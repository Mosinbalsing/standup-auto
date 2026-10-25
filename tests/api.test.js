import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createApp } from '../backend/src/app.ts';
import { sqliteStore } from '../backend/src/config/database.ts';
import { waitForJobs, syncDue } from '../backend/src/jobs/dailyStandup.job.ts';

test('API journey: isolated accounts, repositories, sync, edit, reviewed recap, disconnect and deletion', async () => {
  const db=sqliteStore(); const config={origin:'http://127.0.0.1',production:false,allowDemo:true,encryptionKey:randomBytes(32),githubClient:'',githubSecret:'',githubScope:'',jobSecret:'scheduler'};
  const server=createApp({config,db});await new Promise(r=>server.listen(0,'127.0.0.1',r));config.origin=`http://127.0.0.1:${server.address().port}`;
  function browser(){let cookie='',csrf='';return async(path,method='GET',data,extra={})=>{
    const response=await fetch(config.origin+'/api'+path,{method,headers:{Origin:config.origin,'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf,...extra},...(data===undefined?{}:{body:JSON.stringify(data)})});
    const set=response.headers.getSetCookie();if(set.length)cookie=set.map(c=>c.split(';')[0]).join('; ');
    const result=await response.json();if(result.csrf)csrf=result.csrf;return{status:response.status,data:result};
  }}
  try {
    const alice=browser(),bob=browser();
    assert.equal((await alice('/workspace')).status,401);
    assert.equal((await alice('/demo/login','POST',{}, {Origin:'https://evil.example'})).status,403);
    assert.equal((await alice('/auth/github')).status,503);
    assert.equal((await alice('/demo/login','POST',{})).status,201);
    assert.equal((await bob('/demo/login','POST',{})).status,201);
    assert.equal((await alice('/repositories','PUT',{selected:['demo-web']},{'X-CSRF-Token':'wrong'})).status,403);
    assert.equal((await alice('/repositories','PUT',{selected:['not-owned']})).status,400);
    assert.equal((await alice('/repositories','PUT',{selected:['demo-web','demo-api']})).status,200);
    const accepted=await alice('/sync','POST',{});assert.equal(accepted.status,202);
    await waitForJobs();assert.equal((await alice('/jobs/'+accepted.data.id)).data.status,'succeeded');
    assert.equal((await bob('/jobs/'+accepted.data.id)).status,404);
    const first=(await alice('/workspace')).data;assert.equal(first.standup.items.yesterday.length,4);
    assert.equal((await bob('/workspace')).data.activity.length,0);
    const edited=structuredClone(first.standup);edited.items.today=[{id:'plan',text:'Finish tests.',manual:true,sourceIds:['forged']}];edited.items.yesterday.shift();edited.reviewed=true;
    const saved=await alice('/standups/'+first.date,'PUT',edited);assert.equal(saved.status,200);assert.deepEqual(saved.data.items.today[0].sourceIds,[]);
    assert.equal((await alice('/standups/'+first.date,'PUT',edited)).status,409);
    await alice('/sync','POST',{});await waitForJobs();const after=(await alice('/workspace')).data;
    assert.equal(after.standup.items.yesterday.length,3);assert.equal(after.standup.items.today[0].text,'Finish tests.');
    assert.ok((await alice('/export?date='+first.date+'&format=slack')).data.text.includes('*Today*'));
    const date=new Date(first.date+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-((date.getUTCDay()||7)-1));
    const start=date.toISOString().slice(0,10);
    assert.equal((await alice('/weekly?start='+start)).data.reviewedCount,1);
    const recapEdit={start,version:0,text:'Reviewed onboarding improvements.'};
    assert.equal((await alice('/weekly','PUT',recapEdit)).status,200);
    assert.equal((await alice('/weekly','PUT',recapEdit)).status,409);
    assert.equal((await alice('/weekly?start='+start)).data.edited,recapEdit.text);
    assert.equal((await bob('/weekly?start='+start)).data.edited,null);
    const settings={timezone:'UTC',standupTime:'00:00',activityWindow:'yesterday',workingDays:[0,1,2,3,4,5,6],scheduledSync:true};
    assert.equal((await alice('/settings','PATCH',{...settings,timezone:'invalid/place'})).status,400);
    assert.equal((await alice('/settings','PATCH',settings)).status,200);
    assert.equal((await syncDue(db,config)).started,1);await waitForJobs();assert.equal((await syncDue(db,config)).started,0);
    const account=(await alice('/me')).data.user;
    const scheduled=(await db.list('job',account.id)).find(row=>row.id.includes('daily:'));
    await db.put('job',scheduled.id,account.id,{...scheduled.payload,status:'partial'});
    assert.equal((await syncDue(db,config)).started,1);await waitForJobs();
    assert.equal((await syncDue(db,config)).started,0);
    assert.equal((await alice('/disconnect','POST',{})).status,200);
    await alice('/sync','POST',{});await waitForJobs();assert.equal((await alice('/workspace')).data.connected,false);
    assert.equal((await alice('/demo/reconnect','POST',{})).status,200);
    assert.equal((await alice('/me/data','DELETE',{confirm:'no'})).status,400);
    assert.equal((await alice('/me/data','DELETE',{confirm:'DELETE'})).status,200);
    assert.equal((await alice('/workspace')).status,401);assert.equal((await bob('/workspace')).status,200);
  }finally{await waitForJobs();await new Promise(r=>server.close(r));db.close()}
});

