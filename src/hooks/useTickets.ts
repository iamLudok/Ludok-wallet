import { asc, desc, eq, sql } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { db } from '../lib/db'
import { tickets as ticketsTable } from '../lib/schema'
import { rowToTicket } from '../lib/rows'
import type { Ticket } from '../types'

/**
 * Todas las entradas, reactivo. Primero las que tienen fecha (de más próxima a
 * más lejana), y al final las que no tienen, por si se guardó una entrada sin
 * fecha todavía sin apuntar.
 *
 * SQLite ordena los NULL antes que cualquier valor en ASC, así que un
 * `ORDER BY eventAt` dejaría las entradas sin fecha las PRIMERAS — lo
 * contrario de lo que se busca. El `CASE` las manda al final aparte.
 */
export function useTickets(): { data: Ticket[]; ready: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(ticketsTable)
      .orderBy(
        sql`case when ${ticketsTable.eventAt} is null then 1 else 0 end`,
        asc(ticketsTable.eventAt),
        desc(ticketsTable.addedAt),
      ),
  )
  return { data: (data ?? []).map(rowToTicket), ready: updatedAt !== undefined }
}

/** Una entrada por id, reactiva. */
export function useTicket(id: string | undefined): { data: Ticket | undefined; ready: boolean } {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(ticketsTable)
      .where(eq(ticketsTable.id, id ?? '')),
  )
  return { data: data?.[0] ? rowToTicket(data[0]) : undefined, ready: updatedAt !== undefined }
}
