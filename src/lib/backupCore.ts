// Núcleo de las copias de seguridad: solo consultas Drizzle, sin nada nativo.
//
// Está separado de `backup.ts` a propósito. Aquí no se importa expo-file-system
// ni expo-sqlite, así que este código se puede ejecutar tal cual en Node contra
// un SQLite de escritorio para probarlo. Como recibe la base de datos por
// parámetro y las fotos por `imageRef`, el test ejecuta EXACTAMENTE el mismo
// código que corre en el móvil.
import { eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { cards as cardsTable, tickets as ticketsTable, settings as settingsTable } from './schema'
import { rowToCard, cardToRow, rowToTicket, ticketToRow, rowToSettings } from './rows'
import { getImageStore } from './imageRef'
import { SCHEMA_VERSION } from './version'
import type { BackupFile, Card, Settings, Ticket } from '../types'

export { SCHEMA_VERSION }

/** Cualquier base de datos SQLite de Drizzle (expo-sqlite en el móvil, libsql en los tests). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LudokDb = BaseSQLiteDatabase<any, any, any>

const APP_ID = 'ludok-wallet'

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  theme: 'system',
  lastBackup: 0,
  schemaVersion: SCHEMA_VERSION,
  autoBackup: false,
}

export async function readSettings(database: LudokDb): Promise<Settings> {
  const rows = await database
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, 'app'))
    .limit(1)
  return rows[0] ? rowToSettings(rows[0]) : DEFAULT_SETTINGS
}

export async function writeSettings(database: LudokDb, next: Settings): Promise<void> {
  const row = {
    id: 'app' as const,
    theme: next.theme,
    lastBackup: next.lastBackup,
    schemaVersion: next.schemaVersion ?? SCHEMA_VERSION,
    nextcloudUrl: next.nextcloudUrl ?? null,
    nextcloudUser: next.nextcloudUser ?? null,
    nextcloudPassword: next.nextcloudPassword ?? null,
    nextcloudFolder: next.nextcloudFolder ?? null,
    autoBackup: next.autoBackup ?? null,
    lastAutoBackupAt: next.lastAutoBackupAt ?? null,
  }
  await database
    .insert(settingsTable)
    .values(row)
    .onConflictDoUpdate({ target: settingsTable.id, set: row })
}

/** Los nombres de fichero que usan las fichas dadas, sin repetir. */
export function referencedImages(cards: Card[], tickets: Ticket[]): string[] {
  const names = new Set<string>()
  for (const c of cards) {
    if (c.photo) names.add(c.photo)
    if (c.photoBack) names.add(c.photoBack)
  }
  for (const t of tickets) {
    if (t.image) names.add(t.image)
  }
  return [...names]
}

export interface ExportOptions {
  /**
   * Si la copia lleva las fotos dentro (en base64).
   *
   * Por defecto sí: una copia de una app de tarjetas sin las fotos de las
   * tarjetas no es una copia de nada. Se puede apagar para la subida
   * automática, donde lo que importa es que quepa y sea rápida.
   */
  includeImages?: boolean
}

/** Serializa toda la base de datos a un objeto de copia. */
export async function exportAll(
  database: LudokDb,
  options: ExportOptions = {},
): Promise<BackupFile> {
  const { includeImages = true } = options

  const cardRows = await database.select().from(cardsTable)
  const ticketRows = await database.select().from(ticketsTable)
  const settings = await readSettings(database)

  const cards = cardRows.map(rowToCard)
  const tickets = ticketRows.map(rowToTicket)

  // La contraseña de Nextcloud NO se exporta. Una copia se comparte y se mueve
  // de sitio, y esa contraseña da permiso de ESCRITURA sobre tus ficheros; la
  // propia copia acaba subida ahí, así que además viajaría con su propia llave
  // dentro. Al restaurar en otro móvil hay que volver a escribirla, y punto.
  const { nextcloudPassword: _omitted, ...safeSettings } = settings

  const backup: BackupFile = {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    cards,
    tickets,
    settings: safeSettings,
  }

  if (includeImages) {
    const store = getImageStore()
    const images: Record<string, string> = {}
    for (const name of referencedImages(cards, tickets)) {
      const data = await store.read(name)
      // Una foto que ya no está en disco no debe tumbar la copia entera: se
      // omite y el resto se guarda igual. La ficha queda sin foto al
      // restaurar, que es exactamente lo que ya pasaba en este móvil.
      if (data) images[name] = data
    }
    backup.images = images
  }

  return backup
}

export interface ImportResult {
  cards: number
  tickets: number
  images: number
}

/**
 * Compatibilidad con una copia de antes de la v2, donde una tarjeta llevaba
 * `phone`/`phone2`/`address` en vez de las listas `phones`/`addresses`.
 * Sin esto, importar una copia vieja habría dejado esos datos fuera sin
 * avisar: `cardToRow` solo lee los campos nuevos.
 */
function migrateLegacyCard(raw: Card & { phone?: string; phone2?: string; address?: string }): Card {
  if (raw.phones || raw.addresses) return raw
  const { phone, phone2, address, ...rest } = raw
  const phones = [phone, phone2].filter((v): v is string => !!v)
  const addresses = address ? [address] : []
  return {
    ...rest,
    phones: phones.length ? phones : undefined,
    addresses: addresses.length ? addresses : undefined,
    type: (rest.type as string) === 'hotel' ? 'lodging' : rest.type,
  }
}

/**
 * Compatibilidad con una copia de antes de la v3, sin `sortOrder`: se le
 * asigna uno por nombre, que es como se enseñaban las tarjetas antes de que
 * existiera el orden manual. No toca nada si ya viene con `sortOrder` (una
 * copia ya en el formato actual).
 */
function withSortOrder(cardsIn: Card[]): Card[] {
  const missing = cardsIn.filter((c) => c.sortOrder === undefined)
  if (!missing.length) return cardsIn
  const sorted = [...missing].sort((a, b) => a.name.localeCompare(b.name))
  const order = new Map(sorted.map((c, i) => [c.id, i]))
  return cardsIn.map((c) => (c.sortOrder === undefined ? { ...c, sortOrder: order.get(c.id)! } : c))
}

function isBackupFile(data: unknown): data is BackupFile {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    d.app === APP_ID &&
    typeof d.schemaVersion === 'number' &&
    Array.isArray(d.cards) &&
    Array.isArray(d.tickets)
  )
}

