const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('http://localhost:8091/');await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const i=document.querySelector('img[src*="splash-wide"]');let e=i,o=[];for(let k=0;k<4&&e;k++){const r=e.getBoundingClientRect();o.push(e.tagName+' '+Math.round(r.width)+'x'+Math.round(r.height)+' '+e.style.cssText.slice(0,160));e=e.parentElement;}return o.join('\n')}));
await b.close();})();
