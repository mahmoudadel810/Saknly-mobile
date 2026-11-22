# Saknly Mobile: React Native plan

**Goal:** a new repo, `Saknly-mobile`: an Android and iOS app built with React Native (Expo). It talks to the existing Saknly API at `/api/saknly/v1`. The app should do everything the web app does, and the server stays as it is (one possible exception, see Decision 1).

**What this plan is based on:** `~/Desktop/Mahmoud-Repositories/Saknly-server` and `Saknly-client`, both on `main`. The copy in `~/Desktop/Projects/Coding/ITI/Saknly` was not checked.

---

## 1. Facts from the server that shape the app

| Topic              | What the server does                                                                                                                                           | What it means for mobile                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL           | Web default is `https://saknly-server-9air.vercel.app/api/saknly/v1`                                                                                           | Set it with `EXPO_PUBLIC_API_URL`. The Android emulator reaches the local machine at `http://10.0.2.2:<port>`, not `localhost`                                                                                          |
| Auth header        | `Authorization: Saknly__<jwt>`. The prefix comes from `BEARER_KEY` and is not `Bearer `                                                                        | Set the prefix with `EXPO_PUBLIC_TOKEN_PREFIX`, default `Saknly__`                                                                                                                                                      |
| Token              | One JWT that lasts `JWT_EXPIRES_IN` (default `1d`). There is no separate refresh token. `POST /auth/refresh-token` swaps a **still-valid** token for a new one | Keep the token in `expo-secure-store`. Refresh it when the app returns to the foreground or the token is under 6 h from expiry. Once it has expired, send the user to login                                             |
| Logout             | `POST /auth/logout` with the auth header. The server rejects tokens issued before `lastLogoutAt`                                                               | Call it, then clear secure storage                                                                                                                                                                                      |
| CORS               | Requests with no `Origin` header are allowed                                                                                                                   | Native requests work without any server change                                                                                                                                                                          |
| Uploads            | multer + Cloudinary, image types only, **4 MB per file, 8 files max, and Vercel caps the whole request at about 4.5 MB**                                       | Resize and convert every photo to JPEG on the phone (`expo-image-manipulator`, about 1600 px wide, quality 0.7, so roughly 300–500 KB each). Keep the _total_ under 4 MB. HEIC photos straight from an iPhone will fail |
| Add property       | `POST /properties/addProperty`, accepts any file field name (`uploader.any()`)                                                                                 | Send `FormData` with `{ uri, name, type }` file entries. Use the same field names as the web form                                                                                                                       |
| Update property    | `PUT /properties/updateProperty/:id`, field `newImages`, max 8                                                                                                 | Same as above                                                                                                                                                                                                           |
| Forgot password    | `POST /auth/forgot-password` emails a **code**, then `POST /auth/reset-password` takes `{ email, code, ... }`                                                  | Done entirely in the app, no deep link needed                                                                                                                                                                           |
| Email confirmation | The email links to the **web** page `confirm-email/:token`                                                                                                     | After registering, the app shows a "check your email" screen with a resend button (`/auth/resend-confirmation`). Confirming in the browser works as is. A deep link back to the app is optional                         |
| Google sign-in     | `/auth/google/callback` always redirects to `${CLIENT_URL}/login/success?token=`                                                                               | **Does not work on mobile without a server change**, see Decision 1                                                                                                                                                     |
| Messages           | Server errors and chatbot replies are in Arabic                                                                                                                | The app is Arabic-first and right-to-left, with English as the second language                                                                                                                                          |
| Realtime and push  | No socket or push endpoints exist                                                                                                                              | Out of scope                                                                                                                                                                                                            |

## 2. Endpoints covered (all under `/api/saknly/v1`)

- **auth**: `register`, `resend-confirmation`, `confirm-email/:token`, `login`, `getMe`, `refresh-token`, `logout`, `forgot-password`, `reset-password`, `google`
- **properties**: `allProperties`, `propertyDetails/:_id` (optional auth), `search`, `featured`, `similar/:id`, `myProperties`, `addProperty`, `updateProperty/:id`, `deleteProperty/:id`, `:id/favorite` (GET/POST/DELETE). Admin only: `pending`, `getMostViewedProperties`, `:id/approve`, `:id/deny`
- **users**: `me/wishlist` (GET/DELETE), `me/wishlist/:propertyId` (POST/DELETE). Admin only: `get-all-users`, `get-user/:id`, `update-user/:id`, `delete-user/:id`
- **agencies**: `featured`, `:id`. Admin only: list, create/update with a `logo` upload, delete
- **property-comments**: `GET /:propertyId`, `POST /:propertyId` (auth)
- **property-inquiry**: `add-property-inquiry`. Admin only: list, by id, status, delete, stats
- **contact**: `contact-us`. Admin only: list, status, delete
- **testimonial**: `GET /` (optional auth), `POST /`. Admin only: `all`, `:id/status`, delete
- **chat**: `POST /` with `{ question }` (at most 500 characters)
- **admin**: `analytics`

## 3. Tech stack

