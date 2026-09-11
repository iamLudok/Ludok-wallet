import { Modal, Pressable, View, StyleSheet } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePalette } from '../ui/ThemeProvider'
import { Txt } from '../ui/Text'
import { space } from '../ui/theme'

interface Props {
  visible: boolean
  onClose: () => void
  /** Uri local de la foto elegida (aún sin guardar en el almacenamiento de la app). */
  onPicked: (uri: string) => void
}

/**
 * Pide la foto a la cámara o a la galería, sin recorte forzado. La misma foto
 * alimenta el OCR y la detección de códigos, así que recortarla de más antes
 * de leerla podía dejar fuera justo el teléfono o el código que se buscaba —
 * mejor la imagen completa, tal cual sale de la cámara. `quality` se sube
 * respecto al valor por defecto de Expo: menos artefactos de compresión es
 * menos texto que el reconocedor lee mal.
 */
async function pickFrom(source: 'camera' | 'gallery'): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.92,
  }

  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options)
  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0].uri
}

/** Hoja para elegir entre sacar una foto o coger una ya existente. */
export function PhotoSourceSheet({ visible, onClose, onPicked }: Props) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()

  const choose = async (source: 'camera' | 'gallery') => {
    onClose()
    const uri = await pickFrom(source)
    if (uri) onPicked(uri)
  }

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: palette.scrim }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: palette.surface, borderColor: palette.line, paddingBottom: space.lg + insets.bottom },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: palette.surface2 }]} />
          <Option label="Sacar foto" onPress={() => choose('camera')} />
          <Option label="Elegir de la galería" onPress={() => choose('gallery')} />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Option({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.option, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Txt variant="body">{label}</Txt>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.xs,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: space.sm },
  option: { paddingVertical: space.md },
})
