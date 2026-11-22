// Runs Saknly-server locally for end-to-end tests of the mobile app, fully isolated:
// an in-memory MongoDB, a fake SMTP inbox, a fake Cloudinary, no queue. Nothing reaches a real service.
//
//   SAKNLY_SERVER_DIR=../Saknly-server node scripts/local-api.mjs
//
// API:   http://127.0.0.1:5055/api/saknly/v1   (PORT)
// Inbox: http://127.0.0.1:5056/mail            (MAIL_PORT) — JSON list of captured emails
// Media: http://127.0.0.1:5057/uploads         (MEDIA_PORT) — uploaded and deleted photo ids
// Data:  the server seed script (demo users, agencies, listings, comments, testimonials).
//        Demo logins: <name>@saknly.example.com / LocalDemo1!, admin@saknly.example.com / LocalAdmin1!
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const serverDir = path.resolve(process.env.SAKNLY_SERVER_DIR || '../Saknly-server');
const PORT = Number(process.env.PORT || 5055);
const SMTP_PORT = Number(process.env.SMTP_PORT || 2525);
const MAIL_PORT = Number(process.env.MAIL_PORT || 5056);
const MEDIA_PORT = Number(process.env.MEDIA_PORT || 5057);
// Host in the image URLs the fake Cloudinary hands out: 10.0.2.2 for the Android emulator.
const MEDIA_HOST = process.env.MEDIA_HOST || '127.0.0.1';

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

// --- fake Cloudinary: the server's SDK uploads here (CLOUDINARY_URL upload_prefix below) ----
// Stores each uploaded file in memory and serves it back, so listings with photos work locally.
const media = new Map(); // publicId -> { type, bytes }
const deletedMedia = [];
let mediaCount = 0;

/** The bytes and type of the multipart field named "file". */
const multipartFile = (body, contentType) => {
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType ?? '');
  if (!boundary) return null;
  const delimiter = Buffer.from(`--${boundary[1] ?? boundary[2]}`);
  let start = body.indexOf(delimiter);
  while (start !== -1) {
    const next = body.indexOf(delimiter, start + delimiter.length);
    if (next === -1) break;
    const part = body.subarray(start + delimiter.length + 2, next - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    const headers = part.subarray(0, headerEnd).toString();
    if (/name="file"/.test(headers)) {
      const type = /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1] ?? 'image/jpeg';
      return { type, bytes: Buffer.from(part.subarray(headerEnd + 4)) };
    }
    start = next;
  }
  return null;
};

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });

http
  .createServer(async (req, res) => {
    const body = await readBody(req);
    const json = (status, value) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(value));
    };
    const url = new URL(req.url, 'http://local');

    if (req.method === 'GET' && url.pathname.startsWith('/media/')) {
      const item = media.get(decodeURIComponent(url.pathname.slice('/media/'.length)));
      if (!item) return json(404, { error: 'not found' });
      // The SDK sends application/octet-stream; the server always uploads JPEG (or GIF).
      res.writeHead(200, {
        'Content-Type': item.type.startsWith('image/') ? item.type : 'image/jpeg',
      });
      return res.end(item.bytes);
    }
    if (req.method === 'GET' && url.pathname === '/uploads') {
      return json(200, { stored: [...media.keys()], deleted: deletedMedia });
    }
    // /v1_1/<cloud>/<resource type>/upload
    if (req.method === 'POST' && /\/upload$/.test(url.pathname)) {
      const file = multipartFile(body, req.headers['content-type']);
      if (!file) return json(400, { error: { message: 'no file' } });
      const publicId = `saknly/local-${++mediaCount}`;
      media.set(publicId, file);
      return json(200, {
        public_id: publicId,
        secure_url: `http://${MEDIA_HOST}:${MEDIA_PORT}/media/${encodeURIComponent(publicId)}`,
        resource_type: 'image',
        format: 'jpg',
        bytes: file.bytes.length,
        width: 800,
        height: 600,
      });
    }
    // destroy (one) and delete_resources (batch)
    const params = new URLSearchParams(body.toString());
    const ids = [
      ...params.getAll('public_id'),
      ...params.getAll('public_ids[]'),
      ...url.searchParams.getAll('public_ids[]'),
    ];
    for (const id of ids) {
      if (media.delete(id) || !deletedMedia.includes(id)) deletedMedia.push(id);
    }
    if (/\/destroy$/.test(url.pathname)) return json(200, { result: 'ok' });
    if (/\/resources\//.test(url.pathname)) {
      return json(200, { deleted: Object.fromEntries(ids.map((id) => [id, 'deleted'])) });
    }
    return json(200, {});
  })
  .listen(MEDIA_PORT, '0.0.0.0');

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
  // The SDK reads upload_prefix from CLOUDINARY_URL when it loads: uploads go to the fake above.
  CLOUDINARY_URL: `cloudinary://local:local@localcloud?upload_prefix=http://127.0.0.1:${MEDIA_PORT}`,
  CLOUDINARY_CLOUD_NAME: 'localcloud',
  CLOUDINARY_API_KEY: 'local',
  CLOUDINARY_API_SECRET: 'local',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GEMINI_API_KEY: '',
});
delete process.env.VERCEL;

// The server's logger writes ./logs; keep that out of this repo.
process.chdir(mkdtempSync(path.join(tmpdir(), 'saknly-local-api-')));

// Demo listings, agencies, comments and testimonials from the server's own seed script.
// Async on purpose: a blocking spawn stops this process from draining mongod's output, and mongod stalls.
const seedOutput = [];
const seedCode = await new Promise((resolve) => {
  const child = spawn(process.execPath, [path.join(serverDir, 'utils/seed.js')], {
    env: { ...process.env, SEED_ADMIN_PASSWORD: 'LocalAdmin1!', SEED_DEMO_PASSWORD: 'LocalDemo1!' },
  });
  child.stdout.on('data', (chunk) => seedOutput.push(chunk));
  child.stderr.on('data', (chunk) => seedOutput.push(chunk));
  child.on('exit', resolve);
});
if (seedCode !== 0) {
  console.error(Buffer.concat(seedOutput).toString());
  throw new Error('seeding the local database failed');
}

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
