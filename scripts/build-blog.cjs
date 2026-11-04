const fs = require('node:fs');
const path = require('node:path');
const base = 'https://turnlypros.com';
const out = path.resolve(__dirname, '../blog');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const articles = fs.readdirSync(path.join(out, 'posts')).filter(file => file.endsWith('.md')).sort().map(file => {
  const slug = file.slice(0,-3);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Use a lowercase hyphenated filename: '+file);
  const [heading,...body] = fs.readFileSync(path.join(out,'posts',file),'utf8').trim().split(/\r?\n/);
  if (!heading.startsWith('# ')) throw Error('Missing article title: '+file);
  const blocks = body.join('\n').trim().split(/\n\s*\n/);
  const html = blocks.map(block => {
    if (block.startsWith('## ')) return '<h2>'+escape(block.slice(3))+'</h2>';
    if (block.startsWith('- ')) return '<ul>'+block.split('\n').map(line => '<li>'+escape(line.replace(/^- /,''))+'</li>').join('')+'</ul>';
    return '<p>'+escape(block)+'</p>';
  }).join('\n');
  return {slug,title:heading.slice(2),summary:blocks[0]||'',html,url:'/blog/'+slug+'/'};
});
function page(title, description, url, body) {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escape(title)+' | Turnly Pro Cleaners</title><meta name="description" content="'+escape(description)+'"><link rel="canonical" href="'+base+url+'"><link rel="stylesheet" href="/blog/blog.css"><header><a href="/"><img src="/turnly-icon-192.png" alt="">Turnly Pro Cleaners</a><a href="/Services.html">Services</a></header><main>'+body+'</main><footer><a href="/blog/">Cleaning guides</a> · <a href="/Contact.html">Contact Turnly</a></footer></html>';
}
for (const a of articles) {
  const dir = path.join(out,a.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(a.title,a.summary,a.url,'<a href="/blog/">← Cleaning guides</a><article><h1>'+escape(a.title)+'</h1>'+a.html+'</article>'));
}
fs.writeFileSync(path.join(out,'index.html'),page('Cleaning guides','Practical cleaning guides from Turnly Pro Cleaners.','/blog/','<small>TURNLY JOURNAL</small><h1>Cleaning guides</h1>'+articles.map(a=>'<section><h2><a href="'+a.url+'">'+escape(a.title)+'</a></h2><p>'+escape(a.summary)+'</p></section>').join('')));
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/blog/',...articles.map(a=>a.url)].map(url=>'<url><loc>'+base+url+'</loc></url>').join('')+'</urlset>');
