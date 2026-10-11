import type { CardType } from '../types'

/** Qué es la tarjeta, en el orden en que se ofrecen al crearla. */
export const CARD_TYPES: CardType[] = ['vinyl', 'restaurant', 'person', 'shop', 'lodging', 'company', 'other']

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  vinyl: 'Tienda de vinilos',
  restaurant: 'Restaurante',
  person: 'Persona',
  shop: 'Tienda',
  lodging: 'Alojamiento',
  company: 'Empresa',
  other: 'Otro',
}
