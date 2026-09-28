import { useRef, useState } from 'react'
import AppSidebar from '../components/AppSidebar'

const estados = [
  { id: 1, nombre: 'Vale', iniciales: 'VC', texto: 'Hoy fue un buen dia' },
  { id: 2, nombre: 'Mateo', iniciales: 'MR', texto: 'Sin miedo al lunes' },
  { id: 3, nombre: 'Cami', iniciales: 'CT', texto: 'Modo estudio' },
  { id: 4, nombre: '5A', iniciales: '5A', texto: 'Proyecto final' },
]

const chats = [
  {
    id: 1,
    nombre: 'Valeria Cruz',
    usuario: '@vale.cruz',
    iniciales: 'VC',
    ultimo: 'Te mande la foto de hoy',
    hora: '12:42',
    activo: true,
    mensajes: [
      { id: 1, propio: false, texto: 'Ya viste las fotos de la salida?' },
      { id: 2, propio: true, texto: 'Si, quedaron buenisimas. La de grupo se ve muy bien.' },
      { id: 3, propio: false, texto: 'Te mande la foto de hoy' },
    ],
  },
  {
    id: 2,
    nombre: 'Grupo 5A',
    usuario: '@grupo.5a',
    iniciales: '5A',
    ultimo: 'Ya subieron la tarea?',
    hora: '11:18',
    mensajes: [
      { id: 1, propio: false, texto: 'Recuerden subir el avance antes de la noche.' },
      { id: 2, propio: true, texto: 'Yo lo termino saliendo de clase.' },
      { id: 3, propio: false, texto: 'Ya subieron la tarea?' },
    ],
  },
  {
    id: 3,
    nombre: 'Mateo Rios',
    usuario: '@mateorios',
    iniciales: 'MR',
    ultimo: 'Vamos por cafe saliendo',
    hora: 'Ayer',
    mensajes: [
      { id: 1, propio: false, texto: 'Hoy estuvo pesada la clase.' },
      { id: 2, propio: true, texto: 'Si, necesito despejarme un rato.' },
      { id: 3, propio: false, texto: 'Vamos por cafe saliendo' },
    ],
  },
]

export default function Mensajes() {
  const [chatActivo, setChatActivo] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const estadosRef = useRef(null)
  const dragRef = useRef({ inicioX: 0, scrollInicial: 0 })

  const iniciarArrastre = (e) => {
    if (!estadosRef.current) return
    setArrastrando(true)
    dragRef.current = {
      inicioX: e.pageX,
      scrollInicial: estadosRef.current.scrollLeft,
    }
  }

  const moverArrastre = (e) => {
    if (!arrastrando || !estadosRef.current) return
    const distancia = e.pageX - dragRef.current.inicioX
    estadosRef.current.scrollLeft = dragRef.current.scrollInicial - distancia
  }

  const terminarArrastre = () => {
    setArrastrando(false)
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Mensajes" />

      <section className="messages-page" aria-label="Mensajes">
        <aside className="messages-list">
          <div className="messages-title">
            <p className="feed-kicker">Conversaciones</p>
            <h1>Mensajes</h1>
          </div>

          <div className="thoughts-carousel">
            <div
              className={`thoughts-strip${arrastrando ? ' arrastrando' : ''}`}
              ref={estadosRef}
              aria-label="Estados y pensamientos"
              onMouseDown={iniciarArrastre}
              onMouseMove={moverArrastre}
              onMouseLeave={terminarArrastre}
              onMouseUp={terminarArrastre}
            >
              {estados.map((estado) => (
                <button className="thought-pill" key={estado.id}>
                  <span>{estado.iniciales}</span>
                  <strong>{estado.nombre}</strong>
                  <small>{estado.texto}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="chat-list-large">
            {chats.map((chat) => (
              <button
                className={`chat-preview${chatActivo?.id === chat.id ? ' activo' : ''}`}
                key={chat.id}
                onClick={() => setChatActivo(chat)}
              >
                <span className="chat-avatar">{chat.iniciales}</span>
                <span className="chat-copy">
                  <strong>{chat.nombre}</strong>
                  <small>{chat.ultimo}</small>
                </span>
                <span className="chat-meta">
                  {chat.activo && <i />}
                  <small>{chat.hora}</small>
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
              <p>Elige una conversación de la lista para leer mensajes y responder.</p>
            </div>
          ) : (
            <>
              <header className="chat-room-head">
                <div className="chat-avatar">{chatActivo.iniciales}</div>
                <div>
                  <strong>{chatActivo.nombre}</strong>
                  <span>{chatActivo.usuario}</span>
                </div>
              </header>

              <div className="chat-thread">
                {chatActivo.mensajes.map((mensaje) => (
                  <p className={`message-bubble${mensaje.propio ? ' propio' : ''}`} key={mensaje.id}>
                    {mensaje.texto}
                  </p>
                ))}
              </div>

              <form className="message-composer">
                <input placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje" />
                <button type="button">Enviar</button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  )
}
