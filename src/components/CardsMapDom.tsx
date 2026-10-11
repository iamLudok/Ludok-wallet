'use dom'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

// El CSS de Leaflet referencia sus iconos con `url(images/…)` relativas, y el
// empaquetador de los DOM Components (Metro) todavía no sabe resolver
// recursos locales dentro de un CSS importado — la build revienta con
// «Importing local resources in CSS is not supported yet». Como esto ya vive
// dentro de un WebView de verdad, se carga desde un CDN en tiempo de
// ejecución en vez de compilarlo: mismo efecto, sin tocar el empaquetador.
const LEAFLET_VERSION = '1.9.4'
const LEAFLET_CDN = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist`

export interface MapPoint {
  id: string
  name: string
  lat: number
  lng: number
}

interface Props {
  points: MapPoint[]
  onSelect: (id: string) => Promise<void>
  dom?: import('expo/dom').DOMProps
}

/**
 * Mapa de OpenStreetMap (Leaflet) con una chincheta por tarjeta, dentro de un
 * DOM Component de Expo.
 *
 * Se elige esto y no `react-native-maps` a propósito: en Android esa
 * librería exige una clave de Google Maps sí o sí, incluso para pintar
 * SOLO azulejos de OpenStreetMap encima con `mapType="none"` — el mapa base
 * de Google se sigue inicializando por debajo. Un DOM Component corre dentro
 * de un WebView de verdad, así que Leaflet funciona tal cual, sin clave.
 */
export default function CardsMapDom({ points, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  // El mapa se crea UNA vez. Centrado en España por defecto: es una app en
  // castellano, y sin esto un mapa sin tarjetas aún saldría centrado en el
  // (0, 0) de en medio del océano.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = `${LEAFLET_CDN}/leaflet.css`
      document.head.appendChild(link)
    }
    // Los iconos por defecto también se resuelven contra el propio CSS: sin
    // esto, la chincheta se ve invisible (un cuadrado vacío) en vez de la
    // gota azul de siempre.
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: `${LEAFLET_CDN}/images/marker-icon-2x.png`,
      iconUrl: `${LEAFLET_CDN}/images/marker-icon.png`,
      shadowUrl: `${LEAFLET_CDN}/images/marker-shadow.png`,
    })

    const map = L.map(containerRef.current, { zoomControl: true }).setView([40.4168, -3.7038], 5)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; colaboradores de OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    // El WebView a veces mide el contenedor a 0 antes del primer layout: sin
    // este recálculo, el mapa nace con la mitad de los azulejos en blanco
    // hasta el primer gesto del usuario.
    const t = setTimeout(() => map.invalidateSize(), 100)
    return () => {
      clearTimeout(t)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Las chinchetas se rehacen cada vez que cambian los puntos (tarjetas
  // recién geocodificadas, por ejemplo), sobre el mapa ya creado.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    for (const m of markersRef.current) m.remove()
    markersRef.current = points.map((p) => {
      const marker = L.marker([p.lat, p.lng]).addTo(map).bindPopup(p.name)
      marker.on('click', () => {
        onSelect(p.id)
      })
      return marker
    })

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p): [number, number] => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [32, 32] })
    }
  }, [points, onSelect])

  return (
    // `position: fixed` a propósito, en vez de `width/height: 100%`: la
    // plantilla del DOM Component mete este `<div>` dentro de un `#root` con
    // `flex: 1`, pero ni `html` ni `body` llevan una altura explícita — sin
    // ella, `flex: 1` no tiene de qué tirar y el mapa entero se queda con
    // altura 0 (invisible, aunque Leaflet cargue bien por dentro). Fijo al
    // viewport se salta esa cadena entera y siempre ocupa toda la pantalla.
    <div ref={containerRef} style={{ position: 'fixed', inset: 0 }} />
  )
}
