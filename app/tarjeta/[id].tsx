import { useRef, useState } from 'react'
import { Animated, Pressable, View, ScrollView, StyleSheet, Alert, Linking, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Screen } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { usePalette } from '../../src/ui/ThemeProvider'
import { radius, space } from '../../src/ui/theme'
import { useCard } from '../../src/hooks/useCards'
import { deleteCard } from '../../src/lib/library'
import { imageUri } from '../../src/lib/images'
import { CARD_TYPE_LABELS } from '../../src/lib/cardTypes'
import { TopBar } from '../../src/components/TopBar'
import type { Card } from '../../src/types'

export default function TarjetaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const palette = usePalette()
  const { data: card, ready } = useCard(id)

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.muted} />
      </View>
    )
  }

  if (!card) {
    return (
      <Screen title="Tarjeta">
        <Txt variant="body" tone="muted">
          Esta tarjeta ya no existe.
        </Txt>
      </Screen>
    )
  }

  return <DetailView card={card} onEdit={() => router.push(`/tarjeta/formulario?id=${card.id}`)} onDeleted={() => router.back()} />
}

function DetailView({ card, onEdit, onDeleted }: { card: Card; onEdit: () => void; onDeleted: () => void }) {
  const palette = usePalette()
  const [busy, setBusy] = useState(false)
  const flip = useRef(new Animated.Value(0)).current
  const [showingBack, setShowingBack] = useState(false)

  const hasFront = !!card.photo
  const hasBack = !!card.photoBack
  const canFlip = hasFront && hasBack

  const doFlip = () => {
    if (!canFlip) return
    const toValue = showingBack ? 0 : 1
    setShowingBack(!showingBack)
    Animated.timing(flip, { toValue, duration: 350, useNativeDriver: true }).start()
  }

  const confirmDelete = () => {
    Alert.alert('Eliminar tarjeta', '¿Seguro que quieres eliminar esta tarjeta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true)
          await deleteCard(card.id)
          onDeleted()
        },
      },
    ])
  }

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] })
  // El reverso se pinta encima solo mientras dura el giro: si no, capta los
  // toques aunque esté "detrás" (transform no cambia el orden de pintado).
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5001, 1], outputRange: [1, 1, 0, 0] })
  const backOpacity = flip.interpolate({ inputRange: [0, 0.4999, 0.5, 1], outputRange: [0, 0, 1, 1] })

  return (
    <Screen padded={false} style={{ opacity: busy ? 0.5 : 1 }}>
      <TopBar>
        <Pressable onPress={onEdit} hitSlop={12} accessibilityRole="button" style={{ marginRight: space.lg }}>
          <Txt variant="body">Editar</Txt>
        </Pressable>
        <Pressable onPress={confirmDelete} hitSlop={12} accessibilityRole="button">
          <Txt variant="body" tone="danger">
            Eliminar
          </Txt>
        </Pressable>
      </TopBar>

      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
      <Pressable onPress={canFlip ? doFlip : undefined} style={styles.photoWrap}>
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: palette.surface2, opacity: frontOpacity, transform: [{ rotateY: frontRotate }] },
          ]}
        >
          {hasFront ? (
            <Image source={{ uri: imageUri(card.photo!) }} style={StyleSheet.absoluteFill} contentFit="contain" />
          ) : (
            <Txt variant="label" tone="faint">
              {CARD_TYPE_LABELS[card.type]}
            </Txt>
          )}
        </Animated.View>
        <Animated.View
          style={[
            styles.face,
            styles.faceBack,
            { backgroundColor: palette.surface2, opacity: backOpacity, transform: [{ rotateY: backRotate }] },
          ]}
        >
          {hasBack && <Image source={{ uri: imageUri(card.photoBack!) }} style={StyleSheet.absoluteFill} contentFit="contain" />}
        </Animated.View>
        {canFlip && (
          <View style={[styles.flipHint, { backgroundColor: palette.scrim }]}>
            <Txt variant="small" style={{ color: '#fff' }}>
              {showingBack ? 'Toca para ver anverso' : 'Toca para ver reverso'}
            </Txt>
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <Txt variant="label" tone="muted">
          {CARD_TYPE_LABELS[card.type]}
          {card.country ? ` · ${card.country}` : ''}
        </Txt>
        <Txt variant="display">{card.name}</Txt>

        {!!card.tags?.length && (
          <View style={styles.tags}>
            {card.tags.map((t) => (
              <View key={t} style={[styles.tag, { backgroundColor: palette.surface2, borderColor: palette.line }]}>
                <Txt variant="small">{t}</Txt>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actions}>
          {card.phones?.map((phone) => (
            <ActionRow key={phone} label={phone} onPress={() => Linking.openURL(`tel:${phone}`)} />
          ))}
          {!!card.email && <ActionRow label={card.email} onPress={() => Linking.openURL(`mailto:${card.email}`)} />}
          {card.addresses?.map((address) => (
            <ActionRow
              key={address}
              label={address}
              onPress={async () => {
                const q = encodeURIComponent(address)
                const geo = `geo:0,0?q=${q}`
                const can = await Linking.canOpenURL(geo)
                await Linking.openURL(can ? geo : `https://maps.google.com/?q=${q}`)
              }}
            />
          ))}
          {!!card.website && (
            <ActionRow
              label={card.website}
              onPress={() => Linking.openURL(card.website!.startsWith('http') ? card.website! : `https://${card.website}`)}
            />
          )}
          {!!card.social && <ActionRow label={instagramLabel(card.social)} onPress={() => openInstagram(card.social!)} />}
        </View>
      </View>
      </ScrollView>
    </Screen>
  )
}

function ActionRow({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = usePalette()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: palette.line, opacity: pressed ? 0.6 : 1 }]}
    >
      <Txt variant="body" numberOfLines={1} style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  )
}

/** Extrae el nombre de usuario de cualquier forma que se haya escrito. */
function igUsername(raw: string): string {
  return raw
    .replace(/https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace('@', '')
    .split('?')[0]
    .split('/')[0]
    .trim()
}

function instagramLabel(raw: string): string {
  const u = igUsername(raw)
  return u ? `@${u}` : raw
}

async function openInstagram(raw: string): Promise<void> {
  const username = igUsername(raw)
  if (!username) return
  const appUri = `instagram://user?username=${username}`
  const can = await Linking.canOpenURL(appUri)
  await Linking.openURL(can ? appUri : `https://www.instagram.com/${username}/`)
}

const styles = StyleSheet.create({
  photoWrap: { width: '100%', aspectRatio: 1.55 },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  faceBack: {},
  flipHint: {
    position: 'absolute',
    bottom: space.sm,
    right: space.md,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
  },
  body: { padding: space.lg, gap: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  tag: { paddingVertical: 4, paddingHorizontal: space.sm, borderRadius: radius.pill, borderWidth: 1 },
  actions: { marginTop: space.md },
  row: { paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth },
})
