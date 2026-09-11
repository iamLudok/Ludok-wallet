import { useState } from 'react'
import { Pressable, View, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Screen, Empty } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { Button } from '../../src/ui/Button'
import { usePalette } from '../../src/ui/ThemeProvider'
import { radius, space } from '../../src/ui/theme'
import { useTickets } from '../../src/hooks/useTickets'
import BackupBanner from '../../src/components/BackupBanner'
import { TicketSourceSheet } from '../../src/components/TicketSourceSheet'
import { importTicketFromImage, importTicketFromPdf } from '../../src/lib/ticketImport'
import { setPendingTicketPrefill } from '../../src/lib/ticketPrefillBridge'
import type { Ticket } from '../../src/types'

function formatEventDate(ms: number): string {
  const d = new Date(ms)
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${dia} · ${hora}`
}

export default function EntradasScreen() {
  const router = useRouter()
  const { data: tickets, ready } = useTickets()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  const onCamera = () => router.push('/entrada/escanear?mode=new')

  const onImagePicked = async (uri: string) => {
    setImporting(true)
    try {
      setPendingTicketPrefill(await importTicketFromImage(uri))
      router.push('/entrada/formulario')
    } catch (e) {
      Alert.alert('No se pudo leer la imagen', e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setImporting(false)
    }
  }

  const onPdfPicked = async (uri: string) => {
    setImporting(true)
    try {
      setPendingTicketPrefill(await importTicketFromPdf(uri))
      router.push('/entrada/formulario')
    } catch (e) {
      Alert.alert('No se pudo leer el PDF', e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Screen
      title="Entradas"
      padded={false}
      right={
        <Button
          title="+ Nueva"
          kind="primary"
          small
          onPress={() => setSheetOpen(true)}
          disabled={importing}
        />
      }
    >
      <View style={{ paddingHorizontal: space.lg }}>
        <BackupBanner />
      </View>

      {!ready ? null : tickets.length === 0 ? (
        <Empty text="Todavía no has guardado ninguna entrada.">
          <Button title="Guardar la primera" kind="primary" onPress={() => setSheetOpen(true)} />
        </Empty>
      ) : (
        <View style={styles.list}>
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} onPress={() => router.push(`/entrada/${t.id}`)} />
          ))}
        </View>
      )}

      <TicketSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCamera={onCamera}
        onImagePicked={onImagePicked}
        onPdfPicked={onPdfPicked}
      />

      {importing && (
        <View style={styles.overlay} pointerEvents="auto">
          <ActivityIndicator color="#fff" />
          <Txt variant="body" style={{ color: '#fff', marginTop: space.sm }}>
            Leyendo…
          </Txt>
        </View>
      )}
    </Screen>
  )
}

function TicketRow({ ticket, onPress }: { ticket: Ticket; onPress: () => void }) {
  const palette = usePalette()
  const subtitle = [ticket.venue, ticket.eventAt ? formatEventDate(ticket.eventAt) : undefined]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: palette.surface, borderColor: palette.line, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Txt variant="section" numberOfLines={1}>
          {ticket.title}
        </Txt>
        {subtitle ? (
          <Txt variant="small" tone="muted" numberOfLines={1}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      <Txt variant="body" tone="faint">
        ›
      </Txt>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
