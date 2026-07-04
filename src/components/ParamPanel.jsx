// Right-hand panel: live parameter controls (slider + numeric input),
// printability warnings, dimension readout and STL export.
export default function ParamPanel({
  preset,
  params,
  onChange,
  onReset,
  onExport,
  warnings,
  dims,
  canExport,
}) {
  const setValue = (key, raw, def) => {
    const value = Number(raw)
    onChange({ ...params, [key]: Number.isFinite(value) ? value : def.default })
  }

  return (
    <aside className="param-panel">
      <h2>{preset.name}</h2>
      <p className="description">{preset.description}</p>

      {preset.params.map((def) => (
        <div className="param-row" key={def.key}>
          <div className="param-head">
            <label htmlFor={`num-${def.key}`}>{def.label}</label>
            <span className="param-value">
              <input
                id={`num-${def.key}`}
                type="number"
                min={def.min}
                max={def.max}
                step={def.step}
                value={params[def.key]}
                onChange={(e) => setValue(def.key, e.target.value, def)}
              />
              <span className="unit">{def.unit}</span>
            </span>
          </div>
          <input
            type="range"
            aria-label={def.label}
            min={def.min}
            max={def.max}
            step={def.step}
            value={params[def.key]}
            onChange={(e) => setValue(def.key, e.target.value, def)}
          />
        </div>
      ))}

      {warnings.length > 0 && (
        <div className="warnings" role="alert">
          {warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {dims && (
        <div className="dims">
          Bounding box:{' '}
          <strong>
            {dims[0].toFixed(1)} × {dims[1].toFixed(1)} × {dims[2].toFixed(1)} mm
          </strong>
        </div>
      )}

      <button className="export-btn" onClick={onExport} disabled={!canExport}>
        Export STL
      </button>
      <button className="reset-btn" onClick={onReset}>
        Reset to defaults
      </button>
    </aside>
  )
}
