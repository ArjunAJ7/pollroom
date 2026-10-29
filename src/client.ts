import { NCEngine, OpenChannel, SendTextMessageParams, MessageHandler, ConnectionStatusHandler } from '@nexconn/chat';

const $ = (id: string) => document.getElementById(id)!;
let ROOM = 'pollroom-lobby'; // the Worker picks the room: default lobby, or a private room via ?room=name
type Poll = { id: string; q: string; opts: string[]; by: string; votes: Map<string, number> };
const polls = new Map<string, Poll>();
const order: string[] = [];
const seen = new Set<string>();
let me = '';

function esc(s: string) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)); }
function short(u: string) { return u.slice(0, 6); }

function render() {
  const feed = $('feed');
  feed.innerHTML = '';
  for (const e of log) {
    const d = document.createElement('div');
    if (e.kind === 'chat') {
      d.className = 'msg' + (e.by === me ? ' mine' : '');
      d.innerHTML = `<b>${esc(short(e.by))}</b> ${esc(e.text)}`;
    } else {
      const p = polls.get(e.id)!;
      const total = [...p.votes.values()].length;
      const counts = p.opts.map((_, i) => [...p.votes.values()].filter(v => v === i).length);
      const mine = p.votes.get(me);
      d.className = 'poll';
      d.innerHTML = `<div class="q">${esc(p.q)}</div><div class="by">poll by ${esc(short(p.by))} · ${total} vote${total === 1 ? '' : 's'}</div>` +
        p.opts.map((o, i) => {
          const pct = total ? Math.round(100 * counts[i] / total) : 0;
          return `<button data-p="${esc(p.id)}" data-i="${i}" class="opt${mine === i ? ' sel' : ''}"><span class="bar" style="width:${pct}%"></span><span class="lab">${esc(o)}</span><span class="n">${counts[i]}</span></button>`;
        }).join('');
    }
    feed.appendChild(d);
  }
  feed.scrollTop = feed.scrollHeight;
}
type Entry = { kind: 'chat'; by: string; text: string } | { kind: 'poll'; id: string };
const log: Entry[] = [];

function ingest(m: any) {
  if (seen.has(m.messageId)) return;
  seen.add(m.messageId);
  const text: string = m.content?.text ?? '';
  const by: string = m.senderUserId;
  if (text.startsWith('/poll ')) {
    const parts = text.slice(6).split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3 && parts.length <= 7) {
      polls.set(m.messageId, { id: m.messageId, q: parts[0], opts: parts.slice(1), by, votes: new Map() });
      log.push({ kind: 'poll', id: m.messageId });
    }
  } else if (text.startsWith('/vote ')) {
    const [, pid, idx] = text.split(' ');
    const p = polls.get(pid); const i = Number(idx);
    if (p && Number.isInteger(i) && i >= 0 && i < p.opts.length) p.votes.set(by, i);
  } else if (text.trim()) {
    log.push({ kind: 'chat', by, text: text.slice(0, 500) });
  }
}

let channel: OpenChannel;
async function send(text: string) {
  const r = await channel.sendMessage(new SendTextMessageParams({ text }));
  if (!r.isOk) { $('status').textContent = 'send failed (' + r.code + ')'; return; }
  const m: any = r.data; if (m) { ingest(m); render(); }
}

async function main() {
  $('status').textContent = 'connecting…';
  const s = await (await fetch('/api/session' + location.search)).json();
  me = s.userId;
  NCEngine.initialize({ appKey: s.appKey });
  NCEngine.addConnectionStatusHandler('h', new ConnectionStatusHandler({
    onConnectionStatusChanged({ status }: any) { $('status').textContent = 'status: ' + status; }
  } as any));
  NCEngine.addMessageHandler('h', new MessageHandler({
    onMessageReceived({ messages }: any) {
      for (const m of messages) if (m.channelIdentifier?.channelId === ROOM) ingest(m);
      render();
    }
  } as any));
  if (s.room) ROOM = s.room;
  const c = await NCEngine.connect({ token: s.token });
  if (!c.isOk) { $('status').textContent = 'connect failed (' + c.code + ')'; return; }
  channel = new OpenChannel(ROOM);
  const e = await channel.enterChannel({ messageCount: 50 });
  if (!e.isOk) { $('status').textContent = 'join failed (' + e.code + ')'; return; }
  $('status').textContent = 'you are ' + short(me) + ' · live in #' + ROOM.replace(/^pr-/, '');
  try {
    const q = OpenChannel.createOpenChannelMessagesQuery({ channelId: ROOM, pageSize: 50 } as any);
    const pg: any = await q.loadNextPage();
    const arr: any[] = pg?.data?.data ?? [];
    arr.sort((a, b) => a.sentTime - b.sentTime).forEach(ingest); render();
  } catch (_) {}
  ($('form') as HTMLFormElement).onsubmit = ev => {
    ev.preventDefault();
    const i = $('inp') as HTMLInputElement; const t = i.value.trim(); if (!t) return; i.value = ''; send(t);
  };
  $('feed').onclick = ev => {
    const b = (ev.target as HTMLElement).closest('button.opt') as HTMLElement | null;
    if (b) send(`/vote ${b.dataset.p} ${b.dataset.i}`);
  };
}
main();
