// NODE_PATH must include Playwright; CHROME_PATH can select an installed browser.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const token = 'a'.repeat(64);

test('resident form: QR validation, mobile layout, ratings, details, retries and confirmation', {timeout:120000}, async()=>{
  const routes = JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).routes;
  assert.equal(routes.find(r=>r.dest==='/feedback/index.html').src,'^/f(?:/.*)?$');
  assert.equal(fs.readFileSync(path.join(root,'404.html'),'utf8'),fs.readFileSync(path.join(root,'feedback/index.html'),'utf8'));
  const server = http.createServer((req,res)=>{
    let url = new URL(req.url,'http://localhost').pathname;
    if(url.startsWith('/f/') || url==='/feedback/' || url==='/feedback') url='/feedback/index.html';
    const file=path.resolve(root,'.'+url);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
    try {res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}
    catch{res.writeHead(404,{'Content-Type':'text/html'});res.end(fs.readFileSync(path.join(root,'404.html')))}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
    const page=await browser.newPage({viewport:{width:1440,height:1100}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const submissions=[];let checks=0;let lookupFails=true;let active=true;let failSave=true;
    const inquiries=[];
    await page.route('https://portal.turnlypros.com/api/website-inquiries',async route=>{inquiries.push(route.request().postDataJSON());await route.fulfill({json:{ok:true}})});
    await page.route('https://portal.turnlypros.com/api/resident-feedback',async route=>{
      const body=route.request().postDataJSON();
      assert.equal(body.token,token);
      if(body.action==='quote_context')return route.fulfill({json:{ok:true,context:{property_name:'Vetra Forest Hills',bedrooms:0,bathrooms:1.5,square_feet:850}}});
      assert.equal(route.request().headers().referer,undefined,'Token must not leak through a referrer');
      if(body.action==='resolve'){
        checks++;
        if(lookupFails)return route.abort('failed');
        return route.fulfill({json:{valid:active}});
      }
      submissions.push(body);
      assert.ok(Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5);
      assert.ok(body.message.length <= 2000);
      assert.match(body.request_id,/^[a-f0-9-]{36}$/);
      if(failSave)return route.fulfill({status:503,json:{error:'Service temporarily unavailable. Please retry.'}});
      return route.fulfill({json:{ok:true}});
    });
    const base=`http://127.0.0.1:${server.address().port}`;
    await page.goto(`${base}/f/${token}`);
    await page.getByRole('button',{name:'Try again'}).waitFor();
    assert.equal(await page.locator('#residentFeedbackForm').isVisible(),false);
    lookupFails=false;
    await page.getByRole('button',{name:'Try again'}).click();
    await page.locator('#residentFeedbackForm').waitFor();
    assert.equal(checks,2);
    await page.getByRole('button',{name:'Send my feedback'}).click();
    assert.equal(submissions.length,0,'Rating is required');
    await page.getByRole('radio',{name:'2 stars — Fair'}).check();
    assert.equal(await page.locator('#commentLabel').textContent(),'What could we do better?');
    await page.getByRole('checkbox',{name:'Kitchen',exact:true}).check();
    await page.getByRole('checkbox',{name:'Floors',exact:true}).check();
    await page.locator('#feedbackMessage').fill('The kitchen looked good, but the floors needed more attention.');
    const qa=process.env.FEEDBACK_QA_DIR;
    if(qa){fs.mkdirSync(qa,{recursive:true});await page.screenshot({path:path.join(qa,'resident-desktop.png'),fullPage:true})}
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    if(qa)await page.screenshot({path:path.join(qa,'resident-mobile.png'),fullPage:true});
    await page.setViewportSize({width:320,height:740});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.getByRole('button',{name:'Send my feedback'}).click();
    await page.waitForFunction(()=>document.getElementById('residentFeedbackFormMessage').textContent.includes('temporarily unavailable'));
    assert.equal(await page.locator('#residentFeedbackThanks').isVisible(),false);
    assert.match(await page.locator('#feedbackMessage').inputValue(),/floors needed/);
    assert.equal(submissions[0].message,'Areas: Kitchen, Floors\n\nThe kitchen looked good, but the floors needed more attention.');
    assert.equal(submissions[0].rating,2);
    failSave=false;
    await page.getByRole('button',{name:'Send my feedback'}).click();
    await page.locator('#residentFeedbackThanks').waitFor();
    assert.equal(submissions[1].request_id,submissions[0].request_id,'Retries must reuse the idempotency key');
    assert.equal(await page.locator('#residentFeedbackForm').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.activeElement.id),'thanksTitle');
    if(qa)await page.screenshot({path:path.join(qa,'resident-thanks.png'),fullPage:true});
    const quoteLink = await page.getByRole('link',{name:'Request a quote now'}).getAttribute('href');
    assert.equal(new URL(quoteLink,base).search.includes(token),false);
    assert.ok(quoteLink.endsWith('#card='+token));
    await page.getByRole('link',{name:'Request a quote now'}).click();
    await page.waitForFunction(()=>document.getElementById('squareFeet')?.value==='850');
    assert.equal(await page.locator('#bedrooms').inputValue(),'0');
    assert.equal(await page.locator('#bathrooms').inputValue(),'1.5');
    assert.equal(page.url().includes(token),false,'Token is removed from the visible URL');
    assert.match(await page.locator('#quoteCommunity').textContent(),/Vetra Forest Hills/);
    await page.locator('#name').fill('Test Resident');await page.locator('#email').fill('test@example.com');
    await page.locator('#phone').fill('9195550100');await page.locator('#city').fill('Raleigh');
    await page.locator('#streetAddress').fill('123 Test Street');await page.locator('#unitNumber').fill('2B');
    await page.locator('#state').fill('NC');await page.locator('#postalCode').fill('27601');
    await page.locator('#squareFeet').fill('900');await page.locator('#tier').selectOption('Deep cleaning');
    await page.locator('#frequency').selectOption('Monthly');await page.locator('#message').fill('Occasional deep cleans, especially the kitchen.');
    if(qa){await page.setViewportSize({width:390,height:844});await page.locator('#contact-form').screenshot({path:path.join(qa,'quote-form-mobile.png')})}
    await page.locator('#contactForm button[type="submit"]').click();await page.locator('#formSuccess').waitFor();
    assert.equal(inquiries.length,1);assert.equal(inquiries[0].street_address,'123 Test Street');assert.equal(inquiries[0].square_feet,'900');
    assert.equal(inquiries[0].feedback_token,token);assert.equal(inquiries[0].source_url.includes(token),false);assert.equal(inquiries[0].sms_consent,false);
    await page.goto(`${base}/f/${token}`);
    await page.locator('#residentFeedbackThanks').waitFor();
    assert.equal(submissions.length,2,'Reload must not submit again');
    // Expired/deleted cards cannot open a form, even after a previous successful submission.
    active=false;
    await page.reload();
    await page.getByRole('heading',{name:'This flyer is no longer active.'}).waitFor();
    assert.equal(await page.locator('#residentFeedbackForm').isVisible(),false);
    const before=checks;
    await page.goto(`${base}/f/invalid`);
    await page.getByRole('heading',{name:'This feedback link isn’t valid.'}).waitFor();
    assert.equal(checks,before);
    await page.goto(`${base}/feedback/`);
    await page.getByRole('heading',{name:'Start with your Turnly flyer.'}).waitFor();
    await page.goto(`${base}/feedback/?preview=1`);
    await page.locator('#residentFeedbackForm').waitFor();
    await page.getByRole('radio',{name:'5 stars — Excellent'}).check();
    await page.getByRole('button',{name:'Preview confirmation'}).click();
    await page.locator('#residentFeedbackThanks').waitFor();
    assert.match(await page.locator('#thanksMessage').textContent(),/did not save/);
    assert.equal(submissions.length,2);
    assert.equal(checks,before,'Preview must not contact the service');
    await page.getByRole('link',{name:'Request a quote now'}).click();
    await page.getByText('Preview only: this form will not save a quote request.').waitFor();
    assert.equal(await page.locator('#squareFeet').inputValue(),'');
    assert.deepEqual(errors,[]);
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve))}
});
