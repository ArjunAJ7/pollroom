// Pollroom: live polls in a Nexconn Chat SDK open channel.
// The Worker serves the page, and signs Nexconn server API calls so the App Secret never reaches the browser.
const APP_KEY = "m7ua80gbmci3m";
const API = "https://api.sg-light-api.com";
const ROOM = "pollroom-lobby";
const PAGE = __PAGE__;
const APPJS = __APPJS__;

async function sha1hex(s) {
  const b = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function nx(path, body, env) {
  const nonce = String(Math.floor(Math.random() * 1e9));
  const ts = String(Date.now());
  const sig = await sha1hex(env.NX_SECRET + nonce + ts);
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "App-Key": APP_KEY, Nonce: nonce, Timestamp: ts, Signature: sig, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json().catch(() => ({ code: -1 }));
}
let roomReady = 0;
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/") return new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
    if (u.pathname === "/app.js") return new Response(APPJS, { headers: { "content-type": "application/javascript; charset=utf-8", "cache-control": "public, max-age=300" } });
    if (u.pathname === "/api/session") {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      const userId = "u" + [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
      if (Date.now() - roomReady > 3600e3) {
        // create the open channel if it does not exist yet (an "already exists" reply is fine)
        await nx("/v4/open-channel/create", { channelId: ROOM, destroyType: 0, ttlMinutes: 10080 }, env);
        roomReady = Date.now();
      }
      const t = await nx("/v4/auth/access-token/issue", { userId, name: "guest " + userId.slice(1, 5) }, env);
      if (t.code !== 0) return Response.json({ error: "token failed", code: t.code }, { status: 502 });
      return Response.json({ appKey: APP_KEY, userId, token: t.result.accessToken }, { headers: { "cache-control": "no-store" } });
    }
    return new Response("Not found", { status: 404 });
  },
};
