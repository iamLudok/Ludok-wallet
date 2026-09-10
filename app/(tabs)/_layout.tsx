import { Tabs } from 'expo-router'
import { View, StyleSheet, type ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePalette } from '../../src/ui/ThemeProvider'
import { radius } from '../../src/ui/theme'

type Shape = 'cards' | 'tickets' | 'settings'

/**
 * Las tres pestañas. Formas geométricas dibujadas con vistas en vez de
 * emojis: en «Sala oscura» la interfaz es monocroma, y un emoji a color
 * rompería justo eso. El icono de entradas «recorta» dos huecos con el mismo
 * color del fondo de la barra, para que se lea como una entrada perforada.
 */
function Icon({ shape, color, bg }: { shape: Shape; color: ColorValue; bg: ColorValue }) {
  if (shape === 'cards') {
    return (
      <View style={styles.box}>
        <View style={[styles.cardBack, { borderColor: color }]} />
        <View style={[styles.card, { borderColor: color, backgroundColor: bg }]} />
      </View>
    )
  }
  if (shape === 'tickets') {
    return (
      <View style={styles.box}>
        <View style={[styles.ticket, { borderColor: color }]} />
        <View style={[styles.notch, styles.notchTop, { backgroundColor: bg }]} />
        <View style={[styles.notch, styles.notchBottom, { backgroundColor: bg }]} />
      </View>
    )
  }
  return (
    <View style={styles.box}>
      <View style={[styles.ring, { borderColor: color }]} />
    </View>
  )
}

export default function TabsLayout() {
  const palette = usePalette()
  // La barra de gestos del sistema se come el texto de las pestañas si no se
  // deja hueco por debajo (se ve en móviles con navegación por gestos).
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.bg },
        tabBarActiveTintColor: palette.fg,
        tabBarInactiveTintColor: palette.faint,
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.line,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tarjetas',
          tabBarIcon: ({ color }) => <Icon shape="cards" color={color} bg={palette.bg} />,
        }}
      />
      <Tabs.Screen
        name="entradas"
        options={{
          title: 'Entradas',
          tabBarIcon: ({ color }) => <Icon shape="tickets" color={color} bg={palette.bg} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Icon shape="settings" color={color} bg={palette.bg} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  box: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  cardBack: {
    position: 'absolute',
    width: 18,
    height: 13,
    borderRadius: 3,
    borderWidth: 2,
    top: 1,
    left: 3,
    opacity: 0.5,
  },
  card: { position: 'absolute', width: 18, height: 13, borderRadius: 3, borderWidth: 2, bottom: 1, left: 0 },
  ticket: { width: 19, height: 14, borderRadius: 3, borderWidth: 2 },
  notch: { position: 'absolute', width: 6, height: 6, borderRadius: radius.pill },
  notchTop: { top: -3, left: '50%', marginLeft: -3 },
  notchBottom: { bottom: -3, left: '50%', marginLeft: -3 },
  ring: { width: 17, height: 17, borderRadius: radius.pill, borderWidth: 3 },
})
