import { useEffect, useState } from 'react'
import { ScrollView, View, StyleSheet, Alert, KeyboardAvoidingView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition'
import { Screen } from '../../src/ui/Screen'
import { Txt } from '../../src/ui/Text'
import { Field } from '../../src/ui/Field'
import { Button } from '../../src/ui/Button'
import { Chips } from '../../src/ui/Chips'
import { space } from '../../src/ui/theme'
import { PhotoSlot } from '../../src/components/PhotoSlot'
import { TagInput } from '../../src/components/TagInput'
import { ListField } from '../../src/components/ListField'
import { TopBar } from '../../src/components/TopBar'
import { useCard } from '../../src/hooks/useCards'
import { saveCard } from '../../src/lib/library'
import { saveImage, imageUri } from '../../src/lib/images'
import { parseCardOcr, mergeCardOcr, type OcrCardResult } from '../../src/lib/ocr'
import { CARD_TYPES, CARD_TYPE_LABELS } from '../../src/lib/cardTypes'
import type { CardType } from '../../src/types'

const TYPE_OPTIONS = CARD_TYPES.map((t) => ({ key: t, label: CARD_TYPE_LABELS[t] }))

export default function TarjetaFormularioScreen() {
  const params = useLocalSearchParams<{ id?: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { data: existing, ready } = useCard(id)

  const [loaded, setLoaded] = useState(!id)
  const [name, setName] = useState('')
  const [type, setType] = useState<CardType>('other')
  const [phones, setPhones] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [addresses, setAddresses] = useState<string[]>([])
  const [country, setCountry] = useState('')
  const [website, setWebsite] = useState('')
  const [social, setSocial] = useState('')
  const [tags, setTags] = useState<string[]>([])

  // Se guarda la URI a mostrar (nueva o ya persistida) y, aparte, si es nueva
  // — solo entonces hay que copiarla al guardar; si no, el nombre ya guardado
  // se mantiene tal cual.
  const [frontUri, setFrontUri] = useState<string | undefined>()
  const [frontIsNew, setFrontIsNew] = useState(false)
  const [backUri, setBackUri] = useState<string | undefined>()
  const [backIsNew, setBackIsNew] = useState(false)

  const [ocrRunning, setOcrRunning] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (loaded || !ready || !existing) return
    setName(existing.name)
    setType(existing.type)
    setPhones(existing.phones ?? [])
    setEmail(existing.email ?? '')
    setAddresses(existing.addresses ?? [])
    setCountry(existing.country ?? '')
    setWebsite(existing.website ?? '')
    setSocial(existing.social ?? '')
    setTags(existing.tags ?? [])
    if (existing.photo) setFrontUri(imageUri(existing.photo))
    if (existing.photoBack) setBackUri(imageUri(existing.photoBack))
    setLoaded(true)
  }, [loaded, ready, existing])

  /**
   * Lee una o varias fotos y fusiona lo que saque de cada una (el anverso
   * suele llevar teléfono/nombre, el reverso a veces trae la dirección o el
   * horario en el dorso) — antes solo se leía el anverso, y la mitad de los
   * datos de una tarjeta con reverso impreso se quedaban siempre fuera.
   * El orden de `uris` decide qué foto gana si las dos traen el mismo campo.
   */
  const runOcr = async (uris: string[]) => {
    if (!uris.length) return
    setOcrRunning(true)
    try {
      let merged: OcrCardResult = { phones: [], addresses: [], rawText: '' }
      for (const uri of uris) {
        const result = await TextRecognition.recognize(uri, TextRecognitionScript.LATIN)
        merged = mergeCardOcr(merged, parseCardOcr(result.text))
      }

      let any = false
      const fill = (current: string, setter: (v: string) => void, value?: string) => {
        if (value && !current) {
          setter(value)
          any = true
        }
      }
      // Las listas se completan, no se pisan: lo que ya tenías escrito a mano
      // se queda, y solo se añade lo que aún no estuviera.
      const fillList = (current: string[], setter: (v: string[]) => void, found: string[]) => {
        const nuevos = found.filter((v) => !current.includes(v))
        if (nuevos.length) {
          setter([...current, ...nuevos])
          any = true
        }
      }
      fillList(phones, setPhones, merged.phones)
      fill(email, setEmail, merged.email)
      fillList(addresses, setAddresses, merged.addresses)
      fill(website, setWebsite, merged.website)
      fill(social, setSocial, merged.social)
      Alert.alert(
        any ? 'Datos detectados' : 'Sin datos',
        any ? 'Revisa y corrige si hace falta.' : 'No se detectaron datos reconocibles.',
      )
    } catch {
      Alert.alert('No se pudo leer la foto')
    } finally {
      setOcrRunning(false)
    }
  }

  /** Las fotos que hay ahora mismo, anverso primero — para leerlas juntas. */
  const bothPhotos = (front: string | undefined, back: string | undefined): string[] =>
    [front, back].filter((u): u is string => !!u)

  const offerOcr = (uris: string[]) => {
    Alert.alert(
      '¿Escanear datos?',
      'Puedo intentar detectar teléfono, email, dirección y web. ¿Lo pruebo?',
      [
        { text: 'No, gracias', style: 'cancel' },
        { text: 'Sí, escanear', onPress: () => runOcr(uris) },
      ],
    )
  }

  const onFrontPicked = (uri: string) => {
    setFrontUri(uri)
    setFrontIsNew(true)
    offerOcr(bothPhotos(uri, backUri))
  }

  const onBackPicked = (uri: string) => {
    setBackUri(uri)
    setBackIsNew(true)
    offerOcr(bothPhotos(frontUri, uri))
  }

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'El nombre es obligatorio.')
      return
    }
    setSaving(true)
    try {
      const photo = frontUri ? (frontIsNew ? await saveImage(frontUri) : existing?.photo) : undefined
      const photoBack = backUri ? (backIsNew ? await saveImage(backUri) : existing?.photoBack) : undefined

      await saveCard(
        {
          name: name.trim(),
          type,
          photo,
          photoBack,
          phones,
          email: email.trim() || undefined,
          addresses,
          country: country.trim() || undefined,
          website: website.trim() || undefined,
          social: social.trim() || undefined,
          tags,
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
      <TopBar title={id ? 'Editar tarjeta' : 'Nueva tarjeta'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // «adjustResize» del manifest ya no basta: con edge-to-edge obligatorio
        // desde Android 15, la ventana no se redimensiona sola y el teclado se
        // queda tapando el campo. `behavior="height"` no depende de eso:
        // escucha el evento nativo del teclado y encoge esta vista él solo.
        behavior="height"
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Txt variant="label" tone="muted">
          Tipo
        </Txt>
        <Chips options={TYPE_OPTIONS} value={type} onChange={setType} />

        <View style={styles.photos}>
          <View style={{ flex: 1 }}>
            <PhotoSlot
              label="Anverso"
              uri={frontUri}
              onChange={onFrontPicked}
              ocrRunning={ocrRunning}
              onRescan={frontUri ? () => runOcr(bothPhotos(frontUri, backUri)) : undefined}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PhotoSlot
              label="Reverso"
              uri={backUri}
              onChange={onBackPicked}
              ocrRunning={ocrRunning}
              onRescan={backUri ? () => runOcr(bothPhotos(frontUri, backUri)) : undefined}
            />
          </View>
        </View>

        <Field value={name} onChangeText={setName} placeholder="Nombre *" />

        <Txt variant="label" tone="muted">
          Teléfonos
        </Txt>
        <ListField
          values={phones}
          onChange={setPhones}
          placeholder="Añadir teléfono"
          addLabel="Añadir"
          keyboardType="phone-pad"
        />

        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Txt variant="label" tone="muted">
          Direcciones
        </Txt>
        <ListField values={addresses} onChange={setAddresses} placeholder="Añadir dirección" addLabel="Añadir" />

        <Field value={country} onChangeText={setCountry} placeholder="País" />
        <Field
          value={website}
          onChangeText={setWebsite}
          placeholder="Web"
          keyboardType="url"
          autoCapitalize="none"
        />
        <Field
          value={social}
          onChangeText={setSocial}
          placeholder="Instagram (@usuario o enlace)"
          autoCapitalize="none"
        />

        <Txt variant="label" tone="muted">
          Etiquetas
        </Txt>
        <TagInput tags={tags} onChange={setTags} />

        <Button
          title={saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Crear tarjeta'}
          kind="primary"
          onPress={save}
          disabled={saving}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  photos: { flexDirection: 'row', gap: space.md },
})
