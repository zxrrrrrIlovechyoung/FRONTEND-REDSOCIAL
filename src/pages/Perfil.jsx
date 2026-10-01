import { useCallback, useEffect, useRef, useState } from 'react'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { authService } from '../services/authService'
import { momentoService } from '../services/momentoService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const mapearMomento = (momento) => ({
  id: momento.idMomento,
  texto: momento.texto,
  imagen: normalizarMediaUrl(momento.archivoUrl),
  tipoAdjunto: momento.tipoAdjunto,
  linkUrl: momento.linkUrl,
  likes: momento.totalMeGusta ?? 0,
  comentarios: momento.totalComentarios ?? 0,
  leGusta: Boolean(momento.leGusta),
  tiempo: formatearFechaMomento(momento.fechaCreacion),
})

export default function Perfil() {
  const { usuario } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [momentos, setMomentos] = useState([])
  const [totalMomentos, setTotalMomentos] = useState(0)
  const [cursor, setCursor] = useState(null)
  const [tieneMas, setTieneMas] = useState(false)
  const [cargandoMomentos, setCargandoMomentos] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const cargandoRef = useRef(false)
  const sentinelRef = useRef(null)
  const nombre = usuario?.nombreUsuario || usuario?.usuario || 'Raul'
  const usuarioPerfil = `@${String(perfil?.nombreUsuario || nombre).toLowerCase()}`

  const cargarMomentos = useCallback(async (cursorActual = null, reemplazar = false) => {
    if (cargandoRef.current) return

    cargandoRef.current = true
    if (reemplazar) setCargandoMomentos(true)
    else setCargandoMas(true)

    const resultado = await momentoService.misMomentos({ cursor: cursorActual, cantidad: 30 })

    if (resultado.exito) {
      const datos = resultado.datos
      const nuevos = (datos?.items ?? []).map(mapearMomento)
      setMomentos((actuales) => reemplazar ? nuevos : [...actuales, ...nuevos])
      setCursor(datos?.siguienteCursor ?? null)
      setTieneMas(Boolean(datos?.tieneMas))
      setTotalMomentos(datos?.total ?? 0)
    }

    setCargandoMomentos(false)
    setCargandoMas(false)
    cargandoRef.current = false
  }, [])

  useEffect(() => {
    let activo = true
    authService.miPerfil().then((resultado) => {
      if (activo && resultado.exito) setPerfil(resultado.datos)
    })
    return () => { activo = false }
  }, [])

  useEffect(() => {
    cargarMomentos(null, true)
  }, [cargarMomentos])

  useEffect(() => {
    const nodo = sentinelRef.current
    if (!nodo || !tieneMas) return undefined

    const observer = new IntersectionObserver((entradas) => {
      if (entradas[0].isIntersecting && !cargandoRef.current) {
        cargarMomentos(cursor, false)
      }
    }, { rootMargin: '260px 0px' })

    observer.observe(nodo)
    return () => observer.disconnect()
  }, [cargarMomentos, cursor, tieneMas])

  const alternarLike = async (idMomento) => {
    const respuesta = await momentoService.alternarMeGusta(idMomento)
    if (!respuesta.exito || !respuesta.datos) return

    setMomentos((actuales) => actuales.map((momento) => (
      momento.id === idMomento
        ? { ...momento, likes: respuesta.datos.totalMeGusta, leGusta: respuesta.datos.leGusta }
        : momento
    )))

    setPerfil((actual) => {
      if (!actual) return actual
      const momento = momentos.find((item) => item.id === idMomento)
      const cambio = respuesta.datos.leGusta && !momento?.leGusta ? 1 : !respuesta.datos.leGusta && momento?.leGusta ? -1 : 0
      return {
        ...actual,
        totalMeEncanta: Math.max(0, (actual.totalMeEncanta ?? 0) + cambio),
      }
    })
  }

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
                  <h1>{perfil?.nombrePerfil || nombre}</h1>
                  <Link className="settings-btn" to="/configuracion" aria-label="Configuracion del perfil">⚙</Link>
                </div>
                <span>{usuarioPerfil}</span>
              </div>

              <div className="profile-stats" aria-label="Estadisticas del perfil">
                <div>
                  <strong>{(perfil?.seguidores ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidores</span>
                </div>
                <div>
                  <strong>{(perfil?.seguidos ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Seguidos</span>
                </div>
                <div>
                  <strong>{(perfil?.totalMeEncanta ?? 0).toLocaleString('es-MX')}</strong>
                  <span>Me encanta</span>
                </div>
              </div>
              <p className="profile-about">{perfil?.sobreMi || 'Sin descripción todavía.'}</p>
              <div className="profile-actions">
                <Link className="profile-btn primary" to="/perfil/editar">Editar perfil</Link>
                <button className="profile-btn">Compartir perfil</button>
              </div>
            </div>
          </div>
        </header>

        <div className="profile-section-title">
          <h2>Momentos compartidos</h2>
          <span>{totalMomentos.toLocaleString('es-MX')} publicaciones</span>
        </div>

        {cargandoMomentos && (
          <div className="profile-moments">
            {Array.from({ length: 6 }).map((_, index) => (
              <article className="moment-card moment-card-skeleton" key={index}>
                <div className="skeleton-moment" />
                <div>
                  <div className="skeleton line wide" />
                  <div className="skeleton line small" />
                </div>
              </article>
            ))}
          </div>
        )}

        {!cargandoMomentos && momentos.length === 0 && (
          <section className="profile-empty-moments">
            <h3>Aún no has compartido momentos</h3>
            <p>Cuando publiques algo, aparecerá aquí ligado a tu perfil.</p>
          </section>
        )}

        {!cargandoMomentos && momentos.length > 0 && (
          <div className="profile-moments">
            {momentos.map((momento) => (
              <article className="moment-card" key={momento.id}>
                {momento.imagen ? (
                  momento.tipoAdjunto === 'video'
                    ? <video src={momento.imagen} controls />
                    : <img src={momento.imagen} alt="Momento compartido por el usuario" />
                ) : (
                  <div className="moment-text-preview">{momento.texto}</div>
                )}
                <div>
                  <p>{momento.texto}</p>
                  {momento.linkUrl && <a href={momento.linkUrl} target="_blank" rel="noreferrer">Abrir enlace</a>}
                  <div className="moment-card-meta">
                    <button
                      className={momento.leGusta ? 'liked' : ''}
                      onClick={() => alternarLike(momento.id)}
                      aria-label={momento.leGusta ? 'Quitar me encanta' : 'Me encanta'}
                    >
                      {momento.leGusta ? '♥' : '♡'}
                    </button>
                    <strong>{momento.likes.toLocaleString('es-MX')} me encanta · {momento.tiempo}</strong>
                  </div>
                </div>
              </article>
            ))}

            {cargandoMas && Array.from({ length: 2 }).map((_, index) => (
              <article className="moment-card moment-card-skeleton" key={`mas-${index}`}>
                <div className="skeleton-moment" />
                <div>
                  <div className="skeleton line wide" />
                  <div className="skeleton line small" />
                </div>
              </article>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="profile-load-sentinel" aria-hidden="true" />
      </section>

      <MessagesWidget />
    </main>
  )
}
