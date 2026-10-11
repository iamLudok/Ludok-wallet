#!/usr/bin/env -S npx tsx
/**
 * Migra los datos de la versión anterior de la app (Flutter + Drift, entonces
 * llamada «Ludovis») a una copia de seguridad de Ludok Wallet, lista para
 * importar desde Ajustes.
 *
 * La app de Flutter no tenía exportar/importar, así que la única forma de
 * sacar los datos es tirar directamente de su base SQLite y de sus fotos:
 *
 *   1. Con el móvil en modo depuración USB y `adb` instalado:
 *      adb backup -f backup.ab com.ludovis.ludovis        (o similar)
 *      … o, en un móvil rooteado, copiar directamente desde
 *      /data/data/com.ludovis.ludovis/app_flutter/ (ludovis.sqlite + images/)
 *
 *   2. Deja el fichero `ludovis.sqlite` y la carpeta `images/` juntos, por
 *      ejemplo en `migracion-flutter/` (ya está en `.gitignore`).
 *
 *   3. Ejecuta:
 *      npm run migrate:flutter -- migracion-flutter/ludovis.sqlite migracion-flutter/images
 *
 * Genera `ludok-wallet-backup-<fecha>.json` en la raíz del proyecto: se
 * importa igual que cualquier otra copia, desde Ajustes → Importar copia.
 *
 * Se usa @libsql/client para leer el .sqlite (ya es una dependencia de
 * `verify/`) en vez de sumar otra librería solo para esto.
 */
import { createClient } from '@libsql/client'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { newId } from '../src/lib/ids'
import { SCHEMA_VERSION } from '../src/lib/version'
import type { BackupFile, Card, CardType, CodeFormat, Ticket } from '../src/types'

const [, , dbPathArg, imagesDirArg] = process.argv

if (!dbPathArg) {
  console.error('Uso: npm run migrate:flutter -- <ludovis.sqlite> [carpeta-de-imagenes]')
  console.error('Ver el comentario de cabecera de scripts/migrate-from-flutter.ts para cómo sacarlos del móvil.')
  process.exit(1)
}
if (!existsSync(dbPathArg)) {
  console.error(`No se encuentra ${dbPathArg}`)
  process.exit(1)
}

/** Drift generaba estas columnas en snake_case a partir de los campos Dart. */
interface OldRestaurantRow {
  id: number
  name: string
  card_type: string
  photo_path: string | null
  photo_back_path: string | null
  phone: string | null
  phone2: string | null
  email: string | null
  address: string | null
  website: string | null
  social_link: string | null
  tags: string
  created_at: number
}

interface OldTicketRow {
  id: number
  title: string
  event_date_time: number | null
  venue: string | null
  price: string | null
  code_data: string
  code_format: string
  image_path: string | null
  notes: string | null
  created_at: number
}

/** `BarcodeFormat.name` de mobile_scanner → clave de `CodeFormat` de esta app. */
const CODE_FORMAT_MAP: Record<string, CodeFormat> = {
  qrCode: 'qr',
  code128: 'code128',
  ean13: 'ean13',
  ean8: 'ean8',
  code39: 'code39',
  code93: 'code93',
  codabar: 'codabar',
  itf: 'itf14',
  upcA: 'upc_a',
  upcE: 'upc_e',
  pdf417: 'pdf417',
  aztec: 'aztec',
  dataMatrix: 'datamatrix',
}

const CARD_TYPES: readonly string[] = ['restaurant', 'person', 'shop', 'hotel', 'company', 'other']

function n(v: string | null | undefined): string | undefined {
  const t = v?.trim()
  return t ? t : undefined
}

/** Junta valores sueltos (los dos teléfonos, por ejemplo) en la lista que espera esta app, o `undefined` si no queda ninguno. */
function list(...values: (string | undefined)[]): string[] | undefined {
  const filled = values.filter((v): v is string => !!v)
  return filled.length ? filled : undefined
}

function parseTags(raw: string): string[] | undefined {
  const tags = raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  const unique = [...new Set(tags)]
  return unique.length ? unique : undefined
}

