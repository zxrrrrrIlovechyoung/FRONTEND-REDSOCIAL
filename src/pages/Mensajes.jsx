import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '../context/AuthContext'
import { chatService } from '../services/chatService'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const formateadorFechaMensaje = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
})

const convertirFechaMensaje = (fecha) => {
  if (!fecha) return null
  const valor = String(fecha)
  const tieneZonaHoraria = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valor)
  const fechaMensaje = new Date(tieneZonaHoraria ? valor : `${valor}Z`)
  return Number.isNaN(fechaMensaje.getTime()) ? null : fechaMensaje
}

const formatearFechaMensaje = (fecha) => {
  const fechaMensaje = convertirFechaMensaje(fecha)
  return fechaMensaje ? formateadorFechaMensaje.format(fechaMensaje) : ''
}

export default function Mensajes() {
  const { usuario } = useAuth()
  const location = useLocation()
  const [contactos, setContactos] = useState([])
  const [conversaciones, setConversaciones] = useState([])
  const [chatActivo, setChatActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [onlineIds, setOnlineIds] = useState([])
  const [errorChat, setErrorChat] = useState('')
  const [hubConectado, setHubConectado] = useState(false)
  const estadosRef = useRef(null)
  const dragRef = useRef({ activo: false, inicioX: 0, scrollInicial: 0, distancia: 0 })
  const hubRef = useRef(null)
  const chatActivoRef = useRef(null)
  const composerInputRef = useRef(null)
  const chatInicialAbiertoRef = useRef(false)
  const solicitudMensajesRef = useRef(0)

  useEffect(() => {
    chatActivoRef.current = chatActivo
  }, [chatActivo])

  useEffect(() => {
    chatService.contactos().then((resultado) => {
      if (resultado.exito) setContactos(resultado.datos ?? [])
      else setErrorChat(resultado.mensaje || 'No se pudieron cargar tus contactos.')
    })
    chatService.conversaciones().then((resultado) => {
      if (resultado.exito) setConversaciones(resultado.datos ?? [])
      else setErrorChat(resultado.mensaje || 'No se pudieron cargar tus conversaciones.')
    })
  }, [])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined

    const sincronizarViewport = () => {
      document.documentElement.style.setProperty('--chat-viewport-height', `${viewport.height}px`)
    }

    sincronizarViewport()
    viewport.addEventListener('resize', sincronizarViewport)
    viewport.addEventListener('scroll', sincronizarViewport)

    return () => {
      viewport.removeEventListener('resize', sincronizarViewport)
      viewport.removeEventListener('scroll', sincronizarViewport)
      document.documentElement.style.removeProperty('--chat-viewport-height')
    }
  }, [])

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/chat`, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    connection.on('UsuariosEnLinea', (ids) => setOnlineIds(ids ?? []))
    connection.on('MensajeRecibido', (mensaje) => {
      const chatActual = chatActivoRef.current
      if (chatActual?.hash === mensaje.hash) {
        setMensajes((actuales) => (
          actuales.some((item) => item.idMensaje === mensaje.idMensaje)
            ? actuales
            : [...actuales, mensaje]
        ))
        chatService.marcarLeidos(mensaje.hash).then(() => {
          window.dispatchEvent(new Event('mensajes-no-leidos-actualizado'))
        })
      }
      chatService.conversaciones().then((resultado) => {
        if (resultado.exito) setConversaciones(resultado.datos ?? [])
      })
    })

    connection.onreconnecting(() => setHubConectado(false))
    connection.onreconnected(() => {
      setHubConectado(true)
      setErrorChat('')
    })
    connection.onclose((error) => {
      setHubConectado(false)
      if (error) setErrorChat('Se perdió la conexión del servicio de mensajes. Recarga la vista para volver a conectarte.')
    })

    let desmontada = false
    const iniciarConexion = async () => {
      for (let intento = 0; intento < 3 && !desmontada; intento += 1) {
        try {
          await connection.start()
          if (!desmontada) {
            setHubConectado(true)
            setErrorChat('')
          }
          return
        } catch {
          if (intento === 2 && !desmontada) {
            setErrorChat('No se pudo conectar al servicio de mensajes. Verifica que el backend esté activo.')
          } else {
            await new Promise((resolve) => window.setTimeout(resolve, 800 * (intento + 1)))
          }
        }
      }
    }

    iniciarConexion()
    hubRef.current = connection

    return () => {
      desmontada = true
      connection.stop()
    }
  }, [])

  useEffect(() => {
    if (!chatActivo?.hash) return

    const solicitud = ++solicitudMensajesRef.current
    setMensajes([])

    if (hubConectado && hubRef.current?.state === HubConnectionState.Connected) {
      hubRef.current.invoke('UnirseConversacion', chatActivo.hash).catch(() => {
        setErrorChat('No se pudo abrir el canal de esta conversación.')
      })
    }

    chatService.mensajes(chatActivo.hash).then((resultado) => {
      if (solicitud !== solicitudMensajesRef.current || chatActivoRef.current?.hash !== chatActivo.hash) return
      if (resultado.exito) setMensajes(resultado.datos ?? [])
      else setErrorChat(resultado.mensaje || 'No se pudieron cargar los mensajes.')
    })
  }, [chatActivo?.hash, hubConectado])

  useEffect(() => {
    const contacto = location.state?.contacto
    if (!contacto?.idUsuario || chatInicialAbiertoRef.current) return
    chatInicialAbiertoRef.current = true
    abrirChatConContacto(contacto)
  }, [location.state?.contacto?.idUsuario])

  const abrirChatConContacto = async (contacto) => {
    setErrorChat('')
    const abierto = await chatService.abrir(contacto.idUsuario)
    if (!abierto.exito || !abierto.datos?.hash) {
      setErrorChat(abierto.mensaje || 'No se pudo abrir esta conversación.')
      return
    }

    setChatActivo({
      hash: abierto.datos.hash,
      idUsuario: contacto.idUsuario,
      nombre: contacto.nombre,
      usuario: contacto.usuario,
      fotoPerfilUrl: contacto.fotoPerfilUrl,
      enLinea: onlineIds.includes(contacto.idUsuario) || contacto.enLinea,
    })
    await chatService.marcarLeidos(abierto.datos.hash)
    window.dispatchEvent(new Event('mensajes-no-leidos-actualizado'))
  }

  const abrirConversacion = async (chat) => {
    setErrorChat('')
    setChatActivo(chat)
    const resultado = await chatService.marcarLeidos(chat.hash)
    if (!resultado.exito) setErrorChat(resultado.mensaje || 'No se pudo marcar la conversación como leída.')
    window.dispatchEvent(new Event('mensajes-no-leidos-actualizado'))
  }

  const enviarMensaje = (e) => {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio || !chatActivo?.hash) return

    if (!hubRef.current || hubRef.current.state !== HubConnectionState.Connected) {
      setErrorChat('El servicio de mensajes no está conectado. Inténtalo de nuevo.')
      return
    }

    hubRef.current.invoke('EnviarMensaje', chatActivo.hash, limpio).catch(() => {
      setErrorChat('No se pudo enviar el mensaje.')
    })
    setTexto('')
  }

  const iniciarArrastre = (e) => {
    if (!estadosRef.current) return
    estadosRef.current.setPointerCapture(e.pointerId)
    dragRef.current = {
      activo: true,
      inicioX: e.clientX,
      scrollInicial: estadosRef.current.scrollLeft,
      distancia: 0,
    }
  }

  const moverArrastre = (e) => {
    if (!dragRef.current.activo || !estadosRef.current) return
    const distancia = e.clientX - dragRef.current.inicioX
    dragRef.current.distancia = Math.abs(distancia)
    estadosRef.current.scrollLeft = dragRef.current.scrollInicial - distancia
  }

  const terminarArrastre = () => {
    window.setTimeout(() => {
      dragRef.current.activo = false
      dragRef.current.distancia = 0
    }, 0)
  }

  const seleccionarContacto = (contacto) => {
    if (dragRef.current.distancia > 6) return
    abrirChatConContacto(contacto)
  }

  const pintarAvatar = (item, className = 'chat-avatar') => {
    const foto = normalizarMediaUrl(item.fotoPerfilUrl)
    return (
      <span className={`${className}${onlineIds.includes(item.idUsuario) || item.enLinea ? ' online' : ''}`}>
        {foto ? <img src={foto} alt={item.nombre} /> : inicialesDe(item.nombre || item.usuario)}
      </span>
    )
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Mensajes" />

      <section className={`messages-page${chatActivo ? ' chat-abierto' : ''}`} aria-label="Mensajes">
        {errorChat && <p className="chat-error" role="alert">{errorChat}</p>}
        <aside className="messages-list">
          <div className="messages-title">
            <p className="feed-kicker">Conversaciones</p>
            <h1>Mensajes</h1>
          </div>

          <div className="thoughts-carousel">
            <div
              className="thoughts-strip"
              ref={estadosRef}
              aria-label="Usuarios en línea"
              onPointerDown={iniciarArrastre}
              onPointerMove={moverArrastre}
              onPointerUp={terminarArrastre}
              onPointerCancel={terminarArrastre}
            >
              {contactos.map((contacto) => (
                <button className="thought-pill" key={contacto.idUsuario} onClick={() => seleccionarContacto(contacto)}>
                  {pintarAvatar(contacto, 'thought-avatar')}
                  <strong>{contacto.nombre}</strong>
                  <small>{onlineIds.includes(contacto.idUsuario) || contacto.enLinea ? 'En línea' : contacto.usuario}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="chat-list-large">
            {conversaciones.length === 0 && (
              <div className="empty-chat small">
                <h2>Sin conversaciones</h2>
                <p>Abre un chat desde tus seguidores o seguidos conectados.</p>
              </div>
            )}

            {conversaciones.map((chat) => (
              <button
                className={`chat-preview${chatActivo?.hash === chat.hash ? ' activo' : ''}`}
                key={chat.hash}
                onClick={() => abrirConversacion(chat)}
              >
                {pintarAvatar(chat)}
                <span className="chat-copy">
                  <strong>{chat.nombre}</strong>
                  <small>{chat.ultimo || 'Conversación iniciada'}</small>
                </span>
                <span className="chat-meta">
                  {(onlineIds.includes(chat.idUsuario) || chat.enLinea) && <i />}
                  <small>{chat.usuario}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-room" aria-label={chatActivo ? `Chat con ${chatActivo.nombre}` : 'Selecciona un chat'}>
          {!chatActivo ? (
            <div className="empty-chat">
              <span>✉</span>
              <h2>Selecciona un chat para verlo</h2>
              <p>Elige una conversación o un contacto en línea para empezar.</p>
            </div>
          ) : (
            <>
              <header className="chat-room-head">
                <button className="chat-back-button" type="button" onClick={() => setChatActivo(null)} aria-label="Volver a conversaciones">{'<'}</button>
                {pintarAvatar(chatActivo)}
                <div>
                  <strong>{chatActivo.nombre}</strong>
                  <span>{chatActivo.usuario}</span>
                </div>
              </header>

              <div className="chat-thread">
                {mensajes.map((mensaje) => (
                  <p className={`message-bubble${mensaje.idEmisor === usuario?.idUsuario ? ' propio' : ''}`} key={mensaje.idMensaje}>
                    <span>{mensaje.texto}</span>
                    {mensaje.fechaEnvio && (
                      <time dateTime={mensaje.fechaEnvio} title={formatearFechaMensaje(mensaje.fechaEnvio)}>
                        {formatearFechaMensaje(mensaje.fechaEnvio)}
                      </time>
                    )}
                  </p>
                ))}
              </div>

              <form className="message-composer" onSubmit={enviarMensaje}>
                <input
                  ref={composerInputRef}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onFocus={() => window.setTimeout(() => composerInputRef.current?.scrollIntoView({ block: 'nearest' }), 120)}
                  placeholder="Escribe un mensaje..."
                  aria-label="Escribe un mensaje"
                  inputMode="text"
                  autoComplete="off"
                  enterKeyHint="send"
                />
                <button type="submit">Enviar</button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  )
}
