// Modelo de datos de Ludovis.
//
// Todo vive en local: la base de datos en el SQLite privado de la app y las
// fotos como ficheros sueltos en `images/`. La base guarda solo el NOMBRE del
// fichero, nunca su ruta absoluta: esa ruta cambia entre instalaciones y entre
// móviles, así que guardarla haría que las fotos se «perdieran» al restaurar
// una copia — que es justo lo que hacía la versión de Flutter.

/** Qué es lo que hay en la tarjeta. Decide el icono y el filtro de la lista. */
export type CardType = 'restaurant' | 'person' | 'shop' | 'hotel' | 'company' | 'other'

/**
 * Tarjeta guardada: un restaurante, una persona, una tienda…
 *
 * Casi todo es opcional a propósito. Una tarjeta que solo tiene nombre y foto
 * ya sirve: obligar a rellenar campos convertiría «guardar esto rápido antes de
 * perder el papel» en un formulario, que es lo contrario de lo que se busca.
 */
export interface Card {
  id: string
  name: string
  type: CardType
  /** Nombre del fichero dentro de `images/`. Ver `lib/images.ts`. */
  photo?: string
  /** Reverso, si lo hay. La ficha se gira para verlo. */
  photoBack?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  website?: string
  /** Instagram: se admite @usuario, la URL entera o solo el nombre. */
  social?: string
  /** Etiquetas libres en minúsculas. Ausente = ninguna. Ver `lib/rows.ts`. */
  tags?: string[]
  addedAt: number
  updatedAt: number
}

/**
 * Formatos de código que la app sabe pintar y escanear.
 *
 * Las claves son las de expo-camera (que es quien escanea), y `lib/codes.ts`
 * las traduce a las de bwip-js (que es quien los dibuja). Tener una sola clave
 * canónica evita que el formato que se escanea y el que se guarda se separen.
 */
export type CodeFormat =
  | 'qr'
  | 'code128'
  | 'ean13'
  | 'ean8'
  | 'code39'
  | 'code93'
  | 'codabar'
  | 'itf14'
  | 'upc_a'
  | 'upc_e'
  | 'pdf417'
  | 'aztec'
  | 'datamatrix'

/** Entrada de un evento, con el código que hay que enseñar en la puerta. */
export interface Ticket {
  id: string
  title: string
  /** Fecha y hora del evento en epoch ms. Ausente = sin fecha. */
  eventAt?: number
  venue?: string
  /** Texto libre: llega del OCR tal cual lo pone el billete ("12,50 €"). */
  price?: string
  /** Lo que va codificado en el QR/barras. Es el dato que de verdad importa. */
  code: string
  codeFormat: CodeFormat
  /** Nombre del fichero de la captura de la entrada, dentro de `images/`. */
  image?: string
  notes?: string
  addedAt: number
  updatedAt: number
}

export interface Settings {
  id: 'app'
  theme: 'dark' | 'light' | 'system'
  lastBackup: number
  schemaVersion: number

  /* --- Copia automática a un Nextcloud propio ------------------------------ */
  nextcloudUrl?: string
  nextcloudUser?: string
  /**
   * Contraseña de aplicación de Nextcloud.
   *
   * NO se incluye en las copias exportadas a propósito: una copia se comparte y
   * se mueve de sitio, y esta contraseña da permiso de ESCRITURA sobre tus
   * ficheros — la propia copia acaba subida ahí, así que viajaría con su propia
   * llave dentro. Al restaurar en otro móvil hay que volver a escribirla.
   */
  nextcloudPassword?: string
  nextcloudFolder?: string
  autoBackup?: boolean
  lastAutoBackupAt?: number
}

/**
 * Estructura del fichero de copia de seguridad (export/import).
 *
 * `images` va aparte de las fichas y es opcional: una copia sin fotos sigue
 * siendo válida y se importa igual (las fichas quedan sin foto). Así una copia
 * antigua, o una hecha a mano, nunca se rechaza por ese motivo.
 */
export interface BackupFile {
  app: 'ludovis'
  schemaVersion: number
  exportedAt: number
  cards: Card[]
  tickets: Ticket[]
  settings: Settings | null
  /** nombre de fichero → contenido en base64. */
  images?: Record<string, string>
}
