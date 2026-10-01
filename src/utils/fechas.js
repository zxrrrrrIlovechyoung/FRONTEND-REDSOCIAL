export const formatearFechaMomento = (fecha) => {
  const publicada = new Date(fecha)
  if (Number.isNaN(publicada.getTime())) return ''

  const ahora = new Date()
  const diffMs = Math.max(0, ahora.getTime() - publicada.getTime())
  const minutos = Math.floor(diffMs / 60000)

  if (minutos < 1) return 'Ahora'
  if (minutos < 60) return `Hace ${minutos} min`

  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `Hace ${horas} h`

  const dias = Math.floor(horas / 24)
  if (dias < 7) return `Hace ${dias} d`

  const semanas = Math.floor(dias / 7)
  if (semanas < 5) return `Hace ${semanas} sem`

  const meses = Math.floor(dias / 30)
  if (meses < 12) return `Hace ${meses} mes${meses === 1 ? '' : 'es'}`

  return publicada.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}
