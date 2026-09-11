/**
 * Lee una imagen o un PDF para sacar de ahí una entrada entera de una vez: el
 * código escaneable (si lo trae) y, con OCR, título/lugar/fecha/precio. Es lo
 * que usa el «+» de Entradas —para no enseñar antes un formulario vacío— y
 * también la hoja de compartir desde la Galería.
 */
import { scanFromURLAsync } from 'expo-camera'
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition'
import { convert as convertPdfToImages } from 'react-native-pdf-to-image'
import { parseTicketOcr } from './ocr'
import { saveImage } from './images'
import type { TicketPrefill } from './ticketPrefillBridge'
import type { CodeFormat } from '../types'

const ALL_FORMATS: CodeFormat[] = [
  'qr', 'code128', 'ean13', 'ean8', 'code39', 'code93',
  'codabar', 'itf14', 'upc_a', 'upc_e', 'pdf417', 'aztec', 'datamatrix',
]

/**
 * `react-native-pdf-to-image` devuelve rutas absolutas «peladas»
 * (`/data/user/0/…/cache/…png`), no URIs — a diferencia de todo lo demás en
 * la app, que trabaja con `file://`. Sin este arreglo, tanto el escáner de
 * códigos como el OCR fallan en silencio sobre las páginas de un PDF.
 */
function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`
}

/** Código y texto de UNA imagen ya en disco (una foto, o una página de PDF ya renderizada). */
async function scanOneImage(uri: string): Promise<TicketPrefill> {
  const prefill: TicketPrefill = {}

  const codes = await scanFromURLAsync(uri, ALL_FORMATS).catch(() => [])
  if (codes.length) {
    prefill.code = codes[0].data
    prefill.codeFormat = codes[0].type as CodeFormat
  }

  const recognized = await TextRecognition.recognize(uri, TextRecognitionScript.LATIN).catch(() => null)
  if (recognized) {
    const parsed = parseTicketOcr(recognized.text)
    prefill.title = parsed.title
    prefill.venue = parsed.venue
    prefill.price = parsed.price
    prefill.eventAt = parsed.eventAt
  }

  return prefill
}

/** Foto o captura ya elegida (galería, cámara o recibida al compartir). */
export async function importTicketFromImage(uri: string): Promise<TicketPrefill> {
  const prefill = await scanOneImage(uri)
  // La propia foto se guarda como la imagen de la entrada: es literalmente el
  // billete, así que no tiene sentido pedirla otra vez dentro del formulario.
  prefill.image = await saveImage(uri)
  return prefill
}

/**
 * PDF elegido: se renderiza página a página (como pasando las hojas) hasta
 * encontrar un código; si ninguna lo trae, se queda con el texto de la
 * primera página, que suele llevar el resumen del evento.
 */
export async function importTicketFromPdf(uri: string): Promise<TicketPrefill> {
  const { outputFiles } = await convertPdfToImages(uri)
  const pages = outputFiles ?? []
  if (!pages.length) {
    throw new Error('No se pudo leer ese PDF.')
  }

  // `pages` no está vacío (se comprobó arriba), así que la primera vuelta
  // del bucle SIEMPRE deja `firstPagePrefill` asignado.
  let firstPagePrefill: TicketPrefill = {}
  for (const [i, rawPage] of pages.entries()) {
    const page = toFileUri(rawPage)
    const prefill = await scanOneImage(page)
    if (i === 0) firstPagePrefill = prefill
    if (prefill.code) {
      prefill.image = await saveImage(page)
      return prefill
    }
  }

  firstPagePrefill.image = await saveImage(toFileUri(pages[0]))
  return firstPagePrefill
}
