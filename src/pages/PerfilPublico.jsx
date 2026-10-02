import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import { momentoService } from '../services/momentoService'
import { perfilService } from '../services/perfilService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

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

export default function PerfilPublico() {
  const { nombreUsuario } = useParams()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [momentos, setMomentos] = useState([])
  const [totalMomentos, setTotalMomentos] = useState(0)
  const [cursor, setCursor] = useState(null)
  const [tieneMas, setTieneMas] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [cargandoMomentos, setCargandoMomentos] = useState(false)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [error, setError] = useState('')
  const [errorMomentos, setErrorMomentos] = useState('')
  const [procesando, setProcesando] = useState(false)
  const cargandoRef = useRef(false)
  const sentinelRef = useRef(null)

  const cargarMomentos = useCallback(async (idUsuario, cursorActual = null, reemplazar = false) => {
    if (!idUsuario || cargandoRef.current) return

    cargandoRef.current = true
    if (reemplazar) setCargandoMomentos(true)
    else setCargandoMas(true)

    const resultado = await momentoService.momentosDeUsuario(idUsuario, { cursor: cursorActual, cantidad: 30 })

    if (resultado.exito) {
      const datos = resultado.datos
      const nuevos = (datos?.items ?? []).map(mapearMomento)
      setMomentos((actuales) => reemplazar ? nuevos : [...actuales, ...nuevos])
      setCursor(datos?.siguienteCursor ?? null)
      setTieneMas(Boolean(datos?.tieneMas))
      setTotalMomentos(datos?.total ?? 0)
      setErrorMomentos('')
    } else {
      setErrorMomentos(resultado.mensaje || 'No se pudieron cargar los momentos.')
    }

    setCargandoMomentos(false)
    setCargandoMas(false)
    cargandoRef.current = false
  }, [])

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')
    setPerfil(null)
    setMomentos([])
    setTotalMomentos(0)
    setCursor(null)
    setTieneMas(false)
    setErrorMomentos('')

    perfilService.publico(nombreUsuario).then((resultado) => {
      if (!activo) return
      if (resultado.exito && resultado.datos?.idUsuario) {
        const perfilRecibido = resultado.datos
        setPerfil(perfilRecibido)
        cargarMomentos(perfilRecibido.idUsuario, null, true)
      } else {
        setError(resultado.mensaje || 'Perfil no encontrado')
      }
      setCargando(false)
    })

    return () => { activo = false }
  }, [cargarMomentos, nombreUsuario])

  useEffect(() => {
    const nodo = sentinelRef.current
    if (!nodo || !tieneMas || !perfil?.idUsuario) return undefined

    const observer = new IntersectionObserver((entradas) => {
      if (entradas[0].isIntersecting && !cargandoRef.current) {
        cargarMomentos(perfil.idUsuario, cursor, false)
      }
    }, { rootMargin: '260px 0px' })

    observer.observe(nodo)
    return () => observer.disconnect()
  }, [cargarMomentos, cursor, perfil?.idUsuario, tieneMas])

  const alternarSeguimiento = async () => {
    if (!perfil || procesando) return
    setProcesando(true)

    const resultado = await perfilService.alternarSeguimiento(perfil.idUsuario)
    if (resultado.exito && resultado.datos) {
      setPerfil((actual) => ({
        ...actual,
        siguiendo: resultado.datos.siguiendo,
        seguidores: resultado.datos.seguidores,
      }))
    }

    setProcesando(false)
  }

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

  const fotoPerfilUrl = normalizarMediaUrl(perfil?.fotoPerfilUrl)
  const usuario = perfil?.nombreUsuario ? `@${perfil.nombreUsuario}` : ''
  const iniciales = inicialesDe(perfil?.nombrePerfil || perfil?.nombreUsuario)

  return (
    <main className="app-shell">
      <AppSidebar activo="Buscar" />

      <section className="profile-page public-profile-page" aria-label="Perfil público">
        <button className="profile-back-link" onClick={() => navigate(-1)}>← Volver</button>

        {cargando && (
          <header className="profile-hero public-profile-skeleton">
            <div className="skeleton avatar large" />
            <div>
              <span className="skeleton line wide" />
              <span className="skeleton line small" />
              <span className="skeleton line" />
            </div>
          </header>
        )}

        {!cargando && error && (
          <section className="profile-empty-moments">
            <h3>{error}</h3>
            <p>Puede que el usuario haya cambiado su @ o que el perfil ya no esté disponible.</p>
          </section>
        )}

        {!cargando && perfil && (
          <>
            <header className="profile-hero">
              <div className="profile-main">
                <div className="profile-photo">
                  {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt={`Foto de ${perfil.nombrePerfil}`} /> : <span>{iniciales}</span>}
                </div>

                <div className="profile-info">
                  <p className="feed-kicker">Perfil</p>
                  <div className="profile-title-row">
                    <div className="profile-name-line">
                      <h1>{perfil.nombrePerfil}</h1>
                    </div>
                    <span>{usuario}</span>
                  </div>

                  <div className="public-profile-stats-row">
                    <div className="profile-stats" aria-label="Estadísticas del perfil">
                      <div>
                        <strong>{(perfil.seguidores ?? 0).toLocaleString('es-MX')}</strong>
                        <span>Seguidores</span>
                      </div>
                      <div>
                        <strong>{(perfil.seguidos ?? 0).toLocaleString('es-MX')}</strong>
                        <span>Seguidos</span>
                      </div>
                      <div>
                        <strong>{(perfil.totalMeEncanta ?? 0).toLocaleString('es-MX')}</strong>
                        <span>Me encanta</span>
                      </div>
                    </div>

                    <div className="public-profile-actions">
                      <button
                        className={`profile-btn primary public-follow-btn${perfil.siguiendo ? ' following' : ''}`}
                        onClick={alternarSeguimiento}
                        disabled={procesando}
                      >
                        {procesando ? <span className="spinner" aria-hidden="true" /> : perfil.siguiendo ? 'Siguiendo' : 'Seguir'}
                      </button>
                      <button className="profile-btn public-message-btn">Mensaje</button>
                    </div>
                  </div>

                  <p className="profile-about">{perfil.sobreMi || 'Sin descripción todavía.'}</p>
                </div>
              </div>
            </header>

            <div className="profile-section-title">
              <h2>Momentos públicos</h2>
              <span>{totalMomentos.toLocaleString('es-MX')} publicaciones</span>
            </div>

            {errorMomentos && (
              <p className="profile-form-error">{errorMomentos}</p>
            )}

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
                <h3>Aún no hay momentos públicos</h3>
                <p>Cuando {perfil.nombrePerfil} comparta algo, aparecerá aquí.</p>
              </section>
            )}

            {!cargandoMomentos && momentos.length > 0 && (
              <div className="profile-moments">
                {momentos.map((momento) => (
                  <article className="moment-card" key={momento.id}>
                    {momento.imagen ? (
                      momento.tipoAdjunto === 'video'
                        ? <video src={momento.imagen} controls />
                        : <img src={momento.imagen} alt={`Momento de ${perfil.nombrePerfil}`} />
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
          </>
        )}

        <div ref={sentinelRef} className="profile-load-sentinel" aria-hidden="true" />
      </section>

      <MessagesWidget />
    </main>
  )
}
