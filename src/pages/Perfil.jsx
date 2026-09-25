import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const momentos = [
  {
    id: 1,
    imagen: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
    texto: 'Noche tranquila para ordenar ideas y volver a empezar con calma.',
    likes: 328,
  },
  {
    id: 2,
    imagen: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=900&q=80',
    texto: 'Entre apuntes, cafe y risas tambien pasan cosas que se quedan.',
    likes: 214,
  },
  {
    id: 3,
    imagen: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    texto: 'Construyendo poquito a poquito lo que todavia solo vive en mi cabeza.',
    likes: 487,
  },
  {
    id: 4,
    imagen: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
    texto: 'Hay lugares que bajan el ruido del dia sin decir nada.',
    likes: 391,
  },
]

export default function Perfil() {
  const { usuario } = useAuth()
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const usuarioPerfil = `@${String(nombre).toLowerCase()}`
  const totalLikes = momentos.reduce((total, momento) => total + momento.likes, 0)

  return (
    <main className="app-shell">
      <AppSidebar activo="Perfil" />

      <section className="profile-page" aria-label="Mi perfil">
        <header className="profile-hero">
          <div className="profile-main">
            <div className="profile-photo">{nombre.slice(0, 2).toUpperCase()}</div>
            <div className="profile-info">
              <p className="feed-kicker">Mi perfil</p>
              <div className="profile-title-row">
                <div className="profile-name-line">
                  <h1>{nombre}</h1>
                  <Link className="settings-btn" to="/configuracion" aria-label="Configuracion del perfil">⚙</Link>
                </div>
                <span>{usuarioPerfil}</span>
              </div>

              <div className="profile-stats" aria-label="Estadisticas del perfil">
                <div>
                  <strong>1,248</strong>
                  <span>Seguidores</span>
                </div>
                <div>
                  <strong>486</strong>
                  <span>Seguidos</span>
                </div>
                <div>
                  <strong>{totalLikes.toLocaleString('es-MX')}</strong>
                  <span>Me encanta</span>
                </div>
              </div>
              <p>Compartiendo momentos, pensamientos y pequenas escenas de la vida escolar.</p>
              <div className="profile-actions">
                <button className="profile-btn primary">Editar perfil</button>
                <button className="profile-btn">Compartir perfil</button>
              </div>
            </div>
          </div>
        </header>

        <div className="profile-section-title">
          <h2>Momentos compartidos</h2>
          <span>{momentos.length} publicaciones</span>
        </div>

        <div className="profile-moments">
          {momentos.map((momento) => (
            <article className="moment-card" key={momento.id}>
              <img src={momento.imagen} alt="Momento compartido por el usuario" />
              <div>
                <p>{momento.texto}</p>
                <strong>{momento.likes.toLocaleString('es-MX')} me encanta</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MessagesWidget />
    </main>
  )
}
