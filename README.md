# Ludok Wallet

App personal para guardar **tarjetas** (restaurantes, personas, tiendas, hoteles, empresas…) y
**entradas** de eventos con su código escaneable, tipo cartera física, pero **gratis, sin
cuentas y local-first**. App Android nativa (Expo/React Native): los datos viven en el
almacenamiento privado de la app (`/data/data/com.ludok.wallet/`) y solo desaparecen si
desinstalas — no hace falta pedirle permiso a nadie.

- 💳 **Tarjetas**: nombre, tipo, foto de anverso y reverso (con giro), teléfonos, email,
  dirección, web, Instagram y etiquetas libres.
- 📷 **Lectura automática (OCR)**: fotografía anverso y reverso y la app intenta rellenar
  teléfono, email, dirección y web sola, combinando lo que saque de las dos caras.
- 🎫 **Entradas**: título, lugar, fecha y hora, precio, notas, una imagen opcional y el código
  (QR o de barras, trece formatos) que se enseña a pantalla completa con el brillo al máximo.
- ➕ **Añadir una entrada** pide directamente cámara, imagen de la galería o un PDF — nunca un
  formulario vacío. Con imagen o PDF, la app lee el código y, con OCR, título/lugar/fecha/precio,
  y deja el formulario ya relleno para confirmar.
- 📤 **Compartir desde la Galería**: comparte una foto de una entrada con Ludok Wallet desde el
  propio menú de compartir de Android y se importa igual que desde el «+».
- 💾 **Copia de seguridad** export/import en JSON — con las fotos dentro, en base64 — y aviso de
  «días sin copia». Opcionalmente, subida automática a un Nextcloud propio.

## Por qué nativa (otra vez)

Esta app nació como app Flutter, con el nombre «Ludovis». Se ha vuelto a escribir en Expo/React
Native para seguir el mismo patrón que el resto de mis apps (Ludok Time, Ludok Been): SQLite
propio con Drizzle, copia de seguridad JSON de verdad, capa de datos que se prueba en el
escritorio antes de tocar el móvil, e identidad visual «Sala oscura» (interfaz monocroma, el
color solo con significado).

## Arranque

```bash
npm install
npm run android      # compila e instala en un dispositivo/emulador conectado
npm run typecheck    # tsc sobre src/, verify/ y scripts/
npm run verify        # capa de datos + reglas de negocio + OCR + códigos, en Node
```

## Primer uso y copias de seguridad

La app arranca vacía. En **Ajustes** puedes **Exportar** una copia (JSON con las fotos dentro,
se abre el menú de compartir para mandarla a Archivos/Nextcloud/Drive) e **Importar** para
restaurarla (reemplaza los datos actuales). Si llevas varios días sin copia, un aviso te lo
recuerda en las listas de Tarjetas y Entradas.

### Si vienes de la versión de Flutter («Ludovis»)

Esa app no tenía exportar/importar, así que hay que sacar sus datos a mano:

```bash
# 1. Saca ludovis.sqlite y la carpeta images/ del móvil viejo (adb o root).
# 2. npm run migrate:flutter -- ruta/a/ludovis.sqlite ruta/a/images
# 3. En esta app: Ajustes → Importar copia → elige el ludok-wallet-backup-*.json generado.
```

Instrucciones detalladas de cómo sacar esos ficheros del móvil en el propio
`scripts/migrate-from-flutter.ts`.

## Verificación de la capa de datos

Antes de tocar nada de interfaz, la lógica de negocio se prueba en Node contra un SQLite de
escritorio (mismo motor async que `expo-sqlite`, vía `@libsql/client`) y un almacén de fotos en
memoria:

```bash
npm run verify:data       # ida y vuelta del backup (datos Y fotos, export/import)
npm run verify:library    # crear/editar/borrar tarjetas y entradas, fotos huérfanas
npm run verify:migration  # el esquema se crea de forma idempotente
npm run verify:ocr        # el parser de teléfono/email/dirección/fecha/precio
npm run verify:codes      # los trece formatos de código se dibujan y validan
```

## Estructura

```
app/                    rutas (expo-router)
  (tabs)/                Entradas · Tarjetas · Ajustes
  tarjeta/                ficha y formulario de una tarjeta
  entrada/                ficha, formulario y escáner de una entrada
src/
  lib/                    esquema, base de datos, fotos, backup, OCR, códigos, importación de entradas
  hooks/                  useCards, useTickets, useSettings (useLiveQuery reactivo)
  ui/                      tema (paleta dark/light) y primitivas
  components/              PhotoSlot, TagInput, CodeView, TicketSourceSheet, BackupBanner…
verify/                  scripts Node, no se empaquetan en la app
scripts/                 build-apk.sh, migrate-from-flutter.ts, gen-assets.py
```

## Código escaneable

Los trece formatos que sabe leer `expo-camera` (QR, Code128, EAN-13/8, Code39/93, Codabar,
ITF-14, UPC-A/E, PDF417, Aztec, Data Matrix) se **dibujan** con `bwip-js`, que genera SVG puro
en JavaScript — sin canvas, así que funciona igual en el móvil que en `verify/codes.ts`. No
hace falta una librería nativa de barcodes aparte para esto.

## OCR

`@react-native-ml-kit/text-recognition` lee el texto de una foto; `src/lib/ocr.ts` (pura lógica
de expresiones regulares, sin nada nativo) extrae teléfono/email/dirección/web/Instagram de una
tarjeta, o título/lugar/fecha/precio de una entrada. Se prueba con textos de ejemplo en
`verify/ocr.ts`, sin tocar la cámara.

## Importar una entrada desde imagen, PDF o al compartir

`src/lib/ticketImport.ts` junta el escaneo de código (`expo-camera`) y el OCR en una sola
pasada, tanto para una foto como para un PDF (`react-native-pdf-to-image` renderiza cada página
hasta encontrar un código). El resultado se deja en `ticketPrefillBridge.ts` — el mismo truco de
buzón de un solo uso que `scanBridge.ts` — porque quien elige la imagen navega HACIA el
formulario, no hay ninguna pantalla ya abierta a la que avisar. Compartir una foto desde la
Galería (`expo-share-intent`) usa el mismo camino, enterándose en `app/_layout.tsx`.

## Compilar un APK

```bash
npm run build:apk
```

Necesita `keystore.properties` + una keystore `.jks` propias (gitignored, no se versionan).
**Guarda la keystore a buen recaudo**: si se pierde, ya no se puede actualizar la app in-place
— solo desinstalar (lo que borra los datos) y volver a instalar de cero.

## Stack

Expo SDK 57 · React Native · Drizzle + expo-sqlite (base de datos) · expo-router (rutas) ·
expo-camera (cámara y escaneo) · expo-image-picker (fotos) · expo-document-picker +
react-native-pdf-to-image (importar PDF) · expo-share-intent (compartir desde la Galería) ·
bwip-js + react-native-svg (dibujo de códigos) · @react-native-ml-kit/text-recognition (OCR) ·
expo-brightness (pantalla completa de la entrada).
