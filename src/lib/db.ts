// Único punto donde se toca expo-sqlite. El resto de la lógica pide la base de
// datos a `dbRef`, para que se pueda ejecutar también en el escritorio.
import * as SQLite from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite'
import * as schema from './schema'
import { CREATE_SQL, MIGRATIONS, DB_VERSION } from './schemaSql'
import { setDb } from './dbRef'

export { SCHEMA_VERSION } from './version'
export { newId } from './ids'

/**
 * `enableChangeListener` es imprescindible: es lo que hace que `useLiveQuery`
 * de Drizzle se entere de los cambios y vuelva a pintar las pantallas solo.
 */
export const sqlite = SQLite.openDatabaseSync('ludovis.db', {
  enableChangeListener: true,
})

export const db = drizzle(sqlite, { schema })

setDb(db)

/**
 * El esquema se crea de forma SÍNCRONA al importar este módulo, no en un efecto.
 *
 * Es importante: el proveedor de tema lee los ajustes en el PRIMER render, antes
 * de que ningún `useEffect` haya podido correr. Si las tablas se crearan en un
 * efecto, la primera vez que se abre la app recién instalada esa consulta
 * fallaría con «no such table». Son tres CREATE TABLE IF NOT EXISTS: el coste de
 * hacerlo síncrono es despreciable al lado de esa clase de carrera.
 */
function migrateSync(): void {
  // WAL: menos riesgo de corrupción y mejor concurrencia de lectura/escritura.
  sqlite.execSync('PRAGMA journal_mode = WAL;')
  const row = sqlite.getFirstSync<{ user_version: number }>('PRAGMA user_version')
  const current = row?.user_version ?? 0
  if (current >= DB_VERSION) return

  // Las tablas se crean con IF NOT EXISTS y ya describen el esquema actual:
  // en una instalación nueva esto lo deja todo listo de una vez.
  sqlite.execSync(CREATE_SQL)

  // En una base que ya existía, aplicar solo los cambios que le falten. Empieza
  // en `current` (que vale 0 en una base nueva, donde CREATE_SQL ya lo hizo
  // todo y estos ALTER se saltan porque la versión ya queda al día).
  if (current > 0) {
    for (const step of MIGRATIONS.slice(current - 1)) {
      // execSync admite varias sentencias: algún paso necesita un ALTER y un
      // UPDATE que lo acompañe.
      sqlite.execSync(step)
    }
  }

  sqlite.execSync(`PRAGMA user_version = ${DB_VERSION}`)
}

migrateSync()
