const fs = require('node:fs');
const path = require('node:path');
const base = 'https://turnlypros.com';
const out = path.resolve(__dirname, '../blog');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const inline = value => {
  let text = escape(value);
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">');
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return text;
};
const plainText = value => value
  .replace(/!\[[^\]]*\]\([^)\s]*\)/g, '')
  .replace(/\[([^\]]+)\]\([^)\s]*\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1');
const articles = fs.readdirSync(path.join(out, 'posts')).filter(file => file.endsWith('.md')).sort().map(file => {
  const slug = file.slice(0,-3);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Use a lowercase hyphenated filename: '+file);
  const [heading,...body] = fs.readFileSync(path.join(out,'posts',file),'utf8').trim().split(/\r?\n/);
  if (!heading.startsWith('# ')) throw Error('Missing article title: '+file);
  const blocks = body.join('\n').trim().split(/\n\s*\n/);
  const html = blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (block.startsWith('## ')) return '<h2>'+inline(block.slice(3).trim())+'</h2>';
    if (block.startsWith('### ')) return '<h3>'+inline(block.slice(4).trim())+'</h3>';
    if (lines.every(l => l.startsWith('- '))) return '<ul>'+lines.map(line => '<li>'+inline(line.replace(/^- /,''))+'</li>').join('')+'</ul>';
    if (lines.every(l => /^\d+\.\s/.test(l))) return '<ol>'+lines.map(line => '<li>'+inline(line.replace(/^\d+\.\s*/,''))+'</li>').join('')+'</ol>';
    if (lines.every(l => l.startsWith('|'))) {
      const rows = lines.filter(l => !/^\|[\s\-|]+\|$/.test(l)).map(l => l.replace(/^\||\|$/g,'').split('|').map(c => c.trim()));
      if (!rows.length) return '';
      const head = '<thead><tr>'+rows[0].map(c => '<th>'+inline(c)+'</th>').join('')+'</tr></thead>';
      const rest = rows.slice(1).map(cells => '<tr>'+cells.map(c => '<td>'+inline(c)+'</td>').join('')+'</tr>').join('');
      return '<table>'+head+'<tbody>'+rest+'</tbody></table>';
    }
    return '<p>'+inline(lines.join(' '))+'</p>';
  }).filter(Boolean).join('\n');
  const summaryBlock = blocks.map(b => b.trim()).find(b => b && !b.startsWith('!['));
  const summary = plainText((summaryBlock || '').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('![')).join(' ')).slice(0, 300);
  const jsonLd = JSON.stringify({'@context':'https://schema.org','@type':'Article','headline':heading.slice(2),'description':summary,'author':{'@type':'Organization','name':'Turnly'},'publisher':{'@type':'Organization','name':'Turnly'},'mainEntityOfPage':base+'/blog/'+slug+'/'});
  return {slug,title:heading.slice(2),summary,html,url:'/blog/'+slug+'/',jsonLd};
});
// Build from the public homepage so future navigation and branding changes reach the blog.
const homepage = fs.readFileSync(path.join(out, '../residential/index.html'), 'utf8');
function fragment(pattern) {
  const match = homepage.match(pattern);
  if (!match) throw Error('Could not find homepage layout: ' + pattern);
  return match[0];
}
function siteLinks(markup) {
  return markup.replace(/(href|src)="([^"]+)"/g, (attribute, key, value) => {
    const target = value === '#' ? '/' : new URL(value, base + '/').href;
    return key + '="' + target + '"';
  });
}
const styles = fragment(/<style>[\s\S]*?<\/style>/);
const header = siteLinks(fragment(/<header\b[\s\S]*?<\/header>/)).replaceAll('class="nav-link">Blog', 'class="nav-link" aria-current="page">Blog');
const footer = siteLinks(fragment(/<footer\b[\s\S]*?<\/footer>/));
const controls = homepage.slice(homepage.indexOf('</footer>') + '</footer>'.length, homepage.indexOf('</body>'));
function page(title, description, url, body, jsonLd) {
  const ld = jsonLd ? '<script type="application/ld+json">'+jsonLd+'</script>' : '';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+escape(title)+' | Turnly Pro Cleaners</title><meta name="description" content="'+escape(description)+'"><link rel="canonical" href="'+base+url+'"><link rel="icon" href="/favicon.ico">'+styles+'<link rel="stylesheet" href="/blog/blog.css">'+ld+'</head><body>'+header+'<main class="journal"><div class="journal-inner">'+body+'</div></main>'+footer+controls+'</body></html>';
}
for (const a of articles) {
  const dir = path.join(out,a.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),page(a.title,a.summary,a.url,'<a href="/blog/">← Cleaning guides</a><article><h1>'+escape(a.title)+'</h1>'+a.html+'</article>',a.jsonLd));
}
fs.writeFileSync(path.join(out,'index.html'),page('Cleaning guides','Practical cleaning guides from Turnly Pro Cleaners.','/blog/','<small>TURNLY JOURNAL</small><h1>Cleaning guides</h1>'+articles.map(a=>'<section><h2><a href="'+a.url+'">'+escape(a.title)+'</a></h2><p>'+escape(a.summary)+'</p></section>').join('')));
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/blog/',...articles.map(a=>a.url)].map(url=>'<url><loc>'+base+url+'</loc></url>').join('')+'</urlset>');
