# Builds the Nexconn write-up PDF. Usage: python3 mkpdf.py out.pdf screenshot.png
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, KeepTogether
out = sys.argv[1] if len(sys.argv) > 1 else 'Pollroom-writeup.pdf'
shot = sys.argv[2] if len(sys.argv) > 2 else 'shot.png'
ss = getSampleStyleSheet(); B = ss['BodyText']; B.leading = 15
d = SimpleDocTemplate(out, pagesize=A4, leftMargin=50, rightMargin=50, topMargin=50, bottomMargin=50, title='Pollroom - Nexconn Build Challenge write-up', author='Arjun Vinod')
S = []
def P(t, s=B): S.append(Paragraph(t, s)); S.append(Spacer(1, 6))
C = lambda t: '<font face="Courier">' + t + '</font>'
P('Pollroom: live polls inside a chat room', ss['Title'])
P('Nexconn Build Challenge entry by Arjun Vinod (solo). Built on the Nexconn Chat SDK for Web, Chat Plan (free).')
P('<b>Live app:</b> https://pollroom.arjun-vinod0028.workers.dev<br/><b>Source (MIT):</b> https://github.com/ArjunAJ7/pollroom<br/><b>App Key:</b> m7ua80gbmci3m (Singapore data center)')
P('What it is', ss['Heading2'])
P('Pollroom is a chat room where any message can become a poll. Type ' + C('/poll Lunch? | Pizza | Ramen | Salad') + ' and every person in the room sees a poll card. Tap an option and the totals update live on every screen. Plain text works as normal chat. Open ' + C('/?room=my-room') + ' for a private room. Two browser windows side by side show the sync in the demo video.')
P('How it uses the Nexconn Chat SDK', ss['Heading2'])
for t in ['<b>Open channel.</b> Everyone joins one open channel (the public lobby ' + C('pollroom-lobby') + ' or a private room) with ' + C('OpenChannel.enterChannel') + '. History is loaded through ' + C('createOpenChannelMessagesQuery') + ' so late joiners see current totals.',
 '<b>Messages as the data layer.</b> A poll is a text message that starts with ' + C('/poll') + '. A vote is a text message ' + C('/vote &lt;pollMessageId&gt; &lt;n&gt;') + '. Each client tallies votes from the message stream: one vote per user, latest vote wins. There is no extra database; the channel history is the source of truth.',
 '<b>Real-time delivery.</b> ' + C('MessageHandler.onMessageReceived') + ' feeds new poll and vote messages into the same reducer. ' + C('ConnectionStatusHandler') + ' drives the status line.',
 '<b>Server side.</b> A small Cloudflare Worker holds the App Secret as a secret binding. For each visitor it creates the open channel if needed (' + C('/v4/open-channel/create') + ') and issues an access token (' + C('/v4/auth/access-token/issue') + ') using the SHA1 signature of secret + nonce + timestamp. The secret never reaches the browser.']:
    S.append(Paragraph(t, B)); S.append(Spacer(1, 4))
S.append(KeepTogether([Paragraph('Screenshot from a real run', ss['Heading2']), Image(shot, width=480, height=270), Spacer(1, 6),
  Paragraph('Two windows are two separate users in one room. Both show the same totals after votes from each side (one user changed their vote, so Pizza and Ramen show one each).', B), Spacer(1, 6)]))
P('Build notes and limits', ss['Heading2'])
P('The app was written for this challenge with AI coding assistance and tested end to end with two live clients against the real Nexconn service. The room is public and anonymous with random guest IDs. Open channels are set to auto-destroy after seven days of inactivity and the Worker recreates the channel on the next visit. There is no moderation or rate limiting beyond Nexconn defaults, and the Call SDK is not used.')
P('Contact: Arjun Vinod, arjun.vinod0028@gmail.com, GitHub ArjunAJ7.')
d.build(S)
