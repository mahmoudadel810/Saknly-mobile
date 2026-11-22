// Runs Saknly-server locally for end-to-end tests of the mobile app, fully isolated:
// an in-memory MongoDB, a fake SMTP inbox, no queue, no Cloudinary. Nothing reaches a real service.
//
//   SAKNLY_SERVER_DIR=../Saknly-server node scripts/local-api.mjs
//
// API:   http://127.0.0.1:5055/api/saknly/v1   (PORT)
// Inbox: http://127.0.0.1:5056/mail            (MAIL_PORT) — JSON list of captured emails
import net from 'node:net';
import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const serverDir = path.resolve(process.env.SAKNLY_SERVER_DIR || '../Saknly-server');
const PORT = Number(process.env.PORT || 5055);
const SMTP_PORT = Number(process.env.SMTP_PORT || 2525);
const MAIL_PORT = Number(process.env.MAIL_PORT || 5056);

const fromServer = (rel) => import(pathToFileURL(path.join(serverDir, rel)).href);

// --- fake SMTP: accepts every message and keeps it in memory -------------------------------
const inbox = [];
net
  .createServer((socket) => {
    let data = null;
    const reply = (line) => socket.write(`${line}\r\n`);
    reply('220 local-api fake smtp');
    socket.on('data', (chunk) => {
      for (const line of chunk.toString().split('\r\n')) {
        if (data !== null) {
          if (line === '.') {
            inbox.push({ receivedAt: new Date().toISOString(), raw: data.join('\n') });
            data = null;
            reply('250 queued');
          } else data.push(line.startsWith('..') ? line.slice(1) : line);
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (!line) continue;
        if (cmd === 'EHLO') reply('250-localhost\r\n250 AUTH PLAIN LOGIN');
        else if (cmd === 'HELO') reply('250 localhost');
        else if (cmd === 'AUTH') reply('235 ok');
        else if (cmd === 'DATA') {
          data = [];
          reply('354 go');
        } else if (cmd === 'QUIT') {
          reply('221 bye');
          socket.end();
        } else reply('250 ok');
      }
    });
  })
  .listen(SMTP_PORT, '127.0.0.1');

http
  .createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'DELETE') inbox.length = 0;
    res.end(JSON.stringify(inbox));
  })
  .listen(MAIL_PORT, '127.0.0.1');

// --- isolated environment, set before the server reads it (real env wins over .env files) ---
// Reuse the MongoDB binary the server's own test suite already downloaded.
process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(
  serverDir,
  'node_modules/.cache/mongodb-memory-server',
);
const { MongoMemoryServer } = await fromServer('node_modules/mongodb-memory-server/index.js');
const mongod = await MongoMemoryServer.create();

Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: String(PORT),
  MONGODB_URI: mongod.getUri(),
  DB_NAME: 'saknly-mobile-e2e',
  JWT_SECRET: 'local-api-secret',
  BEARER_KEY: 'Saknly__',
  CLIENT_URL: 'http://localhost:3000',
  RABBITMQ_URL: '',
  EMAIL_SERVICE: '',
  EMAIL_SMTP_HOST: '127.0.0.1',
  EMAIL_SMTP_PORT: String(SMTP_PORT),
  EMAIL_SMTP_USER: 'local',
  EMAIL_SMTP_PASS: 'local',
  EMAIL_FROM: '"Saknly" <no-reply@saknly.local>',
  CLOUDINARY_CLOUD_NAME: '',
  CLOUDINARY_API_KEY: '',
  CLOUDINARY_API_SECRET: '',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GEMINI_API_KEY: '',
});
delete process.env.VERCEL;

const { default: initiateApp } = await fromServer('utils/App/initiateApp.js');
const { default: routes } = await fromServer('modules/indexRouters.js');
initiateApp(routes).startServer();

console.log(
  `local-api ready  api=http://127.0.0.1:${PORT}/api/saknly/v1  inbox=http://127.0.0.1:${MAIL_PORT}/mail`,
);

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
