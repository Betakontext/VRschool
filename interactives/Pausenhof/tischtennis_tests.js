/* Targeted, dependency-free physics checks for the Pong-only helpers. */
'use strict';
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('pausenhof/pausenhof.js','utf8');
const part=src.slice(src.indexOf('function pongEllipseHit'),src.indexOf('function loop(now)'));
const ctx={Math,console,cl:(n,a,b)=>Math.max(a,Math.min(b,n)),R:(a,b)=>a+(b-a)*Math.random(),held:{},a:{score:0,msg:'',lives:3},emit:()=>{}};
vm.createContext(ctx);vm.runInContext(part,ctx);
const ok=(v,m)=>{if(!v)throw Error(m)};
// Ball circle tangentially touching the 68×20 painted rubber ellipse hits; 1px beyond it does not.
ok(ctx.pongEllipseHit({x:78,y:430,r:10},0,430),'ellipse: contour contact');
ok(!ctx.pongEllipseHit({x:79.2,y:430,r:10},0,430),'ellipse: narrowly outside must miss');
// One player bounce increases magnitude but never exceeds 560 and is locked against repeat contact.
let d={p:450,pv:0,o:450,ov:0,pt:450,ot:450,think:1,err:0,hits:0,b:{x:450,y:407,vx:0,vy:300,r:10,contact:''}};
ctx.pongBounce(d,'p');let s1=Math.hypot(d.b.vx,d.b.vy);ok(s1>300&&s1<=560,'speed rises within cap');
for(let i=0;i<20;i++)ctx.pongBounce(d,'p');ok(Math.hypot(d.b.vx,d.b.vy)<=560.0001,'speed cap');
// In one update, contact flag prevents a second collision while ball leaves the face.
d={p:450,pt:450,pv:0,o:450,ot:450,ov:0,think:1,err:0,hits:0,b:{x:450,y:405,vx:0,vy:220,r:10,contact:''}};ctx.a={score:0,msg:'',lives:3};ctx.pongUpdate(d,.02);ok(d.hits===1&&d.b.contact==='p','one collision per contact');
// Opponent target is random but movement is rate-limited: no teleport is possible.
let seen=new Set;for(let i=0;i<30;i++){d={o:450,ot:450,ov:0,think:0,b:{x:300+i*7}};ctx.pongOpponent(d,.1);ok(Math.abs(d.o-450)<=26.0001,'opponent speed limit');seen.add(d.err.toFixed(1));}ok(seen.size>1,'opponent target errors vary between reactions');
console.log('PASS: ellipse contour contact/narrow miss; speed increase and 560 cap; single-contact lock; bounded, variable opponent reaction.');
