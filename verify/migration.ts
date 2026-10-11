/**
 * Verificación de que crear/migrar el esquema es idempotente.
 *
 * Con MIGRATIONS vacío (el esquema nace en v1) esto es fino de momento, pero
 * es la red de seguridad que hace falta tener puesta ANTES de que MIGRATIONS
 * tenga su primer paso real — igual que en Ludok Time y Ludok Been.
 */
import { createClient } from '@libsql/client'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { CREATE_SQL, MIGRATIONS, DB_VERSION } from '../src/lib/schemaSql'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : ' FALLO'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}
function eq<T>(label: string, actual: T, expected: T) {
  check(label, actual === expected, actual === expected ? '' : `esperado ${expected}, salió ${actual}`)
}

async function main() {
  const path = join(tmpdir(), `ludok-wallet-migration-${process.pid}.db`)
  rmSync(path, { force: true })
  const client = createClient({ url: `file:${path}` })

  console.log('\n=== 1. Crear el esquema en una base nueva ===')
  await client.executeMultiple(CREATE_SQL)
  await client.execute(
    'INSERT INTO cards (id, name, type, tags, addedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    ['c1', 'Prueba', 'other', null, 1_700_000_000_000, 1_700_000_000_000],
  )
  await client.execute(
    'INSERT INTO tickets (id, title, code, codeFormat, addedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    ['t1', 'Prueba', 'ABC', 'qr', 1_700_000_000_000, 1_700_000_000_000],
  )
  const rows1 = await client.execute('SELECT * FROM cards')
  eq('una tarjeta insertada', rows1.rows.length, 1)

  console.log('\n=== 2. Re-ejecutar CREATE_SQL no destruye datos (IF NOT EXISTS) ===')
  await client.executeMultiple(CREATE_SQL)
  const rows2 = await client.execute('SELECT * FROM cards')
  eq('la fila sigue ahí', rows2.rows.length, 1)
  const rows2b = await client.execute('SELECT * FROM tickets')
  eq('y la entrada también', rows2b.rows.length, 1)

  console.log('\n=== 3. DB_VERSION coincide con MIGRATIONS.length + 1 ===')
  eq('DB_VERSION', DB_VERSION, MIGRATIONS.length + 1)

  console.log('\n=== 4. user_version se puede fijar y volver a leer ===')
  await client.execute(`PRAGMA user_version = ${DB_VERSION}`)
  const uv = await client.execute('PRAGMA user_version')
  eq('user_version guardado', Number(uv.rows[0]?.user_version ?? -1), DB_VERSION)

  console.log('\n=== 5. Los índices existen (no fallan al usarse en una consulta) ===')
  await client.execute('SELECT * FROM cards WHERE type = ? ORDER BY name', ['other'])
  await client.execute('SELECT * FROM tickets ORDER BY eventAt')
  check('las consultas con los índices no fallan', true)

  for (const s of ['', '-wal', '-shm']) rmSync(path + s, { force: true })

  console.log('\n=== 6. v1 → v4: teléfonos/dirección a listas, «hotel» a «lodging», orden manual y columnas del mapa ===')
  const oldPath = join(tmpdir(), `ludok-wallet-migration-old-${process.pid}.db`)
  rmSync(oldPath, { force: true })
  const oldClient = createClient({ url: `file:${oldPath}` })
  // El esquema tal cual quedaba en v1, antes de este cambio: sin las columnas nuevas.
  await oldClient.executeMultiple(`
    CREATE TABLE cards (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      photo TEXT,
      photoBack TEXT,
      phone TEXT,
      phone2 TEXT,
      email TEXT,
      address TEXT,
      website TEXT,
      social TEXT,
      tags TEXT,
      addedAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `)
  await oldClient.execute(
    `INSERT INTO cards (id, name, type, phone, phone2, address, addedAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['c1', 'Hotel Ejemplo', 'hotel', '944111222', '600333444', 'Gran Vía 1, 48001 Bilbao', 1, 1],
  )
  await oldClient.execute(
    `INSERT INTO cards (id, name, type, addedAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    ['c2', 'Sin datos de contacto', 'other', 1, 1],
  )
  await oldClient.execute(`PRAGMA user_version = 1`)

  for (const step of MIGRATIONS) await oldClient.executeMultiple(step)
  await oldClient.execute(`PRAGMA user_version = ${DB_VERSION}`)

  const migrated = await oldClient.execute('SELECT id, name, type, phones, addresses, sortOrder, lat, lng FROM cards ORDER BY id')
  const c1 = migrated.rows[0] as unknown as {
    type: string; phones: string; addresses: string; sortOrder: number; lat: number | null; lng: number | null
  }
  const c2 = migrated.rows[1] as unknown as {
    type: string; phones: string | null; addresses: string | null; sortOrder: number; lat: number | null; lng: number | null
  }
  eq('el tipo «hotel» pasa a «lodging»', c1.type, 'lodging')
  eq('los dos teléfonos fijos se juntan en la lista', JSON.parse(c1.phones).join(','), '944111222,600333444')
  eq('la dirección fija pasa a lista de una', JSON.parse(c1.addresses).join(','), 'Gran Vía 1, 48001 Bilbao')
  check('una tarjeta sin teléfono ni dirección no gana listas vacías', c2.phones === null && c2.addresses === null)
  eq('orden manual: «Hotel Ejemplo» va antes que «Sin datos de contacto»', c1.sortOrder, 0)
  eq('y esta última la segunda', c2.sortOrder, 1)
  check('lat/lng nacen vacías: las rellena el mapa, no la migración', c1.lat === null && c1.lng === null)

  for (const s of ['', '-wal', '-shm']) rmSync(oldPath + s, { force: true })

  console.log(failures === 0 ? '\n✔ verify:migration — todo correcto' : `\n✘ verify:migration — ${failures} fallo(s)`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
