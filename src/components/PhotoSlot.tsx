import { useState } from 'react'
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { usePalette } from '../ui/ThemeProvider'
import { Txt } from '../ui/Text'
import { radius, space } from '../ui/theme'
import { PhotoSourceSheet } from './PhotoSourceSheet'

interface Props {
  label: string
  /** Uri de la foto a mostrar (recién elegida o ya guardada), si hay. */
  uri?: string
  onChange: (uri: string) => void
  /** Si se está reconociendo texto sobre esta foto ahora mismo. */
  ocrRunning?: boolean
  /** Si se puede volver a leer el texto de la foto ya puesta. Sin esto no sale el botón. */
  onRescan?: () => void
  height?: number
}

/** Hueco para una foto: toca para elegirla, con una miniatura si ya hay una. */
export function PhotoSlot({ label, uri, onChange, ocrRunning, onRescan, height = 130 }: Props) {
  const palette = usePalette()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <View style={styles.wrap}>
      <Txt variant="small" tone="muted">
        {label}
      </Txt>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.box, { height, backgroundColor: palette.surface2 }]}
      >
        {ocrRunning ? (
          <ActivityIndicator color={palette.muted} />
        ) : uri ? (
          <>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.overlayRow}>
              {onRescan && (
                <Pressable
                  onPress={onRescan}
                  style={[styles.badge, { backgroundColor: palette.scrim }]}
                  accessibilityRole="button"
                  accessibilityLabel="Volver a leer el texto de la foto"
                >
                  <Txt variant="small" style={{ color: '#fff' }}>
                    Releer OCR
                  </Txt>
                </Pressable>
              )}
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={[styles.badge, { backgroundColor: palette.scrim, marginLeft: 'auto' }]}
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto"
              >
                <Txt variant="small" style={{ color: '#fff' }}>
                  Cambiar
                </Txt>
              </Pressable>
            </View>
          </>
        ) : (
          <Txt variant="small" tone="faint">
            Añadir foto
          </Txt>
        )}
      </Pressable>

      <PhotoSourceSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={onChange}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  box: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlayRow: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    gap: space.xs,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
  },
})
