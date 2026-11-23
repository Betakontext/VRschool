/* Lokale Three.js-Atelierszene. Die Malfläche bleibt eine unabhängige 2D-Leinwand. */
(() => {
  'use strict';
  const host=document.getElementById('artStudio');
  if(!host||!window.THREE)return;
  const backdrop=document.createElement('div');backdrop.className='atelier-scene';backdrop.setAttribute('aria-hidden','true');host.prepend(backdrop);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch(error){backdrop.remove();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor('#e8e6da');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  backdrop.appendChild(renderer.domElement);host.classList.add('has-atelier-scene');
  const scene=new THREE.Scene();scene.fog=new THREE.Fog('#e8e6da',17,35);
  const camera=new THREE.PerspectiveCamera(47,1,.1,60);camera.position.set(0,4.3,11.8);camera.lookAt(0,2,-2.2);
  const mat=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
  const plaster=mat('#eeeade'),sage=mat('#b2bdac'),oak=mat('#bd9669'),darkOak=mat('#775b41'),steel=mat('#515e58',.45),white=mat('#faf6e9');
  function box(w,h,d,x,y,z,material,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(r1,r2,h,x,y,z,material,parent=scene){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,24),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  scene.add(new THREE.HemisphereLight('#fff8df','#7b8273',2.3));
  const sun=new THREE.DirectionalLight('#fff0cb',3);sun.position.set(-7,10,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.bias=-.001;scene.add(sun);
  box(22,.2,23,0,-.12,-2,oak);box(22,9,.2,0,4.4,-10,plaster);box(.2,9,23,-11,4.4,-2,plaster);box(.2,9,23,11,4.4,-2,sage);
  for(let x=-10;x<=10;x+=1.05)box(.016,.005,23,x,.001,-2,darkOak);
  box(22,.18,.09,0,.15,-9.85,white);box(.09,.18,23,10.85,.15,-2,white);
  // Lichtdurchflutete Fenster mit tiefen Laibungen und Fensterkreuzen.
  const glass=new THREE.MeshStandardMaterial({color:'#c9e7e8',emissive:'#a3cbd0',emissiveIntensity:.55,roughness:.18});
  for(const x of [-7,-3.5]){box(2.7,3.6,.15,x,4.7,-9.7,darkOak);box(2.48,3.38,.17,x,4.7,-9.58,glass);box(.09,3.4,.23,x,4.7,-9.43,white);box(2.5,.09,.23,x,4.7,-9.43,white);box(2.95,.13,.7,x,2.94,-9.35,white);}
  // Flache Lichtinseln liegen auf dem Holzboden, ohne Eingaben abzufangen.
  const glow=new THREE.MeshBasicMaterial({color:'#fff0c0',transparent:true,opacity:.16,depthWrite:false});
  for(let i=0;i<3;i++){const patch=new THREE.Mesh(new THREE.PlaneGeometry(2,5),glow);patch.rotation.x=-Math.PI/2;patch.rotation.z=-.3;patch.position.set(-7+i*3,.015,-5+i);scene.add(patch);}
  // Regal mit Papier, Farbtöpfen und Materialboxen.
  box(4.2,3.2,.7,6.9,1.7,-9.25,sage);
  for(const y of [.2,1.1,2,3.25])box(4.4,.1,.85,6.9,y,-9.2,darkOak);
  const pigments=['#ce7454','#698b75','#d3ad50','#568d9c','#aa7b96'];
  for(let i=0;i<9;i++){const x=5.1+i*.44;cylinder(.14,.15,.33,x,2.22,-8.98,mat(pigments[i%5]));cylinder(.15,.15,.05,x,2.41,-8.98,steel);}
  for(let i=0;i<4;i++)box(.72,.5,.55,5.25+i*1.05,.5,-9,mat(i%2?'#c1b49b':'#d5ccaf'));
  for(let i=0;i<6;i++)box(.75,.035,.48,5.6,1.2+i*.04,-9,white);
  function table(x,z,rotation=0){const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;scene.add(group);box(3.6,.16,1.9,0,1.75,0,oak,group);for(const a of [-1.45,1.45])for(const b of [-.65,.65])box(.09,1.7,.09,a,.85,b,steel,group);return group;}
  const rear=table(-4.8,-6);table(5.4,-4,-.15);
  for(let i=0;i<3;i++){box(.65,.02,.85,-.8+i*.8,1.85,0,white,rear);cylinder(.11,.14,.3,-1.2+i*.3,1.98,.45,mat(pigments[i]),rear);}
  function stool(x,z){cylinder(.43,.43,.13,x,.95,z,darkOak);for(const a of [-.25,.25])for(const b of [-.25,.25])box(.055,.92,.055,x+a,.46,z+b,steel);}
  stool(-5,-4.4);stool(5,-2.4);stool(7,-3);
  // Gerahmte Arbeiten an der hinteren Wand.
  for(let i=0;i<3;i++){box(1.15,1.5,.12,1+i*1.65,5.3,-9.75,darkOak);box(.98,1.32,.13,1+i*1.65,5.3,-9.66,white);const shape=new THREE.Mesh(new THREE.CircleGeometry(.33,40),mat(pigments[i]));shape.position.set(1+i*1.65,5.4,-9.57);scene.add(shape);box(.7,.08,.015,1+i*1.65,4.88,-9.55,mat(pigments[(i+2)%5]));}
  // Pflanze mit sanft bewegten Blättern.
  cylinder(.35,.25,.65,-9,.33,-7,mat('#b77a59'));const leaves=[];
  for(let i=0;i<8;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),mat(i%2?'#68845e':'#80966c'));leaf.scale.set(.2,.65,.09);leaf.position.set(-9+Math.sin(i)*.4,1.1+i*.1,-7+Math.cos(i)*.3);leaf.rotation.z=Math.sin(i)*.7;scene.add(leaf);leaves.push(leaf);}
  // Vereinzelte Staubpartikel im Sonnenlicht – sparsam und ohne physische Interaktion.
  const positions=new Float32Array(48*3);for(let i=0;i<48;i++){positions[i*3]=-9+Math.random()*13;positions[i*3+1]=1+Math.random()*6;positions[i*3+2]=-8+Math.random()*10;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const dust=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#fff9dc',size:.025,transparent:true,opacity:.45,depthWrite:false}));scene.add(dust);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0;
  const resize=()=>{const w=backdrop.clientWidth,h=backdrop.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(backdrop);resize();
  function frame(now){raf=requestAnimationFrame(frame);if(document.hidden||!host.classList.contains('show')||now-last<33)return;last=now;const t=reduced.matches?0:now*.0003;dust.rotation.y=Math.sin(t)*.025;leaves.forEach((leaf,i)=>leaf.rotation.x=Math.sin(t+i)*.05);renderer.render(scene,camera);}
  raf=requestAnimationFrame(frame);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);host.classList.remove('has-atelier-scene');backdrop.remove();});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);geometry.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose();});renderer.dispose();},{once:true});
})();
