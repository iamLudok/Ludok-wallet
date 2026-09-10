import { useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { usePalette } from '../ui/ThemeProvider'
import { Txt } from '../ui/Text'
import { Field } from '../ui/Field'
import { Button } from '../ui/Button'
import { normalizeTag } from '../lib/rows'
import { radius, space } from '../ui/theme'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
}

/**
 * Etiquetas de una tarjeta: se escriben a mano y se van añadiendo como chips.
 *
 * Monocromas a propósito — la versión de Flutter les daba un color estable
 * derivado del texto, pero eso rompía la identidad «Sala oscura», donde el
 * color de la interfaz solo aparece con significado.
 */
export function TagInput({ tags, onChange }: Props) {
  const palette = usePalette()
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = normalizeTag(draft)
    if (!value || tags.includes(value)) {
      setDraft('')
      return
    }
    onChange([...tags, value])
    setDraft('')
  }

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag))

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Field
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          placeholder="Ej: favorito, vip…"
          style={{ flex: 1 }}
        />
        <Button title="Añadir" small onPress={add} disabled={!draft.trim()} />
      </View>

      {tags.length > 0 && (
        <View style={styles.chips}>
          {tags.map((t) => (
            <Pressable
              key={t}
              onPress={() => remove(t)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar etiqueta ${t}`}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: palette.surface2, borderColor: palette.line, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Txt variant="small">{t} ×</Txt>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
})
