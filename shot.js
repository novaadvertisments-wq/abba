const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('http://localhost:8091/');
let last=0;for (const [t,n] of [[700,'a'],[2000,'b'],[3000,'c'],[4100,'d']]) { await p.waitForTimeout(t-last); last=t; await p.screenshot({path:`/tmp/splash_${n}.png`}); }
await b.close();})();
