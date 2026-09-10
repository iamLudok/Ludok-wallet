// Traducción entre las filas de SQLite y el modelo de dominio.
//
// SQLite devuelve `null` en las columnas vacías, pero los tipos de la app (y el
// formato de las copias) usan `undefined`, que `JSON.stringify` elimina. Pasar
// de uno a otro explícitamente es lo que mantiene los ficheros de copia limpios
// en vez de llenos de `"venue": null`.
//
// Está centralizado a propósito: las etiquetas se guardan como JSON en una
// columna de texto, y si ese ida y vuelta estuviera repetido en cada sitio que
// lee tarjetas (las consultas reactivas, las copias, la lógica de negocio)
// acabaría leyéndose bien en unos y mal en otros en cuanto se añada un campo.
import type { CardRow, TicketRow, SettingsRow } from './schema'
import type { Card, Ticket, Settings } from '../types'

/** null → undefined */
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v)
/** undefined → null */
const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v)

export function rowToCard(r: CardRow): Card {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    photo: u(r.photo),
    photoBack: u(r.photoBack),
    phone: u(r.phone),
    phone2: u(r.phone2),
    email: u(r.email),
    address: u(r.address),
    website: u(r.website),
    social: u(r.social),
    tags: parseTags(r.tags),
    addedAt: r.addedAt,
    updatedAt: r.updatedAt,
  }
}

export function cardToRow(c: Card): CardRow {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    photo: n(c.photo),
    photoBack: n(c.photoBack),
    phone: n(c.phone),
    phone2: n(c.phone2),
    email: n(c.email),
    address: n(c.address),
    website: n(c.website),
    social: n(c.social),
    tags: serializeTags(c.tags),
    addedAt: c.addedAt,
    updatedAt: c.updatedAt,
  }
}

export function rowToTicket(r: TicketRow): Ticket {
  return {
    id: r.id,
    title: r.title,
    eventAt: u(r.eventAt),
    venue: u(r.venue),
    price: u(r.price),
    code: r.code,
    codeFormat: r.codeFormat,
    image: u(r.image),
    notes: u(r.notes),
    addedAt: r.addedAt,
    updatedAt: r.updatedAt,
  }
}

export function ticketToRow(t: Ticket): TicketRow {
  return {
    id: t.id,
    title: t.title,
    eventAt: n(t.eventAt),
    venue: n(t.venue),
    price: n(t.price),
    code: t.code,
    codeFormat: t.codeFormat,
    image: n(t.image),
    notes: n(t.notes),
    addedAt: t.addedAt,
    updatedAt: t.updatedAt,
  }
}

export function rowToSettings(r: SettingsRow): Settings {
  return {
    id: 'app',
    theme: r.theme,
    lastBackup: r.lastBackup,
    schemaVersion: r.schemaVersion,
    nextcloudUrl: u(r.nextcloudUrl),
    nextcloudUser: u(r.nextcloudUser),
    nextcloudPassword: u(r.nextcloudPassword),
    nextcloudFolder: u(r.nextcloudFolder),
    autoBackup: u(r.autoBackup),
    lastAutoBackupAt: u(r.lastAutoBackupAt),
  }
}

/**
 * Texto de la columna → lista. Devuelve `undefined` cuando no hay nada, para
 * que el campo simplemente no aparezca en el JSON de la copia en vez de salir
 * como `null` o como lista vacía.
 */
export function parseTags(raw: string | null | undefined): string[] | undefined {
  if (!raw) return undefined
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return undefined
    const list = parsed.filter((t): t is string => typeof t === 'string' && t.length > 0)
    return list.length ? list : undefined
  } catch {
    return undefined
  }
}

/** Lista → texto de la columna (null si está vacía). */
export function serializeTags(list: string[] | undefined): string | null {
  if (!list || list.length === 0) return null
  return JSON.stringify(list)
}

/**
 * Normaliza una etiqueta escrita a mano: en minúsculas y sin espacios de más.
 *
 * Sin esto acabas con «Favorito», «favorito» y «favorito » como tres etiquetas
 * distintas, y el filtro por etiqueta deja de servir para nada.
 */
export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}
