import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SuccessPop from '../components/SuccessPop'
import { useAuth } from '../context/AuthContext'
import { moderacionService } from '../services/moderacionService'

const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:5079/api').replace(/\/api\/?$/, '')

const normalizarMediaUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

const menuModerador = [
  { id: 'dashboard', icono: '▦', texto: 'Dashboard' },
  { id: 'reportes', icono: '!', texto: 'Reportes' },
  { id: 'spam', icono: '⌁', texto: 'Spam' },
  { id: 'restricciones', icono: '⊘', texto: 'Restricciones' },
]

const plantillasAdvertencia = [
  {
    id: 'spam',
    titulo: 'Spam o enlaces repetidos',
    mensaje: 'Detectamos actividad repetitiva o enlaces que pueden considerarse spam. Evita publicar contenido duplicado para mantener Moment seguro.',
  },
  {
    id: 'respeto',
    titulo: 'Convivencia y respeto',
    mensaje: 'Tu actividad fue marcada por posible falta de respeto. Mantén conversaciones sanas y evita ataques personales.',
  },
  {
    id: 'contenido',
    titulo: 'Contenido inapropiado',
    mensaje: 'Parte de tu contenido fue reportado como inapropiado. Revisa las normas de Moment antes de volver a publicar.',
  },
]

const datosIniciales = {
  estadisticas: { reportesAbiertos: 0, alertasSpam: 0, cuentasRestringidas: 0, casosUrgentes: 0 },
  cuentasReportadas: { items: [], pagina: 1, total: 0, totalPaginas: 0, cantidad: 10 },
  cuentasObservacion: { items: [], pagina: 1, total: 0, totalPaginas: 0, cantidad: 10 },
  alertasSpam: [],
  reportesRecientes: { items: [], pagina: 1, total: 0, totalPaginas: 0, cantidad: 10 },
}

const etiquetasMotivo = {
  spam: 'Spam',
  acoso: 'Acoso',
  odio: 'Discurso de odio',
  suplantacion: 'Suplantación',
  contenido_inapropiado: 'Contenido inapropiado',
  violencia: 'Violencia',
  otro: 'Otro',
}

const formatearFechaReporte = (fecha) => {
  if (!fecha) return 'Sin fecha'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha))
}

