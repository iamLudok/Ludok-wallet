import type { CodeFormat } from '../types'

/**
 * Canal de un solo uso entre la pantalla de escaneo y el formulario que la
 * abrió. `expo-router` no tiene un equivalente directo al
 * `Navigator.pop(resultado)` de Flutter: volver atrás pasando parámetros por
 * la URL obligaría a reconstruir el formulario entero desde la ruta, perdiendo
 * cualquier campo que el usuario ya hubiera escrito (título, lugar, notas…).
 *
 * Con esto el formulario se suscribe al abrir el escáner y el escáner solo
 * avisa; el resto del formulario no se entera de nada.
 */
type ScanListener = (code: string, format: CodeFormat) => void

let listener: ScanListener | null = null

export function setScanListener(fn: ScanListener | null): void {
  listener = fn
}

export function emitScan(code: string, format: CodeFormat): void {
  listener?.(code, format)
}
