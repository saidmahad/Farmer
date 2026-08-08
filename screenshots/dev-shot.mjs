// Dev-only screenshot helper: drives headless Chrome over CDP to
// capture the four pages of the app (incl. authenticated views).
// Requires the app server already running on :3000. Not part of the app.
import { spawn } from 'child_process';
import fs from 'fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CDP = 'http://127.0.0.1:9222';
const OUT = 'C:/agri-advisor/screenshots';
const PROFILE = 'C:/agri-advisor/.chrome-profile';
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=9222',
  '--user-data-dir=' + PROFILE,
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForCdp() {
  for (let i = 0; i < 80; i++) {
    try { const r = await fetch(CDP + '/json/version'); if (r.ok) return; } catch {}
    await sleep(250);
  }
  throw new Error('CDP not reachable');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = new Map();
    const send = (method, params = {}) => new Promise((res, rej) => {
      const mid = ++id;
      pending.set(mid, { res, rej });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    ws.onopen = () => resolve({ ws, send });
    ws.onerror = (e) => reject(e);
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      }
    };
  });
}

(async () => {
  await waitForCdp();

  // Fresh login so the token is valid.
  const login = await fetch('http://localhost:3000/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'screenshottest@example.com', password: 'password123' })
  });
  if (!login.ok) throw new Error('login failed');
  const auth = await login.json();
  const token = auth.token;
  const userJson = JSON.stringify(auth.user);

  let pageInfo;
  try {
    pageInfo = await fetch(CDP + '/json/new?' + encodeURIComponent('about:blank'), { method: 'PUT' }).then(r => r.json());
  } catch {
    pageInfo = await fetch(CDP + '/json/new?' + encodeURIComponent('about:blank')).then(r => r.json());
  }

  const { ws, send } = await connect(pageInfo.webSocketDebuggerUrl);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

  const shot = async (name) => {
    await sleep(1700);
    const { data } = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: true });
    fs.writeFileSync(OUT + '/' + name + '.png', Buffer.from(data, 'base64'));
    console.log('saved', name);
  };
  const nav = async (url) => { await send('Page.navigate', { url }); await sleep(900); };

  await nav('http://localhost:3000/index.html'); await shot('1-signin');
  await nav('http://localhost:3000/register.html'); await shot('2-signup');

  // Establish origin, then seed the stored session for the authed pages.
  await nav('http://localhost:3000/index.html');
  await sleep(300);
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('agri_advisor_token', ${JSON.stringify(token)}); localStorage.setItem('agri_advisor_user', ${JSON.stringify(userJson)});`
  });
  await nav('http://localhost:3000/crops.html'); await shot('3-crops');
  await nav('http://localhost:3000/advice.html?crop_id=1'); await shot('4-advice');

  ws.close();
  chrome.kill();
  console.log('done');
})().catch((e) => { console.error('ERR', e); chrome.kill(); process.exit(1); });