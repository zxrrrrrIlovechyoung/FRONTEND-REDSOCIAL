export default function SessionSkeleton() {
  return (
    <main className="session-skeleton-screen" aria-busy="true" aria-label="Cargando sesión" role="status">
      <aside className="session-skeleton-sidebar" aria-hidden="true">
        <div className="session-skeleton-brand">
          <span className="skeleton session-skeleton-brand-mark" />
          <span className="skeleton session-skeleton-brand-name" />
        </div>

        <nav className="session-skeleton-nav">
          {[72, 82, 68, 78, 74].map((width) => (
            <div className="session-skeleton-nav-item" key={width}>
              <span className="skeleton session-skeleton-nav-icon" />
              <span className="skeleton session-skeleton-nav-label" style={{ width: `${width}%` }} />
            </div>
          ))}
        </nav>

        <div className="session-skeleton-profile">
          <span className="skeleton avatar" />
          <div>
            <span className="skeleton line wide" />
            <span className="skeleton line small" />
          </div>
        </div>
      </aside>

      <section className="session-skeleton-feed" aria-hidden="true">
        <div className="session-skeleton-heading">
          <div>
            <span className="skeleton line session-skeleton-kicker" />
            <span className="skeleton line session-skeleton-title" />
          </div>
          <span className="skeleton session-skeleton-button" />
        </div>

        {[1, 2].map((item) => (
          <article className="session-skeleton-post" key={item}>
            <div className="session-skeleton-post-head">
              <span className="skeleton avatar" />
              <div>
                <span className="skeleton line session-skeleton-author" />
                <span className="skeleton line session-skeleton-meta" />
              </div>
            </div>
            <span className="skeleton session-skeleton-media" />
            <div className="session-skeleton-actions">
              <span className="skeleton session-skeleton-action" />
              <span className="skeleton session-skeleton-action" />
              <span className="skeleton session-skeleton-action short" />
            </div>
          </article>
        ))}
      </section>

      <aside className="session-skeleton-rail" aria-hidden="true">
        <span className="skeleton line session-skeleton-rail-title" />
        {[1, 2, 3].map((item) => (
          <div className="session-skeleton-rail-item" key={item}>
            <span className="skeleton session-skeleton-rail-avatar" />
            <div>
              <span className="skeleton line session-skeleton-rail-name" />
              <span className="skeleton line session-skeleton-rail-copy" />
            </div>
          </div>
        ))}
      </aside>
    </main>
  )
}