| Concern       | Choice                                                                                | Why                                                              |
| ------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Framework     | Expo, TypeScript. Use whatever version `create-expo-app@latest` installs, then pin it | No native toolchain to manage on Linux. Cloud builds through EAS |
| Navigation    | Expo Router (file-based)                                                              | Similar to the Next.js `app/` folder the team already knows      |
| Server state  | TanStack Query v5                                                                     | Already used on the web, so query keys and hooks can be ported   |
| HTTP          | axios, one client with request/response interceptors                                  | Port of `Saknly-client/shared/services/api.ts`                   |
| Forms         | Formik + Yup                                                                          | Same as the web, so validation schemas can be copied over        |
| Styling       | NativeWind (Tailwind for RN)                                                          | The web uses Tailwind, so the design tokens carry over           |
| Token storage | `expo-secure-store`                                                                   | Keychain / Keystore, never AsyncStorage                          |
| Images        | `expo-image-picker`, `expo-image-manipulator`, `expo-image`                           | Pick, compress and cache                                         |
| Maps          | `react-native-maps`                                                                   | Replaces Leaflet from the web                                    |
| i18n / RTL    | `i18next` + `expo-localization`, `I18nManager.forceRTL`                               | Arabic first                                                     |
| Toasts        | `react-native-toast-message`                                                          | Replaces react-hot-toast                                         |
| Tests         | Jest + `@testing-library/react-native`, Maestro for end-to-end flows                  | Maestro runs on the Android emulator                             |
| Lint/format   | ESLint (expo config) + Prettier, `tsc --noEmit` in CI                                 |                                                                  |

## 4. Repo layout

```
Saknly-mobile/
  app/                         Expo Router screens
    (auth)/login.tsx register.tsx check-email.tsx forgot-password.tsx reset-password.tsx
    (tabs)/index.tsx            home: featured properties + agencies + testimonials
           properties.tsx       list + search + filters
           wishlist.tsx
           chat.tsx             AI assistant
           profile.tsx          me, my properties, settings, logout
    properties/[id].tsx         details, gallery, map, comments, inquiry, similar
    properties/new.tsx          upload property (multi-step form)
    properties/[id]/edit.tsx
    agencies/[id].tsx
    contact.tsx about.tsx faq.tsx privacy.tsx
    admin/                      phase 6, shown only when role === 'admin'
  src/
    api/client.ts               axios + Saknly__ header + 401 handling
    api/{auth,properties,users,agencies,comments,inquiry,contact,testimonial,chat,admin}.ts
    hooks/                      TanStack Query hooks per resource
    auth/AuthProvider.tsx       token, user, login/logout, refresh on foreground
    components/ i18n/ theme/ utils/image.ts (compress to fit the 4 MB budget)
    types/                      ported from Saknly-client/types + response shapes
  .env.example                  EXPO_PUBLIC_API_URL, EXPO_PUBLIC_TOKEN_PREFIX
  app.json / app.config.ts  eas.json
  .github/workflows/ci.yml      lint + type-check + unit tests
```

## 5. Phases (each one ends with a check against the real API)

### Phase 0: Repo and scaffolding

1. Create the GitHub repo `mahmoudadel810/Saknly-mobile` and clone it to `~/Desktop/Mahmoud-Repositories/Saknly-mobile` (needs your go-ahead).
2. Run `npx create-expo-app@latest Saknly-mobile --template default` with TypeScript, then pin the versions.
3. Add NativeWind, ESLint, Prettier, path aliases, `.env.example`, and a CI workflow.
4. `eas init`, plus build profiles for development, preview (APK) and production.

**Done when:** the app opens on the Android emulator with Expo Go or a dev client, and CI is green.

### Phase 1: API layer and auth

1. Port `api.ts`: base URL and prefix from env, attach `Saknly__<token>`, and on a 401 from a non-auth route clear the token and go to login.
2. Write typed functions for the auth endpoints. Each later phase adds the typed functions for the endpoints it uses (porting `shared/services/*` and `types/*` from the web app), checked against the local API with an e2e test.
3. `AuthProvider`: read the token from secure storage on launch, call `getMe`, refresh on foreground, log out.
4. Screens: login, register, check-email (with resend), forgot password, reset with the code.

**Done when:** a new account can register, confirm by email, log in, survive an app restart, refresh its token and log out on the **local** server.

**Status:** done in code and tests. The auth flow passes end to end against a local Saknly-server (`npm run local-api` + `npm run test:e2e`), and the route guards are tested on the real `src/app` tree. Still to check: the screens on an emulator or phone.

### Phase 2: Browse (works without login)

