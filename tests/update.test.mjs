import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {run,validateManifest,REPOSITORY} from '../scripts/update.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
const bytes=o=>Buffer.from(JSON.stringify(o));
function manifest(version,files) {return {protocol:1,repository:REPOSITORY,version,files:Object.fromEntries(Object.entries(files).map(([p,b])=>[p,{size:Buffer.byteLength(b),sha256:hash(b)}]))};}
async function fixture(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'graphite-updater-'));
  // Intentionally keep fixtures for inspection: updater itself never recursively deletes.
  t.diagnostic('Fixture: '+root);
  const before={'SKILL.md':'old instructions','scripts/update.mjs':'trusted updater','assets/graphite.css':'old css'};
  for(const [p,b] of Object.entries(before)) {await fs.mkdir(path.dirname(path.join(root,p)),{recursive:true});await fs.writeFile(path.join(root,p),b);}
  await fs.writeFile(path.join(root,'release-manifest.json'),bytes(manifest('1.0.0',before)));
  const after={...before,'SKILL.md':'new instructions','assets/graphite.css':'new css'};
  let version='1.1.0', alter=m=>m, error=false, bad=false, count=0;
  const transport=async url=>{
    count++; if(error) throw Error('offline');
    if(url.endsWith('/releases/latest')) return bytes({tag_name:'v'+version,prerelease:false,draft:false});
    if(url.includes('/git/ref/tags/')) return bytes({ref:'refs/tags/v'+version,object:{type:'commit',sha:'a'.repeat(40)}});
    assert.ok(url.startsWith('https://raw.githubusercontent.com/'+REPOSITORY+'/'+'a'.repeat(40)+'/'));
    if(url.endsWith('/release-manifest.json')) return bytes(alter(manifest(version,after)));
    const p=url.split('/').slice(6).join('/');return Buffer.from(bad?'corrupt':after[p]);
  };
  const call=command=>run(command,{root,transport,now:100000000});
  return {root,before,after,call,transport,setVersion:v=>version=v,setAlter:f=>alter=f,setError:()=>error=true,setBad:()=>bad=true,count:()=>count};
}
test('disabled by default; enable is explicit; disable stops network',async t=>{
  const f=await fixture(t);assert.equal((await f.call('auto')).status,'disabled');assert.equal(f.count(),0);
  assert.equal((await f.call('enable')).status,'enabled');await f.call('disable');assert.equal((await f.call('auto')).status,'disabled');assert.equal(f.count(),0);
});
test('check is read-only; update preserves extras; rollback restores and disables',async t=>{
  const f=await fixture(t);assert.equal((await f.call('check')).status,'update available');
  await assert.rejects(fs.stat(path.join(f.root,'.graphite-update')),{code:'ENOENT'});
  await fs.writeFile(path.join(f.root,'notes.txt'),'user data');await f.call('enable');
  assert.equal((await f.call('auto')).status,'updated');assert.equal(await fs.readFile(path.join(f.root,'SKILL.md'),'utf8'),'new instructions');
  assert.equal(await fs.readFile(path.join(f.root,'notes.txt'),'utf8'),'user data');
  assert.equal((await f.call('auto')).status,'checked within 24 hours');
  assert.match((await f.call('rollback')).status,/rolled back/);assert.equal(await fs.readFile(path.join(f.root,'SKILL.md'),'utf8'),'old instructions');assert.equal((await f.call('status')).enabled,false);
});
test('local edits block update and rollback',async t=>{
  const f=await fixture(t);await f.call('enable');await fs.writeFile(path.join(f.root,'assets/graphite.css'),'user edit');await assert.rejects(f.call('auto'),/Local edit/);
  await fs.writeFile(path.join(f.root,'assets/graphite.css'),f.before['assets/graphite.css']);await f.call('auto');
  await fs.writeFile(path.join(f.root,'SKILL.md'),'later user edit');await assert.rejects(f.call('rollback'),/later edit/);
});
test('network failure and bad hashes never change package',async t=>{
  for(const mode of ['setError','setBad']) {const f=await fixture(t);await f.call('enable');f[mode]();await assert.rejects(f.call('auto'),/offline|mismatch/);assert.equal(await fs.readFile(path.join(f.root,'SKILL.md'),'utf8'),f.before['SKILL.md']);}
});
test('reject downgrade, major change, updater change, same-version mutation and protocol',async t=>{
  for(const version of ['0.9.0','2.0.0','1.0.0']) {const f=await fixture(t);f.setVersion(version);await assert.rejects(f.call('check'),/Major|Downgrade|Same-version/);}
  const f=await fixture(t);f.after['scripts/update.mjs']='untrusted code';await assert.rejects(f.call('check'),/Updater changed/);
  const g=await fixture(t);g.setAlter(m=>({...m,protocol:2}));await assert.rejects(g.call('check'),/Incompatible/);
});
test('reject traversal in manifest and symlink or hardlink managed paths',async t=>{
  const f=await fixture(t);const m=manifest('1.0.0',f.before);m.files['../escape']={sha256:'a'.repeat(64),size:1};assert.throws(()=>validateManifest(m),/Unsafe/);
  await fs.unlink(path.join(f.root,'SKILL.md'));await fs.link(path.join(f.root,'assets/graphite.css'),path.join(f.root,'SKILL.md'));await assert.rejects(f.call('enable'),/Unsafe link/);
  const g=await fixture(t);await fs.unlink(path.join(g.root,'SKILL.md'));
  try {await fs.symlink(path.join(g.root,'assets/graphite.css'),path.join(g.root,'SKILL.md'));} catch(e) {if(e.code==='EPERM') {t.diagnostic('Symlink creation unavailable on this Windows account');return;}throw e;}
  await assert.rejects(g.call('enable'),/Unsafe link/);
});
test('git checkouts and concurrent locks are refused',async t=>{
  const f=await fixture(t);await fs.writeFile(path.join(f.root,'.git'),'gitdir: elsewhere');await assert.rejects(f.call('enable'),/Git checkouts/);
  const g=await fixture(t);await g.call('enable');await fs.writeFile(path.join(g.root,'.graphite-update/lock'),'123');await assert.rejects(g.call('auto'),/locked/);
});
test('interrupted transaction is recovered before a new update',async t=>{
  const f=await fixture(t);await f.call('enable');await f.call('auto');const s=await f.call('status');
  await fs.writeFile(path.join(f.root,'.graphite-update/pending.json'),bytes({id:s.backup}));
  await fs.writeFile(path.join(f.root,'SKILL.md'),f.before['SKILL.md']); // Mixed before/after state.
  assert.match((await f.call('auto')).status,/recovered/);assert.equal(await fs.readFile(path.join(f.root,'assets/graphite.css'),'utf8'),f.before['assets/graphite.css']);
});
test('unsafe journal IDs fail closed',async t=>{
  const f=await fixture(t);await f.call('enable');await fs.writeFile(path.join(f.root,'.graphite-update/pending.json'),bytes({id:'../../escape'}));await assert.rejects(f.call('auto'),/Unsafe backup ID/);
});
test('pending restoration finishes even after auto was disabled',async t=>{
  const f=await fixture(t);await f.call('enable');await f.call('auto');const s=await f.call('status');await f.call('disable');
  await fs.writeFile(path.join(f.root,'.graphite-update/pending.json'),bytes({id:s.backup}));
  assert.match((await f.call('auto')).status,/recovered/);assert.equal((await f.call('status')).enabled,false);
});
test('unsafe remote paths, changed file set, oversized responses and invalid commits fail closed',async t=>{
  const f=await fixture(t);f.setAlter(m=>({...m,files:{...m.files,'../evil':{sha256:'a'.repeat(64),size:1}}}));await assert.rejects(f.call('check'),/Unsafe manifest/);
  const g=await fixture(t);g.after['README.md']='new file';await assert.rejects(g.call('check'),/file set changed/);
  await assert.rejects(run('check',{root:g.root,transport:async()=>Buffer.alloc(128*1024+1)}),/Response too large/);
  await assert.rejects(run('check',{root:g.root,transport:async url=>url.includes('/git/ref/tags/')?bytes({ref:'refs/tags/v1.1.0',object:{type:'commit',sha:'../../evil'}}):bytes({tag_name:'v1.1.0'})}),/Invalid immutable/);
});
test('annotated tags resolve to commits; excessive chains, draft and prereleases rejected',async t=>{
  const f=await fixture(t);
  const transport=async url=>{
    if(url.includes('/git/ref/tags/')) return bytes({ref:'refs/tags/v1.1.0',object:{type:'tag',sha:'b'.repeat(40)}});
    if(url.includes('/git/tags/')) return bytes({object:{type:'commit',sha:'a'.repeat(40)}});
    return f.transport(url);
  };
  assert.equal((await run('check',{root:f.root,transport})).status,'update available');
  await assert.rejects(run('check',{root:f.root,transport:async url=>url.includes('/git/tags/')?bytes({object:{type:'tag',sha:'b'.repeat(40)}}):transport(url)}),/chain exceeds/);
  for(const field of ['draft','prerelease']) await assert.rejects(run('check',{root:f.root,transport:async()=>bytes({tag_name:'v1.1.0',[field]:true})}),/Not a stable/);
});
