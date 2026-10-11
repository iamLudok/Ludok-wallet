import { useMemo, useState } from 'react'
import { FlatList, Pressable, View, StyleSheet, Alert, useWindowDimensions } from 'react-native'
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Screen, Empty } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { Button } from '../../src/ui/Button'
import { Chips, type ChipOption } from '../../src/ui/Chips'
import { usePalette } from '../../src/ui/ThemeProvider'
import { radius, space } from '../../src/ui/theme'
import { useCards } from '../../src/hooks/useCards'
import { imageUri } from '../../src/lib/images'
import { deleteCard, reorderCards } from '../../src/lib/library'
import { CARD_TYPES, CARD_TYPE_LABELS } from '../../src/lib/cardTypes'
import BackupBanner from '../../src/components/BackupBanner'
import type { Card, CardType } from '../../src/types'

const TYPE_FILTERS: ChipOption<CardType>[] = CARD_TYPES.map((t) => ({ key: t, label: CARD_TYPE_LABELS[t] }))

const COLUMNS = 2

export default function TarjetasScreen() {
  const router = useRouter()
  const palette = usePalette()
  const { width } = useWindowDimensions()
  const { data: cards, ready } = useCards()
  const [type, setType] = useState<CardType | null>(null)
  const [country, setCountry] = useState<string | null>(null)

  // Modo «Ordenar»: la rejilla de 2 columnas no se lleva bien con arrastrar
  // (el gesto no sabe a qué columna saltar), así que mientras está activo se
  // enseña una lista de una sola columna aparte. `order` es una FOTO del
  // orden al entrar: si se alimentara de `cards` en vivo, cada guardado de
  // `reorderCards` volvería a repintar la lista a medio arrastre.
  const [reordering, setReordering] = useState(false)
  const [order, setOrder] = useState<Card[]>([])
  const startReordering = () => {
    setOrder(cards)
    setReordering(true)
  }

  // Solo los países que de verdad se usan, en el orden en que aparecen: si
  // nadie ha rellenado país todavía, la fila de filtro ni se enseña.
  const countries = useMemo(() => {
    const seen = new Set<string>()
    for (const c of cards) if (c.country) seen.add(c.country)
    return [...seen].sort()
  }, [cards])
  const countryFilters: ChipOption<string>[] = countries.map((c) => ({ key: c, label: c }))

  const filtered = useMemo(
    () =>
      cards
        .filter((c) => (type ? c.type === type : true))
        .filter((c) => (country ? c.country === country : true)),
    [cards, type, country],
  )

  const confirmDelete = (card: Card) => {
    Alert.alert('Eliminar tarjeta', `¿Seguro que quieres eliminar «${card.name}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => deleteCard(card.id) },
    ])
  }

  const cardWidth = (width - space.lg * 2 - space.md * (COLUMNS - 1)) / COLUMNS

  return (
    <Screen
      title="Tarjetas"
      padded={false}
      right={
        reordering ? (
          <Button title="Hecho" kind="primary" small onPress={() => setReordering(false)} />
        ) : (
          <View style={styles.headActions}>
            <Button title="Mapa" small onPress={() => router.push('/tarjeta/mapa')} />
            {cards.length > 1 && <Button title="Ordenar" small onPress={startReordering} />}
            <Button title="+ Nueva" kind="primary" small onPress={() => router.push('/tarjeta/formulario')} />
          </View>
        )
      }
    >
      {!reordering && (
        <>
          <View style={styles.filters}>
            <Chips options={TYPE_FILTERS} value={type} onChange={(v) => setType(v === type ? null : v)} />
          </View>
          {countryFilters.length > 1 && (
            <View style={styles.filters}>
              <Chips options={countryFilters} value={country} onChange={(v) => setCountry(v === country ? null : v)} />
            </View>
          )}

          <View style={{ paddingHorizontal: space.lg }}>
            <BackupBanner />
          </View>
        </>
      )}

      {reordering ? (
        <>
          <Txt variant="small" tone="muted" style={styles.reorderHint}>
            Mantén pulsada una tarjeta y arrástrala a su sitio.
          </Txt>
          <DraggableFlatList
            data={order}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.reorderList}
            onDragEnd={({ data }) => {
              setOrder(data)
              reorderCards(data.map((c) => c.id))
            }}
            renderItem={({ item, drag, isActive }: RenderItemParams<Card>) => (
              <ReorderRow card={item} onDrag={drag} active={isActive} />
            )}
          />
        </>
      ) : !ready ? null : filtered.length === 0 ? (
        <Empty text={cards.length === 0 ? 'Todavía no has guardado ninguna tarjeta.' : 'Nada con ese filtro.'}>
          {cards.length === 0 && (
            <Button title="Guardar la primera" kind="primary" onPress={() => router.push('/tarjeta/formulario')} />
          )}
        </Empty>
      ) : (
        <FlatList
          data={filtered}
          key={COLUMNS}
          numColumns={COLUMNS}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: space.md }}
          renderItem={({ item }) => (
            <CardTile
              card={item}
              width={cardWidth}
              onPress={() => router.push(`/tarjeta/${item.id}`)}
              onLongPress={() => confirmDelete(item)}
            />
          )}
        />
      )}
    </Screen>
  )
}

function ReorderRow({ card, onDrag, active }: { card: Card; onDrag: () => void; active: boolean }) {
  const palette = usePalette()
  return (
    <Pressable
      onLongPress={onDrag}
      disabled={active}
      style={[
        styles.reorderRow,
        { backgroundColor: active ? palette.surface2 : palette.surface, borderColor: palette.line },
      ]}
    >
      <View style={[styles.reorderThumb, { backgroundColor: palette.surface2 }]}>
        {card.photo ? (
          <Image source={{ uri: imageUri(card.photo) }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <Txt variant="small" tone="faint">
            {CARD_TYPE_LABELS[card.type]}
          </Txt>
        )}
      </View>
      <Txt variant="body" numberOfLines={1} style={{ flex: 1 }}>
        {card.name}
      </Txt>
      <View style={styles.grip}>
        <View style={[styles.gripBar, { backgroundColor: palette.muted }]} />
        <View style={[styles.gripBar, { backgroundColor: palette.muted }]} />
        <View style={[styles.gripBar, { backgroundColor: palette.muted }]} />
      </View>
    </Pressable>
  )
}

function CardTile({
  card,
  width,
  onPress,
  onLongPress,
}: {
  card: Card
  width: number
  onPress: () => void
  onLongPress: () => void
}) {
  const palette = usePalette()
  const tags = card.tags ?? []

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.tile,
        { width, backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.photo, { backgroundColor: palette.surface2 }]}>
        {card.photo ? (
          <Image source={{ uri: imageUri(card.photo) }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <Txt variant="label" tone="faint">
            {CARD_TYPE_LABELS[card.type]}
          </Txt>
        )}
      </View>
      <View style={styles.tileBody}>
        <Txt variant="section" numberOfLines={1}>
          {card.name}
        </Txt>
        <Txt variant="small" tone="muted" numberOfLines={1}>
          {tags.length ? tags.slice(0, 2).join(' · ') : CARD_TYPE_LABELS[card.type]}
        </Txt>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  headActions: { flexDirection: 'row', gap: space.sm },
  filters: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  grid: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md },
  tile: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  photo: { aspectRatio: 1.4, alignItems: 'center', justifyContent: 'center' },
  tileBody: { padding: space.sm, gap: 2 },
  reorderHint: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  reorderList: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  reorderThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grip: { gap: 3, alignItems: 'center' },
  gripBar: { width: 16, height: 2, borderRadius: 1 },
})
