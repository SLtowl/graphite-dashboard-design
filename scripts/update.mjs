#!/usr/bin/env node
// No dependencies; downloaded content is data only, never executed.
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const REPOSITORY = 'SLtowl/graphite-dashboard-design';
export const ALLOWED = new Set(['README.md','SKILL.md','LICENSE','.gitignore','.gitattributes','agents/openai.yaml','assets/graphite.css','assets/fonts/OFL.txt','assets/fonts/instrument-sans-variable.woff2','assets/readme-surfaces.png','assets/readme-typography.png','cover.png','preview.png','references/components.md','references/updates.md','examples/index.html','scripts/update.mjs','tests/update.test.mjs']);
const MAX_FILE = 16 * 1024 * 1024, MAX_TOTAL = 64 * 1024 * 1024, DAY = 86400000;
const digest = b => createHash('sha256').update(b).digest('hex');
const fail = message => { throw new Error(message); };
const json = b => JSON.parse(b.toString('utf8'));
const serial = o => Buffer.from(JSON.stringify(o, null, 2) + '\n');
const exists = async p => { try { await fs.lstat(p); return true; } catch(e) { if(e.code === 'ENOENT') return false; throw e; } };

export function validateManifest(m) {
  if (!m || m.protocol !== 1 || m.repository !== REPOSITORY || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(m.version)) fail('Incompatible manifest');
  if (!m.files || typeof m.files !== 'object' || Array.isArray(m.files)) fail('Invalid files');
  let total = 0;
  for (const [p,f] of Object.entries(m.files)) {
    if (!ALLOWED.has(p) || !f || !/^[a-f0-9]{64}$/.test(f.sha256) || !Number.isSafeInteger(f.size) || f.size < 0 || f.size > MAX_FILE) fail('Unsafe manifest entry: ' + p);
    total += f.size;
  }
  if (total > MAX_TOTAL || !m.files['SKILL.md'] || !m.files['scripts/update.mjs']) fail('Incomplete or oversized manifest');
  return m;
}
function compare(a,b) { const x=a.split('.').map(BigInt),y=b.split('.').map(BigInt); for(let i=0;i<3;i++) if(x[i]!==y[i]) return x[i]>y[i]?1:-1; return 0; }
function validateURL(s) {
  const u = new URL(s);
  if (u.protocol !== 'https:' || !['api.github.com','raw.githubusercontent.com'].includes(u.hostname) || u.username || u.password || u.port || u.hash) fail('Unsafe URL');
  return u;
}
export function request(url, limit) {
  const u = validateURL(url);
  return new Promise((resolve,reject) => {
    const req = https.get(u, {headers:{'User-Agent':'graphite-dashboard-design-updater','Accept':'application/vnd.github+json'}}, res => {
      if(res.statusCode !== 200) { res.resume(); reject(new Error('GitHub HTTP ' + res.statusCode + ' (redirects refused)')); return; }
      let size=0; const chunks=[];
      res.on('data', b => { size+=b.length; if(size>limit) req.destroy(new Error('Response too large')); else chunks.push(b); });
      res.on('end',()=>resolve(Buffer.concat(chunks))); res.on('error',reject);
    });
    const timer=setTimeout(()=>req.destroy(new Error('Network timeout')),15000);
    req.on('close',()=>clearTimeout(timer)); req.on('error',reject);
  });
}

