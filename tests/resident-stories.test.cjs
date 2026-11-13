const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const test=require('node:test');
const vm=require('node:vm');
const source=readFileSync(join(__dirname,'..','resident-stories.js'),'utf8');
const Stories=vm.runInNewContext(source+'\nResidentStories');

test('each resident has an independent three-chapter story with choices and dates',()=>{
  const state=Stories.load();
  for(const id of ['gy','xy','jy','by']){
    assert.equal(Stories.next(state,id,1,10),null);
    assert.equal(Stories.next(state,id,2,2),null);
    assert.equal(Stories.complete(state,id,2,3,0,0),true);
    assert.equal(Stories.complete(state,id,2,10,1,1),false);
    assert.equal(Stories.complete(state,id,3,5,1,1),true);
    assert.equal(Stories.complete(state,id,4,10,2,0),false);
    assert.equal(Stories.complete(state,id,5,7,2,0),true);
    assert.equal(Stories.next(state,id,20,10),null);
  }
  assert.equal(Stories.next(state,'xm',20,10),null);
  const restored=Stories.load(JSON.parse(JSON.stringify(state)),5);
  const cards=Stories.cards(restored);
  assert.equal(cards.length,12);
  assert.equal(new Set(cards.map(card=>card.key)).size,12);
  assert.equal(cards.find(card=>card.key==='story:by:1').choice,1);
});

const Moments=vm.runInNewContext(source+'\nResidentMoments');
test('quiet encounters follow location hours and weather and stay available after passing them',()=>{
  const state=Moments.load();
  assert.equal(Moments.available(state,'gy',3,800,'rain'),true);
  assert.equal(Moments.available(state,'gy',3,800,'clear'),false);
  assert.equal(Moments.available(state,'gy',3,1020,'rain'),false);
  assert.equal(Moments.available(state,'xy',3,550,'wind'),true);
  state.declined.xy=3;
  assert.equal(Moments.available(state,'xy',3,550,'wind'),false);
  assert.equal(Moments.available(state,'xy',4,550,'wind'),true);
  assert.equal(Moments.available(state,'constructor',4,550,'wind'),false);
});
test('quiet encounter choices and recall dates survive reload without duplicate cards',()=>{
  const state=Moments.load();
  assert.equal(Moments.complete(state,'gy',3,0),true);
  assert.equal(Moments.complete(state,'gy',3,1),false);
  assert.equal(Moments.available(state,'jy',4,700,'clear'),false);
  assert.equal(Moments.available(state,'jy',5,700,'clear'),true);
  assert.equal(Moments.complete(state,'jy',5,1),true);
  state.records.gy.recalled=7;
  const restored=Moments.load(JSON.parse(JSON.stringify(state)),8);
  assert.equal(restored.records.gy.recalled,7);
  assert.equal(restored.records.jy.choice,1);
  assert.equal(Moments.cards(restored).length,2);
  assert.equal(Moments.load(state,2).records.gy,undefined);
  assert.equal(Moments.load({records:{gy:{day:3,choice:99}}},4).records.gy,undefined);
});
