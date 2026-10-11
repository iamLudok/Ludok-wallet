/**
 * Verificación de la capa de copias de seguridad: la ida y vuelta de los
 * datos Y de las fotos. Ejecuta el MISMO `backupCore` que corre en el móvil,
 * pero contra un SQLite de escritorio y un almacén de fotos en memoria.
 *
 * Fichero de verificación, no forma parte de la app.
 */
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import * as schema from '../src/lib/schema'
import { CREATE_SQL } from '../src/lib/schemaSql'
import { setDb } from '../src/lib/dbRef'
import type { LudokDb } from '../src/lib/backupCore'
import { exportAll, importAll, readSettings, writeSettings, SCHEMA_VERSION } from '../src/lib/backupCore'
import { useMemoryImageStore } from './imageStoreFixture'
import { cardToRow, ticketToRow } from '../src/lib/rows'
import { cards as cardsTable, tickets as ticketsTable } from '../src/lib/schema'
import type { Card, Ticket } from '../src/types'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : ' FALLO'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}
function eq<T>(label: string, actual: T, expected: T) {
  check(label, actual === expected, actual === expected ? '' : `esperado ${JSON.stringify(expected)}, salió ${JSON.stringify(actual)}`)
}

const tempFiles: string[] = []
let dbSeq = 0
async function freshDb(): Promise<LudokDb> {
  const path = join(tmpdir(), `ludok-wallet-verify-${process.pid}-${dbSeq++}.db`)
  rmSync(path, { force: true })
  tempFiles.push(path)
  const client = createClient({ url: `file:${path}` })
  await client.executeMultiple(CREATE_SQL)
  const db = drizzle(client, { schema }) as unknown as LudokDb
  setDb(db)
  return db
}
function cleanup() {
  for (const f of tempFiles) for (const s of ['', '-wal', '-shm']) rmSync(f + s, { force: true })
}

function sampleCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    name: 'Restaurante Prueba',
    type: 'restaurant',
    photo: 'foto-anverso.jpg',
    photoBack: 'foto-reverso.jpg',
    phones: ['600123456'],
    tags: ['favorito', 'vip'],
    sortOrder: 0,
    addedAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  }
}

function sampleTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 'ticket-1',
    title: 'Concierto de prueba',
    code: 'ABC123',
    codeFormat: 'qr',
    image: 'entrada.jpg',
    addedAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  }
}

