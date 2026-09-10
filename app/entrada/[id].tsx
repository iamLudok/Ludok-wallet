import { useEffect, useRef, useState } from 'react'
import { Pressable, View, StyleSheet, Alert, ActivityIndicator, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Image } from 'expo-image'
import * as Brightness from 'expo-brightness'
import { Screen } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { usePalette } from '../../src/ui/ThemeProvider'
import { radius, space } from '../../src/ui/theme'
import { useTicket } from '../../src/hooks/useTickets'
import { deleteTicket } from '../../src/lib/library'
import { imageUri } from '../../src/lib/images'
import { CodeView } from '../../src/components/CodeView'
import { TopBar } from '../../src/components/TopBar'
import { CODE_FORMAT_LABELS } from '../../src/lib/codes'
import type { Ticket } from '../../src/types'

function formatEventDate(ms: number): string {
  const d = new Date(ms)
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${dia} · ${hora}`
}

export default function EntradaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const palette = usePalette()
  const { data: ticket, ready } = useTicket(id)

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.muted} />
      </View>
    )
  }

  if (!ticket) {
    return (
      <Screen title="Entrada">
        <Txt variant="body" tone="muted">
          Esta entrada ya no existe.
        </Txt>
      </Screen>
    )
  }

  return (
    <DetailView
      ticket={ticket}
      onEdit={() => router.push(`/entrada/formulario?id=${ticket.id}`)}
      onDeleted={() => router.back()}
    />
  )
}

function DetailView({ ticket, onEdit, onDeleted }: { ticket: Ticket; onEdit: () => void; onDeleted: () => void }) {
  const palette = usePalette()
  const { width, height } = useWindowDimensions()
  const [fullscreen, setFullscreen] = useState(false)
  const original = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      // Restaurar siempre al salir, aunque no se haya llegado a entrar en
      // pantalla completa (el `if` de dentro lo hace inofensivo).
      if (original.current !== null) Brightness.setBrightnessAsync(original.current).catch(() => {})
    }
  }, [])

  const enterFullscreen = async () => {
    try {
      original.current = await Brightness.getBrightnessAsync()
      await Brightness.setBrightnessAsync(1)
    } catch {
      // Sin permiso o sin sensor: se enseña el código igual, solo que sin subir el brillo.
    }
    setFullscreen(true)
  }

  const exitFullscreen = async () => {
    if (original.current !== null) {
      await Brightness.setBrightnessAsync(original.current).catch(() => {})
    }
    setFullscreen(false)
  }

  const confirmDelete = () => {
    Alert.alert('Eliminar entrada', '¿Seguro que quieres eliminar esta entrada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteTicket(ticket.id); onDeleted() } },
    ])
  }

  if (fullscreen) {
    return (
      <Pressable style={styles.fullscreen} onPress={exitFullscreen}>
        <StatusBar hidden />
        <CodeView data={ticket.code} format={ticket.codeFormat} maxWidth={width * 0.85} maxHeight={height * 0.7} />
        <Txt variant="small" style={{ color: '#111', marginTop: space.lg }}>
          Toca para salir
        </Txt>
      </Pressable>
    )
  }

  return (
    <Screen padded={false}>
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

      <View style={styles.body}>
        <Txt variant="display">{ticket.title}</Txt>
        {ticket.venue ? <Txt variant="body" tone="muted">{ticket.venue}</Txt> : null}
        {ticket.eventAt ? <Txt variant="body" tone="muted">{formatEventDate(ticket.eventAt)}</Txt> : null}

        <Pressable
          onPress={enterFullscreen}
          style={[styles.codeCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <CodeView data={ticket.code} format={ticket.codeFormat} maxWidth={width - space.lg * 4} maxHeight={220} />
          <Txt variant="small" tone="muted" style={{ marginTop: space.md }}>
            {CODE_FORMAT_LABELS[ticket.codeFormat]} · toca para pantalla completa
          </Txt>
        </Pressable>

        {ticket.image ? (
          <Image
            source={{ uri: imageUri(ticket.image) }}
            style={styles.ticketImage}
            contentFit="contain"
          />
        ) : null}

        {ticket.notes ? (
          <View style={[styles.notes, { borderColor: palette.line }]}>
            <Txt variant="body">{ticket.notes}</Txt>
          </View>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.sm },
  codeCard: {
    marginTop: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    alignItems: 'center',
  },
  ticketImage: { width: '100%', height: 220, marginTop: space.md, borderRadius: radius.md },
  notes: { marginTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md },
  fullscreen: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
})
