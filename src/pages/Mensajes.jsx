import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import { useAuth } from '../context/AuthContext'
import { chatService } from '../services/chatService'
import { tokenStorage } from '../utils/tokenStorage'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

export default function Mensajes() {
  const { usuario } = useAuth()
  const [contactos, setContactos] = useState([])
  const [conversaciones, setConversaciones] = useState([])
  const [chatActivo, setChatActivo] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [onlineIds, setOnlineIds] = useState([])
  const estadosRef = useRef(null)
  const dragRef = useRef({ activo: false, inicioX: 0, scrollInicial: 0, distancia: 0 })
  const hubRef = useRef(null)
  const chatActivoRef = useRef(null)

  useEffect(() => {
    chatActivoRef.current = chatActivo
  }, [chatActivo])

  useEffect(() => {
    chatService.contactos().then((resultado) => {
      if (resultado.exito) setContactos(resultado.datos ?? [])
    })
    chatService.conversaciones().then((resultado) => {
      if (resultado.exito) setConversaciones(resultado.datos ?? [])
    })
  }, [])

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/chat`, { accessTokenFactory: () => tokenStorage.obtener() ?? '' })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build()

    connection.on('UsuariosEnLinea', (ids) => setOnlineIds(ids ?? []))
    connection.on('MensajeRecibido', (mensaje) => {
      setMensajes((actuales) => (
        chatActivoRef.current?.hash === mensaje.hash && !actuales.some((item) => item.idMensaje === mensaje.idMensaje)
          ? [...actuales, mensaje]
          : actuales
      ))
      chatService.conversaciones().then((resultado) => {
        if (resultado.exito) setConversaciones(resultado.datos ?? [])
      })
    })

    connection.start().catch(() => {})
    hubRef.current = connection

    return () => {
      connection.stop()
    }
  }, [])

  useEffect(() => {
    if (!chatActivo?.hash || !hubRef.current) return

    hubRef.current.invoke('UnirseConversacion', chatActivo.hash).catch(() => {})
    chatService.mensajes(chatActivo.hash).then((resultado) => {
      if (resultado.exito) setMensajes(resultado.datos ?? [])
    })
  }, [chatActivo?.hash])

  const abrirChatConContacto = async (contacto) => {
    const abierto = await chatService.abrir(contacto.idUsuario)
    if (!abierto.exito || !abierto.datos?.hash) return

    setChatActivo({
      hash: abierto.datos.hash,
      idUsuario: contacto.idUsuario,
      nombre: contacto.nombre,
      usuario: contacto.usuario,
      fotoPerfilUrl: contacto.fotoPerfilUrl,
      enLinea: onlineIds.includes(contacto.idUsuario) || contacto.enLinea,
    })
  }

  const abrirConversacion = (chat) => {
    setChatActivo(chat)
  }

  const enviarMensaje = (e) => {
    e.preventDefault()
    const limpio = texto.trim()
    if (!limpio || !chatActivo?.hash) return

    hubRef.current?.invoke('EnviarMensaje', chatActivo.hash, limpio).catch(() => {})
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
                <button className="chat-back-button" type="button" onClick={() => setChatActivo(null)} aria-label="Volver a conversaciones">‹</button>
                {pintarAvatar(chatActivo)}
                <div>
                  <strong>{chatActivo.nombre}</strong>
                  <span>{chatActivo.usuario}</span>
                </div>
              </header>

              <div className="chat-thread">
                {mensajes.map((mensaje) => (
                  <p className={`message-bubble${mensaje.idEmisor === usuario?.idUsuario ? ' propio' : ''}`} key={mensaje.idMensaje}>
                    {mensaje.texto}
                  </p>
                ))}
              </div>

              <form className="message-composer" onSubmit={enviarMensaje}>
                <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje" />
                <button type="submit">Enviar</button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  )
}