// Test injection is module-only: CLI accepts commands, never hosts or transport overrides.
export async function run(command, {root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), transport=request, now=Date.now()}={}) {
  if(!['enable','disable','status','check','auto','rollback'].includes(command)) fail('Usage: node scripts/update.mjs enable|disable|status|check|auto|rollback');
  root=path.resolve(root);
  if(root===path.parse(root).root || root===os.homedir() || root.split(path.sep).filter(Boolean).length<2) fail('Unsafe package root');
  async function safe(p, directory=false) {
    const absolute=path.resolve(root,p), rel=path.relative(root,absolute);
    if(rel.startsWith('..') || path.isAbsolute(rel)) fail('Path escape');
    // Inspect ancestors as well: a symlinked package or parent is not a standalone install.
    let current=path.parse(absolute).root;
    for(const piece of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
      current=path.join(current,piece);
      const st=await fs.lstat(current);
      if(st.isSymbolicLink() || (!st.isDirectory() && (!st.isFile() || st.nlink!==1))) fail('Unsafe link or special file: '+current);
    }
    const st=await fs.lstat(absolute);
    if(directory?!st.isDirectory():!st.isFile()) fail('Unexpected path type');
    return absolute;
  }
  await safe('',true);
  const read=async (p,limit=MAX_FILE)=>{const a=await safe(p); if((await fs.stat(a)).size>limit) fail('File too large');return fs.readFile(a);};
  const localBytes=await read('release-manifest.json',128*1024);
  const local=validateManifest(json(localBytes));
  const dir='.graphite-update';
  async function stateRead() { if(!await exists(path.join(root,dir))) return {enabled:false,lastCheck:0}; await safe(dir,true); if(!await exists(path.join(root,dir,'state.json'))) return {enabled:false,lastCheck:0}; const s=json(await read(dir+'/state.json',16384)); if(typeof s.enabled!=='boolean' || !Number.isFinite(s.lastCheck) || s.lastCheck<0 || (s.backup && !/^[a-f0-9-]{36}$/.test(s.backup))) fail('Invalid updater state'); return s; }
  let state=await stateRead();
  if(command==='status') return {...state,version:local.version,pending:await exists(path.join(root,dir,'pending.json'))};
  if(command==='auto' && !state.enabled && !await exists(path.join(root,dir,'pending.json'))) return {status:'disabled'};
  if(command==='check') return inspect(); // Network-only check: no state, locks or package writes.
  if(await exists(path.join(root,'.git'))) fail('Git checkouts require a manual update');
  if(!await exists(path.join(root,dir))) await fs.mkdir(path.join(root,dir));
  await safe(dir,true);
  const lockPath=path.join(root,dir,'lock');
  let lock;
  try { lock=await fs.open(lockPath,'wx'); } catch(e) { if(e.code==='EEXIST') fail('Updater locked. If interrupted, ensure no updater is running, then remove only .graphite-update/lock and retry.'); throw e; }
  try {
    await lock.writeFile(String(process.pid));
    state=await stateRead();
    async function atomic(p,b) {
      const parent=path.posix.dirname(p); await safe(parent==='.'?'':parent,true);
      if(await exists(path.join(root,p))) await safe(p);
      const temp=p+'.tmp-'+randomUUID();
      await fs.writeFile(path.join(root,temp),b,{flag:'wx'});
      await fs.rename(path.join(root,temp),path.join(root,p));
    }
    const save=()=>atomic(dir+'/state.json',serial(state));
    async function verify(m) { for(const [p,f] of Object.entries(m.files)) { const b=await read(p); if(b.length!==f.size || digest(b)!==f.sha256) fail('Local edit or corruption: '+p); } }
    async function loadJournal(id) {
      if(!/^[a-f0-9-]{36}$/.test(id)) fail('Unsafe backup ID');
      const j=json(await read(dir+'/'+id+'/journal.json',300*1024));
      validateManifest(j.before); validateManifest(j.after);
      if(JSON.stringify(Object.keys(j.before.files).sort())!==JSON.stringify(Object.keys(j.after.files).sort())) fail('Unsafe journal paths');
      return j;
    }
    async function restore(id,interrupted=false) {
      const j=await loadJournal(id);
      // Preflight every managed file before writing anything; never clobber later edits.
      for(const p of Object.keys(j.after.files)) {
        const h=digest(await read(p));
        if(h!==j.after.files[p].sha256 && (!interrupted || h!==j.before.files[p].sha256)) fail('Cannot restore over later edit: '+p);
        const b=await read(dir+'/'+id+'/old/'+p); if(digest(b)!==j.before.files[p].sha256 || b.length!==j.before.files[p].size) fail('Corrupt backup');
      }
      const mb=await read('release-manifest.json',128*1024);
      if(![digest(serial(j.before)),digest(serial(j.after)),j.originalManifestHash].includes(digest(mb))) fail('Manifest edited after update');
      // Rollback itself is a transaction too: a crash during restoration is recoverable.
      await atomic(dir+'/pending.json',serial({id}));
      for(const p of Object.keys(j.before.files)) await atomic(p,await read(dir+'/'+id+'/old/'+p));
      await atomic('release-manifest.json',serial(j.before));
      state={enabled:false,lastCheck:now}; await save();
      if(await exists(path.join(root,dir,'pending.json'))) {await safe(dir+'/pending.json');await fs.unlink(path.join(root,dir,'pending.json'));}
      return {status:interrupted?'recovered; auto disabled':'rolled back; auto disabled',version:j.before.version};
    }
    if(await exists(path.join(root,dir,'pending.json'))) {
      const pending=json(await read(dir+'/pending.json',4096));
      return await restore(pending.id,true);
    }
    if(command==='disable') {state.enabled=false;await save();return {status:'disabled'};}
    if(command==='rollback') {if(!state.backup) fail('No backup available');return await restore(state.backup);}
    await verify(local);
    if(command==='enable') {state.enabled=true;await save();return {status:'enabled',consent:'Stable compatible releases may update this skill on invocation.'};}
    if(!state.enabled) return {status:'disabled'};
    if(now-state.lastCheck<DAY) return {status:'checked within 24 hours'};
    state.lastCheck=now;await save(); // Throttle attempts, including network failures.
    const result=await inspect();
    if(result.status!=='update available') return result;
    const {manifest:remote,sha}=result;
    const id=randomUUID(), base=dir+'/'+id;
    await fs.mkdir(path.join(root,base));
    for(const sub of ['old','new']) await fs.mkdir(path.join(root,base,sub));
    for(const [p,f] of Object.entries(remote.files)) {
      const b=await get('https://raw.githubusercontent.com/'+REPOSITORY+'/'+sha+'/'+p,MAX_FILE);
      if(b.length!==f.size || digest(b)!==f.sha256) fail('Downloaded hash/size mismatch: '+p);
      for(const sub of ['old','new']) await fs.mkdir(path.dirname(path.join(root,base,sub,p)),{recursive:true});
      await fs.writeFile(path.join(root,base,'new',p),b,{flag:'wx'});
      await fs.writeFile(path.join(root,base,'old',p),await read(p),{flag:'wx'});
    }
    await verify(local);
    await fs.writeFile(path.join(root,base,'journal.json'),serial({before:local,after:remote,originalManifestHash:digest(localBytes)}),{flag:'wx'});
    await atomic(dir+'/pending.json',serial({id}));
    try {
      for(const p of Object.keys(remote.files)) await atomic(p,await read(base+'/new/'+p));
      await atomic('release-manifest.json',serial(remote));
      state.backup=id;await save();
      await safe(dir+'/pending.json');await fs.unlink(path.join(root,dir,'pending.json'));
    } catch(error) {
      try {await restore(id,true);} catch(recovery) {fail(error.message+'; recovery required: '+recovery.message);}
      throw error;
    }
    return {status:'updated',version:remote.version,sha};
  } finally {await lock.close();await fs.unlink(lockPath);}

  async function get(url,limit) {validateURL(url);const b=Buffer.from(await transport(url,limit));if(b.length>limit) fail('Response too large');return b;}
  async function inspect() {
    const release=json(await get('https://api.github.com/repos/'+REPOSITORY+'/releases/latest',128*1024));
    if(release.draft || release.prerelease || typeof release.tag_name!=='string' || !/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(release.tag_name)) fail('Not a stable release');
    const ref=json(await get('https://api.github.com/repos/'+REPOSITORY+'/git/ref/tags/'+encodeURIComponent(release.tag_name),128*1024));
    if(ref.ref!=='refs/tags/'+release.tag_name) fail('Release tag reference mismatch');
    let commit=ref.object;
    for(let hop=0;commit?.type==='tag' && hop<5;hop++) {
      if(!/^[a-f0-9]{40}$/.test(commit.sha)) fail('Invalid immutable tag');
      const tag=json(await get('https://api.github.com/repos/'+REPOSITORY+'/git/tags/'+commit.sha,128*1024));
      commit=tag.object;
    }
    if(commit?.type!=='commit' || !/^[a-f0-9]{40}$/.test(commit.sha)) fail('Invalid immutable commit or tag chain exceeds 5 hops');
    const remote=validateManifest(json(await get('https://raw.githubusercontent.com/'+REPOSITORY+'/'+commit.sha+'/release-manifest.json',128*1024)));
    if(remote.version!==release.tag_name.replace(/^v/,'')) fail('Tag/manifest version mismatch');
    if(remote.version.split('.')[0]!==local.version.split('.')[0]) fail('Major version requires manual update');
    if(compare(remote.version,local.version)<0) fail('Downgrade refused');
    if(JSON.stringify(Object.keys(remote.files).sort())!==JSON.stringify(Object.keys(local.files).sort())) fail('Managed file set changed; manual update required');
    if(remote.files['scripts/update.mjs'].sha256!==local.files['scripts/update.mjs'].sha256) fail('Updater changed; manual update required');
    if(compare(remote.version,local.version)===0) {
      if(Object.keys(local.files).some(p=>local.files[p].sha256!==remote.files[p].sha256 || local.files[p].size!==remote.files[p].size)) fail('Same-version release content changed');
      return {status:'current',version:local.version};
    }
    return {status:'update available',version:remote.version,manifest:remote,sha:commit.sha};
  }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  run(process.argv[2]).then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
