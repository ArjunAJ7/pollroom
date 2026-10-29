// Records a real two-window Pollroom demo (two separate guest users) into a fresh private room.
// Needs: Xvfb, ffmpeg, google-chrome, `npm i puppeteer-core`. No secrets used.
import puppeteer from 'puppeteer-core';
import { spawn, execSync } from 'child_process';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const room = 'demo-' + Math.random().toString(36).slice(2, 8);
const URL = 'https://pollroom.arjun-vinod0028.workers.dev/?room=' + room;
const OUT = process.argv[2] || 'pollroom-demo.mp4';
const D = ':99';
const xvfb = spawn('Xvfb', [D, '-screen', '0', '1280x720x24'], { stdio: 'ignore' }); await sleep(1500);
process.env.DISPLAY = D;
async function win(x) {
  const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: false, defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'], userDataDir: '/tmp/prof' + x,
    args: ['--no-sandbox', '--app=' + URL, `--window-position=${x},0`, '--window-size=640,720', '--no-first-run', '--test-type', '--disable-infobars', '--user-data-dir=/tmp/prof' + x] });
  await sleep(1500); const p = (await b.pages())[0]; return { b, p };
}
const A = await win(0), B = await win(640);
await sleep(7000);
const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'x11grab', '-framerate', '15', '-video_size', '1280x720', '-i', D, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
await sleep(1500);
async function say(w, t) { await w.p.click('input, textarea'); await w.p.keyboard.type(t, { delay: 45 }); await w.p.keyboard.press('Enter'); await sleep(2200); }
async function vote(w, label) { await w.p.evaluate(l => { const el = [...document.querySelectorAll('button, .opt, [data-opt], div')].filter(e => e.children.length < 4 && e.textContent.trim().startsWith(l)).pop(); el && el.click(); }, label); await sleep(2200); }
await say(A, 'hi, anyone up for lunch?');
await say(B, 'yes! where?');
await say(A, '/poll Lunch today? | Pizza | Ramen | Salad');
await vote(B, 'Ramen');
await vote(A, 'Ramen');
await say(B, 'ramen it is');
await vote(A, 'Pizza');
await sleep(2500);
await A.p.screenshot({ path: 'shotA.png' });
ff.stdin.write('q'); await sleep(2500);
await A.b.close(); await B.b.close(); xvfb.kill();
console.log('room', room, 'saved', OUT);
