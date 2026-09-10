// Capa nativa de las fotos: fichero y carpeta privada de la app.
//
// Aparte de `library.ts` (que decide CUÁNDO se guarda o se borra una foto) para
// que esa lógica se pueda probar en el escritorio: aquí solo hay E/S de
// ficheros con expo-file-system, sin ninguna regla de negocio.
import { Directory, File, Paths } from 'expo-file-system'
import { newId } from './ids'
import { setImageStore, type ImageStore } from './imageRef'

/**
 * Carpeta privada de la app donde viven las fotos. En la base de datos solo se
 * guarda el NOMBRE del fichero (ver `types.ts`): la ruta absoluta cambia entre
 * instalaciones y entre móviles, así que guardarla haría que las fotos
 * «desaparecieran» al restaurar una copia en otro dispositivo.
 */
const imagesDir = new Directory(Paths.document, 'images')

function ensureDir(): void {
  if (!imagesDir.exists) imagesDir.create({ intermediates: true })
}

/** URI de fichero para mostrar una foto ya guardada (p. ej. en `<Image source={{ uri }}>`). */
export function imageUri(name: string): string {
  return new File(imagesDir, name).uri
}

/**
 * Copia una foto recién elegida (cámara, galería o recorte) al almacenamiento
 * privado y devuelve el nombre con el que queda guardada.
 *
 * Genera un nombre nuevo en vez de reutilizar el de origen: dos fotos elegidas
 * en momentos distintos pueden llamarse igual (p. ej. "IMG_001.jpg" de dos
 * cámaras distintas) y una pisaría a la otra.
 */
export async function saveImage(sourceUri: string): Promise<string> {
  ensureDir()
  const source = new File(sourceUri)
  const ext = source.extension || '.jpg'
  const name = `${newId()}${ext}`
  await source.copy(new File(imagesDir, name))
  return name
}

const store: ImageStore = {
  async read(name) {
    const file = new File(imagesDir, name)
    if (!file.exists) return undefined
    return await file.base64()
  },
  async write(name, base64) {
    ensureDir()
    const file = new File(imagesDir, name)
    file.create({ intermediates: true, overwrite: true })
    file.write(base64, { encoding: 'base64' })
  },
  async remove(name) {
    const file = new File(imagesDir, name)
    if (file.exists) file.delete()
  },
  async list() {
    ensureDir()
    return imagesDir
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .map((file) => file.name)
  },
}

setImageStore(store)
