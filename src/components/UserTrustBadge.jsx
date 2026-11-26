export default function UserTrustBadge({ verified = false, moderator = false }) {
  if (!verified && !moderator) return null

  return (
    <span className="user-trust-badges" aria-label={moderator ? 'Cuenta verificada y moderador' : 'Cuenta verificada'}>
      {verified && (
        <svg className="user-trust-badge user-trust-badge-verified" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.8 14.2 4l2.5-.1 1.1 2.2 2.1 1.3-.4 2.5 1 2.3-1.7 1.8-.2 2.5-2.4.8-1.7 1.9-2.5-.7-2.5.7-1.7-1.9-2.4-.8-.2-2.5-1.7-1.8 1-2.3-.4-2.5 2.1-1.3 1.1-2.2 2.5.1L12 2.8Z" />
          <path className="user-trust-check" d="m8.1 12.2 2.4 2.4 5.4-5.4" />
        </svg>
      )}
      {moderator && (
        <svg className="user-trust-badge user-trust-badge-moderator" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.8 19 5v5.2c0 5-2.8 8.8-7 11-4.2-2.2-7-6-7-11V5l7-2.2Z" />
          <path className="user-trust-shield-check" d="m8.7 12 2.1 2.1 4.5-4.5" />
        </svg>
      )}
    </span>
  )
}
