import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { usuario } = useAuth()

  return (
    <main className="moderator-shell">
      <section className="moderator-hero">
        <div>
          <span>Panel administrativo</span>
          <h1>Administración de Moment</h1>
          <p>Hola, {usuario?.nombreUsuario ?? 'admin'}. Este espacio quedará reservado para gestionar roles, permisos y configuración global.</p>
        </div>
      </section>
    </main>
  )
}
