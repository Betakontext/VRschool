/* Original NAWI REALISTIC LAB V27, isoliert. */
(function(){
        let gogglesOn=false, burnerOn=false, reactionDone=false, labQuizDone=false, washingDone=false, washingActive=false;
        let poured={green:false, blue:false};
        let active=null;
        let cleaning=false, wipeProgress=0, wipeDistance=0, cleaningStarted=0, lastWipe={x:0,y:0}, cleanedElements=new Set(), messTargets=[], lastCleanTime=0;
        let spillCtx=null,spillDpr=1,spillInitialInk=0,lastInkCheck=1;
        let helpFadeTimer=null;
        let offsets={x:0,y:0};
        // Local lifecycle tracking: reset/close must not leave reaction, wash or drop callbacks alive.
        const lifecycleTimeouts=new Set(), lifecycleIntervals=new Set(), lifecycleRafs=new Set();
        function trackedTimeout(fn,ms){ let id; id=window.setTimeout(()=>{lifecycleTimeouts.delete(id);fn();},ms); lifecycleTimeouts.add(id); return id; }
        function trackedInterval(fn,ms){ const id=window.setInterval(fn,ms); lifecycleIntervals.add(id); return id; }
        function trackedRAF(fn){ let id; id=window.requestAnimationFrame(t=>{lifecycleRafs.delete(id);fn(t);}); lifecycleRafs.add(id); return id; }
        function cancelLifecycle(){ lifecycleTimeouts.forEach(window.clearTimeout); lifecycleIntervals.forEach(window.clearInterval); lifecycleRafs.forEach(window.cancelAnimationFrame); lifecycleTimeouts.clear();lifecycleIntervals.clear();lifecycleRafs.clear(); if(pouringTimer){window.clearInterval(pouringTimer);pouringTimer=null;} }
        // Bridge may abort without using the guarded close path.
        window.cancelNawiLifecycle=function(){ cancelLifecycle(); clearTimeout(helpFadeTimer); helpFadeTimer=null; if(typeof stopSinkFoam==='function') stopSinkFoam(); };
        let pouringTimer=null;
        const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
        const $=id=>document.getElementById(id);
        window.openNawiLab=function(){
          // Isolierung: ausschliesslich die Host-Szenen-/Panel-Sperre entfernt.
          const o=$('nawiLabOverlay'); if(!o) return;
          o.style.display='block'; o.setAttribute('aria-hidden','false');
          resetNawiLab();
          const welcome=$('nawiWelcome'),logo=$('nawiHeroLogo'),hanger=$('nawiLogoHanger');if(hanger)hanger.classList.remove('active');if(welcome&&logo){logo.classList.remove('corner');welcome.querySelector('.nawi-welcome-card').insertBefore(logo,welcome.querySelector('h1'));welcome.classList.add('show');}
        };
        window.startNawiExperience=function(){
          const welcome=$('nawiWelcome'),logo=$('nawiHeroLogo'),hanger=$('nawiLogoHanger');if(welcome)welcome.classList.remove('show');if(hanger&&logo){hanger.appendChild(logo);logo.classList.add('corner');hanger.classList.add('active')}setStatus('Willkommen im Nawi-Labor. Setze zuerst die Schutzbrille auf.');
          const help=$('labActionHelp');
          if(help){ help.classList.remove('hide'); clearTimeout(helpFadeTimer); helpFadeTimer=trackedTimeout(()=>help.classList.add('hide'), 6000); }
        };
        window.closeNawiLab=function(){ if(reactionDone && !labQuizDone){ setStatus('Erst Arbeitsplatz sauber machen und das Abschluss-Quiz beenden. Danach kannst du zurück zur Tour.'); return; } const o=$('nawiLabOverlay'); if(o){cancelLifecycle(); end(); stopSinkFoam(); o.style.display='none';o.setAttribute('aria-hidden','true');} };
        function resetNawiLab(){
          cancelLifecycle(); cleaning=false; wipeProgress=0; wipeDistance=0; cleaningStarted=0; washState={placed:0,active:null,cleanTimer:null};
          gogglesOn=false; burnerOn=false; reactionDone=false; labQuizDone=false; poured={green:false,blue:false}; active=null;
          $('nawiLabOverlay').classList.remove('goggles-on'); $('labGoggles') && $('labGoggles').classList.remove('worn'); resetArms(); $('labFlame').style.display='none';
          $('tubeLiquid').style.height='0'; $('tubeLiquid').style.background='linear-gradient(#63d471,#16a34a)';
          $('labFoam').innerHTML=''; $('labFoam').style.opacity=''; $('pourLayer').innerHTML=''; $('labPuddle').classList.remove('big'); const film=$('tableAcidFilm'); if(film){film.classList.remove('show'); film.style.opacity='';} const coat=$('labCoat'); if(coat) coat.classList.remove('stained'); const hook=$('cleanHook'); if(hook){hook.classList.remove('show','clean-ready','locked-clean');} const held=$('heldCloth'); if(held) held.style.display='none'; const hint=$('burnerHint'); if(hint){hint.classList.remove('show'); hint.textContent='Brenner bleibt bei diesem Versuch AUS';} const burn=$('labBurner'); if(burn) burn.classList.remove('burner-ready','needs-off'); const bcz=$('burnerClickZone'); if(bcz) bcz.classList.remove('show'); const wipe=$('wipeSheen'); if(wipe) wipe.classList.remove('run'); const toast=$('completionToast'); if(toast) toast.classList.remove('show'); const quiz=$('labQuiz'); if(quiz) quiz.classList.remove('show'); const qf=$('quizFinish'); if(qf) qf.classList.remove('show'); const sink=$('labSink'); if(sink) sink.classList.remove('show','washing','focus'); const sh=$('sinkHint'); if(sh) sh.classList.remove('show'); const rack=$('dryRack'); if(rack) rack.classList.remove('show','loaded','manual-loaded'); $('nawiLabOverlay').classList.remove('sink-focus'); ['washGlass1','washGlass2'].forEach(id=>{const g=$(id);if(g){g.className='wash-glass '+(id==='washGlass1'?'green':'blue');g.style.left='';g.style.top='';g.style.transform='';g.dataset.clean='0';g.dataset.placed='0';g.dataset.rinse='0';}}); document.querySelectorAll('.clean-streak,.erase-spot,.wipe-mark').forEach(e=>e.remove()); cleanedElements=new Set(); messTargets=[]; lastCleanTime=0; washingDone=false; washingActive=false; if(typeof stopSinkFoam==='function') stopSinkFoam();
          ['greenBottle','blueBottle'].forEach(id=>{const b=$(id); if(!b) return; b.classList.remove('dragging'); b.style.left='';b.style.top='';b.style.right='';b.style.transform=''; const l=b.querySelector('.bottle-liquid'); if(l) l.style.height='64%';});
          resetReactionDashboard();
          const reactionCanvas=$('reactionCanvas');if(reactionCanvas){reactionCanvas.getContext('2d')?.clearRect(0,0,reactionCanvas.width,reactionCanvas.height);reactionCanvas.classList.remove('active');}
          prepareSpillCanvas(true);
          setStatus('Setze zuerst die Schutzbrille auf. Danach beide Lösungen ins Reagenzglas gießen. Die Reaktion startet beim Kontakt – ohne Brenner.');
        }
        window.putOnGoggles=function(){ gogglesOn=true; $('nawiLabOverlay').classList.add('goggles-on'); $('labGoggles') && $('labGoggles').classList.add('worn'); setStatus('Schutzbrille sitzt. Gieße beide Lösungen nacheinander ein und beobachte, wie die Reaktion sofort beim Kontakt beginnt.'); };
        window.toggleBurner=function(){
          burnerOn=false;
          const flame=$('labFlame'); if(flame) flame.style.display='none';
          const hint=$('burnerHint'); if(hint){hint.textContent='Brenner bleibt bei diesem Versuch AUS';hint.classList.add('show');trackedTimeout(()=>hint.classList.remove('show'),2200);}
          setStatus('Richtig gedacht: Diese Säure-Base-Reaktion braucht keine Flamme. Sie beginnt beim Vermischen und entzieht der Umgebung Wärme.');
        };
        window.showLabInfo=function(e,title,text){ if(e) e.stopPropagation(); const c=$('labInfoCard'); c.innerHTML='<b>'+title+'</b>'+text; c.style.display='block'; c.style.left=clamp((e?.clientX||200)+12,12,window.innerWidth-285)+'px'; c.style.top=clamp((e?.clientY||160)+12,12,window.innerHeight-130)+'px'; };
        window.showChemInfo=function(e,key){
          const cards={
            teilchen:{title:'🔬 Was passiert auf Teilchenebene?',text:'<strong>1.</strong> Essigsäure gibt H⁺-Teilchen ab.<br><strong>2.</strong> Hydrogencarbonat nimmt sie auf und bildet kurz Kohlensäure.<br><strong>3.</strong> Diese zerfällt in Wasser und CO₂. Die CO₂-Moleküle sammeln sich zu sichtbaren Gasblasen.<hr><small>Wichtig: Die farbigen Punkte sind ein Lernmodell – echte Moleküle sind viel kleiner und nicht in diesen Farben sichtbar.</small>'},
            versuch:{title:'🧑‍🏫 So wird der Schulversuch sinnvoll durchgeführt',text:'<strong>Beobachtung:</strong> Blasen, Temperaturabfall und nachlassendes Sprudeln.<br><strong>Vorteil:</strong> sichere, gut sichtbare Säure-Carbonat-Reaktion ohne Brenner.<br><strong>Grenze:</strong> Schaumhöhe und Abkühlung hängen von Menge, Konzentration, Gefäß und Starttemperatur ab. Das Modell zeigt typische Werte, keine exakte Messung für jeden Aufbau.<br><strong>Sicherheit:</strong> Schutzbrille, kleine Mengen, offenes Gefäß, Spritzer mit Wasser aufnehmen; Chemikalien niemals probieren.'}
          };const item=cards[key];if(item)window.showLabInfo(e,item.title,item.text);
        };
        document.addEventListener('click',e=>{ if(!e.target.classList.contains('info-dot')) { const c=$('labInfoCard'); if(c)c.style.display='none'; } });
        function setStatus(t){ const el=$('labStatus'); if(el) el.textContent=t; }
        function resetArms(){
          const l=$('leftArm'), r=$('rightArm');
          if(l){l.classList.remove('grabbing'); l.style.left=''; l.style.top=''; l.style.width=''; l.style.transform='rotate(-20deg)';}
          if(r){r.classList.remove('grabbing'); r.style.left=''; r.style.top=''; r.style.width=''; r.style.transform='rotate(20deg)';}
        }
        function pointArmToBottle(bottle){
          const l=$('leftArm'), r=$('rightArm'); if(!bottle||!l||!r) return;
          const br=bottle.getBoundingClientRect();
          const bx=br.left+br.width/2, by=br.top+br.height*.58;
          const useLeft = bx < window.innerWidth/2;
          const arm = useLeft ? l : r; const other = useLeft ? r : l;
          other.classList.remove('grabbing'); other.style.left=''; other.style.top=''; other.style.width=''; other.style.transform=useLeft?'rotate(20deg)':'rotate(-20deg)';
          const sx = useLeft ? window.innerWidth*.43 : window.innerWidth*.57;
          const sy = window.innerHeight*.83;
          const dx=bx-sx, dy=by-sy;
          const len=Math.max(150, Math.min(360, Math.hypot(dx,dy)));
          const angle=Math.atan2(dy,dx)*180/Math.PI;
          arm.classList.add('grabbing');
          arm.style.width=len+'px'; arm.style.top=(sy-23)+'px';
          if(useLeft){ arm.style.left=sx+'px'; arm.style.transform='rotate('+angle+'deg)'; }
          else { arm.style.left=(sx-len)+'px'; arm.style.transform='rotate('+(angle+180)+'deg)'; }
        }
        function setupBottle(id){
          const b=$(id); if(!b) return;
          const start=(ev)=>{ ev.preventDefault(); if(!gogglesOn){setStatus('Erst Schutzbrille aufsetzen. Sicherheit geht vor.'); return;} active=b; b.classList.add('dragging'); const p=point(ev); const r=b.getBoundingClientRect(); offsets.x=p.x-r.left; offsets.y=p.y-r.top; b.style.right='auto'; move(ev); };
          b.addEventListener('pointerdown',ev=>{ start(ev); if(active===b) try{b.setPointerCapture(ev.pointerId)}catch(_){ } });
        }
        function point(ev){ if(ev.touches && ev.touches[0]) return {x:ev.touches[0].clientX,y:ev.touches[0].clientY}; return {x:ev.clientX,y:ev.clientY}; }
        function move(ev){ if(!active) return; ev.preventDefault&&ev.preventDefault(); const p=point(ev); active.style.left=(p.x-offsets.x)+'px'; active.style.top=(p.y-offsets.y)+'px'; pointArmToBottle(active); const tube=$('reactionTube').getBoundingClientRect(); const b=active.getBoundingClientRect(); const bottleCenter=b.left+b.width/2; const tubeCenter=tube.left+tube.width/2; const near=Math.abs(bottleCenter-tubeCenter)<115 && b.top < tube.bottom && b.bottom > tube.top-80;
          let tilt=near ? clamp((tubeCenter-bottleCenter)*0.9,-72,72) : 0;
          // Wenn Flasche links steht, kippt sie nach rechts; wenn rechts, kippt sie nach links.
          if(near && Math.abs(tilt)<38) tilt = bottleCenter<tubeCenter ? 58 : -58;
          active.style.transform='rotate('+tilt+'deg) scale(1.04)';
          if(near && Math.abs(tilt)>42) pour(active, tilt);
        }
        function end(){ if(active){active.classList.remove('dragging'); active.style.transform=''; active=null; resetArms();} }
        document.addEventListener('pointermove',move,{passive:false});
        document.addEventListener('pointerup',end); document.addEventListener('pointercancel',end);
        function pour(bottle, tilt){
          const chem=bottle.dataset.chem; if(poured[chem] || pouringTimer) return;
          const tube=$('reactionTube').getBoundingClientRect(); const b=bottle.getBoundingClientRect();
          // Auslass ungefähr an der echten Flaschenöffnung je nach Kippseite.
          const mouthX = tilt>0 ? b.right-26 : b.left+26;
          const mouthY = b.top+28;
          const targetX = tube.left + tube.width/2;
          const targetY = tube.top + 28;
          const color = chem==='green' ? '#22c55e' : '#38bdf8';
          const liquid=bottle.querySelector('.bottle-liquid'); if(liquid) liquid.style.height='22%';
          // Viele Tropfen statt Laser-Strich: wirkt flüssiger und kommt aus der Öffnung.
          let i=0; const timer=pouringTimer=trackedInterval(()=>{ createDrop(mouthX+(Math.random()*8-4),mouthY+(Math.random()*8-4),targetX+(Math.random()*18-9),targetY+(Math.random()*18-9),color); if(++i>22){clearInterval(timer); lifecycleIntervals.delete(timer); pouringTimer=null; poured[chem]=true; updateTube(chem); if(poured.green&&poured.blue){ setStatus('Die Lösungen berühren sich – die CO₂-Bildung startet sofort. Beobachte Blasen, Schaum und Temperatur.'); trackedTimeout(startReaction,180); } } },35);
          setStatus((chem==='green'?'Natriumhydrogencarbonat':'Essigsäure')+' wird aus der Flaschenöffnung in das Reagenzglas gegossen.');
        }
        function createDrop(x1,y1,x2,y2,color){
          const d=document.createElement('div'); d.className='droplet'; d.style.left=x1+'px'; d.style.top=y1+'px'; d.style.background=color; d.style.color=color; $('pourLayer').appendChild(d);
          const midX=(x1+x2)/2+(Math.random()*45-22); const midY=(y1+y2)/2+45+Math.random()*18;
          const start=performance.now(); const dur=520+Math.random()*180;
          function anim(t){ const k=Math.min(1,(t-start)/dur); const a=(1-k)*(1-k), b=2*(1-k)*k, c=k*k; const x=a*x1+b*midX+c*x2; const y=a*y1+b*midY+c*y2; d.style.transform='translate('+(x-x1)+'px,'+(y-y1)+'px) scale('+(1-k*.25)+')'; d.style.opacity=String(0.9-k*.35); if(k<1) trackedRAF(anim); else d.remove(); }
          trackedRAF(anim);
        }
        function updateTube(chem){ const l=$('tubeLiquid'); if(!l) return; if(chem==='green'){l.style.height='35px';l.style.background='linear-gradient(#82f0a1,#16a34a)';} if(chem==='blue'){l.style.height=poured.green?'70px':'35px';l.style.background='linear-gradient(#7dd3fc,#2563eb)';} if(poured.green&&poured.blue){l.style.height='82px';l.style.background='linear-gradient(#d9f99d,#22c55e,#38bdf8)';} }
        function startReaction(){
          if(reactionDone) return;
          if(!(poured.green && poured.blue)){setStatus('Es fehlen noch Stoffe im Reagenzglas. Erst beide Flüssigkeiten eingießen.'); return;}
          reactionDone=true;
          animateReactionDashboard();
          startReactionCanvas();
          setStatus('Reaktion läuft: Es entstehen Natriumacetat, Wasser und viele CO₂-Blasen. Die Mischung kühlt messbar ab.');
          const foam=$('labFoam'); foam.innerHTML='';
          const center=$('reactionTube').getBoundingClientRect();
          const table=document.querySelector('.lab-table').getBoundingClientRect();
          const cx=center.left+center.width/2, cy=center.top+45;
          const flame=$('labFlame'); if(flame) flame.style.display='none';
          const tube=$('reactionTube');if(tube){tube.classList.add('chem-reacting');trackedTimeout(()=>tube.classList.remove('chem-reacting'),6200);}

          // Mehrstufige Gasentwicklung: erst starke Keimbildung, danach sichtbar nachlassendes Sprudeln.
          for(let i=0;i<3;i++){const ring=document.createElement('div');ring.className='reaction-ring';ring.style.left=cx+'px';ring.style.top=(cy+35)+'px';ring.style.animationDelay=(i*.22)+'s';foam.appendChild(ring);trackedTimeout(()=>ring.remove(),1800+i*220);}

          // 1) Kurzer sichtbarer "Platz" direkt aus dem Reagenzglas heraus.
          const burst=document.createElement('div');
          burst.className='reaction-burst';
          burst.style.left=cx+'px'; burst.style.top=cy+'px';
          burst.style.width='92px'; burst.style.height='92px';
          foam.appendChild(burst); trackedTimeout(()=>burst.remove(),1000);

          // 2) Kleine CO₂-Blasen steigen hauptsächlich im und direkt über dem Reagenzglas auf.
          for(let i=0;i<18;i++){
            trackedTimeout(()=>{
              const b=document.createElement('div'); b.className='bubble';
              const s=7+Math.random()*22;
              b.style.width=s+'px'; b.style.height=s+'px';
              b.style.left=(cx+(Math.random()*36-18))+'px';
              b.style.top=(cy+(Math.random()*18-9))+'px';
              b.style.setProperty('--x',(Math.random()*88-44)+'px');
              b.style.setProperty('--y',(-28-Math.random()*135)+'px');
              foam.appendChild(b); trackedTimeout(()=>b.remove(),1700);
            },i*10);
          }
          for(let i=0;i<16;i++)trackedTimeout(()=>{
            const b=document.createElement('i');b.className='tube-gas-bubble';
            const s=4+Math.random()*10;b.style.width=s+'px';b.style.height=s+'px';b.style.left=(cx-17+Math.random()*34)+'px';b.style.top=(cy+80+Math.random()*42)+'px';
            b.style.setProperty('--gas-x',(Math.random()*22-11)+'px');foam.appendChild(b);trackedTimeout(()=>b.remove(),1500);
          },i<24?i*55:1320+(i-24)*145);

          // 3) Etwas Schaum quillt aus der Öffnung, ohne den ganzen Tisch zu überdecken.
          for(let i=0;i<6;i++){
            trackedTimeout(()=>{
              const blob=document.createElement('div'); blob.className='foam-blob';
              const size=18+Math.random()*38;
              blob.style.width=size+'px'; blob.style.height=(size*(.48+Math.random()*.25))+'px';
              blob.style.left=cx+'px'; blob.style.top=(cy+22)+'px';
              blob.style.setProperty('--x',(Math.random()*120-60)+'px');
              blob.style.setProperty('--y',(42+Math.random()*115)+'px');
              foam.appendChild(blob);
              trackedTimeout(()=>blob.remove(),5200);
            },260+i*24);
          }

          // 4) Eine echte halbtransparente Flüssigkeitsschicht wird auf eine Canvas-Fläche gemalt.
          trackedTimeout(paintSpillCanvas,950);
          trackedTimeout(()=>{ const hook=$('cleanHook'); if(hook){ hook.classList.remove('locked-clean'); hook.classList.add('show','clean-ready'); } setStatus('Die Gasentwicklung ist fast beendet, weil die Ausgangsstoffe verbraucht sind. Wische anschließend jeden sichtbaren Tropfen gründlich weg.'); },9000);
        }

        function resetReactionDashboard(){
          const phase=$('reactionPhase'),temp=$('reactionTemp'),fill=$('tempFill'),stage=$('particleStage'),ex=$('reactionExplanation'),dash=$('reactionDashboard');
          if(phase) phase.textContent='Bereit'; if(temp) temp.textContent='22,0 °C'; if(fill) fill.style.width='92%';
          if(stage) stage.querySelectorAll('.molecule,.co2-particle').forEach(x=>x.remove());
          if(ex) ex.textContent='Beim Kontakt entstehen CO₂-Blasen. Es ist kein Brenner nötig.'; if(dash) dash.classList.remove('reacting','complete');
        }
        function animateReactionDashboard(){
          const dash=$('reactionDashboard'),phase=$('reactionPhase'),temp=$('reactionTemp'),fill=$('tempFill'),stage=$('particleStage'),ex=$('reactionExplanation');
          if(!dash||!stage)return; dash.classList.add('reacting'); if(phase) phase.textContent='CO₂ entsteht';
          for(let i=0;i<22;i++){const p=document.createElement('i');p.className='molecule '+(i%2?'acid':'base');p.style.left=(8+Math.random()*84)+'%';p.style.top=(28+Math.random()*58)+'%';p.style.setProperty('--dx',(Math.random()*90-45)+'px');p.style.animationDelay=(Math.random()*.8)+'s';stage.appendChild(p);}
          for(let i=0;i<30;i++)trackedTimeout(()=>{const p=document.createElement('i');p.className='co2-particle';p.textContent='CO₂';p.style.left=(28+Math.random()*44)+'%';p.style.bottom='8px';p.style.setProperty('--drift',(Math.random()*100-50)+'px');stage.appendChild(p);trackedTimeout(()=>p.remove(),2600);},i*85);
          const start=performance.now(),room=22,low=15.1;
          const tick=now=>{const elapsed=now-start;let v;if(elapsed<4200){const k=elapsed/4200;v=room+(low-room)*(1-Math.pow(1-k,2));}else{const recover=1-Math.exp(-(elapsed-4200)/52000);v=low+(room-low)*recover;v+=Math.sin(elapsed/1350)*.07;}if(temp)temp.textContent=v.toFixed(1).replace('.',',')+' °C';if(fill)fill.style.width=Math.max(34,Math.min(92,34+(v-low)/(room-low)*58))+'%';if(elapsed>4200){dash.classList.remove('reacting');dash.classList.add('complete');if(phase)phase.textContent='Langsame Erwärmung';if(ex)ex.textContent='Die Probe nimmt nach der Abkühlung langsam wieder Wärme aus dem Raum auf.';}trackedRAF(tick);};trackedRAF(tick);
        }
        function startReactionCanvas(){
          const canvas=$('reactionCanvas'),tube=$('reactionTube');if(!canvas||!tube)return;const dpr=Math.min(1,window.devicePixelRatio||1),w=innerWidth,h=innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);canvas.classList.add('active');const tr=tube.getBoundingClientRect(),cx=tr.left+tr.width/2,mouth=tr.top+14,start=performance.now();
          const particles=Array.from({length:96},(_,i)=>({x:cx+(Math.random()-.5)*22,y:mouth+85+Math.random()*68,r:2+Math.random()*7,v:.55+Math.random()*1.65,drift:(Math.random()-.5)*.55,delay:i*55+Math.random()*420,life:1550+Math.random()*1900}));
          const draw=now=>{const elapsed=now-start;ctx.clearRect(0,0,w,h);const intensity=Math.max(0,1-elapsed/10100),foamRise=Math.min(1,elapsed/1450)*intensity;
            for(const p of particles){const age=elapsed-p.delay;if(age<0||age>p.life)continue;const k=age/p.life,x=p.x+p.drift*age*.055+Math.sin(age*.009+p.r)*5,y=p.y-age*p.v*.085;ctx.beginPath();ctx.arc(x,y,p.r*(.55+k*.7),0,Math.PI*2);const g=ctx.createRadialGradient(x-p.r*.3,y-p.r*.35,0,x,y,p.r*1.3);g.addColorStop(0,'rgba(255,255,255,.98)');g.addColorStop(.35,'rgba(220,248,255,.72)');g.addColorStop(.78,'rgba(116,210,230,.22)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(230,252,255,'+(0.75*(1-k))+')';ctx.lineWidth=1;ctx.stroke();}
            if(foamRise>.03){for(let i=0;i<11;i++){const a=i/10*Math.PI*2,x=cx+Math.cos(a)*(13+foamRise*10),y=mouth+3-Math.sin(a)*5-foamRise*18,r=4+(i%3)*2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle='rgba(245,255,252,'+(0.72*intensity)+')';ctx.fill();ctx.strokeStyle='rgba(151,226,215,.55)';ctx.stroke();}}
            if(elapsed<10500)trackedRAF(draw);else{ctx.clearRect(0,0,w,h);canvas.classList.remove('active');}
          };trackedRAF(draw);
        }
        function prepareSpillCanvas(clear){
          const canvas=$('spillCanvas');if(!canvas)return null;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
          spillDpr=Math.min(.78,window.devicePixelRatio||1);
          if(canvas.width!==Math.round(rect.width*spillDpr)||canvas.height!==Math.round(rect.height*spillDpr)){canvas.width=Math.round(rect.width*spillDpr);canvas.height=Math.round(rect.height*spillDpr);}
          spillCtx=canvas.getContext('2d',{willReadFrequently:true});spillCtx.setTransform(spillDpr,0,0,spillDpr,0,0);if(clear)spillCtx.clearRect(0,0,rect.width,rect.height);return {canvas,rect,ctx:spillCtx};
        }
        function paintSpillCanvas(){
          const s=prepareSpillCanvas(true);if(!s)return;const {rect,ctx}=s,cx=rect.width*.5,cy=rect.height*.57;
          ctx.save();ctx.globalCompositeOperation='source-over';
          for(let i=0;i<11;i++){const x=cx+(Math.random()-.5)*rect.width*.38,y=cy+(Math.random()-.5)*rect.height*.30,rx=25+Math.random()*62,ry=8+Math.random()*24;ctx.save();ctx.translate(x,y);ctx.rotate((Math.random()-.5)*.7);ctx.scale(rx,ry);const g=ctx.createRadialGradient(-.18,-.24,.05,0,0,1);g.addColorStop(0,'rgba(255,255,255,.82)');g.addColorStop(.35,'rgba(205,241,245,.64)');g.addColorStop(.78,'rgba(100,185,196,.34)');g.addColorStop(1,'rgba(65,145,160,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();}
          for(let i=0;i<25;i++){ctx.fillStyle='rgba(154,221,228,'+(.28+Math.random()*.35)+')';ctx.beginPath();ctx.arc(cx+(Math.random()-.5)*rect.width*.44,cy+(Math.random()-.5)*rect.height*.34,1.5+Math.random()*5,0,Math.PI*2);ctx.fill();}
          ctx.restore();spillInitialInk=measureSpillInk();lastInkCheck=1;
        }
        function measureSpillInk(){const c=$('spillCanvas');if(!c||!spillCtx)return 0;const data=spillCtx.getImageData(0,0,c.width,c.height).data;let ink=0,total=0,step=Math.max(4,Math.round(7*spillDpr));for(let y=0;y<c.height;y+=step)for(let x=0;x<c.width;x+=step){total++;if(data[(y*c.width+x)*4+3]>18)ink++;}return total?ink/total:0;}
        function eraseSpillSegment(a,b){const s=prepareSpillCanvas(false);if(!s)return;const {rect,ctx}=s,x1=a.x-rect.left,y1=a.y-rect.top,x2=b.x-rect.left,y2=b.y-rect.top;ctx.save();ctx.globalCompositeOperation='destination-out';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=48;ctx.strokeStyle='rgba(0,0,0,.54)';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();const g=ctx.createRadialGradient(x2,y2,5,x2,y2,31);g.addColorStop(0,'rgba(0,0,0,.82)');g.addColorStop(.72,'rgba(0,0,0,.48)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x2,y2,31,0,Math.PI*2);ctx.fill();ctx.restore();}
        window.pickCleaningCloth=function(e){
          if(e){ e.stopPropagation(); if(e.preventDefault) e.preventDefault(); }
          if(cleaning) return;
          if(burnerOn){ setStatus('Erst den roten Knopf am Gasbrenner drücken und den Brenner ausschalten. Danach darfst du sauber machen.'); const hint=$('burnerHint'); if(hint){hint.textContent='Brenner ausschalten'; hint.classList.add('show');} const burn=$('labBurner'); if(burn) burn.classList.add('needs-off','burner-ready'); const bcz=$('burnerClickZone'); if(bcz) bcz.classList.add('show'); return; }
          cleaning=true; wipeProgress=0; wipeDistance=0; cleaningStarted=performance.now(); cleanedElements=new Set(); messTargets=[]; lastCleanTime=0;lastInkCheck=measureSpillInk();
          const startP = e ? point(e) : {x:window.innerWidth*.67, y:window.innerHeight*.62};
          lastWipe={x:startP.x,y:startP.y};
          const hook=$('cleanHook'); if(hook) hook.classList.remove('show','clean-ready','locked-clean');
          const cloth=$('heldCloth'); if(cloth){ cloth.style.display='block'; cloth.style.left=startP.x+'px'; cloth.style.top=startP.y+'px'; }
          pointRightArmTo(startP.x,startP.y);
          setStatus('Wische wie mit einem Radiergummi über den Tisch. Der Schaum verschwindet Stück für Stück.');
          const r=$('rightArm'); if(r){ r.style.width='260px'; r.style.left=(window.innerWidth*.57-260)+'px'; r.style.top=(window.innerHeight*.78)+'px'; r.style.transform='rotate(205deg)'; }
        };
        function moveCleaningCloth(ev){
          if(!cleaning) return;
          if(ev && ev.preventDefault) ev.preventDefault();
          const p=point(ev); const cloth=$('heldCloth');
          if(cloth){ cloth.style.left=p.x+'px'; cloth.style.top=p.y+'px'; }
          pointRightArmTo(p.x,p.y);

          const now = performance.now();
          if(now - lastCleanTime < 45) return;

          const table=document.querySelector('.lab-table').getBoundingClientRect();
          const over=p.x>table.left && p.x<table.right && p.y>table.top && p.y<table.bottom;
          if(!over) return;

          if(lastWipe.x===0 && lastWipe.y===0){ lastWipe={x:p.x,y:p.y}; return; }
          const dist = Math.hypot(p.x-lastWipe.x,p.y-lastWipe.y);
          if(dist < 18) return;

          const old={x:lastWipe.x,y:lastWipe.y};
          lastWipe={x:p.x,y:p.y}; wipeProgress++; wipeDistance+=dist; lastCleanTime = now;
          const angle=Math.atan2(p.y-old.y,p.x-old.x)*180/Math.PI;
          const midX=(p.x+old.x)/2, midY=(p.y+old.y)/2;

          // Nur noch selten eine Wischspur erzeugen – das spart sehr viel Leistung.
          if(wipeProgress % 2 === 0){
            const streak=document.createElement('div');
            streak.className='clean-streak fast';
            streak.style.left=midX+'px'; streak.style.top=midY+'px';
            streak.style.setProperty('--angle',angle+'deg');
            document.body.appendChild(streak);
            trackedTimeout(()=>streak.remove(),1500);
          }

          eraseSpillSegment(old,p);if(wipeProgress%8===0)lastInkCheck=measureSpillInk();const remaining=spillInitialInk?Math.max(0,lastInkCheck/spillInitialInk):0;
          if(wipeProgress===10) setStatus('Wie mit einem Radiergummi: Fahre mehrfach über jeden einzelnen Fleck.');
          if(wipeProgress%12===0) setStatus('Noch etwa '+Math.round(remaining*100)+' % sichtbar. Wische direkt über die hellen Flüssigkeitsreste.');
          if(remaining<.045 && (wipeDistance<1900 || now-cleaningStarted<8000)) setStatus('Fast vollständig sauber. Noch einige gründliche Bahnen über die Fläche.');
          if(remaining<.045 && wipeDistance>=1900 && now-cleaningStarted>=8000) finishCleaning();
        }
        function pointRightArmTo(x,y){
          const r=$('rightArm'); if(!r) return;
          const sx=window.innerWidth*.58, sy=window.innerHeight*.83;
          const dx=x-sx, dy=y-sy; const len=Math.max(155,Math.min(380,Math.hypot(dx,dy)));
          const angle=Math.atan2(dy,dx)*180/Math.PI;
          r.classList.add('grabbing'); r.style.width=len+'px'; r.style.left=(sx-len)+'px'; r.style.top=(sy-23)+'px'; r.style.transform='rotate('+(angle+180)+'deg)';
        }
        function finishCleaning(){
          if(!cleaning) return; cleaning=false;
          const spill=$('spillCanvas');if(spill){spill.style.transition='opacity .55s ease';spill.style.opacity='0';trackedTimeout(()=>{prepareSpillCanvas(true);spill.style.opacity='1';},600);}
          const wipe=$('wipeSheen'); if(wipe){ wipe.classList.remove('run'); void wipe.offsetWidth; wipe.classList.add('run'); }
          const cloth=$('heldCloth'); if(cloth) cloth.style.display='none'; resetArms();
          setStatus('Sehr schön. Du hast das Experiment offiziell sicher durchgeführt. Gleich kommt das Abschluss-Quiz.');
          const toast=$('completionToast'); if(toast) toast.classList.add('show');
          trackedTimeout(()=>{ const foam=$('labFoam'); if(foam){foam.innerHTML=''; foam.style.opacity='';} const film=$('tableAcidFilm'); if(film){film.classList.remove('show'); film.style.opacity='';} const puddle=$('labPuddle'); if(puddle) puddle.classList.remove('big'); const coat=$('labCoat'); if(coat) coat.classList.remove('stained'); const hook=$('cleanHook'); if(hook) hook.classList.remove('show','clean-ready','locked-clean'); document.querySelectorAll('.erase-spot,.clean-streak,.wipe-mark').forEach(e=>e.remove()); if(toast) toast.classList.remove('show'); const sink=$('labSink'); const sh=$('sinkHint'); const rack=$('dryRack'); if(sink) sink.classList.add('show'); if(sh) sh.classList.add('show'); if(rack) rack.classList.add('show'); setStatus('Jetzt noch die Gläser am Waschbecken spülen und ordentlich ins Regal stellen. Klicke auf das Waschbecken.'); },3200);
        }


        window.startSinkWash=function(e){
          if(e) e.stopPropagation();
          if(washingActive || washingDone) return;
          const sink=$('labSink'), hint=$('sinkHint'), rack=$('dryRack'), overlay=$('nawiLabOverlay');
          washingActive=true;
          if(hint) hint.classList.remove('show');
          if(overlay) overlay.classList.add('sink-focus');
          if(sink) sink.classList.add('focus','washing');
          if(rack) rack.classList.add('show');
          setStatus('Gehe zum Waschbecken: Nimm jedes Glas selbst, halte es unter das Wasser und stelle es danach ins Regal.');
          showManualWashGlasses();
        };

        let washState={placed:0, active:null, cleanTimer:null};
        let sinkFoamInterval=null;
        function showManualWashGlasses(){
          const g1=$('washGlass1'), g2=$('washGlass2'), wt=$('waterTarget'), rt=$('rackTarget');
          if(g1){g1.className='wash-glass green show'; g1.style.left=(window.innerWidth*.43)+'px'; g1.style.top=(window.innerHeight*.66)+'px'; g1.dataset.clean='0'; g1.dataset.placed='0';g1.dataset.rinse='0'; wireWashGlass(g1);}
          if(g2){g2.className='wash-glass blue show'; g2.style.left=(window.innerWidth*.52)+'px'; g2.style.top=(window.innerHeight*.66)+'px'; g2.dataset.clean='0'; g2.dataset.placed='0';g2.dataset.rinse='0'; wireWashGlass(g2);}
          updateRinseMeter(null);
          if(wt) wt.classList.add('show'); if(rt) rt.classList.add('show');
          stopSinkFoam();
        }
        function startSinkFoam(){
          stopSinkFoam();
          sinkFoamInterval=trackedInterval(()=>{
            const sink=$('labSink');
            if(!sink || !sink.classList.contains('washing')) return;
            const r=sink.getBoundingClientRect();
            spawnSinkFoam(r.left+r.width*0.56+(Math.random()*22-11), r.top+r.height*0.70+(Math.random()*16-8));
          },260);
        }
        function stopSinkFoam(){ if(sinkFoamInterval){ clearInterval(sinkFoamInterval); sinkFoamInterval=null; } }
        function spawnSinkFoam(x,y){
          for(let i=0;i<3;i++){
            const b=document.createElement('div');
            b.className='sink-foam';
            b.style.left=(x+(Math.random()*26-13))+'px';
            b.style.top=(y+(Math.random()*12-6))+'px';
            document.body.appendChild(b);
            trackedTimeout(()=>b.remove(),900);
          }
        }
        function wireWashGlass(glass){
          if(glass._wired) return; glass._wired=true;
          glass.addEventListener('pointerdown',(e)=>{ if(glass.dataset.placed==='1') return; e.preventDefault(); glass.setPointerCapture(e.pointerId); washState.active=glass;glass._rinseLast=null; glass.classList.add('grabbed');updateRinseMeter(glass); setStatus(glass.dataset.clean==='1'?'Sauberes Glas mit der Öffnung nach unten ins Trockengestell stellen.':'Glas unter dem Wasserstrahl langsam bewegen und drehen.'); });
          glass.addEventListener('pointermove',(e)=>{ if(washState.active!==glass) return; moveWashGlass(glass,e.clientX,e.clientY); });
          const release=(e,cancelled=false)=>{ if(washState.active!==glass) return; glass.classList.remove('grabbed','rinsing'); washState.active=null;glass._rinseLast=null; try{glass.releasePointerCapture(e.pointerId)}catch(err){}; if(!cancelled) maybePlaceGlass(glass); }; glass.addEventListener('pointerup',e=>release(e)); glass.addEventListener('pointercancel',e=>release(e,true));
        }
        function moveWashGlass(glass,x,y){
          glass.style.left=(x-19)+'px'; glass.style.top=(y-46)+'px';
          const stream=document.querySelector('.water-stream'); const rect=stream?stream.getBoundingClientRect():null;
          const underWater=rect && x>=rect.left-18 && x<=rect.right+18 && y>=rect.top-18 && y<=rect.bottom+18;
          if(underWater && glass.dataset.clean!=='1'){
            glass.classList.add('rinsing');const prev=glass._rinseLast,dist=prev?Math.hypot(x-prev.x,y-prev.y):0;glass._rinseLast={x,y};
            if(dist>1.5){const gain=Math.min(4,dist*.12),value=Math.min(100,(Number(glass.dataset.rinse)||0)+gain);glass.dataset.rinse=value.toFixed(1);glass.style.setProperty('--rinse-tilt',Math.max(-11,Math.min(11,(prev?x-prev.x:0)*1.5))+'deg');updateRinseMeter(glass);if(Math.floor(value/20)!==Math.floor((value-gain)/20)){spawnWaterDrops(x,y);setStatus('Spülfortschritt '+Math.floor(value)+' %. Bewege das Glas weiter, damit Wasser alle Flächen erreicht.');}if(value>=100){glass.dataset.clean='1';glass.classList.remove('rinsing');glass.classList.add('clean');spawnWaterDrops(x,y);setStatus('Glas ist vollständig abgespült. Stelle es mit der Öffnung nach unten ins Trockengestell.');}}
          } else if(!underWater){
            glass._rinseLast=null;glass.classList.remove('rinsing');
          }
        }
        function updateRinseMeter(glass){const meter=$('rinseMeter'),fill=$('rinseMeterFill'),text=$('rinseMeterText'),value=glass?Math.round(Number(glass.dataset.rinse)||0):0;if(meter)meter.classList.toggle('show',washingActive);if(fill)fill.style.width=value+'%';if(text)text.textContent=value+' %';}
        function maybePlaceGlass(glass){
          if(glass.dataset.clean!=='1') return;
          const rack=$('dryRack'); if(!rack) return;
          const r=rack.getBoundingClientRect(); const g=glass.getBoundingClientRect();
          const gx=g.left+g.width/2, gy=g.top+g.height/2;
          if(gx>r.left-30 && gx<r.right+30 && gy>r.top-30 && gy<r.bottom+50){
            glass.dataset.placed='1'; glass.classList.remove('grabbed'); glass.style.transition='left .45s, top .45s, opacity .35s, transform .35s';
            const slot={x:r.left+r.width*(washState.placed===0?.22:.56),y:r.top+r.height*.26};
            glass.style.left=slot.x+'px'; glass.style.top=slot.y+'px'; glass.style.transform='scale(.75)';
            washState.placed++;
            if(washState.placed>=2){ finishManualWash(); } else { updateRinseMeter(null);setStatus('Sehr ordentlich. Jetzt das zweite Glas rundum spülen und mit der Öffnung nach unten abstellen.'); }
          } else {
            setStatus('Das Glas ist sauber. Ziehe es rechts ins Reagenzglas-Regal.');
          }
        }
        function spawnWaterDrops(x,y){
          for(let i=0;i<10;i++){
            const d=document.createElement('div'); d.className='water-drop'; d.style.left=(x-8+Math.random()*28)+'px'; d.style.top=(y-8+Math.random()*18)+'px'; document.body.appendChild(d); trackedTimeout(()=>d.remove(),850);
          }
        }
        function finishManualWash(){
          washingDone=true; washingActive=false;
          const sink=$('labSink'), rack=$('dryRack'), toast=$('completionToast'), wt=$('waterTarget'), rt=$('rackTarget'), overlay=$('nawiLabOverlay');
          stopSinkFoam();
          if(sink) sink.classList.remove('washing');
          if(rack) rack.classList.add('manual-loaded');
          if(wt) wt.classList.remove('show'); if(rt) rt.classList.remove('show');
          $('rinseMeter')?.classList.remove('show');
          setStatus('Sehr schön. Du hast die Gläser selbst gespült und ordentlich ins Regal gestellt. Gleich kommt das Abschluss-Quiz.');
          if(toast) toast.classList.add('show');
          trackedTimeout(()=>{ if(toast) toast.classList.remove('show'); if(sink) sink.classList.remove('show','focus'); if(overlay) overlay.classList.remove('sink-focus'); showLabQuiz(); },3000);
        }

        const labQuizQuestions=[
          {q:'Warum muss man im Nawi-Raum vor dem Experiment eine Schutzbrille tragen?', a:['Damit es professioneller aussieht','Damit Augen vor Spritzern geschützt sind','Damit man Farben besser sieht'], correct:1},
          {q:'Was entsteht bei der Reaktion von Essigsäure und Natriumhydrogencarbonat sichtbar?', a:['Kohlenstoffdioxid, Bläschen und Schaum','Reiner Sauerstoff ohne Schaum','Nur farbiges Wasser'], correct:0},
          {q:'Braucht diese Reaktion einen Gasbrenner, um zu starten?', a:['Ja, ohne Flamme entsteht kein CO₂','Nein, sie beginnt beim Kontakt der beiden Stoffe','Nur wenn das Reagenzglas leer ist'], correct:1},
          {q:'Was ist nach einer schäumenden Reaktion besonders wichtig?', a:['Arbeitsplatz kontrollieren und sauber machen','Schaum liegen lassen','Ohne Kontrolle sofort weggehen'], correct:0},
          {q:'Warum sinkt die Temperatur während des Versuchs?', a:['Die Reaktion nimmt Wärme aus der Umgebung auf','Das CO₂ brennt besonders kalt','Das Reagenzglas erzeugt künstlich Eis'], correct:0}
        ];
        let quizIndex=0;
        function showLabQuiz(){ quizIndex=0; const q=$('labQuiz'); if(q) q.classList.add('show'); renderLabQuiz(); }
        function renderLabQuiz(){
          const item=labQuizQuestions[quizIndex];
          const qp=$('quizProgress'), qq=$('quizQuestion'), qo=$('quizOptions'), qf=$('quizFinish');
          if(qp) qp.textContent='Frage '+(quizIndex+1)+' von '+labQuizQuestions.length;
          if(qq) qq.textContent=item.q;
          if(qf) qf.classList.remove('show');
          if(!qo) return; qo.innerHTML='';
          item.a.forEach((txt,i)=>{ const b=document.createElement('button'); b.textContent=txt; b.onclick=()=>answerLabQuiz(i,b); qo.appendChild(b); });
        }
        function answerLabQuiz(i,btn){
          const item=labQuizQuestions[quizIndex];
          const buttons=Array.from(document.querySelectorAll('#quizOptions button'));
          buttons.forEach((b,idx)=>{ b.disabled=true; if(idx===item.correct) b.classList.add('correct'); });
          if(i!==item.correct) btn.classList.add('wrong');
          trackedTimeout(()=>{
            quizIndex++;
            if(quizIndex>=labQuizQuestions.length){
              const qp=$('quizProgress'), qq=$('quizQuestion'), qo=$('quizOptions'), qf=$('quizFinish');
              if(qp) qp.textContent='Quiz abgeschlossen';
              if(qq) qq.textContent='Sehr gut. Du hast die Reaktion sicher durchgeführt, die CO₂-Bildung und den Temperaturabfall beobachtet und den Arbeitsplatz gereinigt.';
              if(qo) qo.innerHTML='';
              if(qf) qf.classList.add('show');
              labQuizDone=true;
              setStatus('Quiz geschafft. Jetzt darfst du die Tour beenden.');
            } else renderLabQuiz();
          }, i===item.correct ? 650 : 1100);
        }
        window.finishLabQuiz=function(){ labQuizDone=true; const q=$('labQuiz'); if(q) q.classList.remove('show'); window.closeNawiLab(); };
        window.cleanLabMess=finishCleaning;
        document.addEventListener('pointermove',moveCleaningCloth,{passive:false});
        window.addEventListener('load',()=>{ setupBottle('greenBottle'); setupBottle('blueBottle'); });
        // Device patch behaviour: native viewport coordinates, no scaled stage.
        function clampActiveObjects(){
          end();
          ['greenBottle','blueBottle','washGlass1','washGlass2'].forEach(id=>{const el=$(id);if(!el||!el.style.left)return;const r=el.getBoundingClientRect();const x=clamp(r.left,4,Math.max(4,innerWidth-r.width-4)),y=clamp(r.top,70,Math.max(70,innerHeight-r.height-4));el.style.left=x+'px';el.style.top=y+'px';});
        }
        window.addEventListener('resize',clampActiveObjects);
        if(window.top===window.self) window.addEventListener('load',()=>window.openNawiLab());

      })();
/* Original V27 FINAL burner extension retained without duplicate interception. */
(function(){
  // The original inline onclick on #labBurner is the sole toggle path.  In particular, the
  // .burner-button deliberately bubbles to that parent exactly once.
})();
