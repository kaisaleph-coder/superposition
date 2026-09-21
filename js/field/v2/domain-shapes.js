// Procedural topology samplers shared by the production surface compiler.
// These functions are deterministic and intentionally CPU-side: geometry is rebuilt only
// on recipe/state changes, leaving per-frame motion to cheap transforms/material changes.
function financePoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,a=u*Math.PI*2,b=(v-.5)*Math.PI;
 if(top.includes('ellipsoid')){const rr=1+.12*Math.sin(4*a+ph)+.07*Math.cos(3*b);return[Math.cos(b)*Math.cos(a)*rr*1.2,Math.sin(b)*rr*.72,Math.cos(b)*Math.sin(a)*rr*.9]}
 if(top.includes('lemniscate')){const q=(v-.5)*2,den=1+Math.sin(a)**2;return[1.18*Math.cos(a)/den,q*.5+.12*Math.sin(a*3+q*2+ph),.95*Math.sin(a)*Math.cos(a)/den+.2*q]}
 if(top.includes('saddle')){const x=(u-.5)*2.25,z=(v-.5)*1.65;return[x,.36*(x*x-z*z)-.22+.08*Math.sin((x+z)*4+ph),z]}
 if(top.includes('torus')){const q=v*Math.PI*2,R=.72+.1*Math.sin(ph),rr=.22+.08*Math.sin(3*a+ph);return[(R+rr*Math.cos(q))*Math.cos(a),rr*Math.sin(q)*1.7,(R+rr*Math.cos(q))*Math.sin(a)]}
 const rr=.34+.76*v+.08*Math.sin(5*a+ph);return[Math.cos(a)*rr*1.16,(v-.5)*1.38+.13*Math.sin(a*3+ph),Math.sin(a)*rr*.84]}
function constructionPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,x=(u-.5)*2.2,z=(v-.5)*1.7;
 if(top.includes('vault'))return[x,.58*Math.cos((u-.5)*Math.PI)+.1*Math.sin(v*6+ph)-.26,z];
 if(top.includes('prismatic'))return[x,Math.abs(x)*.42+Math.abs(z)*.18-.42+.11*Math.sin((u+v)*8+ph),z];
 if(top.includes('woven'))return[x,.23*Math.sin(u*Math.PI*6+ph)*Math.cos(v*Math.PI*4)+.17*Math.sign(Math.sin((u+v)*Math.PI*4)),z];
 if(top.includes('tensegrity'))return[x,.26*Math.sin((u*3+v*2)*Math.PI+ph)+.19*Math.cos((u-v)*Math.PI*5),z];
 return[x,.37*Math.sin((u*2+v*3)*Math.PI+ph)+.21*Math.sign(Math.sin((u-v)*Math.PI*3)),z]}
function restaurantPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,a=u*Math.PI*2,q=(v-.5)*2;
 if(top.includes('braided')){const rr=.62+.16*Math.sin(a*3+ph);return[Math.cos(a)*rr+q*.22, q*.42+.15*Math.sin(a*2+ph),Math.sin(a)*rr*.8]}
 if(top.includes('vortex')){const rr=.18+.9*u;const ang=u*Math.PI*5+v*Math.PI*2+ph;return[Math.cos(ang)*rr,(v-.5)*1.25+.12*Math.sin(ang*2),Math.sin(ang)*rr*.78]}
 if(top.includes('split')){const side=v<.5?-1:1,qq=(v%0.5)*2;return[(u-.5)*2.0,.34*Math.sin(u*Math.PI*2+ph)+side*.24*(1-Math.abs(u-.5)*1.4),(qq-.5)*1.35+side*.16*Math.sin(u*5)]}
 if(top.includes('capacity'))return[(u-.5)*2.05,.32*Math.sin((u+v)*Math.PI*3+ph),(v-.5)*1.55+.18*Math.sin(u*Math.PI*4)];
 const R=.62+.12*Math.sin(ph),rr=.18+.1*v;return[(R+rr*Math.cos(a*2))*Math.cos(a),q*.5+.12*Math.sin(a*3), (R+rr*Math.cos(a*2))*Math.sin(a)]}
function investorPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,x=(u-.5)*2.2,q=(v-.5)*2;
 if(top.includes('bifurcation')){const branch=Math.tanh(q*3),z=q*.68+.25*Math.sin(u*5+ph);return[x,.18*Math.sin(x*2.2+ph)+branch*.36*Math.abs(x),z]}
 if(top.includes('saddle'))return[x,.28*(x*x-q*q)-.28+.09*Math.sin(x*4+ph),q*.82];
 if(top.includes('caustic')){const a=u*Math.PI*2,rr=.25+.85*v;return[Math.cos(a)*rr*1.1,.24*Math.sin(a*2+ph)*v,Math.sin(a)*rr*.62+(v-.5)*.55]}
 const fan=(u-.5)*2,spread=.14+.9*v;return[fan*spread,.18*Math.sin(fan*3+ph)*(1-v),(v-.5)*1.7+.25*fan*fan]}
function entrepreneurPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,a=u*Math.PI*2,branch=Math.floor(v*5),local=v*5-branch,ang=a+branch*1.257;
 if(top.includes('spiral')){const rr=.18+.92*u;return[Math.cos(a*2.1+ph)*rr,(v-.5)*1.25+.18*Math.sin(a*3),Math.sin(a*2.1+ph)*rr*.78]}
 if(top.includes('bloom')){const rr=.24+.74*u*(.55+.45*Math.sin(branch*1.3+ph)**2);return[Math.cos(ang)*rr,(local-.5)*.95+.12*Math.sin(a*4),Math.sin(ang)*rr*.76]}
 if(top.includes('crown')){const rr=.32+.65*v;return[Math.cos(a+branch*.4)*rr,.65*(u-.5)+.2*Math.sin(a*branch+ph),Math.sin(a+branch*.4)*rr]}
 const stem=(u-.5)*.5,dir=branch/5*Math.PI*2;return[stem+Math.cos(dir)*local*.95,(local-.5)*.95+.12*Math.sin(a*2+ph),Math.sin(dir)*local*.76]}
function aiPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,x=(u-.5)*2.0,z=(v-.5)*1.55;
 if(top.includes('lattice'))return[x,.22*Math.sin(x*4+ph)*Math.cos(z*5-ph),z];
 if(top.includes('interference'))return[x,.25*(Math.sin(x*5+ph)+Math.cos(z*6-ph))*.5,z];
 if(top.includes('feedback')){const a=u*Math.PI*2,b=v*Math.PI*2,R=.62+.08*Math.sin(ph);return[(R+.22*Math.cos(b))*Math.cos(a),.31*Math.sin(b)+.1*Math.sin(a*5), (R+.22*Math.cos(b))*Math.sin(a)]}
 if(top.includes('manifold'))return[x,.25*Math.sin((x+z)*4+ph)+.15*Math.cos((x-z)*6),z];
 return[x,.31*Math.sin(x*3.5+Math.sin(z*4)+ph)+.08*Math.sign(Math.sin((x-z)*5)),z]}
function skillsPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,a=u*Math.PI*2,lobe=Math.floor(v*6),q=v*6-lobe,center=[Math.cos(lobe/6*Math.PI*2)*.68,(lobe%2?-.18:.18),Math.sin(lobe/6*Math.PI*2)*.55],rr=.12+.42*q;
 if(top.includes('bridge')){const b=(v-.5)*2;return[(u-.5)*2.0,.12*Math.sin(u*8+ph)+.18*Math.sin(b*3),b*.65+.22*Math.sin(u*Math.PI*2)]}
 if(top.includes('radial'))return[Math.cos(a)*(.25+.8*v),.18*Math.sin(a*3+ph)*(1-v),Math.sin(a)*(.2+.68*v)];
 return[center[0]+Math.cos(a)*rr*.55,center[1]+Math.sin(a*2+ph)*rr*.3,center[2]+Math.sin(a)*rr*.5]}
function hobbiesPoint(top,u,v,t,seed){const ph=(seed%997)/997*Math.PI*2,x=(u-.5)*2.15,z=(v-.5)*1.65;
 if(top.includes('orbital')){const a=u*Math.PI*2,b=v*Math.PI*2,R=.65+.16*Math.sin(ph);return[(R+.18*Math.cos(b))*Math.cos(a),.36*Math.sin(b)+.08*Math.sin(a*4), (R+.18*Math.cos(b))*Math.sin(a)]}
 if(top.includes('shell')){const a=u*Math.PI*2,b=(v-.5)*Math.PI,rr=.8+.12*Math.sin(a*3+ph);return[Math.cos(b)*Math.cos(a)*rr,Math.sin(b)*rr*.75,Math.cos(b)*Math.sin(a)*rr]}
 if(top.includes('tidal'))return[x,.22*Math.sin(x*2.8+z*2+ph)+.15*Math.cos(z*4-ph),z];
 return[x,.34*Math.sin(x*1.7+ph)*Math.cos(z*2.2)+.12*Math.sin((x+z)*5),z]}
function homePoint(top,u,v,t,seed){let A,B,C;if(top.includes('nested-orbit')){A=financePoint('torus-equilibrium',u,v,t,seed);B=hobbiesPoint('orbital-terrain',u,v,t,seed+11);C=aiPoint('feedback-shell',u,v,t,seed+29)}else if(top.includes('folded-superposition')){A=constructionPoint('folded-frame',u,v,t,seed);B=aiPoint('folded-compute',u,v,t,seed+11);C=financePoint('nested-reservoir',u,v,t,seed+29)}else if(top.includes('interference-shell')){A=aiPoint('interference-grid',u,v,t,seed);B=hobbiesPoint('exploration-shell',u,v,t,seed+11);C=financePoint('ellipsoid-ledger',u,v,t,seed+29)}else{A=financePoint('nested-reservoir',u,v,t,seed);B=constructionPoint('folded-frame',u,v,t,seed+11);C=hobbiesPoint('tidal-field',u,v,t,seed+29)}const k=.34+.18*Math.sin((seed%100)*.1),m=.26+.1*Math.cos((seed%77)*.11);return[A[0]*k+B[0]*m+C[0]*(1-k-m),A[1]*k+B[1]*m+C[1]*(1-k-m),A[2]*k+B[2]*m+C[2]*(1-k-m)]}
export function fieldPoint(domain,top,u,v,t,seed){if(domain==='finance')return financePoint(top,u,v,t,seed);if(domain==='restaurant')return restaurantPoint(top,u,v,t,seed);if(domain==='construction')return constructionPoint(top,u,v,t,seed);if(domain==='investor')return investorPoint(top,u,v,t,seed);if(domain==='entrepreneur')return entrepreneurPoint(top,u,v,t,seed);if(domain==='ai')return aiPoint(top,u,v,t,seed);if(domain==='skills')return skillsPoint(top,u,v,t,seed);if(domain==='hobbies')return hobbiesPoint(top,u,v,t,seed);return homePoint(top,u,v,t,seed)}
