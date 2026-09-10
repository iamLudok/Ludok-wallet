/**
 * Almacén de fotos en memoria, para probar en Node el ciclo de vida de los
 * ficheros (guardar, leer, podar huérfanos…) sin tocar el disco de verdad ni
 * depender de expo-file-system, que solo funciona en el móvil.
 */
import { setImageStore, type ImageStore } from '../src/lib/imageRef'

export function useMemoryImageStore(): Map<string, string> {
  const files = new Map<string, string>()
  const store: ImageStore = {
    async read(name) {
      return files.get(name)
    },
    async write(name, base64) {
      files.set(name, base64)
    },
    async remove(name) {
      files.delete(name)
    },
    async list() {
      return [...files.keys()]
    },
  }
  setImageStore(store)
  return files
}
