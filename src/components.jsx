export function TypeBadge({ type }) {
  return (
    <span className={`badge ${type === 'injection' ? 'badge-inj' : 'badge-oral'}`}>
      {type === 'injection' ? '주사' : '경구'}
    </span>
  )
}
