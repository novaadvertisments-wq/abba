const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
p.on('console',m=>console.log('C',m.text().slice(0,200)));p.on('pageerror',e=>console.log('E',e.message.slice(0,200)));
await p.goto('http://localhost:8091/');await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>[...document.querySelectorAll('img,div[style*="background-image"]')].map(e=>e.tagName+' '+(e.getAttribute('src')||'').slice(0,60)+' '+JSON.stringify(e.getBoundingClientRect())+' '+e.style.cssText.slice(0,200)).join('\n')));
await b.close();})();
