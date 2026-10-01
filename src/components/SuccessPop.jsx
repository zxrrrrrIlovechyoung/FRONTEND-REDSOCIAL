export default function SuccessPop({ visible, mensaje }) {
  if (!visible) return null

  return (
    <div className="profile-success-backdrop" role="presentation">
      <div className="profile-success-modal" role="status" aria-live="polite">
        <span>✓</span>
        <strong>{mensaje}</strong>
      </div>
    </div>
  )
}
