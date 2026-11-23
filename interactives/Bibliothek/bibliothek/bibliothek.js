(()=>{'use strict';const $=id=>document.getElementById(id);const state={found:new Set(),key:false,opened:false,hint:0,activity:{visits:{},lastAction:null,lockErrors:0,noteRead:false,startedAt:Date.now()},hintReadAt:0};const names={shelf:'Archivregal',clock:'Wanduhr',painting:'Alter Fluchtplan',rug:'Perserteppich',drawer:'Schreibtischschublade'};const clues={shelf:{digit:'8',title:'Die Archivsignatur',text:'Hinter einem ungewöhnlich schmalen Buch steckt eine Karte mit der Archivsignatur <strong>8</strong>. Daneben steht: „Was gelesen wird, eröffnet Wege.“'},clock:{digit:'4',title:'Die Uhr des Archivars',text:'Die drei Zeiger bewegen sich. Auf der kleinen Messingplakette unter dem Zifferblatt entdeckst du eine eingeritzte <strong>4</strong>. Darunter steht: „Keine Stunde kehrt zurück.“'},painting:{digit:'2',title:'Hinter dem Rahmen',text:'Hinter dem lockeren Rahmen ist eine <strong>2</strong> in das Holz geritzt. Eine Notiz sagt: „Mancher Plan verschweigt, was sein Rahmen weiß.“'},rug:{digit:'7',title:'Die Spur im Boden',text:'Unter der Teppichkante befindet sich eine alte Bodenmarkierung: <strong>7</strong>. Darunter: „Manchmal spricht der Boden leiser als das Holz.“'}};// Jede Spielrunde erhaelt neue, verschiedene Ziffern. Das letzte Ergebnis
// wird lokal gespeichert, damit nicht derselbe Code direkt erneut erscheint.
const initialClueTexts=Object.fromEntries(Object.entries(clues).map(([id,c])=>[id,c.text]));
const puzzle={shelfSlot:10,rugCorner:2,drawerStage:0,attempts:{}};
function freshPuzzles(){
 // Target positions also vary between rounds; no memory of a previous location can solve it.
 puzzle.shelfSlot=randomDigit(18);
 puzzle.rugCorner=randomDigit(4);
 puzzle.drawerStage=0;
 puzzle.attempts={};
}
function wrongTry(area,feedback){
 puzzle.attempts[area]=(puzzle.attempts[area]||0)+1;
 const line=$('puzzleFeedback');
 if(line){line.textContent=feedback;line.classList.remove('good');}
}
function successTry(text){const line=$('puzzleFeedback');if(line){line.textContent=text;line.classList.add('good');}}
function puzzlePanel(tag,title,description,interactive){
 dialog(tag,title,'<p class="puzzle-intro">'+description+'</p>'+interactive+'<p class="puzzle-feedback" id="puzzleFeedback" aria-live="polite">Untersuche das Objekt selbst.</p>',[{label:'Zurück in den Raum',fn:close,secondary:true}]);
}
function examineShelf(){
 // Visible dimensions and symbols are the clues. An ordinary action button cannot grant a digit.
 const otherSymbols=['◆','●','✦','☽','✧','✜'];
 const books=Array.from({length:18},(_,i)=>{
   const skinny=i===puzzle.shelfSlot || (i%7===2) || (i%9===4);
   const mark=i===puzzle.shelfSlot?'✦':otherSymbols[(i*5+2)%otherSymbols.length];
   // Only the target combines the star and narrow spine.
   const symbol=i!==puzzle.shelfSlot && skinny && mark==='✦'?'◆':mark;
   const col=['wine','sage','copper','night','olive','plum'][(i*5+Math.floor(i/3))%6];
   return '<button type="button" class="archive-book '+col+(skinny?' slim':'')+'" data-book="'+i+'" aria-label="Buch '+(i+1)+', Symbol '+symbol+'"><span class="book-gilt">'+symbol+'</span><span class="book-tiny">'+(i%3===0?'ANNO':'ARCHIV')+'</span></button>';
 }).join('');
 puzzlePanel('UNTERSUCHUNG · REGAL','Die Rücken der alten Bücher',
  'Die Archivnotiz erwähnt einen <strong>Rücken</strong>. Zwischen den Bänden soll ein <strong>auffallend schmales Buch mit einem Sternzeichen</strong> stehen. Finde es im Regal und ziehe genau diesen Band heraus.',
  '<div class="interactive-case book-case" aria-label="Untersuchbares Bücherregal">'+books+'</div>');
 document.querySelectorAll('[data-book]').forEach(el=>el.addEventListener('click',()=>{
  if(Number(el.dataset.book)===puzzle.shelfSlot){el.classList.add('discovered');successTry('Ein verborgenes Fach klickt hinter dem Sternbuch auf.');setTimeout(()=>find('shelf'),420)}
  else{el.classList.add('inspected');wrongTry('shelf','Du ziehst den Band vorsichtig vor. Nur staubige Seiten. Vergleiche Buchbreite und Zeichen auf dem Rücken.')}
 }));
}
function examineClock(){
 const rivets=['◆','⧖','✦','●','▣'];
 // Reversed order on alternating sessions; correct symbol stays logically identifiable.
 const shift=puzzle.shelfSlot%5;
 const buttons=rivets.map((v,i)=>({symbol:v,id:i})).sort((a,b)=>((a.id+shift)%5)-((b.id+shift)%5)).map(({symbol,id})=>
  '<button type="button" class="plaque-rivet" data-rivet="'+id+'" aria-label="Messingprägung '+symbol+'"><span>'+symbol+'</span><small>PRÄGUNG '+(id+1)+'</small></button>').join('');
 puzzlePanel('UNTERSUCHUNG · UHR','Die verborgene Plakette',
  'Unter dem Zifferblatt sitzt eine verschraubte Messingplatte. Ein winziger Spruch ist eingeritzt: <em>„Nicht der Zeiger führt dich heim. Zwei Spitzen treffen sich im Sand der Zeit.“</em> Welche Prägung ist gemeint?',
  '<div class="interactive-case clock-case"><div class="clock-case-top">ARCHIV · ANNO MDCCCLXXIX</div><div class="rivet-row">'+buttons+'</div><div class="clock-case-bottom">TEMPUS OMNIA REVELAT</div></div>');
 document.querySelectorAll('[data-rivet]').forEach(el=>el.addEventListener('click',()=>{
  if(Number(el.dataset.rivet)===1){el.classList.add('discovered');successTry('Die Sanduhrprägung löst den kleinen Riegel. Unter der Platte liegt eine Ziffer.');setTimeout(()=>find('clock'),470)}
  else{el.classList.add('inspected');wrongTry('clock','Das Messing ist fest. Das Zeichen passt nicht zum Spruch über den Sand der Zeit.')}
 }));
}
function examinePainting(){
 const frameEdges=[['oben','Oberkante'],['rechts','Rechte Kante'],['unten','Unterkante'],['links','Linke Kante']];
 const edgeButtons=frameEdges.map(([id,label])=>'<button type="button" data-frame="'+id+'" class="frame-touch '+id+'" aria-label="'+label+' des Rahmens untersuchen">'+(id==='unten'?'⌁':'·')+'</button>').join('');
 puzzlePanel('UNTERSUCHUNG · FLUCHTPLAN','Die Spur am Bilderrahmen',
  'Der alte Plan ist hinter Glas gefasst. Auf dem Holz erkennst du <strong>frische Kratzspuren im Staub</strong>. Untersuche den Rahmen an der richtigen Stelle, um den verborgenen Mechanismus zu entdecken.',
  '<div class="interactive-case painting-case"><div class="painting-frame"><img src="assets/fluchtplan-original.webp" alt="Alter gezeichneter Fluchtplan im Rahmen">'+edgeButtons+'</div><span class="case-footnote">Berühre eine der vier Rahmenkanten. Die eingeritzte Wellenlinie ist ein Hinweis.</span></div>');
 document.querySelectorAll('[data-frame]').forEach(el=>el.addEventListener('click',()=>{
  if(el.dataset.frame==='unten'){el.classList.add('discovered');successTry('Die Unterkante gibt nach. Auf der Rückseite ist ein Zeichen eingeritzt.');setTimeout(()=>find('painting'),440)}
  else{el.classList.add('inspected');wrongTry('painting','Diese Rahmenkante sitzt fest. Suche die Stelle mit den frischen Kratzspuren.')}
 }));
}
function examineRug(){
 const corners=[['oben links','tl'],['oben rechts','tr'],['unten links','bl'],['unten rechts','br']];
 const buttons=corners.map(([n,id],i)=>'<button type="button" class="rug-corner '+id+(i===puzzle.rugCorner?' folded':'')+'" data-corner="'+i+'" aria-label="Teppichecke '+n+' anheben"><span>'+(i===puzzle.rugCorner?'◢':'✧')+'</span></button>').join('');
 puzzlePanel('UNTERSUCHUNG · TEPPICH','Die abgenutzte Webkante',
  'Der Teppich liegt schwer auf den Dielen. <strong>Eine seiner vier Ecken ist sichtbar leicht umgeschlagen.</strong> Finde diese Ecke im Teppichmuster und hebe sie an.',
  '<div class="interactive-case rug-case"><div class="rug-fabric"><div class="rug-pattern">✺<span>❖</span>✺</div>'+buttons+'</div><span class="case-footnote">Achte auf die anders geformte, umgeschlagene Ecke.</span></div>');
 document.querySelectorAll('[data-corner]').forEach(el=>el.addEventListener('click',()=>{
  if(Number(el.dataset.corner)===puzzle.rugCorner){el.classList.add('discovered');successTry('Die umgeschlagene Ecke gleitet zurück. Eine eingeritzte Markierung im Boden kommt zum Vorschein.');setTimeout(()=>find('rug'),440)}
  else{el.classList.add('inspected');wrongTry('rug','Die gewebte Kante ist hier fest und staubig. Eine andere Ecke steht etwas höher.')}
 }));
}
function examineDrawer(){
 if(state.key){dialog('UNTERSUCHUNG','Die alte Schreibtischschublade','<p>Die Lade steht einen Spalt offen. Das geheime Fach unter ihrem Boden ist leer.</p>',[{label:'Weiter erkunden',fn:close}]);return}
 const stage=puzzle.drawerStage;
 const message=stage===0?'Alte Rechnungen, eine Schreibfeder und ein Tintenglas liegen in der mittleren Schublade. <strong>Was verdeckt den Boden?</strong>':stage===1?'Du hast die losen Papiere beiseitegeschoben. Darunter liegen drei Holzfelder. <strong>Prüfe, welches hohl klingt.</strong>':'Das mittlere Feld klingt hohl. An seiner Vorderkante entdeckst du eine winzige Kerbe. <strong>Hier könnte sich die Bodenplatte lösen.</strong>';
 const objects=stage===0?
  '<div class="drawer-objects"><button type="button" class="drawer-piece" data-drawer="ink">✒<small>Tintenglas</small></button><button type="button" class="drawer-piece papers" data-drawer="papers">▤<small>Papierstapel</small></button><button type="button" class="drawer-piece" data-drawer="feather">❧<small>Schreibfeder</small></button></div>':stage===1?
  '<div class="drawer-objects"><button type="button" class="drawer-piece wood" data-drawer="left">▥<small>Linkes Holz</small></button><button type="button" class="drawer-piece wood" data-drawer="center">▥<small>Mittleres Holz</small></button><button type="button" class="drawer-piece wood" data-drawer="right">▥<small>Rechtes Holz</small></button></div>':
  '<div class="drawer-objects"><button type="button" class="drawer-piece wood" data-drawer="pry-left">▥<small>Links anheben</small></button><button type="button" class="drawer-piece latch" data-drawer="latch">⌁<small>Kerbe lösen</small></button><button type="button" class="drawer-piece wood" data-drawer="pry-right">▥<small>Rechts anheben</small></button></div>';
 puzzlePanel('UNTERSUCHUNG · SCHREIBTISCH','Das Geheimnis der Schublade',message,
  '<div class="interactive-case drawer-case"><div class="drawer-lip">ARCHIV · EIGENTUM DER SCHULE</div>'+objects+'<div class="drawer-grain"></div></div>');
 document.querySelectorAll('[data-drawer]').forEach(el=>el.addEventListener('click',()=>{
  const v=el.dataset.drawer;
  if(stage===0&&v==='papers'){puzzle.drawerStage=1;examineDrawer()}
  else if(stage===1&&v==='center'){puzzle.drawerStage=2;examineDrawer()}
  else if(stage===2&&v==='latch'){
   state.key=true;state.found.add('drawer');update();
   dialog('GEHEIMFACH','Ein Schlüssel unter Holz','<div class="clue">Die Kerbe gibt nach. Unter dem dünnen Einlegeboden liegt ein abgenutzter <strong>Messingschlüssel</strong>. Auf dem Bart ist das Zeichen einer Tür zu erkennen.</div><p>Du steckst den Schlüssel ein. Jetzt brauchst du noch die vier Ziffern in der richtigen Folge.</p>',[{label:'Schublade schließen',fn:close}]);
  }else{el.classList.add('inspected');wrongTry('drawer',stage===0?'Dieser Gegenstand lässt sich bewegen, aber er verdeckt nichts. Der Papierstapel liegt direkt auf dem Boden.':stage===1?'Du klopfst: massives Holz. Ein anderes Feld klingt hohl.':'An dieser Seite lässt sich das Brett nicht lösen. Suche die kleine Kerbe.')}
 }));
}

let currentCode='';
function randomDigit(max){
 if(window.crypto && typeof window.crypto.getRandomValues==='function'){
  const v=new Uint32Array(1);const upper=Math.floor(4294967296/max)*max;
  do{window.crypto.getRandomValues(v)}while(v[0]>=upper);
  return v[0]%max;
 }
 return Math.floor(Math.random()*max);
}
function createNewPuzzle(){
 let last='';
 try{last=localStorage.getItem('quinoa_schattenarchiv_last_code')||''}catch(e){}
 const oldCode=currentCode;
 const ids=['shelf','clock','painting','rug'];
 let digits,code;
 do{
  const pool=['1','2','3','4','5','6','7','8','9'];
  digits=[];
  for(let i=0;i<4;i++)digits.push(pool.splice(randomDigit(pool.length),1)[0]);
  code=digits.join('');
 }while(code===last||code===oldCode);
 currentCode=code;
 freshPuzzles();
 ids.forEach((id,i)=>{
  clues[id].digit=digits[i];
  clues[id].text=initialClueTexts[id].replace(/<strong>\d<\/strong>/,'<strong>'+digits[i]+'</strong>');
 });
 try{localStorage.setItem('quinoa_schattenarchiv_last_code',code)}catch(e){}
}
const order=['shelf','clock','painting','rug'];const labels={shelf:'Wissen',clock:'Zeit',painting:'Bild',rug:'Boden'};const hintText=[
 ['Im stillen Raum, von Staub umgeben, kann selbst ein Rücken Zeichen geben. Wo alte Bände dicht beisammen, lässt sich ein kleines Rätsel fangen.', 'Wo Seiten schlafen, lange Zeit, liegt manchmal eine Spur bereit. Nicht alles, was im Regal steht, ist dort, wo es gewöhnlich steht.', 'Ein schmales Buch scheint anders als der Rest; die Abweichung hält ein Zeichen fest.', 'Du musst nicht alle Bücher einzeln prüfen: Untersuche das Archivregal und achte auf ein auffälliges Buch.'],
 ['Die Zeit vergeht, das Bild bleibt stehn; vier leise Zeichen sind zu sehn. Nicht wie du suchst, so führt der Pfad: Ein Vers verrät den stillen Rat.', 'Auf altem Blatt, mit Tinte fein, darf Wort für Wort ein Wegweiser sein. Was erwähnt der Text in welcher Folge?', 'Ein Fund wird nicht zur ersten Zahl, nur weil du ihn zuerst entdeckt hast. Eine Notiz deutet auf die Ordnung hin.', 'Suche die Archivnotiz am Tisch und gleiche ihre Bilder mit den Orten deiner Funde ab.'],
 ['Nicht jedes Holz ist, was es scheint, auch wenn der Staub die Spuren eint. Wo Feder, Blatt und Tinte ruhn, gibt es vielleicht noch mehr zu tun.', 'Manch stilles Fach bewahrt bei Nacht, was niemand je ans Licht gebracht. Hör hin, wenn altes Holz erzählt.', 'Ein Schreibtisch dient nicht nur dem Schreiben. Schau, was seine Schubladen verbergen.', 'Ein doppelter Boden in der mittleren Schublade verbirgt den Schlüssel.'],
 ['Vier Spuren warten, still und klein; doch ihre Folge muss richtig sein. Ein Türschloss hört auf keinen Rat, der ohne Plan vier Zahlen hat.', 'Zuerst versteh den alten Spruch, dann prüfe jedes Fundstückbuch. Was du zusammenlegst, gibt Sinn.', 'Ordne die vier gefundenen Zahlen nach dem Gedicht, nicht nach der Entdeckungszeit.', 'Das Zahlenschloss befindet sich rechts neben der Tür. Du brauchst den Schlüssel und die vier Zahlen in der Reihenfolge der Notiz.']
 ];let toastTimer;function toast(t){$('toast').textContent=t;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2800)}function dialog(tag,title,html,actions=[]){document.querySelector('.dialog').classList.toggle('parchment',tag.startsWith('HINWEIS'));document.querySelector('.dialog').classList.remove('victory-dialog');$('dialogTag').textContent=tag;$('dialogTitle').textContent=title;const details=[['Archivregal','shelf'],['Archivsignatur','shelf'],['stehengebliebene Uhr','clock'],['Wanduhr','clock'],['Hinter dem Rahmen','painting'],['gerahmte Fluchtplan','painting'],['alten Teppich','rug'],['Spur im Boden','rug'],['Geheimfach','drawer'],['Schublade','drawer'],['Schreibtisch','drawer'],['handschriftliche Notiz','note'],['Ausgang','door'],['TÜRSCHLOSS','door']];const match=details.find(([t])=>title.includes(t)||tag.includes(t));const picture=match?'<figure class="detail-image"><img src="assets/detail-'+match[1]+'.webp" alt="Detailaufnahme des untersuchten Gegenstands"><figcaption>DETAILANSICHT · UNTERSUCHUNG</figcaption></figure>':'';$('dialogBody').innerHTML=picture+html;$('dialogActions').innerHTML='';actions.forEach(a=>{const b=document.createElement('button');b.className='action'+(a.secondary?' secondary':'');b.textContent=a.label;b.onclick=a.fn;$('dialogActions').append(b)});$('overlay').hidden=false}function close(){$('overlay').hidden=true}function update(){$('foundCount').textContent=state.found.size+'/5';$('objective').textContent=state.opened?'Der Ausgang ist offen. Du hast das Archiv entschlüsselt.':state.found.size<3?'Untersuche den Raum. Halte ungewöhnliche Fundstücke fest.':state.found.size<5?'Du hast erste Spuren. Welche Orte fehlen noch?':'Alle Spuren entdeckt. Nutze das Zahlenschloss rechts neben der Tür.'}function find(id){const c=clues[id];state.found.add(id);update();dialog('FUNDSTÜCK · '+labels[id].toUpperCase(),c.title,'<div class="clue">'+c.text+'</div><p>Die Beobachtung wurde in deinen Fundstücken notiert.</p>',[{label:'Fundstücke ansehen',fn:journal},{label:'Weiter erkunden',fn:close,secondary:true}])}function journal(){let html='<p>Alle Entdeckungen bleiben hier gespeichert. Die Reihenfolge, in der du sie findest, ist nicht entscheidend.</p>';for(const id of order){const c=clues[id];html+='<div class="evidence"><b>'+labels[id]+' · '+names[id]+'</b><div>'+(state.found.has(id)?c.text:'Noch nicht untersucht')+'</div></div>'}html+='<div class="evidence"><b>Schreibtisch · Schlüssel</b><div>'+(state.key?'Messingschlüssel unter einem doppelten Schubladenboden entdeckt.':'Noch nicht untersucht')+'</div></div>';dialog('DEIN NOTIZBUCH','Fundstücke',html,[{label:'Zurück zum Raum',fn:close}])}function door(){if(state.opened){dialog('GESCHAFFT','Die Tür ist offen','<p>Du hast die Spuren verbunden und das Archiv verlassen.</p>',[{label:'Verlassen',fn:exitGame}]);return}const count=order.filter(x=>state.found.has(x)).length;let html='<p>Am Türschloss befinden sich ein Schlüsselloch und ein vierstelliges Tastenfeld.</p><div class="evidence">Eine verwitterte Gravur: „Nicht jeder Fund ist bereits ein Weg.“</div>';if(!state.key)html+='<p>Das Schlüsselloch ist noch leer. Ein passender Schlüssel muss irgendwo im Raum sein.</p>';if(count<4)html+='<p>Du kennst bisher '+count+' von vier Ziffern. Weitere Spuren könnten helfen.</p>';html+='<div class="digits">'+[0,1,2,3].map(i=>'<input id="digit'+i+'" type="text" inputmode="numeric" maxlength="1" aria-label="Ziffer '+(i+1)+'">').join('')+'</div><p id="lockFeedback" aria-live="polite"></p>';dialog('TÜRSCHLOSS','Der Ausgang',html,[{label:'Schloss prüfen',fn:checkDoor},{label:'Zurück',fn:close,secondary:true}]);for(let i=0;i<4;i++)$('digit'+i).addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,1);if(e.target.value&&i<3)$('digit'+(i+1)).focus()})}function checkDoor(){state.activity.visits.door=(state.activity.visits.door||0)+1;const code=[0,1,2,3].map(i=>$('digit'+i).value).join('');if(!state.key){$('lockFeedback').textContent='Das Schloss lässt sich ohne Schlüssel nicht drehen.';return}if(code.length!==4){$('lockFeedback').textContent='Vier Ziffern werden benötigt.';return}if(code!==currentCode){state.activity.lockErrors++;$('lockFeedback').textContent='Das Schloss bleibt verriegelt. Die Abfolge stimmt noch nicht.';return}state.opened=true;update();dialog('✦ MISSION ERFÜLLT','Freiheit!','<div class="victory-emblem" aria-hidden="true">✦</div><p class="victory-line">Vier Siegel. Ein Schlüssel. <strong>Du bist entkommen!</strong></p>',[{label:'Verlassen',fn:exitGame}]);document.querySelector('.dialog').classList.add('victory-dialog')}function act(id){
 state.activity.visits[id]=(state.activity.visits[id]||0)+1;
 state.activity.lastAction=id;
 if(id==='door'){door();return}
 if(id==='note'){
  state.activity.noteRead=true;
  dialog('ARCHIVNOTIZ','Eine handschriftliche Notiz','<div class="clue">„Erst spricht der Rücken, der nie atmet; dann schlägt ein Herz, das niemals rastet. Was still im Rahmen wacht, folgt später; den Schluss verrät, worauf man steht.“</div><p>Die vier Bilder im Vers deuten auf vier Orte. Ihre Reihenfolge ist für das Zahlenschloss entscheidend.</p>',[{label:'Verstanden',fn:close}]);return;
 }
 if(id==='drawer'){examineDrawer();return}
 if(state.found.has(id)){
  const c=clues[id];dialog('BEREITS ENTDECKT',names[id],'<p>Diese Spur liegt bereits in deinem Notizbuch.</p><div class="clue">'+c.text+'</div>',[{label:'Fundstücke ansehen',fn:journal},{label:'Zurück',fn:close,secondary:true}]);return;
 }
 if(id==='shelf')examineShelf();
 else if(id==='clock')examineClock();
 else if(id==='painting')examinePainting();
 else if(id==='rug')examineRug();
}
// Kontextbezogene Hinweise: ausschließlich lokale Spielaktionen, keine Kamera/Netzwerk.
let hintTicker=null;
const cooldowns=[15,30,45]; // nach Hinweis 1, 2, 3 jeweils zunehmend länger warten
const personalHints={
 shelf:[
  'Ein stiller Rücken, alt und schmal, fällt aus der Reihe dieses Mal. Wo Bücher schweigen, lohnt ein Blick – vielleicht verbirgt sich dort ein Stück.',
  'Im Archiv wirkt nicht jeder Band gleich. Schau auf die Unterschiede, nicht auf die Menge.',
  'Eine einzelne Buchform weicht von ihren Nachbarn ab. Untersuche das Regal genauer.',
  'Suche beim Regal nach einem Buch, das zugleich besonders schmal ist und ein Sternzeichen trägt.'
 ],
 clock:[
  'Die Zeit zieht weiter, still und sacht; doch nicht der Zeiger hält die Wacht. Was fest am alten Werke ruht, bewahrt vielleicht ein Zeichen gut.',
  'Nicht die Uhrzeit selbst ist gesucht. Schau auf das, was zur Uhr gehört und unbeweglich bleibt.',
  'Am Gehäuse der Uhr sitzt ein kleines Detail, das leicht übersehen wird.',
  'Auf der Messingplatte passt das Sanduhrzeichen zum Spruch über zwei Spitzen und die Zeit.'
 ],
 painting:[
  'Ein Weg auf Papier, von Gold umrahmt, hat mehr gesehen als mancher ahnt. Die Mitte zeigt, wohin man geht; der Rand verrät, was keiner sieht.',
  'Der Fluchtplan ist nicht nur eine Zeichnung. Auch seine Einfassung erzählt eine Geschichte.',
  'Staub und feine Spuren am Bilderrahmen könnten wichtiger sein als der gezeichnete Weg.',
  'Untersuche beim Fluchtplan die vier Seiten des Rahmens. Eine zeigt sichtbare Kratzspuren.'
 ],
 rug:[
  'Auf weichem Grund, wo Schritte ruhn, kann altes Holz sich heimlich kundtun. Ein Muster deckt die Spuren zu, doch darunter spricht der Raum dazu.',
  'Manchmal liegt ein Hinweis unter etwas, das jeden Tag übersehen wird.',
  'Nicht nur das Muster des Teppichs ist interessant. Überlege, was er verdeckt.',
  'Vergleiche die vier Ecken des Teppichs. Die umgeschlagene Ecke verbirgt eine Bodenmarkierung.'
 ],
 drawer:[
  'Die Feder schweigt, die Tinte ruht, doch Holz bewahrt so manches Gut. Was hohl klingt, muss nicht leer sein; schau tiefer in das Fach hinein.',
  'Ein Schreibtisch hat mehr als eine Oberfläche. Achte auf das Material der Schubladen.',
  'Ein ungewöhnlicher Klang kann auf einen versteckten Zwischenraum hinweisen.',
  'Schiebe erst die Papiere beiseite, klopfe auf das Holz und suche anschließend nach einer Kerbe.'
 ],
 note:[
  'Vier Zeichen führen aus der Nacht, doch ihre Folge ist nicht nach Fund gemacht. Ein alter Vers erzählt den Pfad, wenn man die Worte richtig hat.',
  'Die Reihenfolge deiner Entdeckungen bestimmt nicht die Reihenfolge für das Schloss.',
  'Auf dem Schreibtisch liegt ein Text. Seine Bilder könnten zu verschiedenen Orten passen.',
  'Lies die Archivnotiz am Tisch aufmerksam und ordne ihre Bilder den Fundstücken zu.'
 ],
 lock:[
  'Der Ausgang wartet, still und schwer; nur Zahlen allein genügen nicht mehr. Verbinde Holz und alten Spruch – dann öffnet sich das letzte Buch.',
  'Ein Code und ein Schlüssel erfüllen unterschiedliche Aufgaben. Prüfe, ob beides vorhanden ist.',
  'Wenn die Zahlen nicht passen, prüfe ihre Reihenfolge anhand der Archivnotiz.',
  'Verwende die vier gesammelten Ziffern in der Reihenfolge, die der Vers vorgibt, zusammen mit dem Schlüssel.'
 ]
};
function hintTarget(){
 const a=state.activity;
 // Fehlversuche am Schloss bekommen Vorrang, wenn bereits alle Fundstücke da sind.
 if(a.lockErrors>0 && state.key && ['shelf','clock','painting','rug'].every(x=>state.found.has(x)))return a.noteRead?'lock':'note';
 // Zuerst echte Wissenslücken schließen, statt bereits gelöste Aufgaben zu verraten.
 if(!state.key && (a.visits.drawer||0)>0)return 'drawer';
 if(a.lastAction==='painting'&&!state.found.has('painting'))return 'painting';
 if(a.lastAction==='clock'&&!state.found.has('clock'))return 'clock';
 if(a.lastAction==='rug'&&!state.found.has('rug'))return 'rug';
 if(a.lastAction==='shelf'&&!state.found.has('shelf'))return 'shelf';
 const missing=['shelf','clock','painting','rug'].filter(x=>!state.found.has(x));
 if(missing.length){const priority=['shelf','clock','painting','rug'];missing.sort((x,y)=>(a.visits[y]||0)-(a.visits[x]||0)||priority.indexOf(x)-priority.indexOf(y));return missing[0]}
 if(!state.key)return 'drawer';
 if(!a.noteRead)return 'note';
 return 'lock';
}
function hint(){
 if(hintTicker){clearInterval(hintTicker);hintTicker=null}
 const level=Math.min(state.hint,3),target=hintTarget();
 const delay=level<3?cooldowns[level]:0;
 const elapsed=Math.floor((Date.now()-state.hintReadAt)/1000);
 const remain=level<3?Math.max(0,delay-elapsed):0;
 const captions={shelf:'Das Archivregal',clock:'Die Wanduhr',painting:'Der alte Fluchtplan',rug:'Der Teppich',drawer:'Der Schreibtisch',note:'Der Weg der Zeichen',lock:'Das Zahlenschloss'};
 const content='<p class="hint-context">Aus deinen bisherigen Entdeckungen: <strong>'+captions[target]+'</strong></p><div class="hint-verse">'+personalHints[target][level]+'</div><div class="hint-status" aria-live="polite">'+(level===3?'Dies ist die letzte Hinweisstufe.':remain?'Nächster Hinweis in '+remain+' Sekunden. (Wartezeit steigt mit jeder Stufe.)':'Der nächste Hinweis ist bereit.')+'</div>';
 const actions=[];
 if(level<3)actions.push({label:remain?'Nächster Hinweis in '+remain+' s':'Nächsten Hinweis lesen',fn:()=>{
  if(Date.now()-state.hintReadAt<cooldowns[state.hint]*1000)return;
  state.hint++;state.hintReadAt=Date.now();hint();
 },secondary:remain>0});
 actions.push({label:'Papier schließen',fn:close,secondary:true});
 dialog('HINWEIS · '+(level+1)+'/4','Eine Seite aus dem Archiv',content,actions);
 const button=$('dialogActions').querySelector('button');if(level<3)button.disabled=remain>0;
 if(level<3&&remain)hintTicker=setInterval(()=>{
  if($('overlay').hidden||!$('dialogTag').textContent.startsWith('HINWEIS')){clearInterval(hintTicker);hintTicker=null;return}
  const r=Math.max(0,Math.ceil(cooldowns[state.hint]-(Date.now()-state.hintReadAt)/1000));
  const status=document.querySelector('.hint-status');if(status)status.textContent=r?'Nächster Hinweis in '+r+' Sekunden. (Wartezeit steigt mit jeder Stufe.)':'Der nächste Hinweis ist bereit.';
  const btn=$('dialogActions').querySelector('button');if(btn){btn.disabled=r>0;btn.textContent=r?'Nächster Hinweis in '+r+' s':'Nächsten Hinweis lesen'}
  if(!r){clearInterval(hintTicker);hintTicker=null}
 },250);
}
function exitGame(){
 // EXIT bedeutet die gesamte Bibliotheksansicht verlassen, niemals neu starten.
 // Die originale 3D-/Fotobibliothek liegt in der uebergeordneten Schul-Webseite.
 close();
 if (window.parent !== window) {
   // Der offizielle Bibliothek-Loader entfernt das iframe-Overlay.
   try {
     if (typeof window.parent.closeBibliothekModule === 'function') {
       window.parent.closeBibliothekModule();
       return;
     }
   } catch (e) { /* Andere Origin: stattdessen Nachricht senden. */ }
   window.parent.postMessage({type:'bibliothek-close'}, '*');
   return;
 }
 // Falls die HTML-Datei als Unterseite aus der realen Schulbibliothek
 // geoeffnet wurde, mit Browser-Zurueck zur vorherigen Ansicht gehen.
 if (document.referrer) {
   try {
     const previous=new URL(document.referrer);
     if (previous.origin===location.origin && previous.pathname!==location.pathname) {
       window.history.back();
       return;
     }
   } catch (e) {}
 }
 // Direkte HTML-Datei hat keinen Host, zu dem man zurueckkehren koennte.
 window.close();
 setTimeout(()=>{if(!window.closed)window.location.replace('about:blank')},120);
}
function restart(){createNewPuzzle();state.found.clear();state.key=false;state.opened=false;state.hint=0;state.hintReadAt=Date.now();state.activity={visits:{},lastAction:null,lockErrors:0,noteRead:false,startedAt:Date.now()};update();close();$('intro').hidden=false;$('mission').hidden=true}
function initAtmosphere(){
 const hr=$('clockHour'),mi=$('clockMinute'),se=$('clockSecond');
 function tick(){const d=new Date();const sec=d.getSeconds()+d.getMilliseconds()/1000,minute=d.getMinutes()+sec/60,hour=(d.getHours()%12)+minute/60;
 hr.style.transform='translate(-50%,-95%) rotate('+(hour*30)+'deg)';mi.style.transform='translate(-50%,-95%) rotate('+(minute*6)+'deg)';se.style.transform='translate(-50%,-95%) rotate('+(sec*6)+'deg)'}tick();setInterval(tick,100);
 const canvas=$('rainCanvas'),ctx=canvas.getContext('2d');if(!ctx)return;
 const drops=Array.from({length:105},()=>({x:Math.random()*600,y:Math.random()*500,v:3+Math.random()*5,len:12+Math.random()*33,w:Math.random()*.8+.4}));
 let frame=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function draw(){ctx.clearRect(0,0,600,500);ctx.lineCap='round';for(const d of drops){ctx.strokeStyle='rgba(197,220,240,'+(.17+d.w*.17)+')';ctx.lineWidth=d.w;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-5,d.y+d.len);ctx.stroke();if(!reduced){d.y+=d.v;d.x-=.7;if(d.y>530){d.y=-30;d.x=Math.random()*600}if(d.x<0)d.x=600}}if(!reduced&&document.visibilityState==='visible')requestAnimationFrame(draw)}draw();document.addEventListener('visibilitychange',()=>{if(!reduced&&document.visibilityState==='visible')requestAnimationFrame(draw)})
}
function init(){createNewPuzzle();initAtmosphere();const palette=['#734439','#4a6b64','#9b744b','#50455d','#896a42','#3f5a71','#806143','#654a4d','#6b7655'];const box=$('books');for(let i=0;i<54;i++){const b=document.createElement('span');b.className='book';b.style.background=palette[(i*7+Math.floor(i/5))%palette.length];b.style.height=(65+(i*13)%32)+'%';b.style.setProperty('--gold',i%4===0?'#c5a76b':'#907b55');b.dataset.title=['ATLAS','HISTORIA','ARCHIV','POESIE','LEXIKON','NATURA','ANNO','CHRONIK','KUNST'][i%9];box.appendChild(b)}document.querySelectorAll('[data-action]').forEach(el=>{el.addEventListener('click',()=>act(el.dataset.action));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act(el.dataset.action)}})});$('journalBtn').onclick=journal;$('hintBtn').onclick=hint;$('helpBtn').onclick=()=>dialog('ANLEITUNG','So funktioniert das Spiel','<p>Untersuche die Gegenstände in beliebiger Reihenfolge. In Detailansichten kannst du Bücher, Metallteile, Rahmenkanten und Schubladen wirklich anklicken. Erst die richtige Untersuchung legt ein Fundstück frei. Deine Entdeckungen landen im Notizbuch.</p><p>Verbinde die Hinweise und öffne die Tür. Es gibt keinen Countdown, keine erzwungene Klickreihenfolge und die Hinweise passen sich deinen Entdeckungen an. Der nächste Hinweis wird nach 15, dann 30 und schließlich 45 Sekunden freigegeben.</p>',[{label:'Verstanden',fn:close}]);$('closeDialog').onclick=close;$('overlay').addEventListener('click',e=>{if(e.target===$('overlay'))close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});let missionTimer=null;function finishMission(){if(missionTimer){clearTimeout(missionTimer);missionTimer=null}$('mission').hidden=true;toast('Suche vier Ziffern und den verborgenen Schlüssel.')};$('missionClose').onclick=finishMission;$('startBtn').onclick=()=>{state.hint=0;state.hintReadAt=Date.now();state.activity={visits:{},lastAction:null,lockErrors:0,noteRead:false,startedAt:Date.now()};$('intro').hidden=true;$('mission').hidden=false;/* Die Mission verschwindet nicht automatisch: nur beim Klick auf den Knopf. */};update()}window.openLibraryEscape=()=>{$('libraryEscape').style.display='block';$('intro').hidden=false};window.startLibraryEscape=()=>{$('intro').hidden=true;$('mission').hidden=true};window.closeLibraryEscape=()=>{$('libraryEscape').style.display='none'};init()})();
