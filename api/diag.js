const https = require('https');

function sendJSON(res, code, obj){ try{res.statusCode=code;res.setHeader('Content-Type','application/json')}catch(_){ } res.end(JSON.stringify(obj)); }
function get(host, path){
  return new Promise((resolve,reject)=>{
    const req = https.request({hostname:host, path, method:'GET'}, res=>{
      let d=''; res.setEncoding('utf8'); res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode||0, body:d}));
    });
    req.on('error',reject); req.end();
  });
}
function post(host, path, headers, body){
  const data = JSON.stringify(body||{});
  const opts = {hostname:host, path, method:'POST', headers:Object.assign({'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}, headers||{})};
  return new Promise((resolve,reject)=>{
    const req = https.request(opts, res=>{
      let d=''; res.setEncoding('utf8'); res.on('data',c=>d+=c); res.on('end',()=>resolve({status:res.statusCode||0, body:d.slice(0,200)})); // body truncated, no secrets
    });
    req.on('error',reject); req.write(data); req.end();
  });
}

module.exports = async (req,res)=>{
  try{
    // 1) No-auth GET to OpenAI models  should be 401 if network is OK
    const noAuth = await get('api.openai.com','/v1/models');

    // 2) Authenticated tiny chat call (no body returned), just status signal
    const key = process.env.OPENAI_API_KEY || '';
    let chatStatus = 0;
    if (key) {
      const r = await post('api.openai.com','/v1/chat/completions',
        {Authorization:Bearer },
        { model: 'gpt-4o-mini', messages: [{role:'user', content:'hi'}] }
      );
      chatStatus = r.status || 0;
    }

    return sendJSON(res, 200, {
      ok: true,
      networkToOpenAI: noAuth.status,   // expect 401
      chatWithKey: chatStatus           // expect 200 if key+model good, 401 if key bad, 404/400 if model bad
    });
  }catch(e){
    return sendJSON(res, 200, { ok:false, error:'net-fail' });
  }
};
