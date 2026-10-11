import { useState } from 'react'
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { Image, type ImageLoadEventData } from 'expo-image'
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

// Límites para la forma del hueco una vez se conoce la foto real: sin esto,
// una captura casi cuadrada o un panorámico raro podrían dejar una caja
// absurdamente alta o plana. Dentro de ese rango, se deja tal cual.
const MIN_RATIO = 0.45
const MAX_RATIO = 2.2

/**
 * Hueco para una foto: toca para elegirla, con una miniatura si ya hay una.
 *
 * En cuanto se conoce el tamaño real de la foto, el hueco adopta SU forma
 * (con el mismo ancho de siempre) en vez de la altura fija de `height`. Antes
 * era siempre una caja apaisada pensada para una tarjeta de visita, y una
 * foto vertical —una entrada, un carné— se veía diminuta en el centro o
 * recortada por los lados.
 */
export function PhotoSlot({ label, uri, onChange, ocrRunning, onRescan, height = 130 }: Props) {
  const palette = usePalette()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [ratio, setRatio] = useState<number | undefined>()

  const onLoad = ({ source }: ImageLoadEventData) => {
    if (source.width > 0 && source.height > 0) {
      setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, source.width / source.height)))
    }
  }

  const boxStyle = uri && ratio ? { aspectRatio: ratio } : { height }

  return (
    <View style={styles.wrap}>
      <Txt variant="small" tone="muted">
        {label}
      </Txt>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.box, boxStyle, { backgroundColor: palette.surface2 }]}
      >
        {ocrRunning ? (
          <ActivityIndicator color={palette.muted} />
        ) : uri ? (
          <>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" onLoad={onLoad} />
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
