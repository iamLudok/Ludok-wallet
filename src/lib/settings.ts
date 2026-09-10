import { eq } from 'drizzle-orm'
import { getDb } from './dbRef'
import { settings as settingsTable } from './schema'
import { DEFAULT_SETTINGS, readSettings, writeSettings } from './backupCore'
import type { Settings } from '../types'

export { DEFAULT_SETTINGS }

/** Lectura sola: devuelve los ajustes guardados o los por defecto (sin escribir). */
export function getSettings(): Promise<Settings> {
  return readSettings(getDb())
}

/** Persiste los ajustes por defecto si aún no existen. Llamar una vez al arrancar. */
export async function ensureSettings(): Promise<void> {
  const db = getDb()
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 'app')).limit(1)
  if (!rows[0]) await writeSettings(db, DEFAULT_SETTINGS)
}

/** Aplica cambios parciales a los ajustes (crea la fila si hace falta). */
export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const current = await getSettings()
  await writeSettings(getDb(), { ...current, ...patch, id: 'app' })
}
