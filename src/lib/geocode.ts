/**
 * Convierte una dirección en texto a coordenadas, usando Nominatim
 * (OpenStreetMap): es el único servicio de geocodificación que no pide
 * cuenta ni clave de API. Es, aparte de la copia a un Nextcloud propio, la
 * única llamada de red de la app — y esta manda la dirección de la tarjeta a
 * un servidor de terceros (OSM), no a Google ni a nadie con quien haya cuenta
 * creada. Se llama una sola vez por tarjeta: el resultado se guarda en la
 * propia tarjeta (`lat`/`lng`) y no se vuelve a pedir.
 *
 * Política de uso de Nominatim: como mucho una petición por segundo y un
 * User-Agent que identifique la app. Quien llama a `geocodeAddress` en bucle
 * (el mapa) es responsable de espaciar las llamadas; aquí solo se pone el
 * User-Agent.
 */
export interface GeoPoint {
  lat: number
  lng: number
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'LudokWallet/1 (app personal de tarjetas, sin servidor propio)'

export async function geocodeAddress(query: string): Promise<GeoPoint | undefined> {
  const q = query.trim()
  if (!q) return undefined

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  if (!res.ok) return undefined

  const data: unknown = await res.json()
  if (!Array.isArray(data) || data.length === 0) return undefined

  const first = data[0] as { lat?: string; lon?: string }
  const lat = first.lat ? Number.parseFloat(first.lat) : NaN
  const lng = first.lon ? Number.parseFloat(first.lon) : NaN
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined

  return { lat, lng }
}
