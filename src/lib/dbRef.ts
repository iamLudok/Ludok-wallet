import type { LudokDb } from './backupCore'

/**
 * Referencia a la base de datos en uso, sin importar nada nativo.
 *
 * La lógica de negocio (`library.ts`, `settings.ts`) pide la base por aquí en
 * vez de crearla ella, para no arrastrar `expo-sqlite` a la cadena de imports.
 * Así esas reglas —guardar una tarjeta, conservar la foto al editar, la ida y
 * vuelta de las copias— se pueden ejecutar y comprobar en el escritorio, que es
 * lo que evita que un fallo ahí aparezca tarde y se confunda con un fallo de la
 * interfaz.
 *
 * En el móvil la registra `db.ts` al arrancar; en las pruebas, el script de
 * verificación con un SQLite de escritorio.
 */
let current: LudokDb | null = null

export function setDb(database: LudokDb): void {
  current = database
}

export function getDb(): LudokDb {
  if (!current) {
    throw new Error('La base de datos no está inicializada (falta llamar a setDb).')
  }
  return current
}
