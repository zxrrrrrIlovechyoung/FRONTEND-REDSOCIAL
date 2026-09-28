import { useEffect, useMemo, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'

const favoritos = [
  {
    id: 1,
    tipo: 'imagen',
    autor: 'Camila Torres',
    usuario: '@cami.t',
    tiempo: 'Guardado ayer',
    imagen: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Un recuerdo no tiene que ser perfecto para quedarse contigo.',
    likes: '2,019',
  },
  {
    id: 2,
    tipo: 'video',
    autor: 'Sofia Marin',
    usuario: '@sofia.m',
    tiempo: 'Guardado hace 2 dias',
    imagen: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Hay personas que hacen que cualquier plan improvisado se vuelva una historia bonita.',
    likes: '1,104',
  },
  {
    id: 3,
    tipo: 'imagen',
    autor: 'Mateo Rios',
    usuario: '@mateorios',
    tiempo: 'Guardado esta semana',
    imagen: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Crecer tambien es aprender a caminar mas lento.',
    likes: '943',
  },
  {
    id: 4,
    tipo: 'imagen',
    autor: 'Valeria Cruz',
    usuario: '@vale.cruz',
    tiempo: 'Guardado hoy',
    imagen: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    pensamiento: 'Luz bonita, buena musica y cero prisa.',
    likes: '1,284',
  },
]

export default function Favoritos() {
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todo')

  useEffect(() => {
    const timer = setTimeout(() => setCargando(false), 700)
    return () => clearTimeout(timer)
  }, [])

  const favoritosVisibles = useMemo(() => {
    if (filtro === 'todo') return favoritos
    return favoritos.filter((item) => item.tipo === filtro)
  }, [filtro])

  const cambiarFiltro = (valor) => {
    setFiltro(valor)
    setCargando(true)
    setTimeout(() => setCargando(false), 520)
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Favoritos" />

      <section className="favorites-page" aria-label="Publicaciones favoritas">
        <header className="search-header">
          <p className="feed-kicker">Tu coleccion</p>
          <h1>Favoritos</h1>
          <span className="favorites-copy">Momentos, imagenes y videos que guardaste para volver despues.</span>
        </header>

        <div className="search-filters">
          {['todo', 'imagen', 'video'].map((item) => (
            <button className={filtro === item ? 'activo' : ''} key={item} onClick={() => cambiarFiltro(item)}>
              {item === 'todo' ? 'Todo' : item === 'imagen' ? 'Imagenes' : 'Videos'}
            </button>
          ))}
        </div>

        <div className="profile-section-title">
          <h2>Guardados recientemente</h2>
          <span>{cargando ? 'Cargando...' : `${favoritosVisibles.length} favoritos`}</span>
        </div>

        <div className="favorites-grid">
          {cargando ? [1, 2, 3, 4].map((item) => (
            <article className="favorite-tile skeleton-favorite" key={item}>
              <span className="skeleton-fill" />
            </article>
          )) : favoritosVisibles.map((post) => (
            <article className="favorite-tile" key={post.id}>
              <img src={post.imagen} alt={`Favorito de ${post.autor}`} />
              {post.tipo === 'video' && <span className="media-type">▷</span>}
              <div>
                <span className="favorite-badge">Favorito</span>
                <strong>{post.usuario}</strong>
                <p>{post.pensamiento}</p>
                <small>{post.likes} me gusta · {post.tiempo}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <MessagesWidget />
    </main>
  )
}
