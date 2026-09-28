import { useAuth } from '../context/AuthContext'

const menuModerador = [
  { icono: '▦', texto: 'Dashboard', activo: true },
  { icono: '!', texto: 'Reportes' },
  { icono: '⌁', texto: 'Spam' },
  { icono: '⊘', texto: 'Restricciones' },
]

const cuentasReportadas = [
  { id: 1, usuario: '@flash.sale22', nombre: 'Promos Flash', reportes: 42, motivo: 'Spam repetitivo', riesgo: 'Alto' },
  { id: 2, usuario: '@lucas.fake', nombre: 'Lucas M.', reportes: 27, motivo: 'Suplantacion', riesgo: 'Alto' },
  { id: 3, usuario: '@ruido_5a', nombre: 'Ruido 5A', reportes: 15, motivo: 'Comentarios ofensivos', riesgo: 'Medio' },
]

const alertasSpam = [
  { id: 1, titulo: 'Mensajes repetidos', detalle: '18 cuentas enviaron el mismo enlace en la ultima hora.', nivel: 'Alto' },
  { id: 2, titulo: 'Actividad inusual', detalle: 'Picos de likes desde perfiles nuevos en publicaciones antiguas.', nivel: 'Medio' },
  { id: 3, titulo: 'Contenido marcado', detalle: '7 momentos fueron reportados por posible contenido engañoso.', nivel: 'Medio' },
]

export default function Moderador() {
  const { usuario } = useAuth()

  return (
    <main className="moderator-shell">
      <aside className="moderator-sidebar">
        <div>
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>Moment</span>
          </div>

          <nav className="side-nav" aria-label="Herramientas de moderacion">
            {menuModerador.map((item) => (
              <button className={`nav-item${item.activo ? ' activo' : ''}`} key={item.texto}>
                <span className="nav-icon">{item.icono}</span>
                <span>{item.texto}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="moderator-role-card">
          <strong>{usuario?.nombreUsuario ?? 'moderador'}</strong>
          <span>{usuario?.rol ?? 'moderador'}</span>
        </div>
      </aside>

      <section className="moderator-page" aria-label="Panel de moderador">
        <header className="moderator-header">
          <div>
            <p className="feed-kicker">Panel de moderacion</p>
            <h1>Hola, {usuario?.nombreUsuario ?? 'moderador'}</h1>
            <span>Revisa reportes, spam y acciones sobre cuentas de Moment.</span>
          </div>
          <strong>{usuario?.rol ?? 'moderador'}</strong>
        </header>

        <div className="moderator-stats">
          <article>
            <strong>84</strong>
            <span>Reportes abiertos</span>
          </article>
          <article>
            <strong>12</strong>
            <span>Alertas por spam</span>
          </article>
          <article>
            <strong>9</strong>
            <span>Cuentas restringidas</span>
          </article>
          <article>
            <strong>3</strong>
            <span>Casos urgentes</span>
          </article>
        </div>

        <div className="moderator-grid">
          <section className="moderator-panel">
            <div className="profile-section-title">
              <h2>Cuentas mas reportadas</h2>
              <span>Prioridad alta</span>
            </div>

            <div className="reported-list">
              {cuentasReportadas.map((cuenta) => (
                <article className="reported-card" key={cuenta.id}>
                  <div>
                    <strong>{cuenta.nombre}</strong>
                    <span>{cuenta.usuario} · {cuenta.reportes} reportes</span>
                    <p>{cuenta.motivo}</p>
                  </div>
                  <small className={cuenta.riesgo === 'Alto' ? 'risk-high' : ''}>{cuenta.riesgo}</small>
                  <div className="moderator-actions">
                    <button>Restringir</button>
                    <button>Desactivar</button>
                    <button className="danger-text">Eliminar</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="moderator-panel">
            <div className="profile-section-title">
              <h2>Alertas por spam</h2>
              <span>En vivo</span>
            </div>

            <div className="spam-list">
              {alertasSpam.map((alerta) => (
                <article className="spam-card" key={alerta.id}>
                  <small>{alerta.nivel}</small>
                  <strong>{alerta.titulo}</strong>
                  <p>{alerta.detalle}</p>
                  <button>Revisar alerta</button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
