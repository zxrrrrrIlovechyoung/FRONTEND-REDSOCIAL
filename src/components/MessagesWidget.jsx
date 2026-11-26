import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatService } from '../services/chatService'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const formatearFecha = (fecha) => {
  if (!fecha) return ''

  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return ''

  const hoy = new Date()
  const esHoy = valor.toDateString() === hoy.toDateString()
  return new Intl.DateTimeFormat('es-MX', esHoy
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short' }).format(valor)
}

export default function MessagesWidget() {
  const navigate = useNavigate()
  const [mensajesAbiertos, setMensajesAbiertos] = useState(false)
  const [conversaciones, setConversaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true

    const cargarConversaciones = async () => {
      const resultado = await chatService.conversaciones()
      if (!activo) return

      if (resultado.exito) {
        // El popup representa conversaciones con mensajes reales, no datos de ejemplo.
        setConversaciones((resultado.datos ?? []).filter((chat) => chat?.hash && chat.ultimo))
      } else {
        setConversaciones([])
      }
      setCargando(false)
    }

    cargarConversaciones()
    const intervalo = window.setInterval(cargarConversaciones, 15000)
    window.addEventListener('mensajes-no-leidos-actualizado', cargarConversaciones)

    return () => {
      activo = false
      window.clearInterval(intervalo)
      window.removeEventListener('mensajes-no-leidos-actualizado', cargarConversaciones)
    }
  }, [])

  const abrirConversacion = (chat) => {
    setMensajesAbiertos(false)
    navigate('/mensajes', {
      state: {
        contacto: {
          idUsuario: chat.idUsuario,
          nombre: chat.nombre,
          usuario: chat.usuario,
          fotoPerfilUrl: chat.fotoPerfilUrl,
        },
      },
    })
  }

  return (
    <aside className={`messages-widget${mensajesAbiertos ? ' abierto' : ''}`}>
      <button
        className="messages-trigger"
        onClick={() => setMensajesAbiertos((valor) => !valor)}
        aria-expanded={mensajesAbiertos}
      >
        <span>Mis mensajes</span>
        <strong>{conversaciones.length}</strong>
      </button>

      <div className="messages-panel" aria-live="polite">
        {cargando && <p className="messages-empty">Cargando mensajes…</p>}
        {!cargando && conversaciones.length === 0 && (
          <p className="messages-empty">No tienes mensajes todavía.</p>
        )}
        {!cargando && conversaciones.map((chat) => {
          const fotoPerfilUrl = normalizarMediaUrl(chat.fotoPerfilUrl)
          return (
            <button className="chat-row" key={chat.hash} onClick={() => abrirConversacion(chat)}>
              <span className="chat-avatar">
                {fotoPerfilUrl
                  ? <img src={fotoPerfilUrl} alt="" />
                  : inicialesDe(chat.nombre)}
              </span>
              <span className="chat-copy">
                <strong>{chat.nombre || chat.usuario || 'Usuario'}</strong>
                <small>{chat.ultimo}</small>
              </span>
              <span className="chat-meta">
                <small>{formatearFecha(chat.fecha)}</small>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