1. Home: featured properties, featured agencies, approved testimonials.
2. Properties list: infinite scroll on `allProperties` (the web listing page's endpoint, which also takes `search`), filters with the same query params as the web, pull to refresh.
3. Property details: image gallery, location, owner/agency card, similar properties, comments.
4. Agency details page.

**Done when:** every list and detail screen shows the same data as the web app for the same property ids.

**Status:** done in code and tests. Tabs: Home, Properties, Account. The browse e2e suite runs against the server's own seed data (filters, sort, paging, details, similar, comments, agencies, testimonials). Two changes from the plan:

- The details screen has an **Open in Maps** button (the pin, or the address) instead of an embedded map. An in-app map with `react-native-maps` needs a Google Maps API key in the Android build; add it once there is a key.
- Call and WhatsApp buttons use the listing's contact info.

Still to check on an emulator or phone: the screens themselves, the agency logos (SVG data URIs in `expo-image`) and the Arabic digits in prices (`Intl` with `ar-EG` on Hermes). Tests ran in Node.

### Phase 3: Signed-in user features

1. Favorite / wishlist: toggle, wishlist tab, clear all. Use optimistic updates.
2. Add a comment. Send a property inquiry. Contact-us form. Submit a testimonial.
3. Profile: user info, my properties (with pending/approved status), logout.

**Done when:** a favorite added on mobile shows on the web wishlist and the other way round.

**Status:** done in code and tests. A Wishlist tab and hearts on every card and listing header (one wishlist request serves all hearts; toggles update at once and roll back on failure). Listing pages add comments and an inquiry form. Account shows my properties (under review / published / not published) and links to Contact us and Share your experience (a general review, held for admin approval). The account e2e suite checks favorites both ways through the app's endpoints (`/users/me/wishlist`) and the web app's (`/properties/:id/favorite`), and reads inquiries, contact messages and reviews back as the seed admin. Signing in from a heart, a comment or the Wishlist tab returns to that screen (a `redirect` param, like the web's). Still to check on an emulator or phone: the screens, and that return after sign-in (it waits one tick for the route guard's own redirect; the timing is verified in tests only).

### Phase 4: Upload and edit properties

1. Multi-step form that mirrors `uploadProperty` (same fields and Yup rules).
2. Pick images with the camera or gallery, compress them to fit the 4 MB total, reorder them, show upload progress.
3. Edit (`newImages` + kept images) and delete.

**Done when:** a property with 8 phone photos uploads successfully to the **deployed Vercel API**, not only to local. Vercel's body cap is what decides this.

**Status:** done in code and tests, except the check against the deployed API (needs a device and your go-ahead: it creates a real listing in production). One form (not multi-step) with the web form's core fields and rules: kind, type, title, description, price, area, bedrooms (0 for a shop), bathrooms, floors, amenities, negotiable, place, contact, rental lease and deposit, student room type / students per room / gender. Photos from the gallery or camera, resized to a 1280 px long edge and saved as JPEG (no HEIC), at most 8 and 4 MB in total, with upload progress. No reordering yet: the first photo is the cover. Edit keeps, removes and adds photos (`images[i]`, `imagesToDelete[]`, `newImages`); delete asks first. Upload requests hand the FormData to React Native untouched (identity `transformRequest`), so axios can't JSON-encode it. `local-api` runs a fake Cloudinary (via `CLOUDINARY_URL` upload_prefix), and the listing e2e suite uploads real JPEGs through the server's own sharp + Cloudinary SDK path. Web-only for now: sale installments and delivery, rental utilities and rules, nearby universities, the map pin.

### Phase 5: AI chat and polish

1. Chat screen on `POST /chat` with a 500-character limit, Arabic replies, and an error state for 503.
2. Static pages: about, FAQ, privacy.
3. Full RTL pass, dark mode, empty/loading/error states everywhere, offline banner.
4. Accessibility labels, app icon, splash screen.

### Phase 6: Admin (role `admin` only)

The web app has a full admin area: analytics, properties approve/deny, users, agencies, inquiries, testimonials, contacts, and import properties. On mobile this comes **last** and is lighter: analytics, pending-property approve/deny, user status, inquiries and testimonial moderation. Bulk **import-properties** stays web only (file parsing with mammoth isn't a phone task) unless you want it.

### Phase 7: Testing and release

1. Unit tests for the API client, token refresh logic and the image budget function.
2. Maestro flows: register → login → browse → favorite → upload → logout.
3. EAS Build: Android APK/AAB, iOS through EAS cloud builds. This machine is Linux, so iOS needs an Apple Developer account and a real device or TestFlight.
4. Store listings, privacy policy URL (reuse the web page), version and OTA updates through EAS Update.

## 6. Decisions you need to make

1. **Google sign-in.** The callback only redirects to the web app. Options:
   - **(Recommended)** a small server addition, `POST /auth/google/mobile`, that verifies a Google ID token from `@react-native-google-signin/google-signin` and returns the same JWT as `login`. Existing endpoints don't change.
   - Add a `redirect` / `state` param so the callback can redirect to `saknly://login/success?token=` (allowlisted).
   - Ship v1 with email/password only.
2. **Admin on mobile:** the light version in Phase 6 (recommended), the full version, or none.
3. **Deep links for the email links** (`saknly://` + Android App Links / iOS Universal Links on the web domain): optional, can wait until after v1.

## 7. Risks

- **Upload size** is the main technical risk: phone photos are much larger than the 4.5 MB Vercel body cap. The compression budget in Phase 4 must be tested against the deployed API.
- A **1-day token with no refresh token** means a user who doesn't open the app for a day has to log in again. Making this longer needs a server change (a long-lived refresh token).
- **iOS** can't be built or tested locally on Linux.
