(()=>{
    const scene=document.querySelector('a-scene'),panel=document.getElementById('panel-Kunstraum'),launch=document.getElementById('artStudioLaunch');
    if(!scene||!panel||!launch)return;
    let hit=document.getElementById('artStudioFullHit');
    if(!hit){
      hit=document.createElement('a-plane');hit.id='artStudioFullHit';hit.className='clickable link';
      hit.setAttribute('width','2.90');hit.setAttribute('height','.88');hit.setAttribute('position','0 0 .095');
      hit.setAttribute('material','shader:flat;color:#ffffff;opacity:.004;transparent:true;side:double;depthTest:false;depthWrite:false');
      launch.appendChild(hit);
    }
    const active=()=>{const v=panel.getAttribute('visible');return scene.dataset.currentId==='Kunstraum'||v===true||v==='true'};
    let timer=0,done=false;
    const open=e=>{if(!active()||done)return;done=true;clearTimeout(timer);e?.preventDefault?.();e?.stopPropagation?.();window.openKunstraumModule?.()};
    const gazeStart=e=>{if(!active()||done)return;clearTimeout(timer);timer=setTimeout(()=>open(e),550)};
    const gazeStop=()=>{clearTimeout(timer);timer=0;done=false};
    hit.addEventListener('click',open,true);
    hit.addEventListener('mousedown',open,true);
    hit.addEventListener('touchstart',open,{capture:true,passive:false});
    hit.addEventListener('raycaster-intersected',gazeStart);
    hit.addEventListener('raycaster-intersected-cleared',gazeStop);
    hit.addEventListener('mouseleave',gazeStop);
    const refresh=()=>document.querySelectorAll('a-cursor,#desktop-touch-cursor').forEach(c=>c?.components?.raycaster?.refreshObjects?.());
    hit.addEventListener('object3dset',refresh);requestAnimationFrame(refresh);setTimeout(refresh,350);setTimeout(refresh,1100);
  })();
