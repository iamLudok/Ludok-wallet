/**
 * Referencia al almacén de fotos en uso, sin importar nada nativo.
 *
 * Mismo motivo que `dbRef`: las fotos son ficheros y leerlos necesita
 * expo-file-system, que solo existe en el móvil. Si `library.ts` lo importara
 * directamente, dejaría de poder ejecutarse en el escritorio y con ello se
 * perdería la verificación de lo que más duele que falle — que al editar una
 * tarjeta se borre la foto que no tocabas, o que una copia se restaure sin
 * fotos y no te enteres hasta que las necesitas.
 *
 * En el móvil lo registra `images.ts`; en las pruebas, un almacén en memoria.
 */

export interface ImageStore {
  /** Contenido en base64, o `undefined` si el fichero ya no está. */
  read(name: string): Promise<string | undefined>
  write(name: string, base64: string): Promise<void>
  remove(name: string): Promise<void>
  /** Nombres de todo lo guardado. Sirve para localizar fotos huérfanas. */
  list(): Promise<string[]>
}

/**
 * Almacén que no guarda nada. Es el valor por defecto a propósito: así el
 * código que no ha registrado uno (un script, un test que no mira fotos) sigue
 * funcionando en vez de reventar, y lo único que pasa es que no hay fotos.
 */
const NONE: ImageStore = {
  read: async () => undefined,
  write: async () => {},
  remove: async () => {},
  list: async () => [],
}

let current: ImageStore = NONE

export function setImageStore(store: ImageStore): void {
  current = store
}

export function getImageStore(): ImageStore {
  return current
}
