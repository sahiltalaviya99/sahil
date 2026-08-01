const list = await (await fetch('http://127.0.0.1:9335/json/list')).json();
const page = list.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id=0; const pending=new Map();
const send=(m,p={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method:m,params:p}))});
await new Promise(r=>ws.onopen=r);
ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}};
await send('Page.enable'); await send('Runtime.enable');
const fs = await import('node:fs');
const ev = async x => (await send('Runtime.evaluate',{expression:x,returnByValue:true})).result.value;
await send('Emulation.setDeviceMetricsOverride',{width:1800,height:1100,deviceScaleFactor:2,mobile:false});
for (const tpl of ['Classic','Sidebar']) {
  await send('Page.navigate',{url:'http://localhost:8081/sahil9909657018'});
  await new Promise(r=>setTimeout(r,4000));
  if (tpl !== 'Classic') {
    await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='${tpl}').click()`);
    await new Promise(r=>setTimeout(r,1200));
  }
  const box = JSON.parse(await ev(`(() => { const s=document.querySelector('.resume-print-portal .resume-sheet'); const p=document.querySelector('.resume-print-portal'); p.style.display='block'; p.style.position='absolute'; p.style.left='0'; p.style.top='0'; p.style.zIndex='9999'; const r=s.getBoundingClientRect(); return JSON.stringify({x:r.x+window.scrollX,y:r.y+window.scrollY,w:r.width}) })()`));
  await new Promise(r=>setTimeout(r,400));
  const shot = await send('Page.captureScreenshot',{format:'png',clip:{x:box.x,y:box.y,width:box.w,height:330,scale:2},captureBeyondViewport:true});
  fs.writeFileSync(`header-${tpl.toLowerCase()}.png`, Buffer.from(shot.data,'base64'));
  console.log('wrote header-'+tpl.toLowerCase());
}
ws.close(); process.exit(0);
