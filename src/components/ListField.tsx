import { useState } from 'react'
import { View, Pressable, StyleSheet, type KeyboardTypeOptions } from 'react-native'
import { usePalette } from '../ui/ThemeProvider'
import { Txt } from '../ui/Text'
import { Field } from '../ui/Field'
import { Button } from '../ui/Button'
import { radius, space } from '../ui/theme'

interface Props {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
  addLabel: string
  keyboardType?: KeyboardTypeOptions
}

/**
 * Lista de valores libres que se van añadiendo uno a uno (teléfonos,
 * direcciones…): un solo campo fijo se quedaba corto en cuanto una tarjeta
 * tenía más de uno, y distinto tipo de ficha necesita distinta cantidad. A
 * diferencia de `TagInput`, no normaliza a minúsculas: un teléfono o una
 * dirección no son etiquetas.
 */
export function ListField({ values, onChange, placeholder, addLabel, keyboardType }: Props) {
  const palette = usePalette()
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value) return
    onChange([...values, value])
    setDraft('')
  }

  const remove = (index: number) => onChange(values.filter((_, i) => i !== index))

  return (
    <View style={styles.wrap}>
      {values.map((v, i) => (
        <View key={i} style={[styles.row, { borderColor: palette.line, backgroundColor: palette.surface }]}>
          <Txt variant="body" style={{ flex: 1 }} numberOfLines={1}>
            {v}
          </Txt>
          <Pressable
            onPress={() => remove(i)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${v}`}
          >
            <Txt variant="body" tone="muted">
              ×
            </Txt>
          </Pressable>
        </View>
      ))}

      <View style={styles.addRow}>
        <Field
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          placeholder={placeholder}
          keyboardType={keyboardType}
          style={{ flex: 1 }}
        />
        <Button title={addLabel} small onPress={add} disabled={!draft.trim()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  addRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
})
