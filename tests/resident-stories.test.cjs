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
