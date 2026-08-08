// Debug: check connectivity + URL construction against Commons.
const crypto = require('node:crypto');

function commonsThumbUrl(filename, width) {
  const md5 = crypto.createHash('md5').update(filename).digest('hex');
  const enc = encodeURIComponent(filename);
  return (
    `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${enc}/` +
    `${width}px-${enc}`
  );
}

async function probe(label, url, method = 'GET') {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'User-Agent': 'Mozilla/5.0 (test)' },
      redirect: 'follow',
    });
    console.log(`${label}: ${res.status} ${res.statusText} (${method} ${url.slice(0, 110)})`);
    if (res.status === 200 && method === 'GET') {
      const ct = res.headers.get('content-type');
      const len = res.headers.get('content-length');
      console.log(`   content-type: ${ct}  length: ${len}`);
    }
  } catch (err) {
    console.log(`${label}: ERROR ${err.message} (${url.slice(0, 110)})`);
  }
}

(async () => {
  // 1. Reachability basics
  await probe('example.com', 'https://example.com');
  await probe('unsplash', 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=80');
  await probe('upload.wikimedia root', 'https://upload.wikimedia.org/wikipedia/commons/', 'HEAD');

  // 2. API once (may be rate limited) for File:Garlic.jpg
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('titles', 'File:Garlic.jpg');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url');
  url.searchParams.set('iiurlwidth', '800');
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (test)' } });
    console.log(`commons API File:Garlic.jpg -> HTTP ${res.status}`);
    if (res.ok) {
      const j = await res.json();
      const page = Object.values(j.query.pages)[0];
      if (page.imageinfo) {
        const info = page.imageinfo[0];
        console.log(`  API thumburl: ${info.thumburl}`);
        console.log(`  my computed : ${commonsThumbUrl('Garlic.jpg', 800)}`);
        await probe('API thumburl GET', info.thumburl);
      } else {
        console.log('  no imageinfo:', JSON.stringify(page).slice(0, 300));
      }
    } else {
      const t = await res.text();
      console.log('  body:', t.slice(0, 200));
    }
  } catch (err) {
    console.log('commons API: ERROR', err.message);
  }
})();
