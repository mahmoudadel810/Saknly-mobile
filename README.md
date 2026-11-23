# Saknly Mobile

The Android and iOS app for Saknly, built with Expo and React Native. It uses the same API as the web app ([Saknly-client](https://github.com/mahmoudadel810/Saknly-client)) and the server ([Saknly-server](https://github.com/mahmoudadel810/Saknly-server)): `/api/saknly/v1`.

The full plan is in [docs/PLAN.md](docs/PLAN.md).

## Stack

Expo SDK 58, Expo Router (screens in `src/app/`), TypeScript, NativeWind (Tailwind with the web app's design tokens), Jest + Testing Library, ESLint + Prettier.

## Getting started

```bash
npm install
cp .env.example .env   # pick the API URL
npx expo start
```

Press `a` for the Android emulator, or scan the QR code with a development build on your phone.

To use a **local** Saknly-server, set `EXPO_PUBLIC_API_URL` in `.env`:

- Android emulator: `http://10.0.2.2:<PORT>/api/saknly/v1` (the emulator can't reach `localhost`)
- Physical phone: `http://<your-LAN-IP>:<PORT>/api/saknly/v1`

`EXPO_PUBLIC_TOKEN_PREFIX` must match the server's `BEARER_KEY` (default `Saknly__`). Requests send `Authorization: Saknly__<token>`.

## Scripts

| Command                  | What it does                                                 |
| ------------------------ | ------------------------------------------------------------ |
| `npm start`              | Start the dev server                                         |
| `npm run lint`           | ESLint + Prettier check                                      |
| `npm run type-check`     | `tsc --noEmit`                                               |
| `npm test`               | Jest unit tests                                              |
| `npm run format`         | Format everything with Prettier                              |
| `npm run export:android` | Bundle the Android JS (what CI runs to prove the app builds) |
| `npm run local-api`      | Run Saknly-server locally, isolated (see below)              |
| `npm run test:e2e`       | End-to-end tests against the local API                       |

## End-to-end tests against a real server

`scripts/local-api.mjs` starts Saknly-server from `../Saknly-server` (override with `SAKNLY_SERVER_DIR`) with an in-memory MongoDB, a fake email inbox and a fake Cloudinary (uploaded photos are kept in memory and served at `http://127.0.0.1:5057/media/…`), so nothing reaches a real database, mailbox or Cloudinary account. It fills the database with the server's own seed script (demo listings, agencies, comments, testimonials; demo logins `<name>@saknly.example.com` / `LocalDemo1!`). It needs `npm install` in Saknly-server first.

To try the app against it from the Android emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:5055/api/saknly/v1` in `.env`, and start the server with `MEDIA_HOST=10.0.2.2 npm run local-api` so uploaded photos load on the emulator.

```bash
npm run local-api                                                        # terminal 1
EXPO_PUBLIC_API_URL=http://127.0.0.1:5055/api/saknly/v1 npm run test:e2e  # terminal 2
```

The auth e2e suite runs the app's own auth code through the whole flow: register, confirm by the emailed link, log in, restore after restart, refresh, log out (token revoked), and reset the password with the emailed code. Captured emails are at `http://127.0.0.1:5056/mail`.

## Device flows (Maestro)

`.maestro/` holds three flows (sign in and favorite, browse signed out, ask the assistant). They drive the app by its on-screen text, so they need an **English** device or emulator, and they sign in as a seeded demo user, so run them against the local API, never the deployed one.

```bash
MEDIA_HOST=10.0.2.2 npm run local-api    # terminal 1
# .env: EXPO_PUBLIC_API_URL=http://10.0.2.2:5055/api/saknly/v1, then build/install the app on the emulator
maestro test .maestro                    # terminal 2 (https://maestro.mobile.dev)
```

`npm test` includes a check that every label the flows tap or assert still exists in the English strings. The flows themselves have **not been run yet** (no emulator on the machine they were written on). Register, email confirmation and photo upload are not in the flows: the first two need a real inbox, and picking photos needs images on the device.

## Builds (Expo Services / EAS)

Profiles are in `eas.json`: `development` (dev client APK), `preview` (installable APK), `production` (store build).

```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # links the project to your Expo account (once)
npx eas-cli@latest build --profile preview --platform android
```

iOS builds run in the cloud too. They need an Apple Developer account.
