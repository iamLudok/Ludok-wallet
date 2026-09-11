import { Modal, Pressable, View, StyleSheet } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePalette } from '../ui/ThemeProvider'
import { Txt } from '../ui/Text'
import { space } from '../ui/theme'

interface Props {
  visible: boolean
  onClose: () => void
  onCamera: () => void
  onImagePicked: (uri: string) => void
  onPdfPicked: (uri: string) => void
}

async function pickImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) return null
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.92 })
  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0].uri
}

async function pickPdf(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  })
  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0].uri
}

/**
 * De dónde sale una entrada nueva. Sustituye al formulario en blanco: se
 * pregunta esto ANTES de nada, y el formulario aparece ya con lo que se haya
 * podido leer (código, título, fecha…), no vacío.
 */
export function TicketSourceSheet({ visible, onClose, onCamera, onImagePicked, onPdfPicked }: Props) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()

  const chooseCamera = () => {
    onClose()
    onCamera()
  }
  const chooseImage = async () => {
    onClose()
    const uri = await pickImage()
    if (uri) onImagePicked(uri)
  }
  const choosePdf = async () => {
    onClose()
    const uri = await pickPdf()
    if (uri) onPdfPicked(uri)
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
          <Txt variant="label" tone="muted" style={{ marginBottom: space.xs }}>
            Nueva entrada
          </Txt>
          <Option label="Escanear con la cámara" onPress={chooseCamera} />
          <Option label="Foto o captura de la galería" onPress={chooseImage} />
          <Option label="Archivo PDF" onPress={choosePdf} />
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