export default function Moderador() {
  const navigate = useNavigate()
  const { usuario, perfilActual, logout } = useAuth()
  const [dashboard, setDashboard] = useState(datosIniciales)
  const [cargando, setCargando] = useState(true)
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [vistaReportes, setVistaReportes] = useState('cuentas')
  const [paginas, setPaginas] = useState({ cuentas: 1, reportes: 1, observacion: 1 })
  const [accionPendiente, setAccionPendiente] = useState(null)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const [procesandoAccion, setProcesandoAccion] = useState(false)
  const [plantilla, setPlantilla] = useState(plantillasAdvertencia[0])
  const [popExito, setPopExito] = useState('')

  const cargarDashboard = async (paginasActuales = paginas) => {
    const resultado = await moderacionService.dashboard({
      paginaCuentas: paginasActuales.cuentas,
      paginaReportes: paginasActuales.reportes,
      paginaObservacion: paginasActuales.observacion,
    })
    if (resultado.exito && resultado.datos) setDashboard(resultado.datos)
    setCargando(false)
  }

  useEffect(() => {
    let activo = true

    moderacionService.dashboard({
      paginaCuentas: paginas.cuentas,
      paginaReportes: paginas.reportes,
      paginaObservacion: paginas.observacion,
    }).then((resultado) => {
      if (!activo) return
      if (resultado.exito && resultado.datos) setDashboard(resultado.datos)
      setCargando(false)
    })

    return () => { activo = false }
  }, [paginas])

  const abrirAccion = (tipo, cuenta) => {
    setPlantilla(plantillasAdvertencia[0])
    setAccionPendiente({ tipo, cuenta })
  }

  const ejecutarAccion = async () => {
    if (!accionPendiente || procesandoAccion) return

    const esAdvertencia = accionPendiente.tipo === 'advertencia'
    setProcesandoAccion(true)
    const respuesta = await moderacionService.accionUsuario(accionPendiente.cuenta.idUsuario, {
      tipo: accionPendiente.tipo,
      motivo: esAdvertencia ? plantilla.titulo : `Acción de moderación: ${accionPendiente.tipo}`,
      plantilla: esAdvertencia ? plantilla.id : null,
      mensaje: esAdvertencia ? plantilla.mensaje : null,
    })
    setProcesandoAccion(false)

    if (respuesta.exito) {
      setAccionPendiente(null)
      setPopExito(esAdvertencia ? 'Advertencia enviada' : 'Acción registrada')
      if (esAdvertencia) {
        setVistaReportes('observacion')
        const siguientesPaginas = { ...paginas, observacion: 1 }
        setPaginas(siguientesPaginas)
        cargarDashboard(siguientesPaginas)
      }
      window.setTimeout(() => setPopExito(''), 1900)
    }
  }

  const cambiarPagina = (tipo, direccion) => {
    const datos = tipo === 'cuentas'
      ? dashboard.cuentasReportadas
      : tipo === 'reportes'
        ? dashboard.reportesRecientes
        : dashboard.cuentasObservacion

    const siguiente = Math.min(Math.max((datos.pagina || 1) + direccion, 1), Math.max(datos.totalPaginas || 1, 1))
    if (siguiente === datos.pagina) return
    setPaginas((actuales) => ({ ...actuales, [tipo]: siguiente }))
  }

  const metricas = [
    { id: 'reportes', titulo: 'Reportes abiertos', valor: dashboard.estadisticas.reportesAbiertos },
    { id: 'spam', titulo: 'Alertas por spam', valor: dashboard.estadisticas.alertasSpam },
    { id: 'restricciones', titulo: 'Cuentas restringidas', valor: dashboard.estadisticas.cuentasRestringidas },
    { id: 'urgentes', titulo: 'Casos urgentes', valor: dashboard.estadisticas.casosUrgentes },
  ]

  const maxMetrica = Math.max(1, ...metricas.map((metrica) => metrica.valor || 0))
  const motivos = Object.entries(
    dashboard.reportesRecientes.items.reduce((grupo, reporte) => {
      grupo[reporte.motivo] = (grupo[reporte.motivo] || 0) + 1
      return grupo
    }, {}),
  ).map(([motivo, total]) => ({ motivo, total }))
  const maxMotivo = Math.max(1, ...motivos.map((item) => item.total))
  const reportesDeMomentos = dashboard.reportesRecientes.items.filter((reporte) => reporte.tipo === 'momento').length
  const reportesDePerfiles = dashboard.reportesRecientes.items.filter((reporte) => reporte.tipo === 'perfil').length
  const cuentasDistintasReportadas = new Set(
    dashboard.reportesRecientes.items
      .map((reporte) => reporte.cuentaReportada?.idUsuario)
      .filter(Boolean),
  ).size
  const motivoPrincipal = motivos.slice().sort((a, b) => b.total - a.total)[0]
  const resumenDashboard = [
    { titulo: 'Cuentas distintas reportadas', valor: cuentasDistintasReportadas, detalle: 'Usuarios únicos en reportes abiertos' },
    { titulo: 'Reportes de momentos', valor: reportesDeMomentos, detalle: 'Contenido puntual para revisar' },
    { titulo: 'Reportes de perfiles', valor: reportesDePerfiles, detalle: 'Cuentas señaladas directamente' },
    { titulo: 'Motivo principal', valor: motivoPrincipal ? (etiquetasMotivo[motivoPrincipal.motivo] ?? motivoPrincipal.motivo) : 'Sin datos', detalle: motivoPrincipal ? `${motivoPrincipal.total} reportes recientes` : 'Sin reportes abiertos' },
  ]
  const nombrePerfil = perfilActual?.nombrePerfil || usuario?.nombrePerfil || usuario?.nombreUsuario || 'Moderador'
  const nombreUsuario = perfilActual?.nombreUsuario || usuario?.nombreUsuario || usuario?.usuario || nombrePerfil
  const fotoPerfilUrl = normalizarMediaUrl(perfilActual?.fotoPerfilUrl)
  const iniciales = nombrePerfil.replace('@', '').slice(0, 2).toUpperCase()

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="moderator-shell">
      <aside className="moderator-sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>Moment</span>
          </div>

          <nav className="side-nav" aria-label="Herramientas de moderación">
            {menuModerador.map((item) => (
              <button
                className={`nav-item${seccionActiva === item.id ? ' activo' : ''}`}
                key={item.texto}
                onClick={() => setSeccionActiva(item.id)}
              >
                <span className="nav-icon">{item.icono}</span>
                <span>{item.texto}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="moderator-role-card">
          <div className="moderator-profile-row">
            <div className="moderator-profile-avatar">
              {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt="Foto de perfil" /> : iniciales}
            </div>
            <div>
              <strong>{nombrePerfil}</strong>
              <span>@{String(nombreUsuario).replace('@', '').toLowerCase()}</span>
              <small>{usuario?.rolActivo ?? 'moderador'}</small>
            </div>
          </div>

          <div className="moderator-role-actions">
            <button onClick={() => navigate('/seleccionar-entrada')}>Cambiar rol</button>
            <button onClick={() => setConfirmarSalida(true)}>Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <section className="moderator-page" aria-label="Panel de moderador">
        {seccionActiva === 'dashboard' && (
          <>
            <div className="moderator-stats moderator-stats-first">
              {metricas.map((metrica) => (
                <article key={metrica.id}>
                  <strong>{cargando ? '...' : metrica.valor}</strong>
                  <span>{metrica.titulo}</span>
                </article>
              ))}
            </div>

            <div className="moderator-insights">
              {resumenDashboard.map((item) => (
                <article key={item.titulo}>
                  <span>{item.titulo}</span>
                  <strong>{cargando ? '...' : item.valor}</strong>
                  <p>{item.detalle}</p>
                </article>
              ))}
            </div>

            <div className="moderator-chart-grid">
              <section className="moderator-panel moderator-chart-panel">
                <div className="profile-section-title">
                  <h2>Actividad general</h2>
                  <span>Vista rápida</span>
                </div>

                <div className="bar-chart">
                  {metricas.map((metrica) => (
                    <div className="bar-row" key={metrica.id}>
                      <span>{metrica.titulo}</span>
                      <div>
                        <i style={{ width: `${((metrica.valor || 0) / maxMetrica) * 100}%` }} />
                      </div>
                      <strong>{metrica.valor || 0}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="moderator-panel moderator-chart-panel">
                <div className="profile-section-title">
                  <h2>Motivos recientes</h2>
                  <span>Reportes abiertos</span>
                </div>

                <div className="reason-chart">
                  {motivos.length === 0 && <p>Sin reportes suficientes para graficar.</p>}
                  {motivos.map((item) => (
                    <div className="reason-row" key={item.motivo}>
                      <span>{etiquetasMotivo[item.motivo] ?? item.motivo}</span>
                      <div>
                        <i style={{ width: `${(item.total / maxMotivo) * 100}%` }} />
                      </div>
                      <strong>{item.total}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {seccionActiva === 'reportes' && (
          <>
            <div className="moderator-tabs" role="tablist" aria-label="Vistas de reportes">
              <button className={vistaReportes === 'cuentas' ? 'activo' : ''} onClick={() => setVistaReportes('cuentas')}>
                Cuentas reportadas
              </button>
              <button className={vistaReportes === 'pendientes' ? 'activo' : ''} onClick={() => setVistaReportes('pendientes')}>
                Reportes por revisar
              </button>
              <button className={vistaReportes === 'observacion' ? 'activo' : ''} onClick={() => setVistaReportes('observacion')}>
                Cuentas a observación
              </button>
            </div>

            {vistaReportes === 'cuentas' && (
              <section className="moderator-panel">
                <div className="profile-section-title">
                  <h2>Cuentas más reportadas</h2>
                  <span>{dashboard.cuentasReportadas.total} cuentas</span>
                </div>

                <div className="reported-list">
                  {dashboard.cuentasReportadas.items.length === 0 && (
                    <article className="reported-card">
                      <div>
                        <strong>Sin cuentas reportadas</strong>
                        <span>Los reportes nuevos aparecerán aquí.</span>
                        <p>La bandeja de moderación está lista para recibir casos.</p>
                      </div>
                    </article>
                  )}

                  {dashboard.cuentasReportadas.items.map((cuenta) => (
                    <article className="reported-card" key={cuenta.idUsuario}>
                      <div>
                        <strong>{cuenta.nombre}</strong>
                        <span>{cuenta.usuario} · {cuenta.reportes} reportes</span>
                        <p>{cuenta.motivo}</p>
                      </div>
                      <small className={cuenta.riesgo === 'Alto' ? 'risk-high' : ''}>{cuenta.riesgo}</small>
                      <div className="moderator-actions">
                        <button onClick={() => abrirAccion('advertencia', cuenta)}>Advertir</button>
                        <button onClick={() => abrirAccion('restringir', cuenta)}>Restringir</button>
                        <button onClick={() => abrirAccion('desactivar', cuenta)}>Desactivar</button>
                        <button className="danger-text" onClick={() => abrirAccion('eliminar', cuenta)}>Eliminar</button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="moderation-pagination">
                  <button onClick={() => cambiarPagina('cuentas', -1)} disabled={dashboard.cuentasReportadas.pagina <= 1}>Anterior</button>
                  <span>Página {dashboard.cuentasReportadas.pagina} de {Math.max(dashboard.cuentasReportadas.totalPaginas, 1)}</span>
                  <button onClick={() => cambiarPagina('cuentas', 1)} disabled={dashboard.cuentasReportadas.pagina >= dashboard.cuentasReportadas.totalPaginas}>Siguiente</button>
                </div>
              </section>
            )}

            {vistaReportes === 'pendientes' && (
              <section className="moderator-panel">
                <div className="profile-section-title">
                  <h2>Reportes por revisar</h2>
                  <span>{dashboard.reportesRecientes.total} abiertos</span>
                </div>

                <div className="report-detail-list compact">
                  {dashboard.reportesRecientes.items.length === 0 && (
                    <article className="report-detail-card empty">
                      <strong>Sin publicaciones reportadas</strong>
                      <span>Cuando alguien reporte un momento, aparecerá aquí para revisión.</span>
                    </article>
                  )}

                  {dashboard.reportesRecientes.items.map((reporte) => (
                    <article className="report-detail-card" key={reporte.id}>
                      <div className="report-detail-head">
                        <time dateTime={reporte.fechaReporte}>{formatearFechaReporte(reporte.fechaReporte)}</time>
                      </div>

                      {reporte.tipo === 'momento' && reporte.momento && (
                        <div className="reported-moment-feed">
                          {reporte.momento.archivoUrl ? (
                            reporte.momento.tipoAdjunto === 'video'
                              ? <video src={normalizarMediaUrl(reporte.momento.archivoUrl)} controls />
                              : <img src={normalizarMediaUrl(reporte.momento.archivoUrl)} alt="Momento reportado" />
                          ) : (
                            <div className="reported-moment-empty">
                              <p>{reporte.momento.texto}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="report-detail-reason">
                        <strong>{etiquetasMotivo[reporte.motivo] ?? reporte.motivo}</strong>
                        <p>{reporte.detalle || 'Sin detalle adicional.'}</p>
                      </div>

                      <div className="report-accounts">
                        <div>
                          <small>Cuenta reportada</small>
                          <strong>{reporte.cuentaReportada?.nombre ?? 'Cuenta no disponible'}</strong>
                          <span>{reporte.cuentaReportada?.usuario ?? 'Sin usuario'} · {reporte.cuentaReportada?.email ?? 'Sin correo'}</span>
                        </div>
                        <div>
                          <small>Reporta</small>
                          <strong>{reporte.cuentaReportante?.nombre ?? 'Usuario'}</strong>
                          <span>{reporte.cuentaReportante?.usuario ?? 'Sin usuario'} · {reporte.cuentaReportante?.email ?? 'Sin correo'}</span>
                        </div>
                      </div>

                      {reporte.momento?.texto && (
                        <p className="reported-moment-text">{reporte.momento.texto}</p>
                      )}
                    </article>
                  ))}
                </div>
                <div className="moderation-pagination">
                  <button onClick={() => cambiarPagina('reportes', -1)} disabled={dashboard.reportesRecientes.pagina <= 1}>Anterior</button>
                  <span>Página {dashboard.reportesRecientes.pagina} de {Math.max(dashboard.reportesRecientes.totalPaginas, 1)}</span>
                  <button onClick={() => cambiarPagina('reportes', 1)} disabled={dashboard.reportesRecientes.pagina >= dashboard.reportesRecientes.totalPaginas}>Siguiente</button>
                </div>
              </section>
            )}

            {vistaReportes === 'observacion' && (
              <section className="moderator-panel">
                <div className="profile-section-title">
                  <h2>Cuentas a observación</h2>
                  <span>{dashboard.cuentasObservacion.total} cuentas</span>
                </div>

                <div className="reported-list">
                  {dashboard.cuentasObservacion.items.length === 0 && (
                    <article className="reported-card">
                      <div>
                        <strong>Sin cuentas a observación</strong>
                        <span>Cuando envíes una advertencia, la cuenta aparecerá aquí.</span>
                        <p>Este espacio ayuda a separar casos ya advertidos de reportes nuevos.</p>
                      </div>
                    </article>
                  )}

                  {dashboard.cuentasObservacion.items.map((cuenta) => (
                    <article className="reported-card observation-card" key={cuenta.idUsuario}>
                      <div>
                        <strong>{cuenta.nombre}</strong>
                        <span>{cuenta.usuario} · {cuenta.advertencias} advertencia{cuenta.advertencias === 1 ? '' : 's'}</span>
                        <p>{cuenta.motivo}</p>
                      </div>
                      <div className="moderator-actions">
                        <button onClick={() => abrirAccion('advertencia', cuenta)}>Nueva advertencia</button>
                        <button onClick={() => abrirAccion('restringir', cuenta)}>Restringir</button>
                        <button onClick={() => abrirAccion('desactivar', cuenta)}>Desactivar</button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="moderation-pagination">
                  <button onClick={() => cambiarPagina('observacion', -1)} disabled={dashboard.cuentasObservacion.pagina <= 1}>Anterior</button>
                  <span>Página {dashboard.cuentasObservacion.pagina} de {Math.max(dashboard.cuentasObservacion.totalPaginas, 1)}</span>
                  <button onClick={() => cambiarPagina('observacion', 1)} disabled={dashboard.cuentasObservacion.pagina >= dashboard.cuentasObservacion.totalPaginas}>Siguiente</button>
                </div>
              </section>
            )}
          </>
        )}

        {seccionActiva === 'spam' && (
          <section className="moderator-panel">
            <div className="profile-section-title">
              <h2>Alertas por spam</h2>
              <span>En vivo</span>
            </div>

            <div className="spam-list">
              {dashboard.alertasSpam.length === 0 && (
                <article className="spam-card">
                  <small>OK</small>
                  <strong>Sin spam activo</strong>
                  <p>Los reportes por spam aparecerán en esta columna.</p>
                </article>
              )}

              {dashboard.alertasSpam.map((alerta) => (
                <article className="spam-card" key={alerta.id}>
                  <small>{alerta.nivel}</small>
                  <strong>{alerta.titulo}</strong>
                  <p>{alerta.detalle}</p>
                  <button>Revisar alerta</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {seccionActiva === 'restricciones' && (
          <section className="moderator-panel">
            <div className="profile-section-title">
              <h2>Restricciones</h2>
              <span>Acciones recientes</span>
            </div>
            <article className="spam-card">
              <small>Próximo</small>
              <strong>Historial de cuentas restringidas</strong>
              <p>Esta sección queda lista para conectar acciones, apelaciones y estados de cuenta.</p>
            </article>
          </section>
        )}
      </section>

      {accionPendiente && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal moderation-confirm" role="dialog" aria-modal="true">
            <h2>{accionPendiente.tipo === 'advertencia' ? 'Enviar advertencia' : `${accionPendiente.tipo} cuenta`}</h2>
            <p>Cuenta: {accionPendiente.cuenta.usuario}</p>

            {accionPendiente.tipo === 'advertencia' && (
              <div className="warning-template-list">
                {plantillasAdvertencia.map((item) => (
                  <button className={plantilla.id === item.id ? 'activo' : ''} key={item.id} onClick={() => setPlantilla(item)}>
                    <strong>{item.titulo}</strong>
                    <span>{item.mensaje}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <button className="profile-btn" onClick={() => setAccionPendiente(null)} disabled={procesandoAccion}>Cancelar</button>
              <button className={accionPendiente.tipo === 'eliminar' ? 'danger-btn' : accionPendiente.tipo === 'desactivar' ? 'warning-btn' : 'profile-btn primary'} onClick={ejecutarAccion} disabled={procesandoAccion}>
                {procesandoAccion ? <span className="spinner" aria-hidden="true" /> : 'Confirmar'}
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmarSalida && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmarSalida(false)}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Cerrar sesión" onClick={(e) => e.stopPropagation()}>
            <h2>Cerrar sesión</h2>
            <p>¿Quieres salir de tu sesión de moderador?</p>
            <div>
              <button className="profile-btn" onClick={() => setConfirmarSalida(false)}>Cancelar</button>
              <button className="profile-btn primary" onClick={cerrarSesion}>Cerrar sesión</button>
            </div>
          </section>
        </div>
      )}

      <SuccessPop visible={Boolean(popExito)} mensaje={popExito} />
    </main>
  )
}
