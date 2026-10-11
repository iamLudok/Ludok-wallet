<div align="center">

<img src="assets/icon.png" alt="Ludok Wallet icon" width="96">

# Ludok Wallet

**Your business cards and event tickets in one place, on your phone.**

Snap a card and the app reads its phone, email and address for you. Import a ticket from a photo or PDF and its code is ready to scan at the door.<br>
Your data lives on your phone. No accounts. No servers. No tracking.

[![License: MIT](https://img.shields.io/github/license/iamLudok/Ludok-wallet?style=flat-square&color=blue)](LICENSE)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-APK-3DDC84?style=flat-square&logo=android&logoColor=white)](https://github.com/iamLudok/Ludok-wallet/releases)
[![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)

[Features](#features) · [Download](#download) · [Build](#building-from-source) · [Backups](#backups) · [License](#license)

</div>

---

<!--
## Screenshots

<p align="center">
  <img src="docs/screenshots/tickets.png" width="230" alt="Tickets">
  <img src="docs/screenshots/cards.png" width="230" alt="Cards">
  <img src="docs/screenshots/map.png" width="230" alt="Cards map">
</p>
-->

## Table of Contents

- [Why Ludok Wallet?](#why-ludok-wallet)
- [Features](#features)
- [Download](#download)
- [Backups](#backups)
- [Building from Source](#building-from-source)
- [How It Works](#how-it-works)
- [How It's Tested](#how-its-tested)
- [Project Structure](#project-structure)
- [Credits](#credits)
- [Contributing](#contributing)
- [License](#license)

---

## Why Ludok Wallet?

Ludok Wallet was born on [GrapheneOS](https://grapheneos.org/), where Google Wallet isn't an
option. Business cards were piling up in a drawer, and event tickets were getting lost between
emails, PDFs and screenshots. Ludok Wallet keeps both in one app, like a physical wallet, **for
free, without an account, and entirely on your phone**.

- 🛡️ **No Google Wallet, no Google account**: built for privacy-focused Android like GrapheneOS. The text recognition and barcode models are bundled inside the app.
- 📱 **Local-first**: everything is stored in a SQLite database inside the app. No accounts, no cloud, no analytics.
- 🔍 **On-device text recognition**: card and ticket photos are read on the phone with ML Kit; they're never uploaded.
- 💾 **Complete backups**: export everything to a single JSON file, **photos included**, and import it on any phone.
- ☁️ **Automatic Nextcloud backup** (optional): uploads a copy to your own Nextcloud when you open the app on WiFi.
- 🧪 **Tested logic**: the data layer, the OCR parser and the code rendering are tested in Node, without a phone (see [below](#how-its-tested)).

> **What leaves your phone:** only when you open the **cards map**: the addresses of cards that
> don't have coordinates yet are sent to [Nominatim](https://nominatim.org/) (OpenStreetMap) to
> find them on the map, and the map tiles (plus the Leaflet library, from unpkg) are downloaded. If you set up the
> Nextcloud backup, it goes straight to your server. Nothing else is sent anywhere.

---

## Features

### Cards

- 💳 **Everything about a place or person**: name, type (record shop, restaurant, person, shop, accommodation, company...), front and back photos, one or more phones and addresses, email, country, website, Instagram and free tags.
- 📷 **Automatic reading (OCR)**: take a photo of the front and back and the app tries to fill in phones, email, addresses and website by itself, combining what it finds on both sides.
- 🔀 **Manual order**: a "Sort" mode to drag each card where you want it, instead of settling for alphabetical order.
- 🗺️ **Map**: a pin for every card with an address, on OpenStreetMap. No account or API key needed.

### Tickets

- 🎫 **Event tickets**: title, venue, date and time, price, notes, an optional image, and the code, shown full screen with brightness at maximum so it scans at the door.
- 🔳 **13 code formats**: QR, Code 128, EAN-13/8, Code 39/93, Codabar, ITF-14, UPC-A/E, PDF417, Aztec and Data Matrix.
- ➕ **Never an empty form**: adding a ticket asks for the camera, a gallery image or a PDF. The app reads the code and, with OCR, the title, venue, date and price, and leaves the form filled in for you to confirm.
- 📤 **Share from the gallery**: share a ticket photo with Ludok Wallet from Android's share menu, and it's imported the same way.

### General

- 🌗 **Dark and light theme**, selectable in *Ajustes → Tema*.
- ⚠️ **Backup reminder** on the Cards and Tickets lists if you haven't made a backup in 7 days.

The app's interface is in Spanish.

---

## Download

Grab the latest signed APK from the [Releases](https://github.com/iamLudok/Ludok-wallet/releases) page
and install it on your Android phone (you'll need to allow installing apps from unknown sources).

Updates install **on top of** the previous version and keep your data, as long as they come from
the same Releases page (same signing key).

---

## Backups

The app starts empty, and your data only exists on your phone, so back it up.

### Manual backup

**Ajustes → Copia de seguridad → Exportar copia** exports everything to a single JSON file, **with photos inside** (as
base64), and opens the share menu so you can save it to Files, Nextcloud, Drive or wherever you want.
**Importar copia** restores a backup, **replacing** the current data.

### Automatic backup to Nextcloud

In **Ajustes → Copia automática a Nextcloud**, enter your server URL, user, password and folder.
When you open the app on WiFi, it uploads a backup at most once every 12 hours, with one file per day.

- **WiFi only**, because backups include photos and can be tens of megabytes.
- Use a Nextcloud **[app password](https://docs.nextcloud.com/server/latest/user_manual/en/session_management.html#managing-devices)**, not your account password, so you can revoke it at any time.
- That password is **never included in exported backups**, since a backup is meant to be shared and moved around. A test in `verify:data` checks this.
- No background task is used on purpose: Android kills them silently, and you'd never know whether they worked.

> The app allows plain `http://` traffic (`usesCleartextTraffic`) so it can reach a Nextcloud on your
> home network. Use HTTPS or a VPN if your server is reachable from outside.

### Coming from the Flutter version ("Ludovis")

The first version of this app was written in Flutter and had no export option, so its data has to
be pulled out by hand:

```bash
# 1. Copy ludovis.sqlite and the images/ folder from the old phone (adb or root).
# 2. Convert them into a backup file:
npm run migrate:flutter -- path/to/ludovis.sqlite path/to/images
# 3. In the app: Ajustes → Importar copia → choose the generated ludok-wallet-backup-*.json
```

Detailed instructions for getting those files off the phone are in
[`scripts/migrate-from-flutter.ts`](scripts/migrate-from-flutter.ts).

---

## Building from Source

### Requirements

- Node.js and npm
- JDK 17
- Android SDK with API 36, and `adb`
- An Android phone connected over USB (or an emulator)

### Run in development

```bash
git clone https://github.com/iamLudok/Ludok-wallet.git
cd Ludok-wallet
npm install
npm run android      # builds, installs and opens the app on a phone connected via adb
npm run typecheck    # types for the app, the verification scripts and scripts/
npm run verify       # tests the data layer, the OCR parser and the code rendering
```

> Gradle needs a **Java 17** toolchain. If it fails with *"Cannot find a Java installation matching
> languageVersion=17"* while you have a newer JDK, point it to the one Gradle already downloaded:
>
> ```bash
> export JAVA_HOME=~/.gradle/jdks/eclipse_adoptium-17-amd64-linux.2
> ```

### Build a release APK

The build script signs the APK with your own keystore. Create one and describe it in a
`keystore.properties` file at the project root (both are in `.gitignore`):

```bash
keytool -genkeypair -v -keystore release.jks -alias ludok-wallet \
  -keyalg RSA -keysize 2048 -validity 10000
```

```properties
storeFile=release.jks
storePassword=...
keyAlias=ludok-wallet
keyPassword=...
```

Then:

```bash
npm run build:apk                    # all architectures
./scripts/build-apk.sh --compartir   # arm64-v8a only, smaller, for sharing
# → android/app/build/outputs/apk/release/app-release.apk

adb install -r android/app/build/outputs/apk/release/app-release.apk
```

It has to be a **release** build: a debug APK loads its JavaScript from the Metro server, so it
doesn't work without your computer.

> ⚠️ **Keep your keystore safe.** Android only installs an APK on top of another if both are signed
> with the same key. If you lose it, the only way to install a new version is to uninstall the
> app, and **uninstalling deletes its data**. It's the one thing in this project that can't be
> regenerated.

---

## How It Works

### Scannable codes

The 13 formats that `expo-camera` can read are **drawn** with [bwip-js](https://github.com/metafloor/bwip-js),
which generates pure SVG in JavaScript. There's no canvas involved, so it works the same on the phone
and in `verify/codes.ts`, and no separate native barcode library is needed.

### OCR

[`@react-native-ml-kit/text-recognition`](https://github.com/a7medev/react-native-ml-kit) reads the
text from a photo on the device. [`src/lib/ocr.ts`](src/lib/ocr.ts), which is pure regular-expression
logic with nothing native, then extracts phone, email, address, website and Instagram from a card,
or title, venue, date and price from a ticket. It's tested with sample texts in `verify/ocr.ts`,
without touching the camera.

### Importing a ticket from an image, a PDF or the share menu

[`src/lib/ticketImport.ts`](src/lib/ticketImport.ts) combines code scanning and OCR in a single pass,
both for a photo and for a PDF (`react-native-pdf-to-image` renders each page until it finds a code).
The result is handed to the form through [`ticketPrefillBridge.ts`](src/lib/ticketPrefillBridge.ts),
a one-time mailbox, because whoever picks the image navigates *to* the form and there's no open
screen to notify. Sharing a photo from the gallery (`expo-share-intent`) follows the same path.

### Cards map

[`app/tarjeta/mapa.tsx`](app/tarjeta/mapa.tsx) geocodes the first address of each card that doesn't
have coordinates yet with Nominatim, one request per second as its usage policy asks, and stores the
result on the card (`lat`/`lng`) so it's never requested again.

The map itself ([`src/components/CardsMapDom.tsx`](src/components/CardsMapDom.tsx)) is an Expo
**DOM Component** running [Leaflet](https://leafletjs.com/) inside a real WebView. That avoids
`react-native-maps`, which on Android requires a Google Maps API key even just to draw
OpenStreetMap tiles.

---

## How It's Tested

The logic is tested in Node, running **the same code that runs on the phone** against a desktop
SQLite (through **libsql**, which supports async transactions like `expo-sqlite`) and an in-memory
photo store:

```bash
npm run verify:data       # backup round trip, data AND photos, password never exported
npm run verify:library    # create/edit/delete cards and tickets, orphaned photos
npm run verify:migration  # the schema is created idempotently
npm run verify:ocr        # the phone/email/address/date/price parser
npm run verify:codes      # all 13 code formats are drawn and validated
```

The logic gets its database from [`src/lib/dbRef.ts`](src/lib/dbRef.ts) instead of creating it, and
[`src/lib/db.ts`](src/lib/db.ts) is the **only** file that touches `expo-sqlite`.

---

## Project Structure

```
Ludok-wallet/
├── app/                    ← Routes (expo-router)
│   ├── (tabs)/             ← Tickets, Cards, Settings
│   ├── tarjeta/            ← Card detail, form and map
│   └── entrada/            ← Ticket detail, form and scanner
├── src/
│   ├── lib/                ← Data and logic (SQLite, photos, backups, OCR, codes, geocoding, ticket import)
│   ├── ui/                 ← Design tokens and base components
│   ├── components/         ← PhotoSlot, TagInput, CodeView, CardsMapDom, BackupBanner...
│   └── hooks/              ← Reactive queries (Drizzle's useLiveQuery)
├── verify/                 ← Tests (Node, not shipped in the APK)
├── scripts/
│   ├── build-apk.sh        ← Builds and signs the release APK
│   ├── migrate-from-flutter.ts ← Converts data from the old Flutter app into a backup
│   └── gen-assets.py       ← Generates the icon and splash images
├── assets/                 ← Icon and splash screen
├── app.json                ← Expo configuration
└── package.json
```

The `android/` folder is generated by `expo prebuild` and is not committed.

---

## Credits

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, available under the [ODbL](https://opendatacommons.org/licenses/odbl/). Geocoding by [Nominatim](https://nominatim.org/).
- Map rendering by [Leaflet](https://leafletjs.com/).
- Barcode and QR rendering by [bwip-js](https://github.com/metafloor/bwip-js).
- Text recognition by [Google ML Kit](https://developers.google.com/ml-kit/vision/text-recognition/v2), through [react-native-ml-kit](https://github.com/a7medev/react-native-ml-kit).

---

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup and
conventions. To report a security vulnerability, follow [SECURITY.md](SECURITY.md) instead of
opening a public issue.

---

## License

Distributed under the **MIT License**. You are free to use, modify and share Ludok Wallet, including
for commercial use, as long as you keep the copyright notice. See [LICENSE](LICENSE) for the full text.

---

<div align="center">

Made by [Luken Iriondo](https://github.com/iamLudok) · If Ludok Wallet is useful to you, consider giving it a ⭐

</div>
