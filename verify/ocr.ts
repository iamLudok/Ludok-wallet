/**
 * Verificación del parser de OCR: texto de ejemplo (el que devolvería el
 * reconocedor de texto sobre una foto real) → campos extraídos. Pura lógica de
 * expresiones regulares, sin nada nativo — por eso se prueba en Node sin más.
 */
import { parseCardOcr, mergeCardOcr, parseTicketOcr } from '../src/lib/ocr'

let failures = 0
function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? '  ok  ' : ' FALLO'} ${label}${detail ? ' — ' + detail : ''}`)
  if (!ok) failures++
}
function eq<T>(label: string, actual: T, expected: T) {
  check(label, actual === expected, actual === expected ? '' : `esperado ${JSON.stringify(expected)}, salió ${JSON.stringify(actual)}`)
}

function main() {
  console.log('\n=== 1. Tarjeta: caso típico ===')
  const card1 = parseCardOcr(
    [
      'RESTAURANTE EL RINCÓN',
      'Calle Mayor 12, 48005 Bilbao',
      'Tel: 944 123 456',
      'info@elrincon.com',
      'www.elrincon.com',
      '@elrincon_bilbao',
    ].join('\n'),
  )
  eq('teléfono', card1.phone, '944 123 456')
  eq('email', card1.email, 'info@elrincon.com')
  eq('dirección', card1.address, 'Calle Mayor 12, 48005 Bilbao')
  eq('web (no se confunde con el email)', card1.website, 'www.elrincon.com')
  eq('instagram', card1.social, '@elrincon_bilbao')

  console.log('\n=== 2. Tarjeta: sin nada reconocible ===')
  const card2 = parseCardOcr('Hola\nqué tal\nnada de esto vale')
  check('sin teléfono', card2.phone === undefined)
  check('sin email', card2.email === undefined)
  check('sin dirección', card2.address === undefined)

  console.log('\n=== 3. Tarjeta: un teléfono demasiado corto no cuenta ===')
  const card3 = parseCardOcr('código 12345')
  check('cinco dígitos no es teléfono', card3.phone === undefined)

  console.log('\n=== 4. mergeCardOcr da prioridad al primero ===')
  const merged = mergeCardOcr({ phone: '111', rawText: 'a' }, { phone: '222', email: 'x@x.com', rawText: 'b' })
  eq('el teléfono del primero gana', merged.phone, '111')
  eq('el email del segundo se cuela porque el primero no lo tenía', merged.email, 'x@x.com')
  eq('el texto bruto se concatena', merged.rawText, 'a\nb')

  console.log('\n=== 5. Entrada: fecha larga en español, con hora ===')
  const t1 = parseTicketOcr(
    ['CONCIERTO DE PRUEBA', 'Sala Apolo', '14 de junio de 2026', '21:30 h', '25,00 €'].join('\n'),
  )
  eq('título', t1.title, 'CONCIERTO DE PRUEBA')
  eq('lugar', t1.venue, 'Sala Apolo')
  eq('precio', t1.price, '25,00 €')
  check('fecha detectada', t1.eventAt !== undefined)
  if (t1.eventAt !== undefined) {
    const d = new Date(t1.eventAt)
    eq('día', d.getDate(), 14)
    eq('mes (junio = índice 5)', d.getMonth(), 5)
    eq('año', d.getFullYear(), 2026)
    eq('hora', d.getHours(), 21)
    eq('minuto', d.getMinutes(), 30)
  }

  console.log('\n=== 6. Entrada: fecha corta ===')
  const t2 = parseTicketOcr('ENTRADA TEATRO\n14/06/2026\n20:00')
  check('fecha corta detectada', t2.eventAt !== undefined)
  if (t2.eventAt !== undefined) {
    const d = new Date(t2.eventAt)
    eq('día', d.getDate(), 14)
    eq('mes', d.getMonth(), 5)
    eq('año', d.getFullYear(), 2026)
  }

  console.log('\n=== 7. Entrada: año de dos cifras se interpreta como 20XX ===')
  const t3 = parseTicketOcr('EVENTO\n14-06-26')
  if (t3.eventAt !== undefined) {
    eq('año completado', new Date(t3.eventAt).getFullYear(), 2026)
  } else {
    check('debería haber detectado fecha', false)
  }

  console.log('\n=== 8. Entrada: el título no puede ser el precio ni la fecha ni solo números ===')
  const t4 = parseTicketOcr('12345\n25,00 €\n14/06/2026\nFESTIVAL DE VERANO')
  eq('salta las líneas no válidas y coge el título real', t4.title, 'FESTIVAL DE VERANO')

  console.log(failures === 0 ? '\n✔ verify:ocr — todo correcto' : `\n✘ verify:ocr — ${failures} fallo(s)`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
