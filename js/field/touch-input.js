/* Deliberate field input: tap to strike; hold before drawing. Native page gestures
   remain unclaimed until the stationary hold has established intent. */
export function createTouchInput({win,body,blocked,busy=()=>false,begin,move,strike,end,holdMs=350}) {
  const contacts=new Set();let gesture=null,disposed=false;
  const now=()=>win.performance.now();
  function clear(){
    const g=gesture;if(!g)return;gesture=null;win.clearTimeout(g.timer);
    delete body.dataset.fieldTouchOwned;delete body.dataset.fieldTouchPhase;
    if(g.active)end();
  }
  function down(e){
    if(disposed)return;contacts.add(e.pointerId);
    if(contacts.size!==1||e.isPrimary===false){clear();return;}
    if(blocked(e)||busy())return;
    clear();const g={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,started:now(),travel:0,active:false};gesture=g;
    body.dataset.fieldTouchPhase='pending';
    g.timer=win.setTimeout(()=>{if(disposed||gesture!==g||contacts.size!==1)return;if(busy()||blocked(e)){clear();return;}g.active=true;body.dataset.fieldTouchOwned='1';body.dataset.fieldTouchPhase='hold';begin(g.x,g.y,(now()-g.started)/1000);},holdMs);
  }
  function onMove(e){
    const g=gesture;if(!g||e.pointerId!==g.id)return;
    const px=g.lastX,py=g.lastY;g.travel+=Math.hypot(e.clientX-px,e.clientY-py);g.lastX=e.clientX;g.lastY=e.clientY;
    if(!g.active){if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>12)clear();return;}
    body.dataset.fieldTouchPhase='drag';move(e.clientX,e.clientY,g.travel,px,py);
  }
  function up(e){
    contacts.delete(e.pointerId);const g=gesture;if(!g||e.pointerId!==g.id)return;
    const elapsed=now()-g.started,eligible=!busy()&&!blocked(e)&&contacts.size===0&&g.travel<14&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<14;
    const power=(g.active||elapsed>=holdMs) ? .35+.65*Math.min(1,elapsed/1100) : .35;
    clear();if(eligible&&!disposed)strike(e.clientX,e.clientY,power);
  }
  function cancel(e){if(e)contacts.delete(e.pointerId);else contacts.clear();if(!e||gesture?.id===e.pointerId||contacts.size!==1)clear();}
  const nativeMove=e=>{if(e.touches.length!==1){clear();return;}if(gesture?.active&&e.cancelable)e.preventDefault();};
  const contextMenu=e=>{if(gesture?.active)e.preventDefault();};
  win.addEventListener('touchmove',nativeMove,{passive:false,capture:true});win.addEventListener('contextmenu',contextMenu);
  return {down,move:onMove,up,cancel,get active(){return !!gesture?.active;},dispose(){disposed=true;cancel();win.removeEventListener('touchmove',nativeMove,true);win.removeEventListener('contextmenu',contextMenu);}};
}
