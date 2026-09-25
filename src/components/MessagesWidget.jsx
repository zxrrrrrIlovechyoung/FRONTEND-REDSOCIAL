import { useState } from 'react'

const chats = [
  { id: 1, nombre: 'Valeria Cruz', mensaje: 'Te mande la foto de hoy', hora: '12:42', iniciales: 'VC', activo: true },
  { id: 2, nombre: 'Grupo 5A', mensaje: 'Ya subieron la tarea?', hora: '11:18', iniciales: '5A' },
  { id: 3, nombre: 'Mateo Rios', mensaje: 'Vamos por cafe saliendo', hora: 'Ayer', iniciales: 'MR' },
]

export default function MessagesWidget() {
  const [mensajesAbiertos, setMensajesAbiertos] = useState(false)

  return (
    <aside className={`messages-widget${mensajesAbiertos ? ' abierto' : ''}`}>
      <button
        className="messages-trigger"
        onClick={() => setMensajesAbiertos((valor) => !valor)}
        aria-expanded={mensajesAbiertos}
      >
        <span>Mis mensajes</span>
        <strong>{chats.length}</strong>
      </button>

      <div className="messages-panel">
        {chats.map((chat) => (
          <button className="chat-row" key={chat.id}>
            <span className="chat-avatar">{chat.iniciales}</span>
            <span className="chat-copy">
              <strong>{chat.nombre}</strong>
              <small>{chat.mensaje}</small>
            </span>
            <span className="chat-meta">
              {chat.activo && <i />}
              <small>{chat.hora}</small>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
