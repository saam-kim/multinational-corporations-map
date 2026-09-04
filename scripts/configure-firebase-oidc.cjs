// One-time setup. Uses the existing Firebase CLI login locally; never exports it.
const {createRequire} = require('node:module');
const path = require('node:path');
const firebaseRoot = process.env.FIREBASE_TOOLS_ROOT;
if (!firebaseRoot || !process.argv.includes('--apply')) throw new Error('Set FIREBASE_TOOLS_ROOT and pass --apply');
const auth = createRequire(path.join(firebaseRoot, 'package.json'))('./lib/auth.js');
const project = 'global-shift-map';
const number = '893932899610';
const team = 'ssam-kim';
const pool = 'vercel-classroom';
const provider = 'global-shift-map';
const accountId = 'vercel-classroom';
const email = accountId + '@' + project + '.iam.gserviceaccount.com';
(async () => {
  const account = auth.getGlobalDefaultAccount();
  if (account?.user.email !== 'kjs59741@gmail.com') throw new Error('Unexpected Firebase account');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  async function request(url, method='GET', body, allow404=false) {
    const response = await fetch(url, {method, headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
    if (response.status===404 && allow404) return null;
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(method+' '+new URL(url).pathname+': non-JSON response ('+response.status+')'); }
    if (!response.ok) throw new Error(method+' '+new URL(url).pathname+': '+response.status+' '+data.error?.message);
    return data;
  }
  async function operation(origin, data) {
    if (!data.name || !data.name.includes('operations/')) return;
    for (let i=0;i<40;i++) {
      if(data.done) { if(data.error) throw new Error(data.error.message); return; }
      await new Promise(r=>setTimeout(r,1500));
      data=await request(origin+'/v1/'+data.name);
    }
    throw new Error('Provisioning is still in progress; inspect before retrying');
  }
  for (const service of ['iam.googleapis.com','iamcredentials.googleapis.com','sts.googleapis.com']) {
    const url='https://serviceusage.googleapis.com/v1/projects/'+number+'/services/'+service;
    const current=await request(url);
    if(current.state!=='ENABLED') await operation('https://serviceusage.googleapis.com',await request(url+':enable','POST',{}));
    console.log(service+' enabled');
  }
  const poolPath='projects/'+number+'/locations/global/workloadIdentityPools/'+pool;
  const iam='https://iam.googleapis.com/v1/';
  if (!await request(iam+poolPath,'GET',null,true)) {
    await operation('https://iam.googleapis.com',await request(iam+'projects/'+number+'/locations/global/workloadIdentityPools?workloadIdentityPoolId='+pool,'POST',{displayName:'Global Shift Vercel',description:'Only the Global Shift Vercel project'}));
  }
  const providerPath=poolPath+'/providers/'+provider;
  if (!await request(iam+providerPath,'GET',null,true)) {
    await operation('https://iam.googleapis.com',await request(iam+poolPath+'/providers?workloadIdentityPoolProviderId='+provider,'POST',{
      displayName:'Global Shift Map',
      oidc:{issuerUri:'https://oidc.vercel.com/'+team,allowedAudiences:['https://vercel.com/'+team]},
      attributeMapping:{'google.subject':'assertion.sub'},
      attributeCondition:"assertion.owner_id == 'team_dlmbLzimWTGgYo2cav4SiZwL' && assertion.project_id == 'prj_T274TWcZrYolgSMEGlw8DxOLHfKY'"
    }));
  }
  const sa='projects/'+project+'/serviceAccounts/'+email;
  if (!await request(iam+sa,'GET',null,true)) await request(iam+'projects/'+project+'/serviceAccounts','POST',{accountId,serviceAccount:{displayName:'Global Shift Firestore server'}});
  const crm='https://cloudresourcemanager.googleapis.com/v1/projects/'+project;
  const policy=await request(crm+':getIamPolicy','POST',{options:{requestedPolicyVersion:3}});
  const member='serviceAccount:'+email;
  policy.bindings ??= [];
  let binding=policy.bindings.find(b=>b.role==='roles/datastore.user'&&!b.condition);
  if(!binding){binding={role:'roles/datastore.user',members:[]};policy.bindings.push(binding);}
  if(!binding.members.includes(member)){binding.members.push(member);await request(crm+':setIamPolicy','POST',{policy});}
  const sapolicy=await request(iam+sa+':getIamPolicy','POST',{options:{requestedPolicyVersion:3}});
  sapolicy.bindings ??= [];
  let users=sapolicy.bindings.find(b=>b.role==='roles/iam.workloadIdentityUser'&&!b.condition);
  if(!users){users={role:'roles/iam.workloadIdentityUser',members:[]};sapolicy.bindings.push(users);}
  let changed=false;
  for(const env of ['development','preview','production']){
    const principal='principal://iam.googleapis.com/'+poolPath+'/subject/owner:'+team+':project:global-shift-map:environment:'+env;
    if(!users.members.includes(principal)){users.members.push(principal);changed=true;}
  }
  if(changed)await request(iam+sa+':setIamPolicy','POST',{policy:sapolicy});
  console.log(JSON.stringify({project,serviceAccount:email,provider:providerPath,privateKeysCreated:0}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
