/**
 * Extrae campos estructurados del texto bruto que devuelve el reconocedor de
 * texto sobre la foto de una tarjeta o de una entrada.
 *
 * Pura lógica de expresiones regulares, sin nada nativo: por eso vive aparte de
 * quien la llama (`app/tarjeta/formulario.tsx`, que sí habla con
 * `@react-native-ml-kit/text-recognition`) y se puede probar en el escritorio
 * con textos de ejemplo en `verify/ocr.ts`.
 */

/* --- Tarjetas ---------------------------------------------------------------- */

export interface OcrCardResult {
  phone?: string
  address?: string
  website?: string
  email?: string
  social?: string
  rawText: string
}

/** Fusiona dos resultados (anverso + reverso), dando prioridad al primero. */
export function mergeCardOcr(a: OcrCardResult, b: OcrCardResult): OcrCardResult {
  return {
    phone: a.phone ?? b.phone,
    address: a.address ?? b.address,
    website: a.website ?? b.website,
    email: a.email ?? b.email,
    social: a.social ?? b.social,
    rawText: `${a.rawText}\n${b.rawText}`.trim(),
  }
}

const PHONE_RE = /(\+?\d[\d\s\-.]{6,14}\d)/
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/i
const URL_RE = /((?:https?:\/\/)?(?:www\.)?[\w-]+\.[a-zA-Z]{2,}(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)/i
// Separado en dos: el de palabra clave es inequívoco («instagram.com/…»), pero
// el de «@usuario» a secas también casa con el trozo «@dominio.com» de un
// email — si se usa en la misma línea que ya dio un email, se descarta.
const SOCIAL_KEYWORD_RE = /(?:instagram|facebook|twitter|linkedin|tiktok|whatsapp|youtube|x\.com)[^\s]*/i
const SOCIAL_HANDLE_RE = /@[\w.]+/
const ADDRESS_RE = /(?:c\/?\.?|calle|avda?\.?|avenida|plaza|pza?\.?|paseo|ps\.?|carretera|ctra\.?)\s+\S/i
const ZIP_RE = /\b\d{5}\b/

export function parseCardOcr(text: string): OcrCardResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let phone: string | undefined
  let address: string | undefined
  let website: string | undefined
  let email: string | undefined
  let social: string | undefined

  for (const line of lines) {
    const lineHasEmail = EMAIL_RE.test(line)

    if (!email) {
      const m = EMAIL_RE.exec(line)
      if (m) email = m[0]
    }

    if (!social) {
      const kw = SOCIAL_KEYWORD_RE.exec(line)
      if (kw) {
        social = kw[0]
      } else if (!lineHasEmail) {
        // Sin esta condición, «@dominio.com» dentro de un email de la MISMA
        // línea se cuela como si fuera un usuario de Instagram.
        const handle = SOCIAL_HANDLE_RE.exec(line)
        if (handle) social = handle[0]
      }
    }

    if (!phone) {
      const m = PHONE_RE.exec(line)
      if (m) {
        const candidate = m[1].replace(/\s+/g, ' ').trim()
        if (candidate.replace(/\D/g, '').length >= 7) phone = candidate
      }
    }

    // Por línea, no por si YA se encontró un email en OTRA línea: si no, un
    // email en la primera línea de la tarjeta bloqueaba la web aunque
    // estuviera en una línea aparte, más abajo.
    if (!website && !lineHasEmail) {
      const m = URL_RE.exec(line)
      if (m) {
        const candidate = m[1]
        if (candidate.includes('.') && !/^\d/.test(candidate) && !candidate.includes('@')) {
          website = candidate
        }
      }
    }

    if (!address && (ADDRESS_RE.test(line) || ZIP_RE.test(line))) {
      address = line
    }
  }

  return { phone, address, website, email, social, rawText: text }
}

/* --- Entradas ---------------------------------------------------------------- */

export interface OcrTicketResult {
  title?: string
  /** epoch ms, o undefined si no se detectó fecha. */
  eventAt?: number
  venue?: string
  price?: string
  rawText: string
}

// Precio: 12€ | €12 | 12,50 EUR | precio: 12.50
const PRICE_RE = /(?:€\s*\d+[.,]?\d*|\d+[.,]\d{2}\s*€|\d+\s*euros?|\bprecio:?\s*\d+[.,]?\d*)/i

// Lugar: palabras clave de recintos.
const VENUE_RE =
  /(?:sala|estadio|teatro|pabellón|palacio|auditorio|arena|recinto|polideportivo|velódromo|campo|pista)/i

// Fechas en español: "14 de junio de 2026" | "14/06/2026" | "14-06-26".
const DATE_LONG_RE =
  /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/i
const DATE_SHORT_RE = /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/
const TIME_RE = /(\d{1,2})[:.](\d{2})\s*(?:h|hrs?)?(?:\b|$)/i
const DIGITS_ONLY_RE = /^\d+$/

const MONTH_NAMES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
}

export function parseTicketOcr(text: string, now: Date = new Date()): OcrTicketResult {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let title: string | undefined
  let eventAt: number | undefined
  let venue: string | undefined
  let price: string | undefined

  let timeFoundWithDate = false

  for (const line of lines) {
    if (!price) {
      const m = PRICE_RE.exec(line)
      if (m) price = m[0].trim()
    }

    if (!venue && VENUE_RE.test(line)) venue = line

    if (eventAt === undefined) {
      const ml = DATE_LONG_RE.exec(line)
      if (ml) {
        const day = parseInt(ml[1], 10) || 1
        const month = MONTH_NAMES[ml[2].toLowerCase()] ?? 1
        const year = ml[3] ? parseInt(ml[3], 10) || now.getFullYear() : now.getFullYear()
        const mt = TIME_RE.exec(line)
        const hour = mt ? parseInt(mt[1], 10) || 0 : 0
        const minute = mt ? parseInt(mt[2], 10) || 0 : 0
        timeFoundWithDate = !!mt
        eventAt = new Date(year, month - 1, day, hour, minute).getTime()
      }

      const ms = DATE_SHORT_RE.exec(line)
      if (ms) {
        const day = parseInt(ms[1], 10) || 1
        const month = parseInt(ms[2], 10) || 1
        let year = parseInt(ms[3], 10) || now.getFullYear()
        if (year < 100) year += 2000
        const mt = TIME_RE.exec(line)
        const hour = mt ? parseInt(mt[1], 10) || 0 : 0
        const minute = mt ? parseInt(mt[2], 10) || 0 : 0
        timeFoundWithDate = !!mt
        eventAt = new Date(year, month - 1, day, hour, minute).getTime()
      }
    }
  }

  // La hora no siempre está en la misma línea que la fecha (un billete suele
  // partirlas en dos). Si se encontró fecha pero ninguna hora en su propia
  // línea, se busca una hora suelta en cualquier otra línea antes de dar la
  // entrada por «sin hora» (00:00).
  if (eventAt !== undefined && !timeFoundWithDate) {
    for (const line of lines) {
      const mt = TIME_RE.exec(line)
      if (!mt) continue
      const hour = parseInt(mt[1], 10) || 0
      const minute = parseInt(mt[2], 10) || 0
      const d = new Date(eventAt)
      eventAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute).getTime()
      break
    }
  }

  // Título: primera línea larga que no sea solo números, precio o fecha.
  for (const line of lines) {
    if (line.length < 4) continue
    if (PRICE_RE.test(line)) continue
    if (DATE_LONG_RE.test(line) || DATE_SHORT_RE.test(line)) continue
    if (DIGITS_ONLY_RE.test(line)) continue
    title = line
    break
  }

  return { title, eventAt, venue, price, rawText: text }
}
