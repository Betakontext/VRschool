// SPDX-FileCopyrightText: 2026 Christoph Medicus
// SPDX-License-Identifier: MIT

/* Ein aktuelles Kunstwerk im vorhandenen Panorama, ohne Raumersatz. */
(()=>{
 'use strict';
 const scene=document.querySelector('a-scene'),panel=document.getElementById('panel-Kunstraum');
 if(!scene?.hasLoaded||!panel||!window.AFRAME||document.getElementById('kunstAktuellesWerk'))return;
 const root=document.createElement('a-entity');root.id='kunstAktuellesWerk';root.setAttribute('position','0 2.4 6.5');root.setAttribute('rotation','0 180 0');root.setAttribute('visible',false);scene.appendChild(root);
 const canvas=document.createElement('canvas');canvas.id='kunstAktuellesCanvas';canvas.width=1200;canvas.height=1000;canvas.hidden=true;document.body.appendChild(canvas);
 function entity(type,attributes,parent=root){const el=document.createElement(type);for(const [k,v]of Object.entries(attributes))el.setAttribute(k,v);parent.appendChild(el);return el;}
 entity('a-box',{width:'4.4',height:'3.67',depth:'.09',color:'#967047'});
 const picture=entity('a-plane',{width:'4.18',height:'3.47',position:'0 0 .055',material:'shader:flat;src:#kunstAktuellesCanvas;side:double'});
 const button=entity('a-plane',{width:'3',height:'.5',position:'0 -2.22 .06',material:'shader:flat;color:#426040;side:double'});
 const text=entity('a-text',{value:'>  Bilder abspielen',align:'center',color:'#fffaf0',width:'4',position:'0 -2.22 .075'});
 let current=null,signature='',token=0,lastOpen=0,active=false,gaze=0,items=[],playing=false,slides=[],slideIndex=0,slideTimer=0;
 const update=()=>{const map=picture.getObject3D?.('mesh')?.material?.map;if(map)map.needsUpdate=true;};
 function draw(item){current=item;const seq=++token,ctx=canvas.getContext('2d');const base=()=>{ctx.fillStyle='#fffaf0';ctx.fillRect(0,0,1200,1000);ctx.textAlign='center';ctx.fillStyle='#4e5c46';ctx.font='28px Georgia';};base();
  if(!item){ctx.fillText('Hier hängt bald dein Kunstwerk',600,450);ctx.font='22px Arial';ctx.fillText('Male etwas und speichere es in der Galerie.',600,510);update();return;}
  const img=new Image();img.onload=()=>{if(seq!==token)return;base();const scale=Math.min(1080/img.width,790/img.height);ctx.drawImage(img,(1200-img.width*scale)/2,35+(790-img.height*scale)/2,img.width*scale,img.height*scale);ctx.font='30px Georgia';ctx.fillText(String(item.name||'Mein Kunstwerk').slice(0,55),600,905);ctx.font='18px Arial';ctx.fillText((playing?'BILD '+(slideIndex+1)+' VON '+slides.length:'ZULETZT GESPEICHERT')+' · '+String(item.date||''),600,950);update();scheduleSlide();};img.onerror=()=>{if(seq!==token)return;ctx.fillText('Bild konnte nicht geladen werden',600,500);update();scheduleSlide();};img.src=item.image;
 }
 function read(){let raw;try{raw=localStorage.getItem('quinoa-schuelergalerie-v2')||'[]';}catch(e){raw='[]';}if(raw===signature)return;signature=raw;items=[];try{const value=JSON.parse(raw);if(Array.isArray(value))items=value.filter(x=>x&&typeof x.image==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(x.image));}catch(e){}if(!playing)draw(items[items.length-1]||null);}
 function stopSlides(){clearTimeout(slideTimer);playing=false;slides=[];slideIndex=0;text.setAttribute('value','>  Bilder abspielen');read();draw(items[items.length-1]||null);}
 function scheduleSlide(){if(!playing)return;clearTimeout(slideTimer);slideTimer=setTimeout(()=>{if(!playing)return;slideIndex++;if(slideIndex>=slides.length){stopSlides();return;}text.setAttribute('value','Stop · '+(slideIndex+1)+' / '+slides.length);draw(slides[slideIndex]);},3000);}
 function sync(){active=scene.dataset.currentId?scene.dataset.currentId==='Kunstraum':panel.getAttribute('visible')===true;root.setAttribute('visible',active);for(const el of[button,text]){el.classList.toggle('clickable',active);el.classList.toggle('link',active);}if(!active){clearTimeout(gaze);if(playing)stopSlides();}}
 function open(e){if(!active||Date.now()-lastOpen<1000)return;lastOpen=Date.now();clearTimeout(gaze);e?.stopPropagation?.();if(playing){stopSlides();return;}read();if(!items.length){text.setAttribute('value','Noch keine Bilder gespeichert');return;}slides=items.slice();slideIndex=0;playing=true;text.setAttribute('value','Stop · 1 / '+slides.length);draw(slides[0]);}
 for(const el of[button,text]){el.addEventListener('click',open);el.addEventListener('triggerdown',open);el.addEventListener('raycaster-intersected',e=>{clearTimeout(gaze);gaze=setTimeout(()=>open(e),900);});el.addEventListener('raycaster-intersected-cleared',()=>clearTimeout(gaze));}
 picture.addEventListener('object3dset',update);const observer=new MutationObserver(sync);observer.observe(scene,{attributes:true,attributeFilter:['data-current-id']});observer.observe(panel,{attributes:true,attributeFilter:['visible']});sync();read();
 const timer=setInterval(()=>{sync();if(active&&!document.hidden)read();},1000);
 const storage=e=>{if(e.key==='quinoa-schuelergalerie-v2')read();};window.addEventListener('storage',storage);
 setTimeout(()=>document.querySelectorAll('a-cursor,#desktop-touch-cursor').forEach(c=>c.components?.raycaster?.refreshObjects?.()),400);
 const visibility=()=>{if(document.hidden&&playing)stopSlides();};document.addEventListener('visibilitychange',visibility);
 window.addEventListener('pagehide',()=>{clearInterval(timer);clearTimeout(gaze);clearTimeout(slideTimer);observer.disconnect();window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visibility);},{once:true});
})();
