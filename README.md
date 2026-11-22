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

## Builds (Expo Services / EAS)

Profiles are in `eas.json`: `development` (dev client APK), `preview` (installable APK), `production` (store build).

```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # links the project to your Expo account (once)
npx eas-cli@latest build --profile preview --platform android
```

iOS builds run in the cloud too. They need an Apple Developer account.
