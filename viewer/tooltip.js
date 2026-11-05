/* Viewport-sized text tooltips. No graph data, HTML parsing or zoom transforms. */
globalThis.pFlow=globalThis.pFlow||{};
globalThis.pFlow.createTooltip=function createTooltip() {
  const popup=document.createElement('div');popup.className='diagram-tooltip';popup.id=`diagram-tooltip-${globalThis.pFlow.tooltipCount=(globalThis.pFlow.tooltipCount||0)+1}`;popup.setAttribute('role','tooltip');popup.hidden=true;document.body.append(popup);
  let anchor,showTimer,hideTimer,overPopup=false;
  function hide() {
    clearTimeout(showTimer);clearTimeout(hideTimer);
    if(anchor)anchor.removeAttribute('aria-describedby');anchor=undefined;popup.hidden=true;overPopup=false;
  }
  function place() {
    if(!anchor?.isConnected){hide();return;}
    const box=anchor.getBoundingClientRect(),area=popup.getBoundingClientRect(),margin=12;
    const x=Math.max(margin,Math.min(innerWidth-area.width-margin,box.left+(box.width-area.width)/2));
    const below=box.bottom+8,y=below+area.height<=innerHeight-margin?below:Math.max(margin,box.top-area.height-8);
    popup.style.left=`${x}px`;popup.style.top=`${y}px`;
  }
  function show(target,text) {
    if(anchor!==target)hide();clearTimeout(hideTimer);anchor=target;popup.textContent=text;popup.hidden=false;target.setAttribute('aria-describedby',popup.id);place();
  }
  function leave(target) {
    clearTimeout(showTimer);clearTimeout(hideTimer);
    hideTimer=setTimeout(()=>{if(!overPopup&&document.activeElement!==target)hide();},100);
  }
  function bind(target,text) {
    target.addEventListener('pointerenter',()=>{clearTimeout(hideTimer);showTimer=setTimeout(()=>show(target,text),250);});
    target.addEventListener('pointerleave',()=>leave(target));
    target.addEventListener('focus',()=>show(target,text));target.addEventListener('blur',()=>leave(target));
  }
  popup.addEventListener('pointerenter',()=>{overPopup=true;clearTimeout(hideTimer);});
  popup.addEventListener('pointerleave',()=>{overPopup=false;if(anchor)leave(anchor);else hide();});
  const escape=event=>{if(event.key==='Escape'&&!popup.hidden)hide();};
  const scroll=event=>{if(anchor&&event.target!==popup&&event.target.contains?.(anchor)){if(document.activeElement===anchor)place();else hide();}};
  document.addEventListener('scroll',scroll,true);
  document.addEventListener('keydown',escape);window.addEventListener('resize',hide);
  return {bind,hide,refresh(){if(!popup.hidden&&anchor){if(document.activeElement===anchor)place();else hide();}},destroy(){hide();popup.remove();document.removeEventListener('scroll',scroll,true);document.removeEventListener('keydown',escape);window.removeEventListener('resize',hide);}};
};
