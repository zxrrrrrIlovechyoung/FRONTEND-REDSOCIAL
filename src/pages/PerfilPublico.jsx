import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppSidebar from '../components/AppSidebar'
import MessagesWidget from '../components/MessagesWidget'
import SuccessPop from '../components/SuccessPop'
import { momentoService } from '../services/momentoService'
import { perfilService } from '../services/perfilService'
import { reporteService } from '../services/reporteService'
import { formatearFechaMomento } from '../utils/fechas'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const inicialesDe = (texto) => (texto || 'MM').replace('@', '').slice(0, 2).toUpperCase()

const motivosReporte = [
  { id: 'spam', texto: 'Spam' },
  { id: 'acoso', texto: 'Acoso' },
  { id: 'odio', texto: 'Odio' },
  { id: 'suplantacion', texto: 'Suplantación' },
  { id: 'contenido_inapropiado', texto: 'Contenido inapropiado' },
  { id: 'violencia', texto: 'Violencia' },
  { id: 'otro', texto: 'Otro' },
]

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
  const [reporteAbierto, setReporteAbierto] = useState(null)
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [motivoReporte, setMotivoReporte] = useState('spam')
  const [detalleReporte, setDetalleReporte] = useState('')
  const [popExito, setPopExito] = useState('')
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

  const enviarReporte = async () => {
    if (!reporteAbierto) return
    const resultado = reporteAbierto.tipo === 'perfil'
      ? await reporteService.perfil({ idUsuario: perfil.idUsuario, motivo: motivoReporte, detalle: detalleReporte })
      : await reporteService.momento({ idMomento: reporteAbierto.idMomento, motivo: motivoReporte, detalle: detalleReporte })

    if (resultado.exito) {
      setReporteAbierto(null)
      setDetalleReporte('')
      setMotivoReporte('spam')
      setPopExito('Reporte enviado')
      window.setTimeout(() => setPopExito(''), 1900)
    }
  }

  const compartirPerfil = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard?.writeText(url)
    } catch {
      window.prompt('Copia el enlace del perfil', url)
    }
    setMenuPerfilAbierto(false)
  }

  const abrirReportePerfil = () => {
    setMenuPerfilAbierto(false)
    setReporteAbierto({ tipo: 'perfil' })
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
                  <div className="public-profile-kicker">
                    <p className="feed-kicker">Perfil</p>
                    <button
                      className="profile-options-trigger"
                      onClick={() => setMenuPerfilAbierto(true)}
                      aria-label="Opciones del perfil"
                      title="Opciones del perfil"
                    >
                      <span />
                      <span />
                      <span />
                    </button>
                  </div>
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
                        <button className="moment-report-btn" onClick={() => setReporteAbierto({ tipo: 'momento', idMomento: momento.id })}>Reportar</button>
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

      {menuPerfilAbierto && (
        <div className="bottom-sheet-backdrop" role="presentation" onClick={() => setMenuPerfilAbierto(false)}>
          <section className="profile-options-sheet" role="dialog" aria-modal="true" aria-label="Opciones del perfil" onClick={(e) => e.stopPropagation()}>
            <span className="sheet-handle" aria-hidden="true" />
            <h2>Opciones del perfil</h2>
            <button onClick={compartirPerfil}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.6 13.4 15.4 17" />
                <path d="M15.4 7 8.6 10.6" />
                <circle cx="6" cy="12" r="2.6" />
                <circle cx="18" cy="5.6" r="2.6" />
                <circle cx="18" cy="18.4" r="2.6" />
              </svg>
              <span>
                <strong>Compartir perfil</strong>
                <small>Copiar enlace del perfil público.</small>
              </span>
            </button>
            <button className="danger-option" onClick={abrirReportePerfil}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 8v5" />
                <path d="M12 17h.01" />
                <path d="M10.2 3.6 2.7 17.1a2 2 0 0 0 1.8 2.9h15a2 2 0 0 0 1.8-2.9L13.8 3.6a2.1 2.1 0 0 0-3.6 0Z" />
              </svg>
              <span>
                <strong>Reportar perfil</strong>
                <small>Enviar este perfil a revisión de moderación.</small>
              </span>
            </button>
            <button className="sheet-cancel" onClick={() => setMenuPerfilAbierto(false)}>Cancelar</button>
          </section>
        </div>
      )}

      {reporteAbierto && (
        <div className="modal-backdrop" role="presentation" onClick={() => setReporteAbierto(null)}>
          <section className="confirm-modal report-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{reporteAbierto.tipo === 'perfil' ? 'Reportar perfil' : 'Reportar momento'}</h2>
            <p>Selecciona el motivo para que moderación pueda revisarlo.</p>
            <div className="report-reasons" role="group" aria-label="Motivo del reporte">
              {motivosReporte.map((motivo) => (
                <button
                  className={motivoReporte === motivo.id ? 'activo' : ''}
                  key={motivo.id}
                  onClick={() => setMotivoReporte(motivo.id)}
                >
                  {motivo.texto}
                </button>
              ))}
            </div>
            <div className="report-detail-field">
              <textarea
                value={detalleReporte}
                onChange={(e) => setDetalleReporte(e.target.value.slice(0, 500))}
                placeholder="Detalle opcional"
                maxLength={500}
              />
              <small>{detalleReporte.length}/500</small>
            </div>
            <div>
              <button className="profile-btn" onClick={() => setReporteAbierto(null)}>Cancelar</button>
              <button className="profile-btn primary" onClick={enviarReporte}>Enviar reporte</button>
            </div>
          </section>
        </div>
      )}

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />
    </main>
  )
}
