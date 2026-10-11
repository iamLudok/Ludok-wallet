import { useEffect, useMemo, useRef, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Empty } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { usePalette } from '../../src/ui/ThemeProvider'
import { space } from '../../src/ui/theme'
import { TopBar } from '../../src/components/TopBar'
import CardsMapDom from '../../src/components/CardsMapDom'
import { useCards } from '../../src/hooks/useCards'
import { geocodeAddress } from '../../src/lib/geocode'
import { setCardCoords } from '../../src/lib/library'
import type { Card } from '../../src/types'

// Política de Nominatim: como mucho una petición por segundo.
const GEOCODE_DELAY_MS = 1100

function primaryQuery(card: Card): string {
  return [card.addresses?.[0], card.country].filter(Boolean).join(', ')
}

export default function TarjetaMapaScreen() {
  const router = useRouter()
  const palette = usePalette()
  const { data: cards, ready } = useCards()

  const [geocoding, setGeocoding] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  // Con qué tarjetas ya se ha intentado en ESTA visita a la pantalla: sin
  // esto, una dirección que Nominatim no sabe situar se reintentaría en
  // bucle en cada repintado, en vez de dejarla para la próxima vez que se
  // abra el mapa.
  const attempted = useRef(new Set<string>())

  useEffect(() => {
    if (!ready) return
    const targets = cards.filter(
      (c) => c.addresses?.length && (c.lat === undefined || c.lng === undefined) && !attempted.current.has(c.id),
    )
    if (!targets.length) return

    let cancelled = false
    const run = async () => {
      setGeocoding(true)
      setProgress({ done: 0, total: targets.length })
      for (const [i, card] of targets.entries()) {
        if (cancelled) break
        attempted.current.add(card.id)
        try {
          const point = await geocodeAddress(primaryQuery(card))
          if (point) await setCardCoords(card.id, point.lat, point.lng)
        } catch {
          // Sin red o Nominatim caído ahora mismo: esta tarjeta se queda sin
          // chincheta por hoy, se reintenta la próxima vez que se abra el mapa.
        }
        if (!cancelled) setProgress({ done: i + 1, total: targets.length })
        if (i < targets.length - 1) await new Promise((r) => setTimeout(r, GEOCODE_DELAY_MS))
      }
      if (!cancelled) setGeocoding(false)
    }
    run()
    return () => {
      cancelled = true
    }
    // Solo al entrar (o si aparecen tarjetas nuevas sin intentar): no se
    // quiere relanzar el bucle cada vez que `cards` cambia por nuestros
    // propios guardados de coordenadas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, cards.length])

  const points = useMemo(
    () =>
      cards
        .filter((c): c is Card & { lat: number; lng: number } => c.lat !== undefined && c.lng !== undefined)
        .map((c) => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng })),
    [cards],
  )

  const withoutCoords = useMemo(
    () => cards.filter((c) => c.addresses?.length && (c.lat === undefined || c.lng === undefined)).length,
    [cards],
  )

  return (
    <Screen padded={false}>
      <TopBar title="Mapa" />
      {geocoding && (
        <View style={[styles.progress, { borderColor: palette.line }]}>
          <ActivityIndicator size="small" color={palette.muted} />
          <Txt variant="small" tone="muted">
            Situando tarjetas… {progress.done}/{progress.total}
          </Txt>
        </View>
      )}
      {!ready ? null : points.length === 0 ? (
        <Empty
          text={
            geocoding
              ? 'Situando las tarjetas con dirección…'
              : withoutCoords > 0
                ? 'No se ha podido situar ninguna dirección todavía.'
                : 'Ninguna tarjeta tiene dirección todavía. Añade una desde su ficha.'
          }
        />
      ) : (
        <CardsMapDom
          points={points}
          onSelect={async (id) => {
            router.push(`/tarjeta/${id}`)
          }}
          dom={{ style: { flex: 1 } }}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})
