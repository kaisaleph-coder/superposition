#!/usr/bin/env node
/* Deterministic 1200×630 social card for kaisabuhussein.com.
   Self-contained by design: no network, no site runtime, no placeholder content. */
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

await page.setContent(`<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:#090b10;color:#f2f4f6;font-family:Arial,Helvetica,sans-serif}
.card{position:relative;width:1200px;height:630px;background:linear-gradient(180deg,#090b10,#0d131d)}
.edge{position:absolute;left:48px;top:58px;width:1px;height:514px;background:linear-gradient(#86d6ff,#b59cff)}
.copy{position:absolute;left:86px;top:64px;z-index:2;width:610px}
.micro{font-size:17px;letter-spacing:.06em;color:#738093;margin-bottom:23px}
h1{margin:0;font-size:72px;line-height:1.06;letter-spacing:-.035em;font-weight:760}
.kicker{margin-top:28px;font-size:24px;letter-spacing:.01em;color:#86d6ff}
.lines{margin-top:21px;font-size:17px;line-height:2;color:#96a0ad}
.url{position:absolute;left:86px;bottom:88px;font-size:17px;color:#738093}
canvas{position:absolute;inset:0;width:1200px;height:630px}
</style></head><body>
<div class="card"><canvas id="field" width="1200" height="630"></canvas><div class="edge"></div>
<div class="copy"><div class="micro">IDENTITY / PORTFOLIO</div><h1>KAIS<br>ABU-HUSSEIN</h1>
<div class="kicker">MULTIDISCIPLINARY EXECUTIVE</div>
<div class="lines">Finance · Restaurants · Construction · Investing<br>Entrepreneurship · Consulting · Systems</div></div>
<div class="url">KAISABUHUSSEIN.COM</div></div>
<script>
const c=document.getElementById('field'),x=c.getContext('2d');
let s=271828;
const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
const gauss=()=>Math.sqrt(-2*Math.log(Math.max(rnd(),1e-9)))*Math.cos(2*Math.PI*rnd());
for(let i=0;i<6500;i++){
  let px=850+170*gauss(),py=315+155*gauss();
  px+=70*Math.sin(((py-315)/150)*2.3);
  if(px<470||px>=1200||py<20||py>=610)continue;
  const q=Math.max(0,Math.min(1,(px-500)/700));
  let r=105+35*q,g=190-25*q,b=255-5*q;
  if(rnd()<.8){r*=.72;g*=.72;b*=.72}
  x.fillStyle='rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
  const rad=rnd()<.96?1:2;
  x.fillRect(px-rad,py-rad,rad*2+1,rad*2+1);
}
</script></body></html>`, { waitUntil: "load" });

await page.screenshot({ path: join(ROOT, "assets/og.png"), type: "png" });
await browser.close();
console.log("assets/og.png written: 1200x630 deterministic identity card");
