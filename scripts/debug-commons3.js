const crypto = require('node:crypto');
function commonsThumbUrl(filename, width) {
  const md5 = crypto.createHash('md5').update(filename).digest('hex');
  const enc = encodeURIComponent(filename);
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${md5[0]}/${md5.slice(0, 2)}/${enc}/${width}px-${enc}`;
}

const files = ['Garlic.jpg', 'Onions.jpg', 'Potatoes.jpg', 'Apple.jpg', 'Tomatoes.jpg', 'Cucumber.jpg'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(label, url, headers) {
  try {
    const res = await fetch(url, { headers, redirect: 'follow' });
    let extra = '';
    if (res.ok) {
      const buf = await res.arrayBuffer();
      extra = ` bytes=${buf.byteLength}`;
    }
    console.log(`${label}: ${res.status}${extra}`);
  } catch (err) {
    console.log(`${label}: ERROR ${err.message}`);
  }
}

(async () => {
  for (const f of files) {
    const u = commonsThumbUrl(f, 960);
    console.log(`\n== ${f} -> ${u}`);
    await probe('  plain', u, { 'User-Agent': 'test-agent/1.0' });
    await sleep(200);
    await probe('  range', u, { 'User-Agent': 'test-agent/1.0', Range: 'bytes=0-0' });
    await sleep(300);
  }
})();
