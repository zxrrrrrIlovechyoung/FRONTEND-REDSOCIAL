import { useEffect, useMemo, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import UserTrustBadge from '../components/UserTrustBadge'
import { momentoService } from '../services/momentoService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const obtenerImagenes = (archivoUrl) => {
  if (!archivoUrl) return []
  try {
    const valor = JSON.parse(archivoUrl)
    if (Array.isArray(valor)) return valor.map(normalizarMediaUrl)
  } catch {}
  return [normalizarMediaUrl(archivoUrl)]
}

const mapearFavorito = (momento) => {
  const imagenes = obtenerImagenes(momento.archivoUrl)
  return {
    id: momento.idMomento,
    tipo: momento.tipoAdjunto === 'video' ? 'video' : imagenes.length ? 'imagen' : 'texto',
    autor: momento.autor || 'Moment',
    usuario: momento.usuario || '@moment',
    tiempo: formatearFechaMomento(momento.fechaCreacion),
    imagenes,
    pensamiento: momento.texto || '',
    likes: momento.totalMeGusta ?? 0,
    esVerificado: Boolean(momento.esVerificado),
    esModerador: Boolean(momento.esModerador),
  }
}

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todo')
  const [quitando, setQuitando] = useState({})

  useEffect(() => {
    let activo = true

    momentoService.favoritos().then((resultado) => {
      if (!activo) return
      if (resultado.exito) {
        setFavoritos((resultado.datos ?? []).map(mapearFavorito))
        setError('')
      } else {
        setError(resultado.mensaje || 'No se pudieron cargar tus favoritos.')
      }
      setCargando(false)
    })

    return () => { activo = false }
  }, [])

  const favoritosVisibles = useMemo(() => {
    if (filtro === 'todo') return favoritos
    return favoritos.filter((item) => item.tipo === filtro)
  }, [favoritos, filtro])

  const quitarFavorito = async (idMomento) => {
    if (quitando[idMomento]) return
    setQuitando((actual) => ({ ...actual, [idMomento]: true }))

    const resultado = await momentoService.alternarMeGusta(idMomento)
    if (resultado.exito && resultado.datos && !resultado.datos.leGusta) {
      setFavoritos((actuales) => actuales.filter((item) => item.id !== idMomento))
      window.dispatchEvent(new Event('favorito-actualizado'))
    }

    setQuitando((actual) => {
      const siguiente = { ...actual }
      delete siguiente[idMomento]
      return siguiente
    })
  }

  return (
    <main className="app-shell">
      <AppSidebar activo="Favoritos" />

      <section className="favorites-page" aria-label="Publicaciones favoritas">
        <header className="search-header">
          <p className="feed-kicker">Tu colección</p>
          <h1>Favoritos</h1>
          <span className="favorites-copy">Publicaciones a las que les diste “Me encanta”.</span>
        </header>

        <div className="search-filters">
          {['todo', 'imagen', 'video'].map((item) => (
            <button className={filtro === item ? 'activo' : ''} key={item} onClick={() => setFiltro(item)}>
              {item === 'todo' ? 'Todo' : item === 'imagen' ? 'Imágenes' : 'Videos'}
            </button>
          ))}
        </div>

        <div className="profile-section-title">
          <h2>Me encanta recientes</h2>
          <span>{cargando ? 'Cargando...' : `${favoritosVisibles.length} publicaciones`}</span>
        </div>

        {error && <p className="profile-form-error" role="alert">{error}</p>}

        <div className="favorites-grid">
          {cargando ? [1, 2, 3].map((item) => (
            <article className="favorite-tile skeleton-favorite" key={item}>
              <span className="skeleton-fill" />
            </article>
          )) : favoritosVisibles.map((post) => (
            <article className={`favorite-tile${post.tipo === 'texto' ? ' favorite-text-tile' : ''}`} key={post.id}>
              {post.imagenes.length > 0
                ? <img src={post.imagenes[0]} alt={`Publicación de ${post.autor}`} />
                : <div className="favorite-text-preview">{post.pensamiento}</div>}
              {post.tipo === 'video' && <span className="media-type">▷</span>}
              <div>
                <strong>{post.autor}<UserTrustBadge verified={post.esVerificado} moderator={post.esModerador} /></strong>
                <small>{post.usuario} · {post.likes.toLocaleString('es-MX')} me gusta · {post.tiempo}</small>
                {post.imagenes.length > 0 && <p>{post.pensamiento}</p>}
                <button
                  className="favorite-remove-btn"
                  type="button"
                  onClick={() => quitarFavorito(post.id)}
                  disabled={quitando[post.id]}
                >
                  {quitando[post.id] ? 'Quitando…' : '♥ Quitar de favoritos'}
                </button>
              </div>
            </article>
          ))}
        </div>

        {!cargando && !error && favoritosVisibles.length === 0 && (
          <section className="favorites-empty">
            <h3>Aún no tienes favoritos</h3>
            <p>Cuando marques una publicación con “Me encanta”, aparecerá aquí.</p>
          </section>
        )}
      </section>

      <MessagesWidget />
    </main>
  )
}
