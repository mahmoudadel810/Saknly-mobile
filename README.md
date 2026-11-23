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

`src/__e2e__/google.e2e.test.ts` needs the server's `POST /auth/google/mobile`, so Saknly-server must be on a branch that has it (`feat/google-mobile-sign-in`, or `main` once merged); on an older server those tests fail with 404.

The auth e2e suite runs the app's own auth code through the whole flow: register, confirm by the emailed link, log in, restore after restart, refresh, log out (token revoked), and reset the password with the emailed code. Captured emails are at `http://127.0.0.1:5056/mail`.

## Google sign-in

"Continue with Google" appears on the sign-in and register screens once `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set; without it the app looks and behaves as before (and still runs in Expo Go, because the native Google module is only loaded when the button is used). With it set, the app needs a **development build**: Expo Go doesn't contain the native module.

How it works: the phone signs in with Google and gets an ID token; the app sends it to `POST /auth/google/mobile` on the server, which verifies it and answers like `/auth/login`. A Google email that already belongs to a password account is refused (the app says to sign in with the password), as on the website.

Set up (done 2026-11-23, see "Current setup" for what exists):

1. **Server:** `POST /auth/google/mobile` is deployed. It accepts ID tokens whose audience is the server's `GOOGLE_CLIENT_ID` or any ID in `GOOGLE_MOBILE_CLIENT_IDS` (comma separated). It does not need a client secret.
2. **Google Cloud:** the app's ID tokens are issued for a **web** OAuth client; the **Android** client (package `com.saknly.mobile` + the SHA-1 of the signing key) must be in the _same_ Google project. The consent screen must be **In production**, or only the listed test users can sign in. A wrong or missing SHA-1 shows up as a cancelled sign-in, not as an error.
3. **App:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is the web client's ID. It is set in every profile of `eas.json` (EAS doesn't read your local `.env`); for `npm start` put it in `.env`. A **development build** is needed, not Expo Go.
4. **Store builds:** when you publish to Google Play, add the **Play App Signing** SHA-1 (Play Console, Release, Setup, App signing) as another Android client in the same project, or sign-in fails for store installs.
5. **iOS, later:** create an iOS OAuth client, then add `["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.<id>" }]` to the plugins in `app.json` (the plugin refuses to build without it, which is why it isn't there yet; Android needs no plugin without Firebase).

### Current setup

- Google Cloud project **Saknly** (`saknly-463408`): consent screen **In production**; web client "Saknly" (`431560128258-uo934sf…`) is the one the app uses; Android client "Saknly Android" with the Expo-generated keystore's SHA-1.
- The website's own Google login uses a **different** Google project (client `964610251855-…`, set as `GOOGLE_CLIENT_ID` on Vercel). It was left alone. The Saknly web client is added to the server as `GOOGLE_MOBILE_CLIENT_IDS`.
- Expo project `@mahmoudadel810/saknly-mobile`; the Android keystore is stored on Expo's servers.

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
