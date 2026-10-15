(function(){'use strict';
function install(){
  var scene=document.querySelector('a-scene');
  /* A manual tour button wins: no duplicate A-Frame launcher is created. */
  if(!scene||document.getElementById('pausenhof-game-button')||document.getElementById('pausenhofSportsLaunch'))return;
  var e=document.createElement('a-entity');e.id='pausenhofSportsLaunch';e.setAttribute('position','0 1.65 -3');e.setAttribute('visible','false');
  e.innerHTML='<a-box class="clickable" width="2.50" height="0.98" depth="0.16" color="#17272c" material="metalness:.52;roughness:.32"></a-box><a-plane class="clickable" width="2.29" height=".79" position="0 0 .091" color="#275548"></a-plane><a-text value="SPORT-ARENA\n10 STATIONEN" align="center" color="#effcff" width="2.2" position="0 .08 .105"></a-text>';
  e.addEventListener('click',function(){if(scene.dataset.currentId==='Hof')window.openPausenhofModule&&window.openPausenhofModule();});scene.appendChild(e);
  function sync(){e.setAttribute('visible',scene.dataset.currentId==='Hof');} new MutationObserver(sync).observe(scene,{attributes:true,attributeFilter:['data-current-id']});sync();
} document.readyState==='loading'?document.addEventListener('DOMContentLoaded',install):install();
}());
