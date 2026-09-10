import { Pressable, View, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Txt } from '../ui/Text'
import { space } from '../ui/theme'

interface Props {
  /** Título corto en la propia barra. Para las fichas, se deja fuera: ya
   * llevan un título grande debajo, y repetirlo arriba sobraría. */
  title?: string
  /** Acciones a la derecha (Editar, Eliminar…). */
  children?: React.ReactNode
}

/**
 * Flecha de volver + acciones, para las pantallas apiladas (fichas y
 * formularios). El layout raíz lleva `headerShown: false` en todas las
 * rutas —«Sala oscura» no usa la cabecera nativa—, así que esto es lo único
 * que deja volver atrás sin depender solo del gesto del sistema.
 */
export function TopBar({ title, children }: Props) {
  const router = useRouter()
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver">
        <Txt variant="title">‹</Txt>
      </Pressable>
      {title ? (
        <Txt variant="section" numberOfLines={1} style={styles.title}>
          {title}
        </Txt>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: { flex: 1, marginLeft: space.xs },
})
