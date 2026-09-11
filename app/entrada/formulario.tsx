import { useEffect, useState } from 'react'
import { ScrollView, View, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { scanFromURLAsync } from 'expo-camera'
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition'
import { Screen } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { Field } from '../../src/ui/Field'
import { Button } from '../../src/ui/Button'
import { Chips, type ChipOption } from '../../src/ui/Chips'
import { space } from '../../src/ui/theme'
import { PhotoSlot } from '../../src/components/PhotoSlot'
import { PhotoSourceSheet } from '../../src/components/PhotoSourceSheet'
import { CodeView } from '../../src/components/CodeView'
import { TopBar } from '../../src/components/TopBar'
import { useTicket } from '../../src/hooks/useTickets'
import { saveTicket } from '../../src/lib/library'
import { saveImage, imageUri } from '../../src/lib/images'
import { parseTicketOcr } from '../../src/lib/ocr'
import { CODE_FORMAT_LABELS, SELECTABLE_CODE_FORMATS } from '../../src/lib/codes'
import { setScanListener } from '../../src/lib/scanBridge'
import { takePendingTicketPrefill } from '../../src/lib/ticketPrefillBridge'
import type { CodeFormat } from '../../src/types'

const ALL_FORMATS: CodeFormat[] = [
  'qr', 'code128', 'ean13', 'ean8', 'code39', 'code93',
  'codabar', 'itf14', 'upc_a', 'upc_e', 'pdf417', 'aztec', 'datamatrix',
]

function formatEventDate(ms: number): string {
  const d = new Date(ms)
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${dia} · ${hora}`
}

export default function EntradaFormularioScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { data: existing, ready } = useTicket(id)

  const [loaded, setLoaded] = useState(!id)
  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [eventAt, setEventAt] = useState<number | undefined>()
  const [code, setCode] = useState('')
  const [codeFormat, setCodeFormat] = useState<CodeFormat>('qr')

  const [imgUri, setImgUri] = useState<string | undefined>()
  const [imgIsNew, setImgIsNew] = useState(false)
  // Nombre YA guardado en el almacenamiento de la app: el de una entrada que
  // se está editando, o el que ya dejó ahí una importación de imagen/PDF
  // antes de llegar aquí. Se usa tal cual al guardar; `imgIsNew` es solo para
  // una foto elegida DENTRO de este formulario, que todavía hay que copiar.
  const [savedImageName, setSavedImageName] = useState<string | undefined>()

  const [ocrRunning, setOcrRunning] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sheet compartida por los dos botones que piden una foto sin guardarla
  // como "la imagen de la entrada": leer el billete (OCR) y detectar el
  // código dentro de una captura. `purpose` decide qué hacer con lo elegido.
  const [sheetOpen, setSheetOpen] = useState(false)
  const [purpose, setPurpose] = useState<'ocr' | 'detect'>('ocr')

  useEffect(() => {
    if (loaded || !ready || !existing) return
    setTitle(existing.title)
    setVenue(existing.venue ?? '')
    setPrice(existing.price ?? '')
    setNotes(existing.notes ?? '')
    setEventAt(existing.eventAt)
    setCode(existing.code)
    setCodeFormat(existing.codeFormat)
    if (existing.image) {
      setImgUri(imageUri(existing.image))
      setSavedImageName(existing.image)
    }
    setLoaded(true)
  }, [loaded, ready, existing])

  // Entrada nueva (sin id) creada desde el «+»: si el código/la foto/el PDF ya
  // se leyeron antes de llegar aquí (imagen, PDF o cámara), se rellena con
  // eso. Solo una vez — `takePendingTicketPrefill` vacía el buzón al leerlo.
  useEffect(() => {
    if (id) return
    const prefill = takePendingTicketPrefill()
    if (!prefill) return
    if (prefill.title) setTitle(prefill.title)
    if (prefill.venue) setVenue(prefill.venue)
    if (prefill.price) setPrice(prefill.price)
    if (prefill.eventAt) setEventAt(prefill.eventAt)
    if (prefill.code) setCode(prefill.code)
    if (prefill.codeFormat) setCodeFormat(prefill.codeFormat)
    if (prefill.image) {
      setImgUri(imageUri(prefill.image))
      setSavedImageName(prefill.image)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // El escáner de cámara avisa por aquí en vez de por parámetros de ruta: así
  // no se pierde nada de lo que ya llevabas escrito en el formulario.
  useEffect(() => {
    setScanListener((scannedCode, scannedFormat) => {
      setCode(scannedCode)
      setCodeFormat(scannedFormat)
    })
    return () => setScanListener(null)
  }, [])

  const pickDate = () => {
    const base = eventAt ? new Date(eventAt) : new Date()
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onChange: (_e, date) => {
        if (!date) return
        DateTimePickerAndroid.open({
          value: base,
          mode: 'time',
          onChange: (_e2, time) => {
            if (!time) return
            setEventAt(
              new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes()).getTime(),
            )
          },
        })
      },
    })
  }

  const runOcr = async (uri: string) => {
    setOcrRunning(true)
    try {
      const result = await TextRecognition.recognize(uri, TextRecognitionScript.LATIN)
      const parsed = parseTicketOcr(result.text)
      let any = false
      if (parsed.title && !title) { setTitle(parsed.title); any = true }
      if (parsed.venue && !venue) { setVenue(parsed.venue); any = true }
      if (parsed.price && !price) { setPrice(parsed.price); any = true }
      if (parsed.eventAt && !eventAt) { setEventAt(parsed.eventAt); any = true }
      Alert.alert(
        any ? 'Datos detectados' : 'Sin datos',
        any ? 'Revisa y corrige si hace falta.' : 'No se detectó nada reconocible en la imagen.',
      )
    } catch {
      Alert.alert('No se pudo leer la imagen')
    } finally {
      setOcrRunning(false)
    }
  }

  const detectCode = async (uri: string) => {
    setDetecting(true)
    try {
      const results = await scanFromURLAsync(uri, ALL_FORMATS)
      if (results.length === 0) {
        Alert.alert('Sin código', 'No se encontró ningún código QR o de barras en la imagen.')
        return
      }
      setCode(results[0].data)
      setCodeFormat(results[0].type as CodeFormat)
      // Misma imagen: igual que hacía la importación desde PDF, se aprovecha
      // para intentar leer también el título si aún no lo tienes.
      if (!title) await runOcr(uri)
    } catch (e) {
      Alert.alert('Error al leer la imagen', e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setDetecting(false)
    }
  }

  const onSheetPicked = (uri: string) => {
    if (purpose === 'ocr') runOcr(uri)
    else detectCode(uri)
  }

  const formatOptions: ChipOption<CodeFormat>[] = SELECTABLE_CODE_FORMATS.includes(codeFormat)
    ? SELECTABLE_CODE_FORMATS.map((f) => ({ key: f, label: CODE_FORMAT_LABELS[f] }))
    : [...SELECTABLE_CODE_FORMATS, codeFormat].map((f) => ({ key: f, label: CODE_FORMAT_LABELS[f] }))

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Falta el título', 'El título del evento es obligatorio.')
      return
    }
    if (!code.trim()) {
      Alert.alert('Falta el código', 'Escanea o escribe el valor del código.')
      return
    }
    setSaving(true)
    try {
      const image = imgUri ? (imgIsNew ? await saveImage(imgUri) : savedImageName) : undefined
      await saveTicket(
        {
          title: title.trim(),
          venue: venue.trim() || undefined,
          price: price.trim() || undefined,
          notes: notes.trim() || undefined,
          eventAt,
          code: code.trim(),
          codeFormat,
          image,
        },
        id,
      )
      router.back()
    } catch (e) {
      Alert.alert('No se pudo guardar', e instanceof Error ? e.message : 'Error desconocido')
      setSaving(false)
    }
  }

  return (
    <Screen padded={false}>
      <TopBar title={id ? 'Editar entrada' : 'Nueva entrada'} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field value={title} onChangeText={setTitle} placeholder="Título del evento *" />
        <Field value={venue} onChangeText={setVenue} placeholder="Lugar" />
        <Field value={price} onChangeText={setPrice} placeholder="Precio (opcional)" />

        <Button
          title={eventAt ? formatEventDate(eventAt) : 'Seleccionar fecha y hora'}
          onPress={pickDate}
        />

        <Txt variant="label" tone="muted">
          Código escaneable
        </Txt>
        <View style={styles.row}>
          <Button title="Cámara" onPress={() => router.push('/entrada/escanear')} style={{ flex: 1 }} />
          <Button
            title={detecting ? 'Leyendo…' : 'Desde imagen'}
            onPress={() => { setPurpose('detect'); setSheetOpen(true) }}
            disabled={detecting}
            style={{ flex: 1 }}
          />
        </View>

        <Field value={code} onChangeText={setCode} placeholder="Valor del código *" autoCapitalize="none" />
        <Chips options={formatOptions} value={codeFormat} onChange={setCodeFormat} />

        {code.trim() ? (
          <View style={styles.preview}>
            <CodeView data={code.trim()} format={codeFormat} maxWidth={220} maxHeight={140} />
          </View>
        ) : null}

        <Button
          title={ocrRunning ? 'Leyendo…' : 'Leer datos del billete (OCR)'}
          onPress={() => { setPurpose('ocr'); setSheetOpen(true) }}
          disabled={ocrRunning}
        />

        <Txt variant="label" tone="muted">
          Imagen de la entrada (opcional)
        </Txt>
        <PhotoSlot
          label="Captura o foto"
          uri={imgUri}
          onChange={(uri) => { setImgUri(uri); setImgIsNew(true) }}
          height={140}
        />

        <Field value={notes} onChangeText={setNotes} placeholder="Notas" multiline numberOfLines={2} />

        <Button
          title={saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Guardar entrada'}
          kind="primary"
          onPress={save}
          disabled={saving}
        />
      </ScrollView>

      <PhotoSourceSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onPicked={onSheetPicked} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  row: { flexDirection: 'row', gap: space.sm },
  preview: { alignItems: 'center', paddingVertical: space.sm },
})
