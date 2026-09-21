import { fieldPoint } from './domain-shapes.js';
import { SURFACE_COST } from './domain-grammars.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function createSurfaceScene(THREE,{backend='webgpu',mobile=false}={}){
  const root=new THREE.Group();
  root.name='superposition-v2-surfaces';
  let objects=[];
  let activeRecipe=null;
  let primitiveCount=0;

  function materialLine(L){
    return new THREE.LineBasicMaterial({
      color:new THREE.Color(L.color),transparent:true,opacity:clamp(L.alpha*.72,.04,.52),
      depthWrite:false,depthTest:false,blending:L.blend==='screen'?THREE.AdditiveBlending:THREE.NormalBlending,
    });
  }
  function materialMesh(L){
    return new THREE.MeshBasicMaterial({
      color:new THREE.Color(L.color),transparent:true,opacity:clamp(L.alpha*.16,.018,.12),
      side:THREE.DoubleSide,depthWrite:false,depthTest:false,
      blending:L.blend==='screen'?THREE.AdditiveBlending:THREE.NormalBlending,
    });
  }
  function line(points,L,segments=false){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
    const o=segments?new THREE.LineSegments(g,materialLine(L)):new THREE.Line(g,materialLine(L));
    o.frustumCulled=false; return o;
  }
  function mesh(vertices,indices,L){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));
    g.setIndex(indices); g.computeVertexNormals?.();
    const o=new THREE.Mesh(g,materialMesh(L));o.frustumCulled=false;return o;
  }
  function sample(L,u,v){
    const p=fieldPoint(activeRecipe.domain,activeRecipe.topology,u,v,0,L.seed);
    return [p[0]*L.scale,p[1]*L.scale,p[2]*L.scale];
  }
  function makeGridLines(L,mode='both'){
    const quality=backend==='webgpu'?1:(backend==='webgl'?.7:.45);
    const U=Math.max(4,Math.floor((8+7*L.density)*quality*(mobile?.7:1)));
    const V=Math.max(3,Math.floor((6+5*L.density)*quality*(mobile?.7:1)));
    const group=new THREE.Group();
    if(mode!=='v') for(let j=0;j<=V;j++){const pts=[];for(let i=0;i<=U*2;i++)pts.push(sample(L,i/(U*2),j/V));group.add(line(pts,L));primitiveCount+=pts.length}
    if(mode!=='u') for(let i=0;i<=U;i++){const pts=[];for(let j=0;j<=V*2;j++)pts.push(sample(L,i/U,j/(V*2)));group.add(line(pts,L));primitiveCount+=pts.length}
    return group;
  }
  function makeMembrane(L){
    const quality=backend==='webgpu'?1:.62;
    const U=Math.max(4,Math.floor((10+5*L.density)*quality*(mobile?.7:1))),V=Math.max(3,Math.floor((7+4*L.density)*quality*(mobile?.7:1)));
    const verts=[];for(let j=0;j<=V;j++)for(let i=0;i<=U;i++)verts.push(sample(L,i/U,j/V));
    const idx=[];for(let j=0;j<V;j++)for(let i=0;i<U;i++){const a=j*(U+1)+i,b=a+1,c=a+(U+1),d=c+1;idx.push(a,c,b,b,c,d)}
    primitiveCount+=idx.length/3;return mesh(verts,idx,L);
  }
  function makeContours(L){return makeGridLines(L,'u')}
  function makeSpines(L){return makeGridLines(L,'v')}
  function makeOrbits(L){const group=new THREE.Group(),n=Math.max(3,Math.floor(4+5*L.density)*(mobile?.7:1));for(let k=0;k<n;k++){const pts=[];for(let i=0;i<72;i++){const a=i/71*Math.PI*2,rr=.38+.065*k;pts.push([Math.cos(a)*rr,Math.sin(a*2+L.phase)*.055+(k-n/2)*.035,Math.sin(a)*rr*.82])}group.add(line(pts,L));primitiveCount+=pts.length}return group}
  function makeTruss(L){const group=new THREE.Group(),nx=mobile?4:6,nz=mobile?3:5,levels=mobile?3:5;const pts=[];for(let y=0;y<levels;y++)for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)pts.push([-1+2*x/(nx-1),-.7+1.4*y/(levels-1)+.07*Math.sin(x*1.4+z*.9+L.phase),-.75+1.5*z/(nz-1)]);const id=(x,z,y)=>y*nx*nz+z*nx+x,seg=[];for(let y=0;y<levels;y++)for(let z=0;z<nz;z++)for(let x=0;x<nx;x++){const a=pts[id(x,z,y)];if(x<nx-1)seg.push(a,pts[id(x+1,z,y)]);if(z<nz-1)seg.push(a,pts[id(x,z+1,y)]);if(y<levels-1)seg.push(a,pts[id(x,z,y+1)]);if(x<nx-1&&y<levels-1&&(x+z+y)%2===0)seg.push(a,pts[id(x+1,z,y+1)])}primitiveCount+=seg.length/2;return line(seg,L,true)}
  function makeFilaments(L){const group=new THREE.Group(),n=Math.max(12,Math.floor((18+18*L.density)*(mobile?.65:1)));const pts=[];for(let i=0;i<n;i++){const u=((i*0.61803398875)%1),v=((i*0.41421356237+L.phase)%1);pts.push(sample(L,u,v))}const seg=[];for(let i=0;i<n;i++){const A=pts[i];let best=[Infinity,-1],second=[Infinity,-1];for(let j=0;j<n;j++)if(i!==j){const B=pts[j],d=(A[0]-B[0])**2+(A[1]-B[1])**2+(A[2]-B[2])**2;if(d<best[0]){second=best;best=[d,j]}else if(d<second[0])second=[d,j]}if(best[1]>=0)seg.push(A,pts[best[1]]);if(second[1]>=0)seg.push(A,pts[second[1]])}primitiveCount+=seg.length/2;return line(seg,L,true)}
  function makeRibbonLike(L){return makeMembrane(L)}
  function makeShards(L){const group=new THREE.Group(),n=Math.max(6,Math.floor((8+10*L.density)*(mobile?.65:1)));for(let i=0;i<n;i++){const u=((i*0.754877666)%1),v=((i*0.569840296+L.phase)%1),q=sample(L,u,v),s=.035+.06*((i%7)/7);const verts=[[q[0]-s,q[1],q[2]],[q[0]+s*.7,q[1]+s*.5,q[2]+s*.2],[q[0]+s*.2,q[1]-s*.55,q[2]-s*.2]];group.add(mesh(verts,[0,1,2],L));primitiveCount++}return group}
  function makeCells(L){const group=new THREE.Group(),n=Math.max(8,Math.floor((12+10*L.density)*(mobile?.65:1)));for(let i=0;i<n;i++){const u=((i*0.618)%1),v=((i*.381+L.phase)%1),q=sample(L,u,v),r=.025+.03*(i%5);const pts=[];for(let k=0;k<=6;k++){const a=k/6*Math.PI*2;pts.push([q[0]+Math.cos(a)*r,q[1]+Math.sin(a)*r,q[2]+Math.sin(a*2)*r*.2])}group.add(line(pts,L));primitiveCount+=pts.length}return group}
  function makeStreams(L){const group=new THREE.Group(),m=Math.max(6,Math.floor((10+12*L.density)*(mobile?.55:1)));for(let k=0;k<m;k++){const pts=[],v=(k+.5)/m;for(let i=0;i<34;i++){const u=i/33;pts.push(sample(L,u,(v+.06*Math.sin(u*8+L.phase)+1)%1))}group.add(line(pts,L));primitiveCount+=pts.length}return group}
  function buildLayer(L){
    switch(L.type){
      case 'shell': case 'lattice': return makeGridLines(L);
      case 'contours': return makeContours(L);
      case 'spines': return makeSpines(L);
      case 'membrane': case 'bands': case 'ribbons': case 'slices': return makeRibbonLike(L);
      case 'truss': return makeTruss(L);
      case 'filaments': case 'braid': return makeFilaments(L);
      case 'orbits': case 'halo': return makeOrbits(L);
      case 'streams': return makeStreams(L);
      case 'shards': return makeShards(L);
      case 'cells': return makeCells(L);
      case 'cloud': return null;
      default:return null;
    }
  }
  function clear(){for(const o of objects){root.remove(o);o.traverse?.(x=>{x.geometry?.dispose?.();x.material?.dispose?.()})}objects=[];primitiveCount=0}
  function applyRecipe(recipe){
    clear();activeRecipe=recipe;
    const reduced=backend==='webgl';
    const candidates=recipe.layers.filter(L=>L.type!=='cloud');
    const maxLayers=backend==='webgpu'?(mobile?9:13):(mobile?5:7);
    for(const source of candidates.slice(0,maxLayers)){
      const mode=reduced?(SURFACE_COST[source.type]?.webgl||'full'):'full';
      const factor=mode==='reduced'?.48:mode==='approx'?.68:1;
      const L=factor===1?source:{...source,density:source.density*factor,alpha:source.alpha*(.72+.20*factor)};
      const o=buildLayer(L);if(!o)continue;
      o.userData.spLayer={phase:L.phase,direction:L.direction,twist:L.twist,weight:L.weight,type:L.type};
      root.add(o);objects.push(o);
    }
    return {layers:objects.length,primitiveCount};
  }
  function update(t,pointer={x:0,y:0}){
    root.rotation.y=.12*Math.sin(t*.07)+(pointer.x||0)*.035;
    root.rotation.x=.05*Math.sin(t*.043)+(pointer.y||0)*.025;
    for(let i=0;i<objects.length;i++){
      const o=objects[i],m=o.userData.spLayer||{};
      o.rotation.y=(m.direction||1)*t*.007*(1+(i%3)*.13)+(m.phase||0)*.02;
      o.rotation.z=Math.sin(t*.025+(m.phase||0))*.012*(m.twist||0);
      const breathe=1+Math.sin(t*.11+(m.phase||0))*.006;
      o.scale.setScalar(breathe);
    }
  }
  function dispose(){clear();root.removeFromParent?.()}
  return {root,applyRecipe,update,dispose,get debug(){return {layers:objects.length,primitiveCount,recipe:activeRecipe?.signature||''}}};
}