async function main() {
  console.log('\n=== 1. Copia de una base vacía ===')
  let db = await freshDb()
  useMemoryImageStore()
  let backup = await exportAll(db)
  eq('app', backup.app, 'ludok-wallet')
  eq('schemaVersion', backup.schemaVersion, SCHEMA_VERSION)
  eq('sin tarjetas', backup.cards.length, 0)
  eq('sin entradas', backup.tickets.length, 0)
  check('settings por defecto', backup.settings?.theme === 'system')

  console.log('\n=== 2. Copia con tarjetas, entradas y fotos ===')
  db = await freshDb()
  const files = useMemoryImageStore()
  files.set('foto-anverso.jpg', 'QU5WRVJTTw==')
  files.set('foto-reverso.jpg', 'UkVWRVJTTw==')
  files.set('entrada.jpg', 'RU5UUkFEQQ==')
  await db.insert(cardsTable).values(cardToRow(sampleCard()))
  await db.insert(ticketsTable).values(ticketToRow(sampleTicket()))
  await writeSettings(db, {
    id: 'app',
    theme: 'dark',
    lastBackup: 0,
    schemaVersion: SCHEMA_VERSION,
    nextcloudPassword: 'secreta',
  })

  backup = await exportAll(db)
  eq('una tarjeta', backup.cards.length, 1)
  eq('una entrada', backup.tickets.length, 1)
  eq('tres fotos', Object.keys(backup.images ?? {}).length, 3)
  eq('foto correcta', backup.images?.['foto-anverso.jpg'], 'QU5WRVJTTw==')
  check('la contraseña de Nextcloud NO se exporta', backup.settings?.nextcloudPassword === undefined)
  eq('el tema sí se exporta', backup.settings?.theme, 'dark')

  console.log('\n=== 3. Importar en una base y un almacén nuevos, en blanco ===')
  const raw = JSON.stringify(backup)
  db = await freshDb()
  const freshFiles = useMemoryImageStore()
  const result = await importAll(db, raw)
  eq('tarjetas importadas', result.cards, 1)
  eq('entradas importadas', result.tickets, 1)
  eq('fotos importadas', result.images, 3)
  eq('la foto llega intacta', freshFiles.get('foto-anverso.jpg'), 'QU5WRVJTTw==')

  const restored = await exportAll(db)
  eq('la tarjeta vuelve igual', restored.cards[0]?.name, 'Restaurante Prueba')
  eq('las etiquetas vuelven', restored.cards[0]?.tags?.join(','), 'favorito,vip')

  console.log('\n=== 4. Importar conserva la contraseña de Nextcloud que ya hubiera ===')
  db = await freshDb()
  useMemoryImageStore()
  await writeSettings(db, {
    id: 'app',
    theme: 'system',
    lastBackup: 0,
    schemaVersion: SCHEMA_VERSION,
    nextcloudPassword: 'la-de-este-móvil',
  })
  await importAll(db, raw)
  const settingsAfter = await readSettings(db)
  eq('contraseña intacta', settingsAfter.nextcloudPassword, 'la-de-este-móvil')
  eq('pero el tema sí se actualiza con el de la copia', settingsAfter.theme, 'dark')

  console.log('\n=== 5. Rechaza lo que no debe entrar ===')
  db = await freshDb()
  useMemoryImageStore()
  check('JSON inválido', await rejects(() => importAll(db, '{ esto no es json')))
  check('app distinta', await rejects(() => importAll(db, JSON.stringify({ app: 'otra-app', schemaVersion: 1, cards: [], tickets: [] }))))
  check(
    'versión futura',
    await rejects(() => importAll(db, JSON.stringify({ app: 'ludok-wallet', schemaVersion: SCHEMA_VERSION + 1, cards: [], tickets: [] }))),
  )

  console.log('\n=== 6. Una foto que falta en disco no rompe la copia ===')
  db = await freshDb()
  const missingFiles = useMemoryImageStore()
  await db.insert(cardsTable).values(cardToRow(sampleCard({ id: 'card-2', photo: 'no-existe.jpg', photoBack: undefined })))
  missingFiles.clear() // la ficha apunta a una foto que ya no está en el almacén
  const backupMissing = await exportAll(db)
  eq('la copia sale igual, sin esa foto', Object.keys(backupMissing.images ?? {}).length, 0)
  eq('pero la ficha sigue en la copia', backupMissing.cards.length, 1)

  console.log('\n=== 7. Importar una copia nueva poda las fotos que ya no usa nadie ===')
  db = await freshDb()
  const pruneFiles = useMemoryImageStore()
  await db.insert(cardsTable).values(cardToRow(sampleCard({ id: 'card-old', photo: 'vieja.jpg', photoBack: undefined })))
  pruneFiles.set('vieja.jpg', 'Vieja')
  await importAll(db, raw) // la copia de la sección 2, que no menciona 'vieja.jpg'
  check('la foto de la tarjeta reemplazada se ha podado', !pruneFiles.has('vieja.jpg'))
  check('las fotos de la copia importada siguen ahí', pruneFiles.has('foto-anverso.jpg'))

  console.log('\n=== 8. Importar una copia de antes de la v2 migra phone/phone2/address y «hotel» ===')
  db = await freshDb()
  useMemoryImageStore()
  const legacyRaw = JSON.stringify({
    app: 'ludok-wallet',
    schemaVersion: 1,
    exportedAt: 1_700_000_000_000,
    cards: [
      {
        id: 'legacy-1',
        name: 'Hotel Antiguo',
        type: 'hotel',
        phone: '944111222',
        phone2: '600333444',
        address: 'Gran Vía 1, 48001 Bilbao',
        addedAt: 1,
        updatedAt: 1,
      },
      {
        id: 'legacy-2',
        name: 'Bar Antiguo',
        type: 'other',
        addedAt: 1,
        updatedAt: 1,
      },
    ],
    tickets: [],
    settings: null,
  })
  await importAll(db, legacyRaw)
  const legacy = await exportAll(db)
  const legacyByName = new Map(legacy.cards.map((c) => [c.name, c]))
  eq('el tipo «hotel» se migra a «lodging»', legacyByName.get('Hotel Antiguo')?.type, 'lodging')
  eq('los dos teléfonos se juntan en la lista', legacyByName.get('Hotel Antiguo')?.phones?.join(','), '944111222,600333444')
  eq('la dirección pasa a lista de una', legacyByName.get('Hotel Antiguo')?.addresses?.join(','), 'Gran Vía 1, 48001 Bilbao')
  eq('sin sortOrder en la copia: se asigna por nombre — «Bar» va antes', legacyByName.get('Bar Antiguo')?.sortOrder, 0)
  eq('y «Hotel» detrás', legacyByName.get('Hotel Antiguo')?.sortOrder, 1)

  cleanup()
  console.log(failures === 0 ? '\n✔ verify:data — todo correcto' : `\n✘ verify:data — ${failures} fallo(s)`)
  process.exit(failures === 0 ? 0 : 1)
}

async function rejects(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn()
    return false
  } catch {
    return true
  }
}

main().catch((e) => {
  console.error(e)
  cleanup()
  process.exit(1)
})
