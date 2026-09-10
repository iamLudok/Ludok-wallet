import { useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { renderCode, type RenderedCode } from '../lib/codes'
import { usePalette } from '../ui/ThemeProvider'
import { Txt } from '../ui/Text'
import { space } from '../ui/theme'
import type { CodeFormat } from '../types'

interface Props {
  data: string
  format: CodeFormat
  /** Recuadro máximo donde tiene que caber el dibujo. */
  maxWidth: number
  maxHeight: number
}

type Result = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; code: RenderedCode }

/**
 * Dibuja un código (QR, de barras…) a partir de su valor y formato, con la
 * proporción natural de CADA código — un PDF417 sale ancho, un QR cuadrado,
 * sin tener que decidirlo a mano según el formato.
 *
 * `renderCode` es asíncrono (carga `bwip-js` la primera vez que hace falta),
 * así que esto pasa por un estado «cargando» breve en vez de calcularse en el
 * propio render.
 */
export function CodeView({ data, format, maxWidth, maxHeight }: Props) {
  const palette = usePalette()
  const [result, setResult] = useState<Result>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setResult({ status: 'loading' })
    renderCode(format, data)
      .then((code) => {
        if (!cancelled) setResult({ status: 'ok', code })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResult({ status: 'error', message: e instanceof Error ? e.message : 'Código no válido' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [data, format])

  if (result.status === 'loading') {
    return (
      <View style={{ width: maxWidth, height: maxHeight, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.muted} />
      </View>
    )
  }

  if (result.status === 'error') {
    return (
      <View style={[styles.error, { width: maxWidth, height: maxHeight }]}>
        <Txt variant="small" tone="danger" style={{ textAlign: 'center' }}>
          Código no válido para este formato
        </Txt>
        <Txt variant="small" tone="faint" style={{ textAlign: 'center' }}>
          Prueba a cambiar el formato en editar
        </Txt>
      </View>
    )
  }

  // Ajuste "contain": el lado que sobre según la proporción del código es el
  // que manda, para que quepa entero dentro del recuadro disponible.
  const { aspectRatio, svg } = result.code
  const boxRatio = maxWidth / maxHeight
  const width = aspectRatio > boxRatio ? maxWidth : maxHeight * aspectRatio
  const height = aspectRatio > boxRatio ? maxWidth / aspectRatio : maxHeight

  return <SvgXml xml={svg} width={width} height={height} />
}

const styles = StyleSheet.create({
  error: { alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingHorizontal: space.lg },
})
