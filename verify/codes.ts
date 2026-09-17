/**
 * Verificación del dibujo de códigos: que los trece formatos codifican sin
 * reventar, que el SVG sale con un `viewBox` válido y que un valor que no
 * encaja en el formato (p. ej. letras en un EAN-13) se rechaza con un error
 * en vez de colarse como un código roto.
 */
import { renderCode, SELECTABLE_CODE_FORMATS, CODE_FORMAT_LABELS } from '../src/lib/codes'
import type { CodeFormat } from '../src/types'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : ' FALLO'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}
function eq<T>(label: string, actual: T, expected: T) {
  check(label, actual === expected, actual === expected ? '' : `esperado ${expected}, salió ${actual}`)
}

// Un valor válido por formato — no todos aceptan cualquier texto.
const VALID_VALUES: Record<CodeFormat, string> = {
  qr: 'https://ludok-wallet.example/entrada/123',
  code128: 'ABC-123-XYZ',
  ean13: '5901234123457',
  ean8: '96385074',
  code39: 'CODE39TEST',
  code93: 'CODE93TEST',
  codabar: 'A123456A',
  itf14: '10012345678902',
  upc_a: '036000291452',
  upc_e: '01234565',
  pdf417: 'Datos de una entrada de prueba',
  aztec: 'Datos de una entrada de prueba',
  datamatrix: 'Datos de una entrada de prueba',
}

async function main() {
  console.log('\n=== 1. Los trece formatos se dibujan sin reventar ===')
  for (const format of Object.keys(VALID_VALUES) as CodeFormat[]) {
    try {
      const rendered = await renderCode(format, VALID_VALUES[format])
      check(`${format} da un SVG`, rendered.svg.startsWith('<svg'))
      check(`${format} tiene proporción positiva`, rendered.aspectRatio > 0)
    } catch (e) {
      check(format, false, e instanceof Error ? e.message : String(e))
    }
  }

  console.log('\n=== 2. Un valor que no encaja en el formato lanza, no se cuela ===')
  check('EAN-13 con letras lanza', await throws(() => renderCode('ean13', 'no-son-digitos')))
  check('UPC-A con pocos dígitos lanza', await throws(() => renderCode('upc_a', '123')))
  check('código vacío lanza', await throws(() => renderCode('qr', '')))
  check('código en blanco lanza', await throws(() => renderCode('qr', '   ')))

  console.log('\n=== 3. Formatos seleccionables ===')
  eq('seis formatos para elegir a mano', SELECTABLE_CODE_FORMATS.length, 6)
  for (const f of SELECTABLE_CODE_FORMATS) {
    check(`«${f}» tiene etiqueta`, !!CODE_FORMAT_LABELS[f])
  }

  console.log('\n=== 4. Todas las etiquetas cubren todos los formatos ===')
  eq('trece etiquetas', Object.keys(CODE_FORMAT_LABELS).length, 13)

  console.log(failures === 0 ? '\n✔ verify:codes — todo correcto' : `\n✘ verify:codes — ${failures} fallo(s)`)
  process.exit(failures === 0 ? 0 : 1)
}

async function throws(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn()
    return false
  } catch {
    return true
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
