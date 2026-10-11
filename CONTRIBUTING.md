# Contributing to Ludok Wallet

Thanks for your interest in Ludok Wallet! It's a personal project, but contributions are welcome.

## Ways to Contribute

- **Code changes**: send a pull request directly. Fixes, improvements and new features are all welcome as PRs.
- **Bugs and ideas**: if you found something that doesn't work, or have an idea but don't want to code it, open a public [issue](https://github.com/iamLudok/Ludok-wallet/issues).
- **OCR that reads something wrong**: open an issue with the recognised text (not the photo), and say what it should have found.
- **Security vulnerabilities**: never in a public issue. Report them privately as explained in [SECURITY.md](SECURITY.md).

Before attaching a backup file, logs, screenshots or OCR text, **remove any personal data**: names,
phone numbers, emails, addresses, ticket codes, Nextcloud URLs and usernames. A ticket's code is
often all it takes to get into the event.

## Development Setup

You need Node.js, JDK 17, the Android SDK (API 36) and `adb`, plus an Android phone or emulator.

```bash
git clone https://github.com/iamLudok/Ludok-wallet.git
cd Ludok-wallet
npm install
npm run android
```

Before opening a PR, make sure both of these pass:

```bash
npm run typecheck
npm run verify
```

To test a release build you'll need your own keystore; see [Build a release APK](README.md#build-a-release-apk).
**Never commit** `release.jks`, `keystore.properties`, backup files (`ludok-wallet-backup-*.json`) or the generated `android/` folder.

## Project Conventions

- **Code, comments and the app's interface are in Spanish**; the README and docs are in English.
- Follow the Expo SDK 57 docs: <https://docs.expo.dev/versions/v57.0.0/>. APIs have changed between SDK versions.
- [`src/lib/db.ts`](src/lib/db.ts) is the **only** file allowed to import `expo-sqlite`. The rest of the logic gets the database from `dbRef.ts`, so it can be tested in Node.
- Keep parsing logic pure: [`src/lib/ocr.ts`](src/lib/ocr.ts) only works on text, never on images. If you improve it, add the sample text to [`verify/ocr.ts`](verify/ocr.ts).
- Respect [Nominatim's usage policy](https://operations.osmfoundation.org/policies/nominatim/): at most one request per second, an identifying User-Agent, and cache the result on the card.
- Colours, spacing and typography come from [`src/ui/theme.ts`](src/ui/theme.ts). No hardcoded colours in components.
- Keep dependencies minimal.

## Changing the Data Model

Data loss is the one thing this app must never cause, so schema changes need extra care:

1. Update both [`src/lib/schema.ts`](src/lib/schema.ts) (Drizzle) and [`src/lib/schemaSql.ts`](src/lib/schemaSql.ts) (SQL), keeping the migration idempotent.
2. Update the row mapping in [`src/lib/rows.ts`](src/lib/rows.ts) and the types in [`src/types.ts`](src/types.ts).
3. Make sure **old backups still import**. If the backup format changes, handle the previous version on import.
4. Add or update checks in [`verify/`](verify) and run `npm run verify`.

## Pull Requests

- Keep each PR focused on one change.
- Describe what changed and how you tested it (on a real device, if it touches the camera, OCR or UI).
- Update the README if you change a feature or the backup format.

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