/**
 * Importa una copia, reemplazando el contenido actual. Valida el formato y el
 * schemaVersion antes de tocar nada. Las filas van dentro de una transacción:
 * si algo falla a mitad no se queda la base de datos a medias.
 *
 * Las fotos se escriben ANTES de la transacción, no dentro: son ficheros, no
 * filas, y no participan de ese «todo o nada». Escribirlas primero significa
 * que en el peor caso sobran fotos sin ficha (invisibles, y `pruneOrphanImages`
 * las barre después), en vez de fichas apuntando a fotos que no llegaron a
 * escribirse.
 */
export async function importAll(database: LudokDb, raw: string): Promise<ImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('El fichero no es un JSON válido.')
  }
  if (!isBackupFile(parsed)) {
    throw new Error('Este fichero no es una copia de Ludok Wallet.')
  }
  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `La copia es de una versión más nueva (v${parsed.schemaVersion}). Actualiza la app antes de importar.`,
    )
  }

  const store = getImageStore()
  let restored = 0
  for (const [name, data] of Object.entries(parsed.images ?? {})) {
    if (typeof data !== 'string' || !data) continue
    await store.write(name, data)
    restored++
  }

  await database.transaction(async (tx: LudokDb) => {
    await tx.delete(cardsTable)
    await tx.delete(ticketsTable)
    if (parsed.cards.length) {
      const cards = withSortOrder(parsed.cards.map(migrateLegacyCard))
      await tx.insert(cardsTable).values(cards.map(cardToRow))
    }
    if (parsed.tickets.length) {
      await tx.insert(ticketsTable).values(parsed.tickets.map(ticketToRow))
    }
    if (parsed.settings) {
      // La contraseña de Nextcloud no viene en la copia (no se exporta), así
      // que se mantiene la que ya hubiera en este móvil.
      const current = await readSettings(tx)
      await writeSettings(tx, {
        ...current,
        ...parsed.settings,
        nextcloudPassword: current.nextcloudPassword,
        id: 'app',
        schemaVersion: SCHEMA_VERSION,
      })
    }
  })

  // Las fotos de lo que había antes ya no las apunta nadie: ocupan sitio para
  // siempre si no se barren aquí.
  await pruneOrphanImages(database)

  return {
    cards: parsed.cards.length,
    tickets: parsed.tickets.length,
    images: restored,
  }
}

/**
 * Borra las fotos que ya no apunta ninguna ficha.
 *
 * Pasa de forma natural al importar una copia y al borrar tarjetas o entradas,
 * y sin esto el almacenamiento de la app solo crece. Se calcula con la lista
 * real de ficheros, no con lo que creemos haber borrado: así también se llevan
 * las que quedaron sueltas por un cierre a destiempo.
 */
export async function pruneOrphanImages(database: LudokDb): Promise<number> {
  const store = getImageStore()
  const stored = await store.list()
  if (!stored.length) return 0

  const cardRows = await database.select().from(cardsTable)
  const ticketRows = await database.select().from(ticketsTable)
  const used = new Set(referencedImages(cardRows.map(rowToCard), ticketRows.map(rowToTicket)))

  let removed = 0
  for (const name of stored) {
    if (used.has(name)) continue
    await store.remove(name)
    removed++
  }
  return removed
}

/** Días transcurridos desde la última copia. null si nunca se hizo. */
export function daysSinceBackup(lastBackup: number): number | null {
  if (!lastBackup) return null
  return Math.floor((Date.now() - lastBackup) / 86_400_000)
}
