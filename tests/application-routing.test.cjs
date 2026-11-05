const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const config=require('../vercel.json');
const firstRoute=url=>config.routes.find(r=>r.src&&new RegExp(r.src).test(url));
test('application assets bypass the residential catch-all',()=>{
 for(const asset of ['apply.html','apply.mjs','applications-20261019-logo.css','assets/turnly-website-logo.png']){
  assert.equal(firstRoute('/'+asset).dest,'/$1');assert.ok(fs.existsSync(asset));
 }
});
test('application submissions retain the existing applicant backend',()=>{
 assert.equal(firstRoute('/api/applicants').dest,'https://portal.turnlypros.com/api/applicants');
 assert.match(fs.readFileSync('apply.mjs','utf8'),/fetch\('\/api\/applicants'/);
});
