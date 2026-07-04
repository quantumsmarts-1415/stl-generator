import { useEffect, useMemo, useState } from 'react'
import modeling from '@jscad/modeling'
import { presets, defaultParams } from './presets/index.js'
import { downloadStl } from './lib/exportStl.js'
import PresetGrid from './components/PresetGrid.jsx'
import ParamPanel from './components/ParamPanel.jsx'
import Viewport from './components/Viewport.jsx'

const { measureBoundingBox } = modeling.measurements

function getInitialTheme() {
  const saved = localStorage.getItem('stlgen-theme')
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

export default function App() {
  const [presetId, setPresetId] = useState(presets[0].id)
  const preset = presets.find((p) => p.id === presetId)
  const [params, setParams] = useState(() => defaultParams(presets[0]))
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('stlgen-theme', theme)
  }, [theme])

  const selectPreset = (id) => {
    const next = presets.find((p) => p.id === id)
    setPresetId(id)
    setParams(defaultParams(next))
  }

  const { geom, error } = useMemo(() => {
    try {
      return { geom: preset.build(params), error: null }
    } catch (e) {
      return { geom: null, error: e.message }
    }
  }, [preset, params])

  const dims = useMemo(() => {
    if (!geom) return null
    const [min, max] = measureBoundingBox(geom)
    return [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  }, [geom])

  const warnings = useMemo(
    () => (preset.warnings ? preset.warnings(params) : []),
    [preset, params]
  )

  const handleExport = () => {
    if (!geom || !dims) return
    const dimStr = dims.map((d) => d.toFixed(1)).join('x')
    downloadStl(geom, `${preset.id}_${dimStr}mm.stl`)
  }

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1>STL Generator</h1>
          <span className="subtitle">parametric blanks · live preview · one-click export</span>
        </div>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? '☀ Light' : '☾ Dark'}
        </button>
      </header>
      <div className="layout">
        <PresetGrid presets={presets} selectedId={presetId} onSelect={selectPreset} />
        <Viewport
          geom={geom}
          presetId={presetId}
          size={dims ? Math.max(...dims) : 30}
          error={error}
        />
        <ParamPanel
          preset={preset}
          params={params}
          onChange={setParams}
          onReset={() => setParams(defaultParams(preset))}
          onExport={handleExport}
          warnings={warnings}
          dims={dims}
          canExport={!!geom}
        />
      </div>
    </div>
  )
}
