// Hermes no trae `URL`/`URLSearchParams` completos: cualquier cliente que
// construya URLs (Nextcloud) revienta sin este polyfill, y tiene que ir antes
// que cualquier otro import.
import 'react-native-url-polyfill/auto'

import { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, AppState } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useShareIntent } from 'expo-share-intent'
// Importar `db` crea el esquema de forma síncrona: para cuando esto se
// evalúa, las tablas ya existen y cualquier pantalla puede consultar.
// `images` registra el almacén de fotos del mismo modo.
import '../src/lib/db'
import '../src/lib/images'
import { ensureSettings } from '../src/lib/settings'
import { maybeAutoBackup } from '../src/lib/autoBackup'
import { importTicketFromImage } from '../src/lib/ticketImport'
import { setPendingTicketPrefill } from '../src/lib/ticketPrefillBridge'
import { ThemeProvider, usePalette, useIsDark } from '../src/ui/ThemeProvider'
import { Txt } from '../src/ui/Text'
import { space } from '../src/ui/theme'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

function Shell() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importingShare, setImportingShare] = useState(false)
  const palette = usePalette()
  const isDark = useIsDark()
  const router = useRouter()
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent()

  useEffect(() => {
    // Las tablas ya están creadas (al importar `db`). Aquí solo se persisten
    // los ajustes por defecto la primera vez.
    ensureSettings()
      .then(() => setReady(true))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : 'Error al abrir la base de datos'),
      )
  }, [])

  // Copia automática al Nextcloud propio: al arrancar y cada vez que se
  // vuelve a la app. `maybeAutoBackup` decide sola si toca (WiFi, tiempo desde
  // la última), así que llamarla de más no cuesta nada. Los fallos se ignoran
  // a propósito: si no hay red no es momento de dar la tabarra.
  useEffect(() => {
    if (!ready) return
    const run = () => {
      maybeAutoBackup().catch(() => {})
    }
    run()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run()
    })
    return () => sub.remove()
  }, [ready])

  /**
   * Alguien comparte una foto CON Ludovis (Galería, WhatsApp, Gmail…): se lee
   * como una entrada nueva —código y, con OCR, título/lugar/fecha— y se abre
   * el formulario ya relleno, igual que al elegirla desde el «+» de Entradas.
   * `expo-share-intent` solo entrega esto por aquí, en el layout raíz: no hay
   * otro sitio donde enterarse de una app abierta desde fuera con datos.
   */
  useEffect(() => {
    if (!ready || !hasShareIntent) return
    const file = shareIntent.files?.[0]
    if (!file) {
      resetShareIntent()
      return
    }
    setImportingShare(true)
    importTicketFromImage(file.path)
      .then((prefill) => {
        setPendingTicketPrefill(prefill)
        router.push('/entrada/formulario')
      })
      .catch(() => {
        // Sin aviso: si lo compartido no era legible, el formulario se abre
        // igual desde el «+» normal y no hay nada que perder aquí.
      })
      .finally(() => {
        setImportingShare(false)
        resetShareIntent()
      })
  }, [ready, hasShareIntent, shareIntent, resetShareIntent, router])

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Txt variant="body" tone="danger" style={{ textAlign: 'center' }}>
          {error}
        </Txt>
      </View>
    )
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator color={palette.muted} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      {importingShare && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color="#fff" />
          <Txt variant="body" style={{ color: '#fff', marginTop: space.sm }}>
            Leyendo lo que has compartido…
          </Txt>
        </View>
      )}
    </>
  )
}
