/**
 * Verificación de las reglas de negocio: `saveCard`/`deleteCard`/`saveTicket`/
 * `deleteTicket`. Ejecuta el `library.ts` real (el mismo que corre en el
 * móvil) contra un SQLite de escritorio y un almacén de fotos en memoria,
 * gracias a que ambos se piden por referencia (`dbRef`, `imageRef`).
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
import { useMemoryImageStore } from './imageStoreFixture'
import {
  saveCard,
  deleteCard,
  getCard,
  allTags,
  saveTicket,
  deleteTicket,
  getTicket,
} from '../src/lib/library'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : ' FALLO'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}
function eq<T>(label: string, actual: T, expected: T) {
  check(label, actual === expected, actual === expected ? '' : `esperado ${JSON.stringify(expected)}, salió ${JSON.stringify(actual)}`)
}

const tempFiles: string[] = []
let seq = 0
async function useFreshDb(): Promise<Map<string, string>> {
  const path = join(tmpdir(), `ludovis-lib-${process.pid}-${seq++}.db`)
  rmSync(path, { force: true })
  tempFiles.push(path)
  const client = createClient({ url: `file:${path}` })
  await client.executeMultiple(CREATE_SQL)
  setDb(drizzle(client, { schema }) as unknown as LudokDb)
  return useMemoryImageStore()
}
function cleanup() {
  for (const f of tempFiles) for (const s of ['', '-wal', '-shm']) rmSync(f + s, { force: true })
}

async function main() {
  console.log('\n=== 1. saveCard crea y actualiza ===')
  let files = await useFreshDb()
  const id = await saveCard({ name: 'Café Bilbao', type: 'restaurant', tags: ['Favorito', ' favorito ', 'vip'] })
  let card = await getCard(id)
  eq('nombre guardado', card?.name, 'Café Bilbao')
  eq('etiquetas normalizadas y sin duplicados', card?.tags?.join(','), 'favorito,vip')
  check('addedAt y updatedAt puestos', !!card?.addedAt && card.addedAt === card.updatedAt)

  const firstAddedAt = card!.addedAt
  await new Promise((r) => setTimeout(r, 5))
  await saveCard({ name: 'Café Bilbao Centro', type: 'restaurant', tags: [] }, id)
  card = await getCard(id)
  eq('nombre actualizado', card?.name, 'Café Bilbao Centro')
  eq('addedAt no cambia al editar', card?.addedAt, firstAddedAt)
  check('updatedAt avanza al editar', (card?.updatedAt ?? 0) > firstAddedAt)
  check('etiquetas vacías quedan ausentes, no como lista vacía', card?.tags === undefined)

  console.log('\n=== 2. Editar una tarjeta reemplazando la foto borra la vieja ===')
  files.set('vieja.jpg', 'AAAA')
  await saveCard({ name: 'Con foto', type: 'other', photo: 'vieja.jpg' }, id)
  await saveCard({ name: 'Con foto', type: 'other', photo: 'nueva.jpg' }, id)
  check('la foto vieja se ha borrado del almacén', !files.has('vieja.jpg'))

  console.log('\n=== 3. deleteCard borra la ficha y su foto, si no la usa nadie más ===')
  files.set('nueva.jpg', 'BBBB')
  await deleteCard(id)
  check('la ficha ya no está', !(await getCard(id)))
  check('su foto tampoco', !files.has('nueva.jpg'))

  console.log('\n=== 4. Una foto compartida por error entre dos tarjetas no se borra si otra la sigue usando ===')
  files = await useFreshDb()
  files.set('compartida.jpg', 'CCCC')
  const idA = await saveCard({ name: 'A', type: 'other', photo: 'compartida.jpg' })
  await saveCard({ name: 'B', type: 'other', photo: 'compartida.jpg' })
  await deleteCard(idA)
  check('la foto sigue porque la otra tarjeta la usa', files.has('compartida.jpg'))

  console.log('\n=== 5. allTags junta las etiquetas de todas las tarjetas, sin repetir ===')
  files = await useFreshDb()
  await saveCard({ name: 'Uno', type: 'other', tags: ['ocio', 'cerca'] })
  await saveCard({ name: 'Dos', type: 'other', tags: ['cerca', 'trabajo'] })
  eq('etiquetas únicas y ordenadas', (await allTags()).join(','), 'cerca,ocio,trabajo')

  console.log('\n=== 6. saveTicket crea y actualiza ===')
  files = await useFreshDb()
  const ticketId = await saveTicket({ title: 'Concierto', code: 'XYZ', codeFormat: 'qr' })
  let ticket = await getTicket(ticketId)
  eq('título guardado', ticket?.title, 'Concierto')
  eq('formato guardado', ticket?.codeFormat, 'qr')

  await saveTicket({ title: 'Concierto (cambio de sala)', venue: 'Sala X', code: 'XYZ', codeFormat: 'qr' }, ticketId)
  ticket = await getTicket(ticketId)
  eq('título actualizado', ticket?.title, 'Concierto (cambio de sala)')
  eq('lugar añadido', ticket?.venue, 'Sala X')

  console.log('\n=== 7. Editar una entrada reemplazando la imagen borra la vieja ===')
  files.set('billete-viejo.jpg', 'DDDD')
  await saveTicket({ title: 'X', code: 'X', codeFormat: 'qr', image: 'billete-viejo.jpg' }, ticketId)
  await saveTicket({ title: 'X', code: 'X', codeFormat: 'qr', image: 'billete-nuevo.jpg' }, ticketId)
  check('la imagen vieja se ha borrado', !files.has('billete-viejo.jpg'))

  console.log('\n=== 8. deleteTicket borra la ficha y su imagen ===')
  files.set('billete-nuevo.jpg', 'EEEE')
  await deleteTicket(ticketId)
  check('la entrada ya no está', !(await getTicket(ticketId)))
  check('su imagen tampoco', !files.has('billete-nuevo.jpg'))

  console.log('\n=== 9. Guardar/editar algo que no existe falla con un error claro ===')
  files = await useFreshDb()
  check(
    'editar una tarjeta borrada lanza',
    await rejects(() => saveCard({ name: 'X', type: 'other' }, 'no-existe')),
  )
  check(
    'editar una entrada borrada lanza',
    await rejects(() => saveTicket({ title: 'X', code: 'X', codeFormat: 'qr' }, 'no-existe')),
  )

  cleanup()
  console.log(failures === 0 ? '\n✔ verify:library — todo correcto' : `\n✘ verify:library — ${failures} fallo(s)`)
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
