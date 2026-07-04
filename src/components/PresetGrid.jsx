// Sidebar list of shape presets, grouped by category, with simple SVG icons.
const DEFAULT_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5Z" />
  </svg>
)

const ICONS = {
  'box-with-lid': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="10" width="16" height="10" rx="1" />
      <rect x="2.5" y="4" width="19" height="4" rx="1" />
    </svg>
  ),
  'nested-boxes': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <rect x="6.5" y="6.5" width="11" height="11" rx="1" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" />
    </svg>
  ),
  'phone-stand': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 20h18M5 20 15 4l4 3-8 13" />
    </svg>
  ),
  'phone-case': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <rect x="9.5" y="4.5" width="3" height="3" rx="0.8" />
    </svg>
  ),
  dragon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 17c3 0 4-2 6-2s3 2 6 2c2.5 0 4-1.5 4-4 0-3-2.5-5-5-5-1 0-1.5.3-2.4 1L9 6.5 9.8 9C7 9.6 3 12 3 17Z" />
      <path d="m15 8-1-3.5L17.5 7" />
    </svg>
  ),
}

export default function PresetGrid({ presets, selectedId, onSelect }) {
  const categories = [...new Set(presets.map((p) => p.category))]
  return (
    <nav className="preset-list" aria-label="Shape presets">
      {categories.map((cat) => (
        <div key={cat} style={{ display: 'contents' }}>
          <div className="preset-category">{cat}</div>
          {presets
            .filter((p) => p.category === cat)
            .map((p) => (
              <button
                key={p.id}
                className={`preset-card${p.id === selectedId ? ' selected' : ''}`}
                onClick={() => onSelect(p.id)}
                title={p.description}
              >
                {ICONS[p.id] ?? DEFAULT_ICON}
                <span>{p.name}</span>
              </button>
            ))}
        </div>
      ))}
    </nav>
  )
}
