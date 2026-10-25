import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { sqliteStore, supabaseStore } from '../backend/src/config/database.ts';
import { encrypt, decrypt, equal } from '../backend/src/utils/security.ts';
import { localDate, workDate, monday } from '../backend/src/utils/dates.ts';
import { generateItems, validateItems, weekly } from '../backend/src/modules/standup/services/standup.service.ts';
import { GitHub } from '../backend/src/modules/github/services/github.service.ts';

test('encrypted tokens round-trip, differ across writes, and reject tampering', () => {
  const key = randomBytes(32), a = encrypt('private-token', key), b = encrypt('private-token', key);
  assert.notEqual(a, b); assert.equal(decrypt(a, key), 'private-token');
  assert.throws(() => decrypt(a, randomBytes(32))); assert.equal(equal('short', 'longer'), false);
});
test('timezone and previous working day use local calendar dates', () => {
  assert.equal(localDate('Asia/Kolkata', new Date('2026-10-25T20:00:00Z')), '2026-10-26');
  assert.equal(workDate('2026-10-26', { activityWindow: 'previous-working-day' }), '2026-10-23');
  assert.equal(monday('2026-10-25'), '2026-10-19');
});
test('merged PRs replace their commits but a commit alone does not imply completion', () => {
  const common = { occurredAt: '2026-10-23T12:00:00Z', sourceUrl: null };
  const activity = [{ ...common, id:'pr', type:'pull_request', title:'Login', status:'merged', commitShas:['abc'] },
    { ...common, id:'c1', type:'commit', title:'Login code', sha:'abc' }, { ...common, id:'c2', type:'commit', title:'Other work', sha:'def' }];
  const draft = generateItems(activity,'2026-10-26',{ timezone:'UTC', activityWindow:'previous-working-day' });
  assert.equal(draft.yesterday.length, 2); assert.equal(draft.yesterday[1].text,'Committed changes: Other work');
  assert.deepEqual(draft.today, []);
});
test('store ownership, create-only writes and version conflicts prevent overwrites', async () => {
  const db = sqliteStore();
  try {
    const first = await db.put('standup','day','alice',{text:'first'},0);
    assert.equal(await db.get('standup','day','bob'), undefined);
    await assert.rejects(db.put('standup','day','bob',{text:'stolen'}), { status:409 });
    await db.put('standup','day','alice',{text:'edited'},first.version);
    await assert.rejects(db.put('standup','day','alice',{text:'old tab'},first.version), { status:409 });
    assert.equal((await db.get('standup','day','alice')).payload.text,'edited');
  } finally { db.close(); }
});
test('browser input cannot fabricate provenance or duplicate item IDs', () => {
  const items={yesterday:[{id:'new',text:'Some text',sourceIds:['fake']}],today:[],blockers:[]};
  const result=validateItems(items,{yesterday:[],today:[],blockers:[]},[]);
  assert.equal(result.yesterday[0].manual,true); assert.deepEqual(result.yesterday[0].sourceIds,[]);
  items.today.push({id:'new',text:'Duplicate'}); assert.throws(()=>validateItems(items,{yesterday:[],today:[],blockers:[]},[]));
});
test('weekly recap excludes drafts and deduplicates reviewed sources', async () => {
  const db=sqliteStore(), user={id:'a'};
  try {
    for(const [date,reviewed] of [['2026-10-19',true],['2026-10-20',false],['2026-10-21',true]])
      await db.put('standup',`a/${date}`,'a',{date,reviewed,items:{yesterday:[{id:date,text:'Work',sourceIds:['one']}],today:[],blockers:[]}});
    const result=await weekly(db,user,'2026-10-19');assert.equal(result.reviewedCount,2);assert.equal(result.highlights.length,1);assert.equal(result.days[3].status,'missing');
  }finally{db.close()}
});
test('GitHub pagination collects every page and exposes incomplete results', async () => {
  let calls=0;
  const client=new GitHub('token',async()=>new Response(JSON.stringify([{id:++calls}]),{headers:calls===1?{link:'<next>; rel="next"'}:{}}));
  assert.equal((await client.pages('/user/repos')).length,2);
  const partial=new GitHub('token',async()=>new Response(JSON.stringify({items:[],incomplete_results:true})));
  await assert.rejects(partial.search('is:pr'),{status:502});
});
test('Supabase store keeps credentials in headers and scopes records to owner', async () => {
  let captured;
  const db=supabaseStore('https://example.supabase.co','server-secret',async(url,options)=>{captured={url:new URL(url),options};return new Response('[]')});
  await db.get('standup','day','alice');
  assert.equal(captured.url.searchParams.get('owner'),'eq.alice');assert.equal(captured.options.headers.apikey,'server-secret');assert.ok(!captured.url.href.includes('server-secret'));
});
test('new Supabase secret keys are never sent as bearer JWTs', async () => {
  const db=supabaseStore('https://example.supabase.co','sb_secret_example',async(url,options)=>{
    assert.equal(options.headers.apikey,'sb_secret_example');assert.equal(options.headers.Authorization,undefined);return new Response('[]');
  });
  await db.list('activity','alice');
});
