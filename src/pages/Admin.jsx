import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LogsAcceso from '../components/LogsAcceso'
import SuccessPop from '../components/SuccessPop'
import { useAuth } from '../context/AuthContext'
import { adminService } from '../services/adminService'
import { rutaInicialPorRol } from '../utils/rutasPorRol'

const datosIniciales = {
  estadisticas: { totalUsuarios: 0, usuariosActivos: 0, nuevosMes: 0, loginsSemana: 0, publicaciones: 0, reportesAbiertos: 0 },
  crecimiento: [],
  actividad: [],
}

const usuariosIniciales = { items: [], pagina: 1, total: 0, totalPaginas: 0, cantidad: 10 }

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin registro'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(fecha))
}

const formatearDiaCorto = (fecha) => {
  if (!fecha) return ''
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(new Date(fecha))
}

export default function Admin() {
  const navigate = useNavigate()
  const { usuario, logout, seleccionarRolActivo } = useAuth()
  const [seccion, setSeccion] = useState('dashboard')
  const [dashboard, setDashboard] = useState(datosIniciales)
  const [usuarios, setUsuarios] = useState(usuariosIniciales)
  const [paginaUsuarios, setPaginaUsuarios] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [usuarioExpandido, setUsuarioExpandido] = useState(null)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [popExito, setPopExito] = useState('')
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const rolesDisponibles = Array.isArray(usuario?.roles) ? usuario.roles : []
  const puedeCambiarModo = rolesDisponibles.length > 1

  useEffect(() => {
    adminService.dashboard().then((resultado) => {
      if (resultado.exito && resultado.datos) setDashboard(resultado.datos)
    })
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      adminService.usuarios({ pagina: paginaUsuarios, q: busqueda }).then((resultado) => {
        if (resultado.exito && resultado.datos) setUsuarios(resultado.datos)
      })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [paginaUsuarios, busqueda])

  const metricas = [
    { id: 'usuarios', titulo: 'Usuarios totales', valor: dashboard.estadisticas.totalUsuarios },
    { id: 'activos', titulo: 'Usuarios activos', valor: dashboard.estadisticas.usuariosActivos },
    { id: 'nuevos', titulo: 'Nuevos este mes', valor: dashboard.estadisticas.nuevosMes },
  ]
  const maxCrecimiento = Math.max(1, ...dashboard.crecimiento.map((item) => item.total || 0))
  const maxActividad = Math.max(1, ...dashboard.actividad.map((item) => item.total || 0))
  const crecimientoVisible = dashboard.crecimiento.slice(-10)
  const actividadVisible = dashboard.actividad.slice(-10)

  const ejecutarAccion = async (accion) => {
    if (!usuarioSeleccionado || procesando) return

    setProcesando(true)
    const respuesta = await adminService.accionUsuario(usuarioSeleccionado.idUsuario, {
      accion,
      motivo: `Acción administrativa: ${accion}`,
    })
    setProcesando(false)

    if (!respuesta.exito) return

    setUsuarioSeleccionado(null)
    setPopExito('Acción registrada')
    window.setTimeout(() => setPopExito(''), 1900)
    adminService.usuarios({ pagina: paginaUsuarios, q: busqueda }).then((resultado) => {
      if (resultado.exito && resultado.datos) setUsuarios(resultado.datos)
    })
  }

  const cerrarSesion = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const cambiarModo = (rol) => {
    seleccionarRolActivo(rol)
    setMenuMovilAbierto(false)
    navigate(rutaInicialPorRol(rol), { replace: true })
  }

  return (
    <main className="moderator-shell">
      <aside className="moderator-sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>Moment</span>
          </div>

          <nav className="side-nav" aria-label="Herramientas administrativas">
            <button className={`nav-item${seccion === 'dashboard' ? ' activo' : ''}`} onClick={() => setSeccion('dashboard')}>
              <span className="nav-icon">▦</span>
              <span>Dashboard</span>
            </button>
            <button className={`nav-item${seccion === 'usuarios' ? ' activo' : ''}`} onClick={() => setSeccion('usuarios')}>
              <span className="nav-icon">◎</span>
              <span>Usuarios</span>
            </button>
            <button className={`nav-item${seccion === 'logs' ? ' activo' : ''}`} onClick={() => setSeccion('logs')}>
              <span className="nav-icon">≡</span>
              <span>Logs de acceso</span>
            </button>
            <button className={`nav-item${seccion === 'reportes' ? ' activo' : ''}`} onClick={() => setSeccion('reportes')}>
              <span className="nav-icon">!</span>
              <span>Reportes</span>
            </button>
          </nav>
        </div>

        <div className="moderator-role-card">
          <strong>{usuario?.nombreUsuario ?? 'admin'}</strong>
          <span>{usuario?.rolActivo ?? 'admin'}</span>
          <div className="moderator-role-actions">
            {puedeCambiarModo && <button onClick={() => navigate('/seleccionar-entrada')}>Cambiar rol</button>}
            <button onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </div>
      </aside>

      <header className="admin-mobile-topbar">
        <button
          className={`admin-mobile-menu-button${menuMovilAbierto ? ' abierto' : ''}`}
          type="button"
          aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuMovilAbierto}
          onClick={() => setMenuMovilAbierto((actual) => !actual)}
        >
          <span /><span /><span />
        </button>
        <div className="admin-mobile-brand"><span className="brand-mark">M</span><strong>Moment</strong></div>
        <span className="admin-mobile-role">Admin</span>
      </header>

      {menuMovilAbierto && (
        <div className="admin-mobile-drawer-layer" role="presentation" onClick={() => setMenuMovilAbierto(false)}>
          <aside className="admin-mobile-drawer" role="dialog" aria-label="Cambiar modo de usuario" onClick={(e) => e.stopPropagation()}>
            <div className="admin-mobile-drawer-head">
              <div><span className="brand-mark">M</span><strong>Moment</strong></div>
              <button type="button" onClick={() => setMenuMovilAbierto(false)} aria-label="Cerrar menú">×</button>
            </div>
            <p>Selecciona el modo de trabajo para esta sesión.</p>
            {puedeCambiarModo && (
              <div className="admin-mobile-role-list">
                {rolesDisponibles.map((rol) => (
                  <button className={rol === 'admin' ? 'activo' : ''} type="button" key={rol} onClick={() => cambiarModo(rol)}>
                    <span>{rol === 'usuario' ? '⌂' : rol === 'moderador' ? '!' : '✦'}</span>
                    <strong>{rol === 'usuario' ? 'Usuario' : rol === 'moderador' ? 'Moderador' : 'Administrador'}</strong>
                    <small>{rol === 'admin' ? 'Modo actual' : 'Cambiar a este modo'}</small>
                  </button>
                ))}
              </div>
            )}
            <button className="admin-mobile-logout" type="button" onClick={() => { setMenuMovilAbierto(false); setConfirmarSalida(true) }}>Cerrar sesión</button>
          </aside>
        </div>
      )}

      <nav className="admin-mobile-nav" aria-label="Navegación administrativa móvil">
        <button className={seccion === 'dashboard' ? 'activo' : ''} onClick={() => setSeccion('dashboard')}>
          <span aria-hidden="true">▦</span>
          <strong>Inicio</strong>
        </button>
        <button className={seccion === 'usuarios' ? 'activo' : ''} onClick={() => setSeccion('usuarios')}>
          <span aria-hidden="true">◎</span>
          <strong>Usuarios</strong>
        </button>
        <button className={seccion === 'logs' ? 'activo' : ''} onClick={() => setSeccion('logs')}>
          <span aria-hidden="true">≡</span>
          <strong>Logs</strong>
        </button>
        <button className={seccion === 'reportes' ? 'activo' : ''} onClick={() => setSeccion('reportes')}>
          <span aria-hidden="true">!</span>
          <strong>Reportes</strong>
        </button>
      </nav>

      <section className="moderator-page admin-page" aria-label="Panel administrador">
        {seccion === 'logs' && <LogsAcceso />}
        {seccion === 'dashboard' && (
          <>
            <div className="moderator-stats moderator-stats-first admin-stats">
              {metricas.map((metrica) => (
                <article key={metrica.id}>
                  <strong>{metrica.valor}</strong>
                  <span>{metrica.titulo}</span>
                </article>
              ))}
            </div>

            <div className="moderator-chart-grid">
              <section className="moderator-panel moderator-chart-panel">
                <div className="profile-section-title">
                  <h2>Crecimiento de usuarios</h2>
                  <span>Últimos 30 días</span>
                </div>
                <div className="admin-readable-chart">
                  {dashboard.crecimiento.length === 0 && <p>Sin altas recientes.</p>}
                  {crecimientoVisible.map((item) => (
                    <div className="admin-chart-column" key={item.fecha}>
                      <strong>{item.total}</strong>
                      <i style={{ height: `${Math.max(12, (item.total / maxCrecimiento) * 100)}%` }} />
                      <span>{formatearDiaCorto(item.fecha)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="moderator-panel moderator-chart-panel">
                <div className="profile-section-title">
                  <h2>Pico de actividad</h2>
                  <span>Publicaciones recientes</span>
                </div>
                <div className="admin-readable-chart warm">
                  {dashboard.actividad.length === 0 && <p>Sin actividad reciente.</p>}
                  {actividadVisible.map((item) => (
                    <div className="admin-chart-column" key={item.fecha}>
                      <strong>{item.total}</strong>
                      <i style={{ height: `${Math.max(12, (item.total / maxActividad) * 100)}%` }} />
                      <span>{formatearDiaCorto(item.fecha)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {seccion === 'usuarios' && (
          <section className="moderator-panel">
            <div className="profile-section-title">
              <h2>Usuarios de Moment</h2>
              <span>{usuarios.total} usuarios</span>
            </div>

            <input
              className="admin-search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaUsuarios(1)
              }}
              placeholder="Buscar por usuario, nombre o correo"
            />

            <div className="admin-user-list">
              {usuarios.items.map((item) => {
                const expandido = usuarioExpandido === item.idUsuario
                return (
                  <article
                    className={`admin-user-row${expandido ? ' expandido' : ''}`}
                    key={item.idUsuario}
                    onClick={() => setUsuarioExpandido((actual) => actual === item.idUsuario ? null : item.idUsuario)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setUsuarioExpandido((actual) => actual === item.idUsuario ? null : item.idUsuario)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandido}
                  >
                    <div className="admin-user-summary">
                      <strong>{item.nombre}</strong>
                      <span>{item.usuario}</span>
                    </div>
                    <div className="admin-user-status">
                      <span>{item.activo ? item.estadoCuenta : 'inactiva'}</span>
                      <b aria-hidden="true">{expandido ? '⌃' : '⌄'}</b>
                    </div>
                    {expandido && (
                      <div className="admin-user-details" onClick={(e) => e.stopPropagation()}>
                        <div>
                          <small>Correo</small>
                          <span>{item.email}</span>
                        </div>
                        <div>
                          <small>Roles</small>
                          <span>{item.roles?.join(', ') || 'usuario'}</span>
                        </div>
                        <button type="button" onClick={() => setUsuarioSeleccionado(item)}>Gestionar usuario</button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            <div className="moderation-pagination">
              <button onClick={() => setPaginaUsuarios((valor) => Math.max(1, valor - 1))} disabled={usuarios.pagina <= 1}>Anterior</button>
              <span>Página {usuarios.pagina} de {Math.max(usuarios.totalPaginas, 1)}</span>
              <button onClick={() => setPaginaUsuarios((valor) => valor + 1)} disabled={usuarios.pagina >= usuarios.totalPaginas}>Siguiente</button>
            </div>
          </section>
        )}

        {seccion === 'reportes' && (
          <section className="moderator-panel">
            <div className="profile-section-title">
              <h2>Reportes administrativos</h2>
              <span>Vista ejecutiva</span>
            </div>
            <article className="spam-card">
              <small>{dashboard.estadisticas.reportesAbiertos}</small>
              <strong>Reportes abiertos</strong>
              <p>El detalle operativo vive en el panel de moderador. Aquí mantendremos métricas globales y auditoría administrativa.</p>
            </article>
          </section>
        )}
      </section>

      {usuarioSeleccionado && (
        <div className="modal-backdrop" role="presentation" onClick={() => setUsuarioSeleccionado(null)}>
          <section className="confirm-modal admin-user-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{usuarioSeleccionado.nombre}</h2>
            <p>{usuarioSeleccionado.usuario} · {usuarioSeleccionado.email}</p>
            <div className="admin-action-grid">
              <button onClick={() => ejecutarAccion('moderador')} disabled={procesando}>Invitar a moderación</button>
              <button onClick={() => ejecutarAccion('admin')} disabled={procesando}>Asignar admin</button>
              <button onClick={() => ejecutarAccion('desactivar')} disabled={procesando}>Desactivar</button>
              <button className="danger-btn" onClick={() => ejecutarAccion('eliminar')} disabled={procesando}>Eliminar</button>
            </div>
          </section>
        </div>
      )}

      {confirmarSalida && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmarSalida(false)}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-label="Cerrar sesión" onClick={(e) => e.stopPropagation()}>
            <h2>Cerrar sesión</h2>
            <p>¿Quieres salir de tu sesión de administrador?</p>
            <div className="confirm-actions">
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
