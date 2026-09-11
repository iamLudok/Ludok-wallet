import type { CodeFormat } from '../types'

/**
 * Datos ya detectados (código, título, fecha…) para una entrada que aún no
 * existe, de camino al formulario. Mismo motivo que `scanBridge`: quien crea
 * esta pantalla (el «+» de Entradas, la hoja de compartir) navega HACIA
 * adelante al formulario, así que no hay ningún parámetro de ruta capaz de
 * llevar un objeto — y menos aún si trae texto largo de un OCR.
 */
export interface TicketPrefill {
  code?: string
  codeFormat?: CodeFormat
  title?: string
  venue?: string
  price?: string
  eventAt?: number
  /** Nombre del fichero ya copiado al almacenamiento de la app (ver `images.ts`). */
  image?: string
}

let pending: TicketPrefill | null = null

export function setPendingTicketPrefill(data: TicketPrefill): void {
  pending = data
}

/** Se consume una sola vez: al leerlo, desaparece. */
export function takePendingTicketPrefill(): TicketPrefill | null {
  const data = pending
  pending = null
  return data
}
