import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createApp } from '../backend/src/app.ts';
import { sqliteStore } from '../backend/src/config/database.ts';

test('OAuth validates cookie state and PKCE, stores encrypted tokens, and creates a server session', async () => {
  const db=sqliteStore(),config={origin:'http://127.0.0.1',production:false,allowDemo:false,encryptionKey:randomBytes(32),githubClient:'client-id',githubSecret:'client-secret',githubScope:''};
  let exchanged=false;
  const request=async(url,options)=>{
    if(String(url).includes('/login/oauth/access_token')){
      assert.equal(options.body.get('client_secret'),'client-secret');assert.ok(options.body.get('code_verifier').length>40);exchanged=true;
      return new Response(JSON.stringify({access_token:'mock-private-access-token'}));
    }
    assert.equal(options.headers.Authorization,'Bearer mock-private-access-token');
    return new Response(JSON.stringify({id:123,login:'test-developer',name:'Test Developer'}));
  };
  const server=createApp({config,db,request});await new Promise(r=>server.listen(0,'127.0.0.1',r));config.origin=`http://127.0.0.1:${server.address().port}`;
  try{
    const begin=await fetch(config.origin+'/api/auth/github',{redirect:'manual'});assert.equal(begin.status,302);
    const location=new URL(begin.headers.get('location')),state=location.searchParams.get('state');
    assert.equal(location.searchParams.get('code_challenge_method'),'S256');
    const cookie=begin.headers.getSetCookie()[0].split(';')[0];
    const bad=await fetch(config.origin+`/api/auth/github/callback?code=test&state=${state}`,{headers:{Cookie:'sa_oauth=wrong'},redirect:'manual'});
    assert.equal(bad.status,400);assert.equal(exchanged,false);
    const callback=await fetch(config.origin+`/api/auth/github/callback?code=test&state=${state}`,{headers:{Cookie:cookie},redirect:'manual'});
    assert.equal(callback.status,302);assert.equal(callback.headers.get('location'),'/app#/repositories');
    const sessionCookie=callback.headers.getSetCookie().find(c=>c.startsWith('sa_session=')).split(';')[0];
    const me=await(await fetch(config.origin+'/api/me',{headers:{Cookie:sessionCookie}})).json();assert.equal(me.user.login,'test-developer');assert.ok(me.csrf);
    const token=await db.get('integration','github:123','github:123');assert.ok(!JSON.stringify(token).includes('mock-private-access-token'));
    const replay=await fetch(config.origin+`/api/auth/github/callback?code=test&state=${state}`,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(replay.status,400);
  }finally{await new Promise(r=>server.close(r));db.close()}
});
