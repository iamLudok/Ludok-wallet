import { useEffect, useState } from 'react'
import { ScrollView, View, StyleSheet, Alert } from 'react-native'
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
import { TopBar } from '../../src/components/TopBar'
import { useCard } from '../../src/hooks/useCards'
import { saveCard } from '../../src/lib/library'
import { saveImage, imageUri } from '../../src/lib/images'
import { parseCardOcr } from '../../src/lib/ocr'
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
  const [phone, setPhone] = useState('')
  const [phone2, setPhone2] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
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
    setPhone(existing.phone ?? '')
    setPhone2(existing.phone2 ?? '')
    setEmail(existing.email ?? '')
    setAddress(existing.address ?? '')
    setWebsite(existing.website ?? '')
    setSocial(existing.social ?? '')
    setTags(existing.tags ?? [])
    if (existing.photo) setFrontUri(imageUri(existing.photo))
    if (existing.photoBack) setBackUri(imageUri(existing.photoBack))
    setLoaded(true)
  }, [loaded, ready, existing])

  const runOcr = async (uri: string) => {
    setOcrRunning(true)
    try {
      const result = await TextRecognition.recognize(uri, TextRecognitionScript.LATIN)
      const parsed = parseCardOcr(result.text)
      let any = false
      const fill = (current: string, setter: (v: string) => void, value?: string) => {
        if (value && !current) {
          setter(value)
          any = true
        }
      }
      fill(phone, setPhone, parsed.phone)
      fill(email, setEmail, parsed.email)
      fill(address, setAddress, parsed.address)
      fill(website, setWebsite, parsed.website)
      fill(social, setSocial, parsed.social)
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

  const onFrontPicked = (uri: string) => {
    setFrontUri(uri)
    setFrontIsNew(true)
    Alert.alert(
      '¿Escanear datos?',
      'Puedo intentar detectar teléfono, email, dirección y web. ¿Lo pruebo?',
      [
        { text: 'No, gracias', style: 'cancel' },
        { text: 'Sí, escanear', onPress: () => runOcr(uri) },
      ],
    )
  }

  const onBackPicked = (uri: string) => {
    setBackUri(uri)
    setBackIsNew(true)
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
          phone: phone.trim() || undefined,
          phone2: phone2.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
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
              onRescan={frontUri ? () => runOcr(frontUri) : undefined}
            />
          </View>
          <View style={{ flex: 1 }}>
            <PhotoSlot label="Reverso" uri={backUri} onChange={onBackPicked} />
          </View>
        </View>

        <Field value={name} onChangeText={setName} placeholder="Nombre *" />
        <Field value={phone} onChangeText={setPhone} placeholder="Teléfono 1" keyboardType="phone-pad" />
        <Field value={phone2} onChangeText={setPhone2} placeholder="Teléfono 2" keyboardType="phone-pad" />
        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field value={address} onChangeText={setAddress} placeholder="Dirección" />
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
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.xxl },
  photos: { flexDirection: 'row', gap: space.md },
})
