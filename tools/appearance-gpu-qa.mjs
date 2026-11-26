// Full release SIM compute probe. No page-side eval/Function, no candidate edits.
// node verify-production-gpu.mjs <source-repo-with-playwright> <candidate>
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

if (![2,4].includes(process.argv.length)) throw new Error('Expected optional source-repo and candidate paths');
const sourceRepo = resolve(process.argv[2] || fileURLToPath(new URL('..',import.meta.url))), candidate = resolve(process.argv[3] || sourceRepo);
const receiptPath = join(sourceRepo,'test-results/appearance-release/gpu.json');mkdirSync(dirname(receiptPath),{recursive:true});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fieldPath = join(candidate, 'js/field/resonance.js');
const catalogPath = join(candidate, 'js/field/appearance-catalog.js');
const fieldBytes = readFileSync(fieldPath), catalogBytes = readFileSync(catalogPath);
const source = fieldBytes.toString('utf8').replace(/\r\n/g, '\n').replace(/^import[^\n]*\n/gm,'');
const catalog = catalogBytes.toString('utf8').replace(/\r\n/g, '\n');
const receipt = {
  startedAt: new Date().toISOString(), sourceRepo, candidate,
  sourceHashes: { resonance: sha(fieldBytes), catalog: sha(catalogBytes) },
  scope: 'Actual specialized full SIM compute; no draw/show pipeline, UI integration, sustained-rate, phone or performance acceptance',
  observation: 'P buffer adds COPY_SRC/COPY_DST for readback; real uniform, storage, sampled mask/mark textures and filtering sampler',
  modes: [], controls: [], errors: [], complete: false,
};
const save = () => writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
function exactlyOne(text, token) {
  const at = text.indexOf(token);
  if (at < 0 || text.indexOf(token, at + token.length) >= 0) throw new Error('Expected one source anchor: ' + token);
  return at;
}
const prefix = source.slice(0, exactlyOne(source, 'export const Resonance'));
const extracted = {};
vm.createContext(extracted);
vm.runInContext(prefix + '\nglobalThis.sim=SIM;globalThis.specialize=specializeSimulation;', extracted);
const catalogContext = {};
vm.createContext(catalogContext);
vm.runInContext(catalog.replace('export const PATTERNS =', 'const PATTERNS =').replace('export const SCHEMES =', 'const SCHEMES =') + '\nglobalThis.patterns=PATTERNS;', catalogContext);
const patterns = Array.from(catalogContext.patterns, ([id, label, mode]) => ({ id, label, mode }));
const expectedModes = [9,10,11,13,14,15,16,18,19,20,21,22,23,24,25,26,27,29,30,31,32,33,34,35,37,38];
if (patterns.map(p => p.mode).sort((a,b) => a-b).join(',') !== expectedModes.join(',')) throw new Error('Catalog does not contain exactly the 26 retained modes');
const baseMatch = [...source.matchAll(/const BASE_MODES = (\[[^\]]+\]);/g)];
if (baseMatch.length !== 1) throw new Error('Expected one BASE_MODES declaration');
const base = vm.runInNewContext(baseMatch[0][1]);
if (Array.from(base).join(',') !== '0,1,2,3,4,5,6,7,8') throw new Error('Original base modes changed');
const uniformMatch = [...source.matchAll(/const U = new Float32Array\((\d+)\)/g)];
if (uniformMatch.length !== 1 || +uniformMatch[0][1] !== 36) throw new Error('Current caller uniform layout is not 36 floats');
const workgroupMatch = [...extracted.sim.matchAll(/@compute @workgroup_size\((\d+)\)\s*fn sim\(/g)];
if (workgroupMatch.length !== 1 || +workgroupMatch[0][1] !== 256) throw new Error('Unexpected real SIM workgroup/entry point');

// Invoke the actual candidate descriptor helper against named resource stubs in
// Node, then map that descriptor to real browser GPU resources. Never recompile
// JavaScript source inside the CSP-protected browser document.
const helperStart = exactlyOne(source, '    function simulationGroup(');
const helperEnd = exactlyOne(source, '    function makeMaskTextures(');
if (helperEnd <= helperStart) throw new Error('Descriptor helper anchors out of order');
const descriptorContext = {
  device: { createBindGroup: descriptor => descriptor },
  uBuf: { resourceName: 'uniform' }, pBuf: { resourceName: 'particles' }, sampler: { resourceName: 'sampler' },
  maskTex: { createView: () => ({ resourceName: 'mask' }) },
  markTex: { createView: () => ({ resourceName: 'mark' }) },
};
vm.createContext(descriptorContext);
vm.runInContext(source.slice(helperStart, helperEnd) + '\nglobalThis.descriptor=simulationGroup({getBindGroupLayout:()=>({index:0})});', descriptorContext);
const bindingPlan = Array.from(descriptorContext.descriptor.entries, item => ({
  binding: item.binding, resourceName: (item.resource.buffer || item.resource).resourceName,
  buffer: !!item.resource.buffer,
}));
if (bindingPlan.map(x => x.binding + ':' + x.resourceName).join(',') !== '0:uniform,1:particles,2:mask,3:sampler,4:mark') throw new Error('Actual five-binding descriptor differs from contract');
receipt.compute = { fullSimSha256: sha(extracted.sim), uniformFloats: 36, uniformBytes: 144, workgroupSize: 256, bindingPlan, particleCount: 512, frameStepsPerMix: 6, mixes: [0,0.5,1] };
const jobs = patterns.map(pattern => {
  const code = extracted.specialize(extracted.sim, [...base, 13, pattern.mode]);
  const ids = [...code.matchAll(/case (\d+) \{/g)].map(m => +m[1]);
  for (const id of [...base,13,pattern.mode]) if (id !== 0 && !ids.includes(id)) throw new Error('Specializer omitted selected mode ' + id);
  return { ...pattern, code, codeSha256: sha(code) };
});
save();

const require = createRequire(join(sourceRepo, 'package.json'));
const { chromium } = require('@playwright/test');
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; connect-src 'none'", 'Cache-Control': 'no-store' });
  response.end('<!doctype html><meta charset="utf-8"><title>Isolated full SIM compute probe</title><p>GPU compute validation</p>');
});
await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true, timeout: 45000, args: ['--enable-gpu','--ignore-gpu-blocklist','--enable-unsafe-webgpu','--use-angle=d3d11'] });
  receipt.browser = { version: browser.version(), headless: true, channel: 'chrome', isolatedProfile: true };
  const page = await browser.newPage();
  page.on('pageerror', error => receipt.errors.push('page: ' + error.message));
  await page.goto('http://127.0.0.1:' + server.address().port + '/', { waitUntil: 'load' });
  receipt.adapter = await page.evaluate(async () => {
    if (!navigator.gpu) throw new Error('WebGPU unavailable in isolated secure-origin page');
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No hardware GPU adapter');
    const info = adapter.info || {};
    const summary = { vendor: info.vendor || '', architecture: info.architecture || '', device: info.device || '', description: info.description || '', isFallbackAdapter: !!adapter.isFallbackAdapter, secureContext: isSecureContext };
    if (adapter.isFallbackAdapter || /swiftshader|software|llvmpipe|lavapipe|warp/i.test(Object.values(summary).join(' '))) throw new Error('Software adapter rejected: ' + JSON.stringify(summary));
    const device = await adapter.requestDevice();
    const state = { device, uncaptured: [], lost: null };
    device.addEventListener('uncapturederror', e => state.uncaptured.push(e.error?.message || String(e)));
    device.lost.then(info => { state.lost = { reason: info.reason, message: info.message }; });
    globalThis.__fullSimGpu = state;
    return summary;
  });
  save();

  // This literal function is serialized by Playwright; only WGSL and descriptor
  // data are supplied as arguments. There is no page-side eval or Function use.
  const runCompute = async ({ code, mode, bindingPlan, fault = null }) => {
    const state = globalThis.__fullSimGpu, device = state.device;
    const timed = (promise, label) => new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error(label + ' exceeded 45 seconds')), 45000);
      Promise.resolve(promise).then(value => { clearTimeout(timer); done(value); }, error => { clearTimeout(timer); reject(error); });
    });
    const result = { mode, fault, compilationErrors: [], validationError: null, runs: [], error: null };
    const allocated = [];
    device.pushErrorScope('validation');
    try {
      const module = device.createShaderModule({ code });
      if (module.getCompilationInfo) {
        const info = await timed(module.getCompilationInfo(), 'shader diagnostics');
        result.compilationErrors = info.messages.filter(m => m.type === 'error').map(m => ({ message:m.message, lineNum:m.lineNum, linePos:m.linePos }));
        if (result.compilationErrors.length) throw new Error('SIM shader compilation failed');
      }
      const pipeline = await timed(device.createComputePipelineAsync({ layout: 'auto', compute: { module, entryPoint: 'sim' } }), 'compute pipeline');
      const count = 512, bytes = count * 16;
      const buffer = (size, usage) => { const value = device.createBuffer({ size, usage }); allocated.push(value); return value; };
      const uniform = buffer(fault === 'short-uniform' ? 128 : 144, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
      const particles = buffer(bytes, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC);
      const readback = buffer(bytes, GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);
      const sampler = device.createSampler({ magFilter:'linear', minFilter:'linear' });
      const texture = red => {
        const value = device.createTexture({ size:[32,32], format:'rgba8unorm', usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT }); allocated.push(value);
        const data = new Uint8Array(256 * 32);
        for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=y*256+x*4;data[i+3]=255;if(red)data[i]=(x+y)%7===0?180:0;else data[i+1]=x>23&&y>6&&y<25?255:0;}
        device.queue.writeTexture({texture:value},data,{bytesPerRow:256,rowsPerImage:32},[32,32]);
        return value.createView();
      };
      const resources = { uniform, particles, sampler, mask:texture(false), mark:texture(true) };
      const entries = bindingPlan.filter(item => fault !== 'missing-mark' || item.binding !== 4).map(item => ({ binding:item.binding, resource:item.buffer?{buffer:resources[item.resourceName]}:resources[item.resourceName] }));
      const group = device.createBindGroup({ layout:pipeline.getBindGroupLayout(0), entries });
      if (fault === 'short-uniform' || fault === 'missing-mark') {
        // Observe these controls specifically at validation, without dispatching
        // an invalid command buffer or miscounting another failure as a kill.
        result.validationError = (await timed(device.popErrorScope(), 'binding validation'))?.message || null;
        return result;
      }
      const limits = [780/1688,1];
      for (const mix of [0,0.5,1]) {
        const initial = new Float32Array(count*4);
        for(let i=0;i<count;i++){initial[i*4]=(((i%32)+0.37)/32*2-1)*limits[0];initial[i*4+1]=((Math.floor(i/32)+0.43)/16*2-1)*limits[1];initial[i*4+2]=0.25;initial[i*4+3]=0.125+(i%7)*0.01;}
        device.queue.writeBuffer(particles,0,initial);
        for(let frame=0;frame<6;frame++){
          const uniforms=new Float32Array([
            780,1688,...limits,
            2+frame/60,1/60,frame+11,count,
            13,mode,mix,0.2,
            0.05,-0.1,0.1,-0.08,
            0.1,0.15,0.2,0.09,
            0.012,0.02,0.0011,844,
            0.04,0,2025.6,0.35,
            0.4,0.08,-0.05,1.2,
            1.15,0.14,-0.12,0.17,
          ]);
          device.queue.writeBuffer(uniform,0,uniforms);
          const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
          pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(Math.ceil(count/256));pass.end();device.queue.submit([encoder.finish()]);
        }
        const encoder=device.createCommandEncoder();encoder.copyBufferToBuffer(particles,0,readback,0,bytes);device.queue.submit([encoder.finish()]);
        await timed(device.queue.onSubmittedWorkDone(),'GPU completion');
        await timed(readback.mapAsync(GPUMapMode.READ),'particle readback');
        const output=new Float32Array(readback.getMappedRange().slice(0));readback.unmap();
        let nonFinite=0,changedPositions=0,outOfBounds=0,unwritten=0;
        for(let i=0;i<count;i++){for(let j=0;j<4;j++)if(!Number.isFinite(output[i*4+j]))nonFinite++;if(output[i*4]!==initial[i*4]||output[i*4+1]!==initial[i*4+1])changedPositions++;if(Math.abs(output[i*4])>limits[0]+1e-5||Math.abs(output[i*4+1])>limits[1]+1e-5)outOfBounds++;if(output[i*4+3]!==0)unwritten++;}
        const run={mix,particles:count,steps:6,nonFinite,changedPositions,outOfBounds,unwritten};result.runs.push(run);
        if(nonFinite)throw new Error('Non-finite particle output');
        if(!changedPositions)throw new Error('No particle position changed');
        if(outOfBounds)throw new Error('Particle escaped plate bounds');
        if(unwritten)throw new Error('Particle output stride/work coverage incomplete');
      }
    } catch(error) { result.error=error?.message||String(error); }
    finally {
      if(fault!=='short-uniform'&&fault!=='missing-mark')result.validationError=(await timed(device.popErrorScope(),'validation completion'))?.message||null;
      for(const resource of allocated)try{resource.destroy();}catch{}
    }
    return result;
  };
  for(const job of jobs){
    const result=await page.evaluate(runCompute,{code:job.code,mode:job.mode,bindingPlan});
    receipt.modes.push({...job,code:undefined,...result});save();
    const ok=!result.error&&!result.validationError&&!result.compilationErrors.length&&result.runs.length===3;
    console.log((ok?'PASS':'FAIL')+' SIM '+job.id+' '+JSON.stringify({mode:job.mode,error:result.error,validation:result.validationError,runs:result.runs}));
    if(!ok){receipt.errors.push('Full SIM failed: '+job.id);break;}
  }
  const sunflower=jobs.find(job=>job.mode===13);
  const store='P[i] = vec4f(p, h, 0.0);';
  exactlyOne(sunflower.code,store);
  const controls=[
    {name:'missing-mark',code:sunflower.code,fault:'missing-mark',expected:'validation'},
    {name:'short-uniform',code:sunflower.code,fault:'short-uniform',expected:'validation'},
    {name:'no-update',code:sunflower.code.replace(store,'P[i] = q;'),expected:'No particle position changed'},
    {name:'non-finite',code:sunflower.code.replace(store,'P[i] = vec4f(bitcast<f32>(0x7fc00000u + (gid.x & 1u)));'),expected:'Non-finite particle output'},
  ];
  for(const control of controls){
    const result=await page.evaluate(runCompute,{code:control.code,mode:13,bindingPlan,fault:control.fault||null});
    const killed=control.expected==='validation'?!!result.validationError&&!result.error&&!result.compilationErrors.length:result.error===control.expected&&!result.validationError&&!result.compilationErrors.length;
    receipt.controls.push({name:control.name,expected:control.expected,killed,...result});save();console.log((killed?'KILLED':'SURVIVED')+' CONTROL '+control.name+' '+JSON.stringify(result));
    if(!killed)receipt.errors.push('Negative control was not caught for its intended reason: '+control.name);
  }
  receipt.device=await page.evaluate(()=>({uncaptured:globalThis.__fullSimGpu.uncaptured,lost:globalThis.__fullSimGpu.lost}));
  if(receipt.device.uncaptured.length||receipt.device.lost)receipt.errors.push('GPU device reported an uncaptured error or loss');
  receipt.complete=receipt.modes.length===26&&receipt.modes.every(r=>!r.error&&!r.validationError&&r.runs.length===3)&&receipt.controls.every(r=>r.killed)&&!receipt.errors.length;
} catch(error){receipt.errors.push(error?.stack||String(error));}
finally {
  if(browser)await browser.close().catch(error=>receipt.errors.push('browser close: '+error.message));
  await new Promise(done=>server.close(done));
  receipt.finishedAt=new Date().toISOString();
  receipt.currentSourceHashes={resonance:sha(readFileSync(fieldPath)),catalog:sha(readFileSync(catalogPath))};
  receipt.sourceChangedDuringRun=receipt.currentSourceHashes.resonance!==receipt.sourceHashes.resonance||receipt.currentSourceHashes.catalog!==receipt.sourceHashes.catalog;
  if(receipt.sourceChangedDuringRun){receipt.complete=false;receipt.errors.push('Candidate source changed during the run; rerun against final bytes');}
  save();
}
console.log('GPU_RECEIPT '+JSON.stringify({complete:receipt.complete,modes:receipt.modes.length,controlsKilled:receipt.controls.filter(r=>r.killed).length,errors:receipt.errors,receipt:receiptPath}));
if(!receipt.complete)process.exitCode=1;
