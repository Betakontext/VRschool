/* Original NAWI REALISTIC LAB V27, isoliert. */
(function(){
        let gogglesOn=false, burnerOn=false, reactionDone=false, labQuizDone=false, washingDone=false, washingActive=false;
        let poured={green:false, blue:false};
        let active=null;
        let cleaning=false, wipeProgress=0, lastWipe={x:0,y:0}, cleanedElements=new Set(), messTargets=[], lastCleanTime=0;
        let helpFadeTimer=null;
        let offsets={x:0,y:0};
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
          if(help){ help.classList.remove('hide'); clearTimeout(helpFadeTimer); helpFadeTimer=setTimeout(()=>help.classList.add('hide'), 6000); }
        };
        window.closeNawiLab=function(){ if(reactionDone && !labQuizDone){ setStatus('Erst Arbeitsplatz sauber machen und das Abschluss-Quiz beenden. Danach kannst du zurück zur Tour.'); return; } const o=$('nawiLabOverlay'); if(o){o.style.display='none';o.setAttribute('aria-hidden','true');} };
        function resetNawiLab(){
          gogglesOn=false; burnerOn=false; reactionDone=false; labQuizDone=false; poured={green:false,blue:false}; active=null;
          $('nawiLabOverlay').classList.remove('goggles-on'); $('labGoggles') && $('labGoggles').classList.remove('worn'); resetArms(); $('labFlame').style.display='none';
          $('tubeLiquid').style.height='0'; $('tubeLiquid').style.background='linear-gradient(#63d471,#16a34a)';
          $('labFoam').innerHTML=''; $('labFoam').style.opacity=''; $('pourLayer').innerHTML=''; $('labPuddle').classList.remove('big'); const film=$('tableAcidFilm'); if(film){film.classList.remove('show'); film.style.opacity='';} const coat=$('labCoat'); if(coat) coat.classList.remove('stained'); const hook=$('cleanHook'); if(hook){hook.classList.remove('show','clean-ready','locked-clean');} const held=$('heldCloth'); if(held) held.style.display='none'; const hint=$('burnerHint'); if(hint){hint.classList.remove('show'); hint.textContent='Jetzt Brenner-Knopf drücken';} const burn=$('labBurner'); if(burn) burn.classList.remove('burner-ready','needs-off'); const bcz=$('burnerClickZone'); if(bcz) bcz.classList.remove('show'); const wipe=$('wipeSheen'); if(wipe) wipe.classList.remove('run'); const toast=$('completionToast'); if(toast) toast.classList.remove('show'); const quiz=$('labQuiz'); if(quiz) quiz.classList.remove('show'); const qf=$('quizFinish'); if(qf) qf.classList.remove('show'); const sink=$('labSink'); if(sink) sink.classList.remove('show','washing'); const sh=$('sinkHint'); if(sh) sh.classList.remove('show'); const rack=$('dryRack'); if(rack) rack.classList.remove('show','loaded'); document.querySelectorAll('.clean-streak,.erase-spot,.wipe-mark').forEach(e=>e.remove()); cleanedElements=new Set(); messTargets=[]; lastCleanTime=0; washingDone=false; washingActive=false; if(typeof stopSinkFoam==='function') stopSinkFoam();
          ['greenBottle','blueBottle'].forEach(id=>{const b=$(id); if(!b) return; b.classList.remove('dragging'); b.style.left='';b.style.top='';b.style.right='';b.style.transform=''; const l=b.querySelector('.bottle-liquid'); if(l) l.style.height='64%';});
          setStatus('Setze zuerst die Schutzbrille auf. Danach beide Flüssigkeiten ins Reagenzglas gießen. Der Gasbrenner bleibt aus, bis beide Stoffe drin sind.');
        }
        window.putOnGoggles=function(){ gogglesOn=true; $('nawiLabOverlay').classList.add('goggles-on'); $('labGoggles') && $('labGoggles').classList.add('worn'); setStatus('Schutzbrille sitzt. Jetzt beide Flaschen nacheinander über das Reagenzglas ziehen und eingießen. Danach erst den Gasbrenner einschalten.'); };
        window.toggleBurner=function(){
          if(reactionDone){
            if(burnerOn){
              burnerOn=false;
              const flame=$('labFlame'); if(flame) flame.style.display='none';
              const hint=$('burnerHint'); if(hint) hint.classList.remove('show');
              const burn=$('labBurner'); if(burn) burn.classList.remove('needs-off','burner-ready');
              const bcz=$('burnerClickZone'); if(bcz) bcz.classList.remove('show');
              const hook=$('cleanHook'); if(hook){ hook.classList.remove('locked-clean'); hook.classList.add('show','clean-ready'); }
              setStatus('Gasbrenner ist ausgeschaltet. Jetzt den Lappen nehmen und den Tisch sauber wischen.');
            } else {
              setStatus('Der Brenner ist aus. Jetzt mit dem Lappen den Arbeitsplatz sauber machen.');
            }
            return;
          }
          if(!(poured.green && poured.blue)){
            $('labFlame').style.display='none'; burnerOn=false;
            setStatus('Erst beide Flüssigkeiten ins Reagenzglas geben. Danach darfst du den Gasbrenner einschalten.');
            return;
          }
          burnerOn=true;
          const hint=$('burnerHint'); if(hint){hint.classList.remove('show'); hint.textContent='Jetzt Brenner-Knopf drücken';} const burn=$('labBurner'); if(burn) burn.classList.remove('burner-ready','needs-off');
          $('labFlame').style.display='block';
          setStatus('Gasbrenner ist an. Die Mischung wird erhitzt – gleich startet die Reaktion.');
          setTimeout(startReaction, 450);
        };
        window.showLabInfo=function(e,title,text){ if(e) e.stopPropagation(); const c=$('labInfoCard'); c.innerHTML='<b>'+title+'</b>'+text; c.style.display='block'; c.style.left=clamp((e?.clientX||200)+12,12,window.innerWidth-285)+'px'; c.style.top=clamp((e?.clientY||160)+12,12,window.innerHeight-130)+'px'; };
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
          b.addEventListener('pointerdown',start); b.addEventListener('mousedown',start); b.addEventListener('touchstart',start,{passive:false});
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
        document.addEventListener('pointermove',move); document.addEventListener('mousemove',move); document.addEventListener('touchmove',move,{passive:false});
        document.addEventListener('pointerup',end); document.addEventListener('mouseup',end); document.addEventListener('touchend',end);
        function pour(bottle, tilt){
          const chem=bottle.dataset.chem; if(poured[chem]) return;
          const tube=$('reactionTube').getBoundingClientRect(); const b=bottle.getBoundingClientRect();
          // Auslass ungefähr an der echten Flaschenöffnung je nach Kippseite.
          const mouthX = tilt>0 ? b.right-26 : b.left+26;
          const mouthY = b.top+28;
          const targetX = tube.left + tube.width/2;
          const targetY = tube.top + 28;
          const color = chem==='green' ? '#22c55e' : '#38bdf8';
          const liquid=bottle.querySelector('.bottle-liquid'); if(liquid) liquid.style.height='22%';
          // Viele Tropfen statt Laser-Strich: wirkt flüssiger und kommt aus der Öffnung.
          let i=0; const timer=setInterval(()=>{ createDrop(mouthX+(Math.random()*8-4),mouthY+(Math.random()*8-4),targetX+(Math.random()*18-9),targetY+(Math.random()*18-9),color); if(++i>22){clearInterval(timer); poured[chem]=true; updateTube(chem); if(poured.green&&poured.blue){ const hint=$('burnerHint'); if(hint) hint.classList.add('show'); const burn=$('labBurner'); if(burn) burn.classList.add('burner-ready'); setStatus('Beide Flüssigkeiten sind im Reagenzglas. Jetzt den roten Knopf am Gasbrenner anklicken.'); } } },35);
          setStatus((chem==='green'?'Natriumhydrogencarbonat':'Essigsäure')+' wird aus der Flaschenöffnung in das Reagenzglas gegossen.');
        }
        function createDrop(x1,y1,x2,y2,color){
          const d=document.createElement('div'); d.className='droplet'; d.style.left=x1+'px'; d.style.top=y1+'px'; d.style.background=color; d.style.color=color; $('pourLayer').appendChild(d);
          const midX=(x1+x2)/2+(Math.random()*45-22); const midY=(y1+y2)/2+45+Math.random()*18;
          const start=performance.now(); const dur=520+Math.random()*180;
          function anim(t){ const k=Math.min(1,(t-start)/dur); const a=(1-k)*(1-k), b=2*(1-k)*k, c=k*k; const x=a*x1+b*midX+c*x2; const y=a*y1+b*midY+c*y2; d.style.transform='translate('+(x-x1)+'px,'+(y-y1)+'px) scale('+(1-k*.25)+')'; d.style.opacity=String(0.9-k*.35); if(k<1) requestAnimationFrame(anim); else d.remove(); }
          requestAnimationFrame(anim);
        }
        function updateTube(chem){ const l=$('tubeLiquid'); if(!l) return; if(chem==='green'){l.style.height='35px';l.style.background='linear-gradient(#82f0a1,#16a34a)';} if(chem==='blue'){l.style.height=poured.green?'70px':'35px';l.style.background='linear-gradient(#7dd3fc,#2563eb)';} if(poured.green&&poured.blue){l.style.height='82px';l.style.background='linear-gradient(#d9f99d,#22c55e,#38bdf8)';} }
        function startReaction(){
          if(reactionDone) return;
          if(!(poured.green && poured.blue)){setStatus('Es fehlen noch Stoffe im Reagenzglas. Erst beide Flüssigkeiten eingießen.'); return;}
          if(!burnerOn){setStatus('Die Stoffe sind gemischt. Schalte jetzt den Gasbrenner ein.'); return;}
          reactionDone=true;
          setStatus('Boom! Die CO₂-Schaumreaktion platzt aus dem Reagenzglas, läuft über den Tisch und hinterlässt grüne Spritzer.');
          const foam=$('labFoam'); foam.innerHTML='';
          const center=$('reactionTube').getBoundingClientRect();
          const table=document.querySelector('.lab-table').getBoundingClientRect();
          const cx=center.left+center.width/2, cy=center.top+45;
          const flame=$('labFlame');
          if(flame){ flame.style.display='block'; flame.style.opacity='1'; flame.style.transform='scale(1.38)'; setTimeout(()=>{flame.style.transform=''; flame.style.opacity='.78';},1100); }

          // 1) Kurzer sichtbarer "Platz" direkt aus dem Reagenzglas heraus.
          const burst=document.createElement('div');
          burst.className='reaction-burst';
          burst.style.left=cx+'px'; burst.style.top=cy+'px';
          burst.style.width='195px'; burst.style.height='195px';
          foam.appendChild(burst); setTimeout(()=>burst.remove(),1000);

          // 2) Schaum steigt zuerst aus der Öffnung des Reagenzglases.
          for(let i=0;i<85;i++){
            setTimeout(()=>{
              const b=document.createElement('div'); b.className='bubble';
              const s=10+Math.random()*42;
              b.style.width=s+'px'; b.style.height=s+'px';
              b.style.left=(cx+(Math.random()*36-18))+'px';
              b.style.top=(cy+(Math.random()*18-9))+'px';
              b.style.setProperty('--x',(Math.random()*260-130)+'px');
              b.style.setProperty('--y',(-35-Math.random()*190)+'px');
              foam.appendChild(b); setTimeout(()=>b.remove(),1700);
            },i*10);
          }

          // 3) Dicke Schaumklumpen platzen auf den Tisch und bleiben sichtbar.
          for(let i=0;i<52;i++){
            setTimeout(()=>{
              const blob=document.createElement('div'); blob.className='foam-blob';
              const size=26+Math.random()*98;
              blob.style.width=size+'px'; blob.style.height=(size*(.50+Math.random()*.30))+'px';
              blob.style.left=cx+'px'; blob.style.top=(cy+22)+'px';
              blob.style.setProperty('--x',(Math.random()*(table.width*.88)-table.width*.44)+'px');
              blob.style.setProperty('--y',(table.top+table.height*(.40+Math.random()*.42)-cy)+'px');
              foam.appendChild(blob);
            },260+i*24);
          }

          // 4) Säure-/Schaumfilm bedeckt fast den ganzen Tisch.
          setTimeout(()=>{ const film=$('tableAcidFilm'); if(film) film.classList.add('show'); $('labPuddle').classList.add('big'); },850);

          // 5) Grüne Spritzer an den Kanten und ein paar auf dem Kittel.
          for(let i=0;i<48;i++){
            setTimeout(()=>{
              const sp=document.createElement('div'); sp.className='acid-splash';
              const size=12+Math.random()*52;
              sp.style.width=size+'px'; sp.style.height=(size*(.35+Math.random()*.55))+'px';
              sp.style.left=cx+'px'; sp.style.top=cy+'px';
              const towardBody = i>40;
              const targetX = towardBody ? (Math.random()*220-110) : (Math.random()*table.width - table.width/2);
              const targetY = towardBody ? (window.innerHeight*.83-cy + Math.random()*70) : (table.top+table.height*(.24+Math.random()*.68)-cy);
              sp.style.setProperty('--x',targetX+'px'); sp.style.setProperty('--y',targetY+'px');
              sp.style.setProperty('--r',(Math.random()*160-80)+'deg');
              foam.appendChild(sp);
            },420+i*28);
          }
          setTimeout(()=>{ const coat=$('labCoat'); if(coat) coat.classList.add('stained'); },1300);
          setTimeout(()=>{ const hint=$('burnerHint'); if(hint){ hint.textContent='Brenner ausschalten'; hint.classList.add('show'); } const burn=$('labBurner'); if(burn) burn.classList.add('burner-ready','needs-off'); const bcz=$('burnerClickZone'); if(bcz) bcz.classList.add('show'); const hook=$('cleanHook'); if(hook){ hook.classList.remove('show','clean-ready'); hook.classList.add('locked-clean'); } setStatus('Reaktion beendet. Schalte den Gasbrenner über den roten Knopf aus, danach sauber machen.'); },1900);
        }
        window.pickCleaningCloth=function(e){
          if(e){ e.stopPropagation(); if(e.preventDefault) e.preventDefault(); }
          if(cleaning) return;
          if(burnerOn){ setStatus('Erst den roten Knopf am Gasbrenner drücken und den Brenner ausschalten. Danach darfst du sauber machen.'); const hint=$('burnerHint'); if(hint){hint.textContent='Brenner ausschalten'; hint.classList.add('show');} const burn=$('labBurner'); if(burn) burn.classList.add('needs-off','burner-ready'); const bcz=$('burnerClickZone'); if(bcz) bcz.classList.add('show'); return; }
          cleaning=true; wipeProgress=0; cleanedElements=new Set(); messTargets=Array.from(document.querySelectorAll('#labFoam .foam-blob,#labFoam .acid-splash,#labFoam .bubble')); lastCleanTime=0;
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
          if(dist < 42) return;

          const old={x:lastWipe.x,y:lastWipe.y};
          lastWipe={x:p.x,y:p.y}; wipeProgress++; lastCleanTime = now;
          const angle=Math.atan2(p.y-old.y,p.x-old.x)*180/Math.PI;
          const midX=(p.x+old.x)/2, midY=(p.y+old.y)/2;

          // Nur noch selten eine Wischspur erzeugen – das spart sehr viel Leistung.
          if(wipeProgress % 2 === 0){
            const streak=document.createElement('div');
            streak.className='clean-streak fast';
            streak.style.left=midX+'px'; streak.style.top=midY+'px';
            streak.style.setProperty('--angle',angle+'deg');
            document.body.appendChild(streak);
            setTimeout(()=>streak.remove(),1500);
          }

          eraseNearbyMess(midX, midY, 125);
          if(wipeProgress===6) setStatus('Gut. Weiterwischen: Der Schaum verschwindet dort, wo du wirklich mit dem Lappen langgehst.');
          if(wipeProgress===18) setStatus('Fast sauber. Noch ein paar Bahnen über den Tisch wischen.');
          const film=$('tableAcidFilm');
          if(film && wipeProgress>10) film.style.opacity=String(Math.max(0.16,1-(wipeProgress-10)*0.04));
          const targetCount = messTargets.length || 1;
          if(wipeProgress>=34 || cleanedElements.size>=Math.min(42, targetCount*.78)) finishCleaning();
        }
        function eraseNearbyMess(x,y,radius){
          const targets = messTargets.length ? messTargets : Array.from(document.querySelectorAll('#labFoam .foam-blob,#labFoam .acid-splash,#labFoam .bubble'));
          let removedNow = 0;
          for(const el of targets){
            if(!el || cleanedElements.has(el) || !el.isConnected) continue;
            const rect=el.getBoundingClientRect();
            const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
            if(Math.hypot(cx-x,cy-y)<radius){
              cleanedElements.add(el); removedNow++;
              el.style.transition='opacity .35s ease, transform .35s ease, filter .35s ease';
              el.style.opacity='0';
              el.style.filter='blur(4px)';
              el.style.transform=(el.style.transform||'')+' scale(.62)';
              setTimeout(()=>{ if(el && el.remove) el.remove(); },390);
              if(removedNow>=10) break; // nie zu viele Elemente auf einmal anfassen
            }
          }
          const foam=$('labFoam');
          const total=targets.length||1;
          if(foam && cleanedElements.size>total*.55){ foam.style.opacity='0.78'; }
          if(foam && cleanedElements.size>total*.76){ foam.style.opacity='0.50'; }
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
          const wipe=$('wipeSheen'); if(wipe){ wipe.classList.remove('run'); void wipe.offsetWidth; wipe.classList.add('run'); }
          const cloth=$('heldCloth'); if(cloth) cloth.style.display='none'; resetArms();
          setStatus('Sehr schön. Du hast das Experiment offiziell sicher durchgeführt. Gleich kommt das Abschluss-Quiz.');
          const toast=$('completionToast'); if(toast) toast.classList.add('show');
          setTimeout(()=>{ const foam=$('labFoam'); if(foam){foam.innerHTML=''; foam.style.opacity='';} const film=$('tableAcidFilm'); if(film){film.classList.remove('show'); film.style.opacity='';} const puddle=$('labPuddle'); if(puddle) puddle.classList.remove('big'); const coat=$('labCoat'); if(coat) coat.classList.remove('stained'); const hook=$('cleanHook'); if(hook) hook.classList.remove('show','clean-ready','locked-clean'); document.querySelectorAll('.erase-spot,.clean-streak,.wipe-mark').forEach(e=>e.remove()); if(toast) toast.classList.remove('show'); const sink=$('labSink'); const sh=$('sinkHint'); const rack=$('dryRack'); if(sink) sink.classList.add('show'); if(sh) sh.classList.add('show'); if(rack) rack.classList.add('show'); setStatus('Jetzt noch die Gläser am Waschbecken spülen und ordentlich ins Regal stellen. Klicke auf das Waschbecken.'); },3200);
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
          if(g1){g1.className='wash-glass green show'; g1.style.left=(window.innerWidth*.43)+'px'; g1.style.top=(window.innerHeight*.66)+'px'; g1.dataset.clean='0'; g1.dataset.placed='0'; wireWashGlass(g1);}
          if(g2){g2.className='wash-glass blue show'; g2.style.left=(window.innerWidth*.52)+'px'; g2.style.top=(window.innerHeight*.66)+'px'; g2.dataset.clean='0'; g2.dataset.placed='0'; wireWashGlass(g2);}
          if(wt) wt.classList.add('show'); if(rt) rt.classList.add('show');
          startSinkFoam();
        }
        function startSinkFoam(){
          stopSinkFoam();
          sinkFoamInterval=setInterval(()=>{
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
            setTimeout(()=>b.remove(),900);
          }
        }
        function wireWashGlass(glass){
          if(glass._wired) return; glass._wired=true;
          glass.addEventListener('pointerdown',(e)=>{ if(glass.dataset.placed==='1') return; e.preventDefault(); glass.setPointerCapture(e.pointerId); washState.active=glass; glass.classList.add('grabbed'); setStatus(glass.dataset.clean==='1'?'Sauberes Glas ins Regal stellen.':'Halte das Glas unter den Wasserstrahl, bis es sauber ist.'); });
          glass.addEventListener('pointermove',(e)=>{ if(washState.active!==glass) return; moveWashGlass(glass,e.clientX,e.clientY); });
          glass.addEventListener('pointerup',(e)=>{ if(washState.active!==glass) return; glass.classList.remove('grabbed'); washState.active=null; clearTimeout(washState.cleanTimer); washState.cleanTimer=null; try{glass.releasePointerCapture(e.pointerId)}catch(err){}; maybePlaceGlass(glass); });
        }
        function moveWashGlass(glass,x,y){
          glass.style.left=(x-19)+'px'; glass.style.top=(y-46)+'px';
          const sink=$('labSink'); const rect=sink?sink.getBoundingClientRect():null;
          const underWater=rect && x>rect.left+120 && x<rect.left+175 && y>rect.top+70 && y<rect.top+170;
          if(underWater && glass.dataset.clean!=='1'){
            if(!washState.cleanTimer){
              setStatus('Sehr gut. Halte das Glas kurz unter dem Wasserstrahl.');
              spawnWaterDrops(x,y); spawnSinkFoam(x,y);
              washState.cleanTimer=setTimeout(()=>{ glass.dataset.clean='1'; glass.classList.add('clean'); spawnWaterDrops(x,y); spawnSinkFoam(x,y); setStatus('Glas ist sauber. Stelle es jetzt ins Reagenzglas-Regal.'); },950);
            }
          } else if(!underWater){
            clearTimeout(washState.cleanTimer); washState.cleanTimer=null;
          }
        }
        function maybePlaceGlass(glass){
          if(glass.dataset.clean!=='1') return;
          const rack=$('dryRack'); if(!rack) return;
          const r=rack.getBoundingClientRect(); const g=glass.getBoundingClientRect();
          const gx=g.left+g.width/2, gy=g.top+g.height/2;
          if(gx>r.left-30 && gx<r.right+30 && gy>r.top-30 && gy<r.bottom+50){
            glass.dataset.placed='1'; glass.classList.remove('grabbed'); glass.style.transition='left .45s, top .45s, opacity .35s, transform .35s';
            const slot=washState.placed===0?{x:r.left+38,y:r.top+32}:{x:r.left+88,y:r.top+32};
            glass.style.left=slot.x+'px'; glass.style.top=slot.y+'px'; glass.style.transform='scale(.75)';
            washState.placed++;
            if(washState.placed>=2){ finishManualWash(); } else { setStatus('Sehr ordentlich. Jetzt noch das zweite Glas spülen und ins Regal stellen.'); }
          } else {
            setStatus('Das Glas ist sauber. Ziehe es rechts ins Reagenzglas-Regal.');
          }
        }
        function spawnWaterDrops(x,y){
          for(let i=0;i<10;i++){
            const d=document.createElement('div'); d.className='water-drop'; d.style.left=(x-8+Math.random()*28)+'px'; d.style.top=(y-8+Math.random()*18)+'px'; document.body.appendChild(d); setTimeout(()=>d.remove(),850);
          }
        }
        function finishManualWash(){
          washingDone=true; washingActive=false;
          const sink=$('labSink'), rack=$('dryRack'), toast=$('completionToast'), wt=$('waterTarget'), rt=$('rackTarget'), overlay=$('nawiLabOverlay');
          stopSinkFoam();
          if(sink) sink.classList.remove('washing');
          if(rack) rack.classList.add('manual-loaded');
          if(wt) wt.classList.remove('show'); if(rt) rt.classList.remove('show');
          setStatus('Sehr schön. Du hast die Gläser selbst gespült und ordentlich ins Regal gestellt. Gleich kommt das Abschluss-Quiz.');
          if(toast) toast.classList.add('show');
          setTimeout(()=>{ if(toast) toast.classList.remove('show'); if(sink) sink.classList.remove('show','focus'); if(overlay) overlay.classList.remove('sink-focus'); showLabQuiz(); },3000);
        }

        const labQuizQuestions=[
          {q:'Warum muss man im Nawi-Raum vor dem Experiment eine Schutzbrille tragen?', a:['Damit es professioneller aussieht','Damit Augen vor Spritzern geschützt sind','Damit man Farben besser sieht'], correct:1},
          {q:'Was entsteht bei der Reaktion von Essigsäure und Natriumhydrogencarbonat sichtbar?', a:['Kohlenstoffdioxid, Bläschen und Schaum','Reiner Sauerstoff ohne Schaum','Nur farbiges Wasser'], correct:0},
          {q:'Wann darf der Gasbrenner eingeschaltet werden?', a:['Erst nachdem beide Lösungen im Reagenzglas sind','Direkt am Anfang, bevor die Schutzbrille sitzt','Während man noch die Flasche hält'], correct:0},
          {q:'Was ist nach einer schäumenden Reaktion besonders wichtig?', a:['Arbeitsplatz kontrollieren und sauber machen','Schaum liegen lassen','Den Brenner weiterlaufen lassen'], correct:0},
          {q:'Was ist die richtige Reihenfolge nach der Reaktion?', a:['Erst Lappen nehmen, dann Brenner ausschalten','Brenner ausschalten, dann sauber machen','Einfach weggehen, wenn es fertig ist'], correct:1}
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
          setTimeout(()=>{
            quizIndex++;
            if(quizIndex>=labQuizQuestions.length){
              const qp=$('quizProgress'), qq=$('quizQuestion'), qo=$('quizOptions'), qf=$('quizFinish');
              if(qp) qp.textContent='Quiz abgeschlossen';
              if(qq) qq.textContent='Sehr gut. Du hast das Experiment sicher durchgeführt, den Brenner ausgeschaltet, den Arbeitsplatz gereinigt und die wichtigsten Sicherheitsregeln verstanden.';
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
        document.addEventListener('mousemove',moveCleaningCloth);
        document.addEventListener('touchmove',moveCleaningCloth,{passive:false});
        window.addEventListener('load',()=>{ setupBottle('greenBottle'); setupBottle('blueBottle'); });
      })();
/* Original V27 FINAL burner extension. */
(function(){
        function $(id){ return document.getElementById(id); }
        function safeToggleBurner(e){
          if(e){ e.preventDefault(); e.stopPropagation(); }
          if(typeof window.toggleBurner === 'function') window.toggleBurner();
        }
        function wireV27Burner(){
          const zone = $('burnerClickZone');
          const burner = $('labBurner');
          const button = burner ? burner.querySelector('.burner-button') : null;
          [zone, burner, button].forEach(el=>{
            if(!el || el._v27Wired) return;
            el.addEventListener('click', safeToggleBurner, true);
            el.addEventListener('pointerdown', function(e){
              if(zone && zone.classList.contains('show')) safeToggleBurner(e);
            }, true);
            el._v27Wired = true;
          });
        }
        document.addEventListener('DOMContentLoaded', wireV27Burner);
        setTimeout(wireV27Burner, 400);
        setTimeout(wireV27Burner, 1200);
      })();
