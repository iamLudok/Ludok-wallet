/**
 * Códigos escaneables: formatos, y su dibujo como SVG.
 *
 * `bwip-js` es la única dependencia para esto y hace las dos cosas — codifica
 * Y dibuja — sin canvas: `toSVG` genera directamente una cadena SVG en JS puro,
 * así que sirve igual en el móvil que en Node. Eso evita depender de una
 * librería nativa de dibujo (la razón de que Flutter necesitara
 * `barcode_widget`) y de paso cubre los trece formatos con una sola pieza.
 *
 * Para ESCANEAR no hace falta traducir nada: los formatos de expo-camera
 * (`BarcodeType`) son exactamente las claves de `CodeFormat` de abajo.
 *
 * Se importa `bwip-js/generic` y NO `bwip-js` a secas. La entrada normal del
 * paquete resuelve, en React Native, a una build que al cargarse decodifica
 * en base64 (vía un polyfill de `Buffer`) una fuente por defecto que aquí no
 * hace falta — no se pinta texto legible en ningún código, todo va con
 * `includetext: false` — y ese polyfill revienta bajo Hermes con un críptico
 * «Cannot read property 'slice' of null» antes de que se ejecute nada nuestro.
 * `/generic` decodifica esa misma fuente a mano, sin `Buffer`, y no revienta.
 *
 * Y se importa de forma DINÁMICA (`import()`), no estática. Ese subcamino del
 * paquete solo declara condición `import` en su `package.json` (no `require`):
 * como este proyecto no es ESM puro, un `import` estático se transpila a
 * `require()` y Node lo rechaza con «Package subpath './generic' is not
 * defined by exports» — pero un `import()` dinámico sí usa el resolutor ESM de
 * verdad y lo encuentra. Se guarda en caché tras la primera carga.
 */
import type { CodeFormat } from '../types'

/**
 * Los tipos que trae el paquete describen `bwip-js/generic` al estilo CommonJS
 * (`export =`), pero en tiempo de ejecución es un módulo ESM de verdad con
 * `export default {…}` — de ahí este tipo mínimo escrito a mano en vez de usar
 * el que trae el paquete, que no encaja con lo que realmente devuelve.
 */
interface BwipGenericModule {
  default: { toSVG(opts: Record<string, unknown>): string }
}

let bwipPromise: Promise<BwipGenericModule> | null = null
function loadBwip(): Promise<BwipGenericModule> {
  bwipPromise ??= import('bwip-js/generic') as unknown as Promise<BwipGenericModule>
  return bwipPromise
}

/** Nombre de símbolo de bwip-js para cada formato. No todos coinciden con la clave. */
const BCID: Record<CodeFormat, string> = {
  qr: 'qrcode',
  code128: 'code128',
  ean13: 'ean13',
  ean8: 'ean8',
  code39: 'code39',
  code93: 'code93',
  codabar: 'rationalizedCodabar',
  itf14: 'itf14',
  upc_a: 'upca',
  upc_e: 'upce',
  pdf417: 'pdf417',
  aztec: 'azteccode',
  datamatrix: 'datamatrix',
}

/** Etiqueta en castellano de cada formato, para el desplegable y el detalle. */
export const CODE_FORMAT_LABELS: Record<CodeFormat, string> = {
  qr: 'QR',
  code128: 'Code 128',
  ean13: 'EAN-13',
  ean8: 'EAN-8',
  code39: 'Code 39',
  code93: 'Code 93',
  codabar: 'Codabar',
  itf14: 'ITF-14',
  upc_a: 'UPC-A',
  upc_e: 'UPC-E',
  pdf417: 'PDF417',
  aztec: 'Aztec',
  datamatrix: 'Data Matrix',
}

/**
 * Los que se ofrecen al escribir un código a mano. El resto solo aparecen si
 * los trae un código ya escaneado — elegir «Codabar» o «UPC-E» a ciegas para
 * teclear un valor es más confuso que útil.
 */
export const SELECTABLE_CODE_FORMATS: CodeFormat[] = [
  'qr',
  'code128',
  'ean13',
  'code39',
  'pdf417',
  'aztec',
]

export interface RenderedCode {
  svg: string
  /** Proporción ancho/alto del dibujo, la que le corresponda a ESE código en
   * concreto — un PDF417 sale rectangular y un QR cuadrado sin tener que
   * decidirlo a mano por formato. */
  aspectRatio: number
}

/**
 * Dibuja un código como SVG. Puede lanzar: no todos los formatos aceptan
 * cualquier texto (EAN-13 exige 12-13 dígitos con checksum válido, por
 * ejemplo), y quien llama es quien decide qué mostrar en ese caso — un error
 * al guardar, un aviso en el detalle…
 */
export async function renderCode(format: CodeFormat, data: string): Promise<RenderedCode> {
  if (!data.trim()) throw new Error('El código está vacío.')

  const bwipjs = (await loadBwip()).default
  const svg = bwipjs.toSVG({
    bcid: BCID[format],
    text: data,
    includetext: false,
    backgroundcolor: 'ffffff',
    paddingwidth: 8,
    paddingheight: 8,
  })

  const match = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  const width = match ? Number(match[1]) : 1
  const height = match ? Number(match[2]) : 1

  return { svg, aspectRatio: height > 0 ? width / height : 1 }
}
