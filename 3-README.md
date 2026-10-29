# Pollroom

A live chat room where anyone can drop a poll and watch votes land in real time. Built for the Nexconn Build Challenge on the Nexconn Chat SDK (Chat Plan, free tier).

**Live demo:** https://pollroom.arjun-vinod0028.workers.dev

## How it works

- Everyone joins one Nexconn **open channel** (`pollroom-lobby`) through `@nexconn/chat`.
- Type `/poll Question | Option A | Option B` (2 to 6 options) to post a poll. Normal text is normal chat.
- Clicking an option sends a `/vote <pollMessageId> <n>` message. Every client tallies votes from the message stream, one vote per user, latest vote wins. There is no extra backend state: the channel history is the source of truth, so a late joiner sees the same totals after history loads.
- A small Cloudflare Worker serves the page and holds the App Secret. For each visitor it creates the open channel if needed and issues an access token through the Nexconn server API (`/v4/auth/access-token/issue`, SHA1 signature of secret + nonce + timestamp). The secret never reaches the browser.

## Files

- `src/client.ts` browser app (Chat SDK: `NCEngine`, `OpenChannel`, `MessageHandler`)
- `src/page.html` page and styles
- `worker.tpl.js` Worker template; `build.mjs` bundles everything into `worker.js` (the deployed file)

## Run it yourself

1. Create a Nexconn app (free Chat Plan) and note the App Key and App Secret.
2. Put your App Key and your data center API host in `worker.tpl.js`.
3. `npm install && npm run build`, then deploy `worker.js` as a Cloudflare Worker with a secret binding named `NX_SECRET` holding your App Secret.

## Private rooms

Open `/?room=my-room` (3 to 32 lowercase letters, digits or dashes) for a separate room with its own history. Without the parameter you join the public lobby.

## Demo tooling

`demo-record.mjs` records the two-window demo (Xvfb + ffmpeg + puppeteer-core, a fresh private room, real interaction) and `demo-mkpdf.py` builds the write-up PDF. Neither contains any secret.

## Limits and notes

- The demo room is public and anonymous: visitors get random guest IDs. Messages are visible to everyone in the room.
- Open channels auto-destroy after inactivity (set to 7 days of inactivity); the Worker recreates the channel on the next visit.
- No user accounts, moderation or rate limiting beyond what Nexconn provides. It is a small demo.

MIT licensed.
