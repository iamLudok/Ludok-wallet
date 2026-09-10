import { useRef, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Txt } from '../../src/ui/Text'
import { space } from '../../src/ui/theme'
import { emitScan } from '../../src/lib/scanBridge'
import type { CodeFormat } from '../../src/types'

/** Todos los formatos que sabe leer la cámara — coinciden con `CodeFormat`. */
const ALL_FORMATS: CodeFormat[] = [
  'qr',
  'code128',
  'ean13',
  'ean8',
  'code39',
  'code93',
  'codabar',
  'itf14',
  'upc_a',
  'upc_e',
  'pdf417',
  'aztec',
  'datamatrix',
]

/** Abre la cámara, y al detectar un código avisa al formulario que la abrió y vuelve atrás. */
export default function EscanearScreen() {
  const router = useRouter()
  const [permission, requestPermission] = useCameraPermissions()
  const [torch, setTorch] = useState(false)
  const detected = useRef(false)

  const onScanned = ({ data, type }: { data: string; type: string }) => {
    if (detected.current) return
    detected.current = true
    emitScan(data, type as CodeFormat)
    router.back()
  }

  if (!permission) return null

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Txt variant="body" tone="muted" style={{ textAlign: 'center', marginBottom: space.lg }}>
          Hace falta permiso de cámara para escanear el código.
        </Txt>
        <Pressable onPress={requestPermission} accessibilityRole="button">
          <Txt variant="body">Dar permiso</Txt>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ALL_FORMATS }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.frame} pointerEvents="none" />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
          <Txt variant="title" style={{ color: '#fff' }}>
            ×
          </Txt>
        </Pressable>
        <Pressable onPress={() => setTorch((t) => !t)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Linterna">
          <Txt variant="body" style={{ color: '#fff' }}>
            {torch ? 'Linterna ✓' : 'Linterna'}
          </Txt>
        </Pressable>
      </View>
      <Txt variant="small" style={styles.hint}>
        Coloca el código dentro del recuadro
      </Txt>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  frame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 240,
    height: 240,
    marginLeft: -120,
    marginTop: -120,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
  topBar: {
    position: 'absolute',
    top: space.xl,
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
})
