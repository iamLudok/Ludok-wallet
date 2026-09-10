import { TextInput, StyleSheet, type TextInputProps } from 'react-native'
import { usePalette } from './ThemeProvider'
import { radius, space } from './theme'

/**
 * Campo de texto con el estilo de la app. Envuelve `TextInput` para que cada
 * formulario no repita los mismos bordes y colores a mano.
 */
export function Field(props: TextInputProps) {
  const palette = usePalette()
  return (
    <TextInput
      placeholderTextColor={palette.faint}
      {...props}
      style={[
        styles.input,
        { borderColor: palette.line, color: palette.fg, backgroundColor: palette.surface },
        props.style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 14,
  },
})
