import type { CardType } from '../types'

/** Qué es la tarjeta, en el orden en que se ofrecen al crearla. */
export const CARD_TYPES: CardType[] = ['restaurant', 'person', 'shop', 'hotel', 'company', 'other']

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  restaurant: 'Restaurante',
  person: 'Persona',
  shop: 'Tienda',
  hotel: 'Hotel',
  company: 'Empresa',
  other: 'Otro',
}
