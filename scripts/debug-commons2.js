const crypto = require('node:crypto');

function commonsThumbUrl(filename, width) {
  const md5 = crypto.createHash('md5').update(filename).digest('hex');
  const enc = encodeURIComponent(filename);
  return (
    `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${enc}/` +
    `${width}px-${enc}`
  );
}

const url = commonsThumbUrl('Garlic.jpg', 800);
console.log('URL:', url);

async function probe(label, headers, method = 'GET') {
  try {
    const res = await fetch(url, { method, headers, redirect: 'follow' });
    console.log(`${label}: status=${res.status} ${res.statusText}`);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      console.log(`   bytes: ${buf.byteLength}`);
    }
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`);
  }
}

(async () => {
  await probe('plain GET, UA', { 'User-Agent': 'Mozilla/5.0 (test)' });
  await probe('GET + Range 0-0', { 'User-Agent': 'Mozilla/5.0 (test)', Range: 'bytes=0-0' });
  await probe('GET + API query', {
    'User-Agent': 'Mozilla/5.0 (test)',
  }, 'GET', );
  const withQ = url + '?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail';
  const r2 = await fetch(withQ, { headers: { 'User-Agent': 'Mozilla/5.0 (test)' } });
  console.log(`GET + query string: status=${r2.status}`);
})();
