// Hasta ahora no hacía falta este fichero: Expo aplica su preset por defecto
// sin necesidad de declararlo. Pero react-native-reanimated (para arrastrar
// tarjetas y reordenarlas) necesita su plugin de Babel, y ese SIEMPRE tiene
// que ir el último de la lista.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
