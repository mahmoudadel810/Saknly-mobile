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

`scripts/local-api.mjs` starts Saknly-server from `../Saknly-server` (override with `SAKNLY_SERVER_DIR`) with an in-memory MongoDB and a fake email inbox, so nothing reaches a real database or mailbox. It needs `npm install` in Saknly-server first.

```bash
npm run local-api                                                        # terminal 1
EXPO_PUBLIC_API_URL=http://127.0.0.1:5055/api/saknly/v1 npm run test:e2e  # terminal 2
```

The e2e suite runs the app's own auth code through the whole flow: register, confirm by the emailed link, log in, restore after restart, refresh, log out (token revoked), and reset the password with the emailed code. Captured emails are at `http://127.0.0.1:5056/mail`.

## Builds (Expo Services / EAS)

Profiles are in `eas.json`: `development` (dev client APK), `preview` (installable APK), `production` (store build).

```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # links the project to your Expo account (once)
npx eas-cli@latest build --profile preview --platform android
```

iOS builds run in the cloud too. They need an Apple Developer account.
