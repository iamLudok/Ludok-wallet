/**
 * Base64 sin dependencias, en los dos sentidos.
 *
 * El motor de React Native no trae `btoa`/`atob` de forma fiable, y aquí hacen
 * falta para dos cosas muy distintas: la cabecera de autenticación de Nextcloud
 * (texto) y las fotos de las copias de seguridad (bytes). Está en un módulo
 * propio y puro para poder comprobarlo en el escritorio — un fallo aquí no
 * daría un error, daría fotos corruptas al restaurar, que es peor.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Índice inverso, para decodificar sin buscar con `indexOf` en cada carácter. */
const LOOKUP = (() => {
  const table = new Uint8Array(128).fill(255)
  for (let i = 0; i < ALPHABET.length; i++) table[ALPHABET.charCodeAt(i)] = i
  return table
})()

/** Bytes → base64. */
export function encodeBytes(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1]
    const b2 = bytes[i + 2]
    out += ALPHABET[b0 >> 2]
    out += ALPHABET[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)]
    out += b1 === undefined ? '=' : ALPHABET[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)]
    out += b2 === undefined ? '=' : ALPHABET[b2 & 63]
  }
  return out
}

/**
 * base64 → bytes.
 *
 * Se ignora cualquier carácter que no sea del alfabeto (saltos de línea, y el
 * relleno `=`): algunos servidores devuelven el base64 partido en líneas y
 * rechazarlo por eso sería absurdo.
 */
export function decodeBytes(input: string): Uint8Array {
  // Primera pasada: quedarse solo con los caracteres válidos, para saber
  // cuántos bytes salen antes de reservar el array.
  const codes: number[] = []
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    const value = code < 128 ? LOOKUP[code] : 255
    if (value !== 255) codes.push(value)
  }

  // Cada 4 caracteres son 3 bytes; un resto de 2 o 3 caracteres son 1 o 2 bytes.
  const bytes = new Uint8Array(Math.floor((codes.length * 3) / 4))
  let out = 0
  for (let i = 0; i < codes.length; i += 4) {
    const c0 = codes[i]
    const c1 = codes[i + 1]
    const c2 = codes[i + 2]
    const c3 = codes[i + 3]
    if (c1 !== undefined) bytes[out++] = (c0 << 2) | (c1 >> 4)
    if (c2 !== undefined) bytes[out++] = ((c1 & 15) << 4) | (c2 >> 2)
    if (c3 !== undefined) bytes[out++] = ((c2 & 3) << 6) | c3
  }
  return bytes
}

/**
 * Texto → base64, pasando por UTF-8.
 *
 * El paso por UTF-8 no es opcional: una contraseña con acentos daría puntos de
 * código por encima de 255 y saldría un base64 que el servidor no reconoce.
 */
export function encodeText(text: string): string {
  const utf8 = unescape(encodeURIComponent(text))
  const bytes = new Uint8Array(utf8.length)
  for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i)
  return encodeBytes(bytes)
}
