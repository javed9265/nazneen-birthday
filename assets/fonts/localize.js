// Localizes Google Fonts CSS + woff2 files so the site works 100% offline.
const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = __dirname;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const families = [
  'Great+Vibes',
  'Cinzel:wght@500;700',
  'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',
  'Poppins:wght@300;400;600',
];

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, ...headers } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, headers));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ body: Buffer.concat(chunks), headers: res.headers }));
    }).on('error', reject);
  });
}

(async () => {
  const out = [];
  for (const fam of families) {
    const name = fam.split(':')[0];
    let css = (await get(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`)).body.toString('utf8');
    const urls = [...new Set([...css.matchAll(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g)].map(m => m[0]))];
    for (const u of urls) {
      const file = u.split('/').pop();
      const buf = (await get(u)).body;
      fs.writeFileSync(path.join(dir, file), buf);
      css = css.split(u).join(file); // CSS lives in the same folder as the woff2
      out.push(`${file} ${buf.length}`);
    }
    fs.writeFileSync(path.join(dir, `${name}.css`), css);
  }
  console.log('downloaded:\n' + out.join('\n'));
})();