/**
 * Drift, sin configuración expresa de `dateTimeMode`, guarda los `DateTime`
 * como segundos desde el epoch (no milisegundos, que es lo que usa esta app).
 */
function secondsToMs(v: number | null): number | undefined {
  return v === null ? undefined : v * 1000
}

const imagesRead: Record<string, string> = {}
const missingImages: string[] = []

/**
 * Localiza la foto por su nombre de fichero (la ruta guardada era absoluta en
 * EL MÓVIL VIEJO, así que solo el nombre sirve aquí) y la deja lista en
 * base64 para meter en la copia. Devuelve el nombre a guardar en la ficha, o
 * `undefined` si no había ruta o no se encontró el fichero.
 */
function resolveImage(oldPath: string | null): string | undefined {
  if (!oldPath) return undefined
  const name = basename(oldPath)
  if (imagesRead[name]) return name

  if (!imagesDirArg) {
    missingImages.push(name)
    return undefined
  }
  const local = join(imagesDirArg, name)
  if (!existsSync(local)) {
    missingImages.push(name)
    return undefined
  }
  imagesRead[name] = readFileSync(local).toString('base64')
  return name
}

async function main() {
  const client = createClient({ url: `file:${dbPathArg}` })

  const restaurantsRes = await client.execute('SELECT * FROM restaurants')
  const ticketsRes = await client.execute('SELECT * FROM tickets')

  const cards: Card[] = restaurantsRes.rows.map((r, index) => {
    const row = r as unknown as OldRestaurantRow
    const rawType = CARD_TYPES.includes(row.card_type) ? row.card_type : 'other'
    // «hotel» pasó a llamarse «lodging» (etiqueta «Alojamiento») en esta app.
    const type: CardType = rawType === 'hotel' ? 'lodging' : (rawType as CardType)
    const addedAt = secondsToMs(row.created_at) ?? Date.now()
    const card: Card = {
      id: newId(),
      name: row.name,
      type,
      photo: resolveImage(row.photo_path),
      photoBack: resolveImage(row.photo_back_path),
      phones: list(n(row.phone), n(row.phone2)),
      email: n(row.email),
      addresses: list(n(row.address)),
      website: n(row.website),
      social: n(row.social_link),
      tags: parseTags(row.tags),
      // El orden que ya traía la base vieja (por fila) sirve de orden manual
      // inicial; se puede reordenar a mano en la app en cuanto se importe.
      sortOrder: index,
      addedAt,
      updatedAt: addedAt,
    }
    return card
  })

  const tickets: Ticket[] = ticketsRes.rows.map((r) => {
    const row = r as unknown as OldTicketRow
    const addedAt = secondsToMs(row.created_at) ?? Date.now()
    const ticket: Ticket = {
      id: newId(),
      title: row.title,
      eventAt: secondsToMs(row.event_date_time),
      venue: n(row.venue),
      price: n(row.price),
      code: row.code_data,
      codeFormat: CODE_FORMAT_MAP[row.code_format] ?? 'qr',
      image: resolveImage(row.image_path),
      notes: n(row.notes),
      addedAt,
      updatedAt: addedAt,
    }
    return ticket
  })

  const backup: BackupFile = {
    app: 'ludok-wallet',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    cards,
    tickets,
    settings: null,
    images: imagesRead,
  }

  const d = new Date()
  const pad = (x: number) => String(x).padStart(2, '0')
  const outPath = `ludok-wallet-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`
  writeFileSync(outPath, JSON.stringify(backup, null, 2))

  console.log(`\n${cards.length} tarjetas y ${tickets.length} entradas migradas.`)
  console.log(`${Object.keys(imagesRead).length} fotos incluidas.`)
  if (missingImages.length) {
    console.log(
      `\n${missingImages.length} foto(s) referenciadas pero no encontradas` +
        (imagesDirArg ? ` en ${imagesDirArg}` : ' (no se indicó carpeta de imágenes') +
        `:\n  ${missingImages.join('\n  ')}`,
    )
    console.log('Esas fichas se importarán igual, solo que sin foto.')
  }
  console.log(`\nEscrito: ${outPath}`)
  console.log('Ahora, en el móvil con la app instalada: Ajustes → Importar copia → elige ese fichero.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
