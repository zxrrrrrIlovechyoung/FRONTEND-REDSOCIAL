import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'

const favoritos = [
  {
    id: 1,
    autor: 'Camila Torres',
    usuario: '@cami.t',
    avatar: 'CT',
    tiempo: 'Guardado ayer',
    imagen: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Un recuerdo no tiene que ser perfecto para quedarse contigo. A veces basta con que haya sido real.',
    likes: '2,019',
    comentarios: '132',
  },
  {
    id: 2,
    autor: 'Sofia Marin',
    usuario: '@sofia.m',
    avatar: 'SM',
    tiempo: 'Guardado hace 2 dias',
    imagen: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Hay personas que hacen que cualquier plan improvisado se vuelva una historia bonita.',
    likes: '1,104',
    comentarios: '54',
  },
  {
    id: 3,
    autor: 'Mateo Rios',
    usuario: '@mateorios',
    avatar: 'MR',
    tiempo: 'Guardado esta semana',
    imagen: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Me gusta pensar que crecer tambien es aprender a caminar mas lento cuando algo vale la pena.',
    likes: '943',
    comentarios: '41',
  },
]

export default function Favoritos() {
  return (
    <main className="app-shell">
      <AppSidebar activo="Favoritos" />

      <section className="feed favorites-feed" aria-label="Publicaciones favoritas">
        <div className="feed-header">
          <div>
            <p className="feed-kicker">Tu coleccion</p>
            <h1>Favoritos</h1>
          </div>
        </div>

        <div className="post-list">
          {favoritos.map((post) => (
            <article className="post-card" key={post.id}>
              <header className="post-top">
                <div className="author">
                  <div className="author-avatar">{post.avatar}</div>
                  <div>
                    <strong>{post.autor}</strong>
                    <span>{post.usuario} · {post.tiempo}</span>
                  </div>
                </div>
                <span className="favorite-badge">Favorito</span>
              </header>

              <img className="post-image" src={post.imagen} alt={`Publicacion favorita de ${post.autor}`} />

              <div className="post-actions">
                <div>
                  <button aria-label="Me gusta">♥</button>
                  <button aria-label="Comentar">☰</button>
                  <button aria-label="Enviar">✉</button>
                </div>
                <button aria-label="Guardado">■</button>
              </div>

              <div className="post-body">
                <strong>{post.likes} me gusta</strong>
                <p><span>{post.usuario}</span> {post.pensamiento}</p>
                <button className="comments-btn">Ver {post.comentarios} comentarios</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MessagesWidget />
    </main>
  )
}
