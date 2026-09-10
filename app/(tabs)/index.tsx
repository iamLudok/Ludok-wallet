import { useMemo, useState } from 'react'
import { FlatList, Pressable, View, StyleSheet, useWindowDimensions } from 'react-native'
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

  const filtered = useMemo(
    () => (type ? cards.filter((c) => c.type === type) : cards),
    [cards, type],
  )

  const cardWidth = (width - space.lg * 2 - space.md * (COLUMNS - 1)) / COLUMNS

  return (
    <Screen
      title="Tarjetas"
      padded={false}
      right={
        <Button title="+ Nueva" kind="primary" small onPress={() => router.push('/tarjeta/formulario')} />
      }
    >
      <View style={styles.filters}>
        <Chips options={TYPE_FILTERS} value={type} onChange={(v) => setType(v === type ? null : v)} />
      </View>

      <View style={{ paddingHorizontal: space.lg }}>
        <BackupBanner />
      </View>

      {!ready ? null : filtered.length === 0 ? (
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
            />
          )}
        />
      )}
    </Screen>
  )
}

function CardTile({ card, width, onPress }: { card: Card; width: number; onPress: () => void }) {
  const palette = usePalette()
  const tags = card.tags ?? []

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { width, backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.photo, { backgroundColor: palette.surface2 }]}>
        {card.photo ? (
          <Image source={{ uri: imageUri(card.photo) }} style={StyleSheet.absoluteFill} contentFit="cover" />
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
  filters: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  grid: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md },
  tile: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  photo: { aspectRatio: 1.4, alignItems: 'center', justifyContent: 'center' },
  tileBody: { padding: space.sm, gap: 2 },
})
