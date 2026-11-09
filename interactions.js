/* Small mechanical interactions. No wheel interception or artificial scroll physics. */
(() => {
  'use strict';
  const root=document.documentElement;
  const cursor=document.querySelector('#gripper-cursor');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  function hideCursor(){root.classList.remove('gripper-ready');cursor.classList.remove('gripper-closed','gripper-hover')}
  window.addEventListener('pointermove',event=>{
    if(!fine.matches||event.pointerType==='touch'||event.target.closest('dialog,video,input,textarea,select')){hideCursor();return}
    cursor.style.left=`${event.clientX}px`;cursor.style.top=`${event.clientY}px`;
    root.classList.add('gripper-ready');
    cursor.classList.toggle('gripper-hover',Boolean(event.target.closest('a,button,[role="slider"]')));
  },{passive:true});
  window.addEventListener('pointerdown',event=>{if(event.pointerType!=='touch')cursor.classList.add('gripper-closed')},{passive:true});
  ['pointerup','pointercancel','blur'].forEach(name=>window.addEventListener(name,()=>cursor.classList.remove('gripper-closed')));
  document.addEventListener('pointerleave',hideCursor);window.addEventListener('blur',hideCursor);fine.addEventListener('change',hideCursor);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hideCursor()});

  const rail=document.querySelector('#scroll-rail');
  const stops=[...rail.querySelectorAll('[data-section]')];
  const sections=stops.map(link=>document.getElementById(link.dataset.section));
  let queued=0,locations=[],lastScroll=scrollY,trailTimer;
  function measure(){
    locations=sections.map(section=>section.getBoundingClientRect().top+scrollY);
    update();
  }
  function update(){
    queued=0;
    const total=Math.max(0,root.scrollHeight-innerHeight);
    const progress=total?Math.max(0,Math.min(1,scrollY/total)):0;
    rail.style.setProperty('--star-progress',`${progress*100}%`);
    if(scrollY!==lastScroll){
      rail.dataset.direction=scrollY>lastScroll?'down':'up';
      rail.classList.add('star-moving');
      clearTimeout(trailTimer);
      trailTimer=setTimeout(()=>rail.classList.remove('star-moving'),180);
      lastScroll=scrollY;
    }
    let current=0;
    locations.forEach((y,i)=>{if(scrollY+innerHeight*.28>=y)current=i});
    if(total>0&&scrollY>=total-2)current=stops.length-1;
    stops.forEach((link,i)=>{if(i===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
  }
  window.addEventListener('scroll',()=>{
    if(!queued)queued=requestAnimationFrame(update);
  },{passive:true});
  window.addEventListener('resize',measure,{passive:true});window.addEventListener('load',measure);
  if('ResizeObserver' in window)new ResizeObserver(measure).observe(document.querySelector('main'));
  measure();
})();

/* A supporter’s signature. */
(() => {
  const cheer=document.querySelector('#united-cheer');
  const hero=document.querySelector('#home');
  let reset;
  cheer.addEventListener('click',()=>{
    clearTimeout(reset);
    hero.classList.add('united-moment');cheer.setAttribute('aria-pressed','true');
    reset=setTimeout(()=>{hero.classList.remove('united-moment');cheer.setAttribute('aria-pressed','false')},1800);
  });
})();
