import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { db } from '../lib/db'
import { cards as cardsTable } from '../lib/schema'
import { rowToCard } from '../lib/rows'
import type { Card } from '../types'

/** Todas las tarjetas, reactivo. En el orden manual («Ordenar» en la lista). */
export function useCards(): { data: Card[]; ready: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db.select().from(cardsTable).orderBy(cardsTable.sortOrder),
  )
  return { data: (data ?? []).map(rowToCard), ready: updatedAt !== undefined }
}

/** Una tarjeta por id, reactiva. */
export function useCard(id: string | undefined): { data: Card | undefined; ready: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(cardsTable)
      // Sin id no hay nada que consultar, pero el hook tiene que llamarse
      // siempre igual: se filtra por un id que nunca casa con nada.
      .where(eq(cardsTable.id, id ?? '')),
  )
  return { data: data?.[0] ? rowToCard(data[0]) : undefined, ready: updatedAt !== undefined }
}
