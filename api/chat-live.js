function ok(res, obj){ try{res.statusCode=200;res.setHeader('Content-Type','application/json')}catch(_){}; res.end(JSON.stringify(obj)); }
function readJSON(req, cb){
  if (req.body) { try { return cb(null, (typeof req.body==='string'? JSON.parse(req.body): req.body)||{}); } catch { return cb(null,{}) } }
  let d=''; req.on('data',c=>d+=c); req.on('end',()=>{ try{ cb(null, d?JSON.parse(d):{}) } catch { cb(null,{}) } }); req.on('error',()=>cb(null,{}) );
}
const https = require('https');
function post(host, path, headers, body){
  const data = JSON.stringify(body||{});
  const opt = { hostname:host, path, method:'POST',
    headers:Object.assign({'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}, headers||{}) };
  return new Promise((resolve,reject)=>{
    const req = https.request(opt, res=>{ let d=''; res.setEncoding('utf8'); res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode||0, body:d})) });
    req.on('error',reject); req.write(data); req.end();
  });
}
const VERSION = "chat-live-20251010155635";
module.exports = (req,res)=>{
  if (req.method!=='POST') return ok(res,{ok:false, reason:'method', version:VERSION});
  readJSON(req, async (_e, b)=>{
    const msg = String((b && b.message) || '').trim();
    const key = process.env.OPENAI_API_KEY || "";
    if (!key) return ok(res,{ok:false, reason:'no-key', version:VERSION});
    try{
      const up = await post('api.openai.com','/v1/chat/completions',
        {Authorization:Bearer },
        { model:'gpt-4o-mini', messages:[{role:'user',content: msg||'hi'}], temperature:0.2 }
      );
      if (up.status<200 || up.status>=300) return ok(res,{ok:false, reason:'upstream', status:up.status, version:VERSION});
      let parsed=null; try{ parsed = JSON.parse(up.body||'{}') }catch{}
      const reply = parsed?.choices?.[0]?.message?.content || '(no content)';
      return ok(res,{ok:true, reply, version:VERSION});
    }catch{
      return ok(res,{ok:false, reason:'network', version:VERSION});
    }
  });
};
