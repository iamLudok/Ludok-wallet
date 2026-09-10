// Altas/bajas/ediciones de tarjetas y entradas. Pura lógica de negocio: pide la
// base a `dbRef` y las fotos a `imageRef`, así que se puede ejecutar y probar
// en el escritorio igual que en el móvil.
import { eq } from 'drizzle-orm'
import { getDb } from './dbRef'
import { getImageStore } from './imageRef'
import { newId } from './ids'
import { cards as cardsTable, tickets as ticketsTable } from './schema'
import { rowToCard, cardToRow, rowToTicket, ticketToRow, normalizeTag } from './rows'
import type { Card, CardType, CodeFormat, Ticket } from '../types'

/* --- Tarjetas ---------------------------------------------------------------- */

export interface CardInput {
  name: string
  type: CardType
  photo?: string
  photoBack?: string
  phone?: string
  phone2?: string
  email?: string
  address?: string
  website?: string
  social?: string
  tags?: string[]
}

export async function getCard(id: string): Promise<Card | undefined> {
  const rows = await getDb().select().from(cardsTable).where(eq(cardsTable.id, id)).limit(1)
  return rows[0] ? rowToCard(rows[0]) : undefined
}

/**
 * Crea o actualiza una tarjeta. Las etiquetas se normalizan y se deduplican
 * aquí, no en la interfaz: es la regla de negocio, y así cualquier punto de
 * entrada (formulario, una futura importación) la respeta igual.
 */
export async function saveCard(input: CardInput, id?: string): Promise<string> {
  const now = Date.now()
  const tags = [...new Set((input.tags ?? []).map(normalizeTag).filter(Boolean))]

  if (id) {
    const existing = await getCard(id)
    if (!existing) throw new Error('La tarjeta ya no existe.')
    const card: Card = { ...existing, ...input, tags: tags.length ? tags : undefined, id, updatedAt: now }
    await getDb().update(cardsTable).set(cardToRow(card)).where(eq(cardsTable.id, id))

    // Si el anverso o el reverso cambiaron, el fichero viejo puede quedar huérfano.
    const replaced = [existing.photo, existing.photoBack].filter(
      (name): name is string => !!name && name !== card.photo && name !== card.photoBack,
    )
    if (replaced.length) await removeOrphanPhotos(replaced)
    return id
  }

  const card: Card = {
    id: newId(),
    ...input,
    tags: tags.length ? tags : undefined,
    addedAt: now,
    updatedAt: now,
  }
  await getDb().insert(cardsTable).values(cardToRow(card))
  return card.id
}

/**
 * Borra la tarjeta y, si sus fotos ya no las usa nada más, también los
 * ficheros. Una tarjeta duplicada a mano (mismo fichero de foto en dos fichas)
 * no debería darse en esta app, pero comprobarlo es gratis y evita un cabo
 * suelto si algún día pasara.
 */
export async function deleteCard(id: string): Promise<void> {
  const card = await getCard(id)
  if (!card) return
  await getDb().delete(cardsTable).where(eq(cardsTable.id, id))
  await removeOrphanPhotos([card.photo, card.photoBack])
}

/** Etiquetas usadas por alguna tarjeta, para sugerirlas al escribir una nueva. */
export async function allTags(): Promise<string[]> {
  const rows = await getDb().select().from(cardsTable)
  const tags = new Set<string>()
  for (const r of rows) {
    for (const t of rowToCard(r).tags ?? []) tags.add(t)
  }
  return [...tags].sort()
}

/* --- Entradas ---------------------------------------------------------------- */

export interface TicketInput {
  title: string
  eventAt?: number
  venue?: string
  price?: string
  code: string
  codeFormat: CodeFormat
  image?: string
  notes?: string
}

export async function getTicket(id: string): Promise<Ticket | undefined> {
  const rows = await getDb().select().from(ticketsTable).where(eq(ticketsTable.id, id)).limit(1)
  return rows[0] ? rowToTicket(rows[0]) : undefined
}

export async function saveTicket(input: TicketInput, id?: string): Promise<string> {
  const now = Date.now()

  if (id) {
    const existing = await getTicket(id)
    if (!existing) throw new Error('La entrada ya no existe.')
    const ticket: Ticket = { ...existing, ...input, id, updatedAt: now }
    await getDb().update(ticketsTable).set(ticketToRow(ticket)).where(eq(ticketsTable.id, id))

    if (existing.image && existing.image !== ticket.image) await removeOrphanPhotos([existing.image])
    return id
  }

  const ticket: Ticket = { id: newId(), ...input, addedAt: now, updatedAt: now }
  await getDb().insert(ticketsTable).values(ticketToRow(ticket))
  return ticket.id
}

export async function deleteTicket(id: string): Promise<void> {
  const ticket = await getTicket(id)
  if (!ticket) return
  await getDb().delete(ticketsTable).where(eq(ticketsTable.id, id))
  await removeOrphanPhotos([ticket.image])
}

/**
 * Borra del disco las fotos de la lista que ya no use ninguna otra tarjeta o
 * entrada. Se usa al borrar una ficha y también al reemplazar una foto suya
 * por otra nueva (el anverso se cambia, pero el fichero viejo no debe quedarse
 * huérfano ocupando sitio para siempre).
 */
async function removeOrphanPhotos(names: (string | undefined)[]): Promise<void> {
  const candidates = names.filter((n): n is string => !!n)
  if (!candidates.length) return

  const cardRows = await getDb().select().from(cardsTable)
  const ticketRows = await getDb().select().from(ticketsTable)
  const used = new Set<string>()
  for (const r of cardRows) {
    const c = rowToCard(r)
    if (c.photo) used.add(c.photo)
    if (c.photoBack) used.add(c.photoBack)
  }
  for (const r of ticketRows) {
    const t = rowToTicket(r)
    if (t.image) used.add(t.image)
  }

  const store = getImageStore()
  for (const name of candidates) {
    if (!used.has(name)) await store.remove(name)
  }
}
