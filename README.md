# Ludovis

App personal para guardar **tarjetas** (restaurantes, personas, tiendas, hoteles, empresas…) y
**entradas** de eventos con su código escaneable, tipo cartera física, pero **gratis, sin
cuentas y local-first**. App Android nativa (Expo/React Native): los datos viven en el
almacenamiento privado de la app (`/data/data/com.ludok.ludovis/`) y solo desaparecen si
desinstalas — no hace falta pedirle permiso a nadie.

- 💳 **Tarjetas**: nombre, tipo, foto de anverso y reverso (con giro), teléfonos, email,
  dirección, web, Instagram y etiquetas libres.
- 📷 **Lectura automática (OCR)**: fotografía una tarjeta y la app intenta rellenar teléfono,
  email, dirección y web sola, a partir del texto de la foto.
- 🎫 **Entradas**: título, lugar, fecha y hora, precio, notas, una imagen opcional y el código
  (QR o de barras, trece formatos) que se enseña a pantalla completa con el brillo al máximo.
- 📷➜🔢 El código se consigue escaneándolo con la cámara **o** detectándolo dentro de una foto o
  captura de pantalla ya guardada (una entrada que llegó por email, por ejemplo).
- 💾 **Copia de seguridad** export/import en JSON — con las fotos dentro, en base64 — y aviso de
  «días sin copia». Opcionalmente, subida automática a un Nextcloud propio.

## Por qué nativa (otra vez)

Ludovis nació como app Flutter. Se ha vuelto a escribir en Expo/React Native para seguir el
mismo patrón que el resto de mis apps (Ludok Time, Ludok Been): SQLite propio con Drizzle,
copia de seguridad JSON de verdad, capa de datos que se prueba en el escritorio antes de tocar
el móvil, e identidad visual «Sala oscura» (interfaz monocroma, el color solo con significado).

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

### Si vienes de la versión de Flutter

La app de Flutter no tenía exportar/importar, así que hay que sacar sus datos a mano:

```bash
# 1. Saca ludovis.sqlite y la carpeta images/ del móvil viejo (adb o root).
# 2. npm run migrate:flutter -- ruta/a/ludovis.sqlite ruta/a/images
# 3. En esta app: Ajustes → Importar copia → elige el ludovis-backup-*.json generado.
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
  (tabs)/                Tarjetas · Entradas · Ajustes
  tarjeta/                ficha y formulario de una tarjeta
  entrada/                ficha, formulario y escáner de una entrada
src/
  lib/                    esquema, base de datos, fotos, backup, OCR, códigos
  hooks/                  useCards, useTickets, useSettings (useLiveQuery reactivo)
  ui/                      tema (paleta dark/light) y primitivas
  components/              PhotoSlot, TagInput, CodeView, BackupBanner…
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

## Compilar un APK

```bash
npm run build:apk
```

Necesita `keystore.properties` + una keystore `.jks` propias (gitignored, no se versionan).
**Guarda la keystore a buen recaudo**: si se pierde, ya no se puede actualizar la app in-place
— solo desinstalar (lo que borra los datos) y volver a instalar de cero.

## Stack

Expo SDK 57 · React Native · Drizzle + expo-sqlite (base de datos) · expo-router (rutas) ·
expo-camera (cámara y escaneo) · expo-image-picker (fotos) · bwip-js + react-native-svg
(dibujo de códigos) · @react-native-ml-kit/text-recognition (OCR) · expo-brightness
(pantalla completa de la entrada).
