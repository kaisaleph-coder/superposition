// OKLCH -> sRGB. The proof uses bounded chroma so clipping remains restrained.
function oklabToLinearRGB(L,a,b){
  const l_=L+0.3963377774*a+0.2158037573*b;
  const m_=L-0.1055613458*a-0.0638541728*b;
  const s_=L-0.0894841775*a-1.291485548*b;
  const l=l_**3,m=m_**3,s=s_**3;
  return [
    4.0767416621*l-3.3077115913*m+0.2309699292*s,
    -1.2684380046*l+2.6097574011*m-0.3413193965*s,
    -0.0041960863*l-0.7034186147*m+1.707614701*s
  ];
}
function encode(x){x=Math.max(0,Math.min(1,x));return x<=0.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-0.055}
export function oklchToHex(L,C,H){const h=H*Math.PI/180,a=C*Math.cos(h),b=C*Math.sin(h);const rgb=oklabToLinearRGB(L,a,b).map(encode);return '#'+rgb.map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('')}
export function oklchToRgb(L,C,H){const h=H*Math.PI/180,a=C*Math.cos(h),b=C*Math.sin(h);return oklabToLinearRGB(L,a,b).map(encode).map(x=>Math.round(x*255))}
export function rgba(rgb,a){return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`}
function hash32(x){x|=0;x=Math.imul(x^(x>>>16),0x21f0aaad);x=Math.imul(x^(x>>>15),0x735a2d97);return(x^(x>>>15))>>>0}
function makeRng(seed){let a=hash32(seed||1);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
export function compileChromaticState(grammar,seed){
  const r=makeRng(seed^0x51f15e),s=grammar.spectral;
  const groundHue=(s.groundH+(r()-.5)*14+360)%360;
  const groundL=s.groundL+(r()-.5)*.015;
  const ground=oklchToHex(groundL,.026,groundHue);
  const ground2=oklchToHex(groundL+.035,.035,(groundHue+s.spread*.08)%360);
  const ink=oklchToHex(.925,.018,(groundHue+20)%360);
  const muted=oklchToHex(.65,.035,(groundHue+18)%360);
  const rule=oklchToHex(.42,.045,(groundHue+10)%360);
  const count=9,colors=[];
  for(let i=0;i<count;i++){
    const t=i/(count-1),wave=Math.sin((t*2.15+r()*.18)*Math.PI);
    const hue=(s.h+(t-.5)*s.spread+wave*12+360)%360;
    const light=s.l+(i%2?-.055:.025)+(r()-.5)*.035;
    const chroma=Math.max(.07,s.c*(.72+.34*r()));
    colors.push({hex:oklchToHex(light,chroma,hue),rgb:oklchToRgb(light,chroma,hue),hue,light,chroma});
  }
  const accent=colors[Math.floor(r()*colors.length)],accent2=colors[(Math.floor(r()*colors.length)+3)%colors.length];
  return {id:`spec-${Math.round(s.h)}-${Math.round(s.spread)}`,ground,ground2,ink,muted,rule,accent:accent.hex,accent2:accent2.hex,colors};
}
