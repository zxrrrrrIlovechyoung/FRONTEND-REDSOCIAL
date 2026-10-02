import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { advertenciaService } from '../services/advertenciaService'

const motivosAdvertencia = {
  spam: 'Spam o enlaces repetidos',
  respeto: 'Convivencia y respeto',
  contenido: 'Contenido inapropiado',
  general: 'Advertencia general',
}

const formatearFecha = (fecha) => {
  if (!fecha) return ''

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}

export default function WarningNotice() {
  const { estaAutenticado } = useAuth()
  const [advertencias, setAdvertencias] = useState([])
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    if (!estaAutenticado) {
      setAdvertencias([])
      return undefined
    }

    let activo = true

    const cargar = async () => {
      const resultado = await advertenciaService.pendientes()
      if (!activo) return
      if (resultado.exito) setAdvertencias(resultado.datos ?? [])
    }

    cargar()
    const intervalo = window.setInterval(cargar, 45000)
    return () => {
      activo = false
      window.clearInterval(intervalo)
    }
  }, [estaAutenticado])

  const advertencia = advertencias[0]
  if (!estaAutenticado || !advertencia) return null

  const confirmarLectura = async () => {
    if (procesando) return

    setProcesando(true)
    const resultado = await advertenciaService.marcarLeida(advertencia.idAdvertencia)
    setProcesando(false)

    if (resultado.exito) {
      setAdvertencias((actuales) => actuales.filter((item) => item.idAdvertencia !== advertencia.idAdvertencia))
    }
  }

  return (
    <div className="warning-notice-backdrop" role="presentation">
      <section className="warning-notice-modal" role="dialog" aria-modal="true" aria-label="Advertencia de moderación">
        <span className="warning-notice-icon" aria-hidden="true">!</span>
        <small>Advertencia de moderación · {formatearFecha(advertencia.fechaCreacion)}</small>
        <h2>Revisa tu actividad en Moment</h2>
        <strong className="warning-notice-reason">{motivosAdvertencia[advertencia.plantilla] ?? advertencia.plantilla}</strong>
        <p>{advertencia.mensaje}</p>
        <button onClick={confirmarLectura} disabled={procesando}>
          {procesando ? <span className="spinner" aria-hidden="true" /> : 'Entendido'}
        </button>
      </section>
    </div>
  )
}
