import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('index.html',import.meta.url),'utf8');
const elements=new Map();
function element(){return {textContent:'',value:'35',disabled:false,dataset:{},style:{},classList:{toggle(){}},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(){},blur(){}};}
const chips=[1,2,3].map(n=>Object.assign(element(),{dataset:{level:String(n)}}));
const sandbox={console,Math,document:{querySelector(s){if(!elements.has(s))elements.set(s,element());return elements.get(s);},querySelectorAll(){return chips;},addEventListener(){},activeElement:{tagName:'BODY'}},window:{addEventListener(){}},setInterval(){},requestAnimationFrame(){}};
sandbox.document.querySelector('#game').getContext=()=>({});
vm.createContext(sandbox);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],sandbox);
const run=code=>vm.runInContext(code,sandbox);
const clear=()=>run("state.obstacles=[{type:'rock',x:40,y:263,w:34,h:27,hit:false,passed:false}];step();");
run('start()');
for(let stage=1;stage<=3;stage++){
 for(let cleared=1;cleared<=19;cleared++){
  clear();assert.equal(run('state.level'),stage);assert.equal(run('state.stageCleared'),cleared);assert.equal(run('state.celebration'),null);
 }
 assert.equal(elements.get('#stageProgress').attrs['aria-valuenow'],'95');
 clear();
 if(stage<3){assert.equal(run('state.level'),stage+1);assert.equal(run('state.stageCleared'),0);assert.equal(run('state.celebration'),null);assert.ok(chips[stage-1].textContent.endsWith('100%'));}
}
assert.equal(run('state.finished'),true);assert.equal(run('state.score'),6000);assert.equal(run('state.lives'),3);
assert.ok(run('state.celebration'));assert.equal(elements.get('#stageProgress').attrs['aria-valuenow'],'100');assert.equal(elements.get('#progressFill').style.width,'100%');
assert.ok(chips.every(chip=>chip.textContent.endsWith('100%')));
const distance=run('state.distance');run('step();');assert.equal(run('state.distance'),distance);assert.ok(run('state.celebration.particles.length')>0);
run('pause();step();');assert.equal(run('state.celebration.age'),1);run('pause();for(let i=0;i<269;i++)step();');
assert.equal(run('state.phase'),'won');assert.equal(run('state.celebration'),null);assert.equal(elements.get('#pause').disabled,true);
run('step();');assert.equal(run('state.score'),6000);
run('start();');assert.equal(run('state.level'),1);assert.equal(run('state.stageCleared'),0);assert.equal(run('state.lives'),3);assert.equal(run('state.finished'),false);assert.equal(run('state.progress.join()'),'0,0,0');
run("state.obstacles=[{type:'rock',x:114,y:263,w:34,h:27,hit:false,passed:false}];step();");assert.equal(run('state.lives'),2);assert.equal(run('state.stageCleared'),0);
for(const type of ['cactus','rock','mushroom','double','bird','drone']){
 const air=['bird','drone'].includes(type);
 run(`{state.y=0;state.duck=false;const def=obstacleKinds['${type}'];globalThis.testObstacle={x:114,y:def.air?GROUND-('${type}'==='drone'?67:60):GROUND-def.h,w:def.w,h:def.h};}`);
 assert.equal(run('overlaps(playerBox(),testObstacle)'),true);run(air?'state.duck=true;':'state.y=100;');assert.equal(run('overlaps(playerBox(),testObstacle)'),false);
}
console.log('Passed: 20 successful obstacles per stage, no early transitions or fanfare, 0–100% progress, 3 hearts, final celebration, pause/resume, victory, reset and six obstacle types.');
