interface ChartSlice {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: ChartSlice[]
  size?: number
  thickness?: number
}

export function DonutChart({ data, size = 160, thickness = 22 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (total === 0) {
    return (
      <div className="chart-donut-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={thickness}
          />
        </svg>
        <div className="chart-donut-center">
          <strong>0</strong>
          <span>Tests</span>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((slice) => {
            if (slice.value <= 0) return null
            const length = (slice.value / total) * circumference
            const circle = (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += length
            return circle
          })}
        </g>
      </svg>
      <div className="chart-donut-center">
        <strong>{total}</strong>
        <span>Tests</span>
      </div>
    </div>
  )
}

interface BarChartProps {
  data: ChartSlice[]
  maxBars?: number
}

export function BarChart({ data, maxBars = 6 }: BarChartProps) {
  const items = data.slice(0, maxBars)
  const max = Math.max(...items.map((d) => d.value), 1)

  if (items.length === 0) {
    return <p className="chart-empty">No subject data yet</p>
  }

  return (
    <div className="chart-bars" role="img" aria-label="Tests by subject">
      {items.map((item) => (
        <div key={item.label} className="chart-bar-row">
          <span className="chart-bar-label" title={item.label}>
            {item.label}
          </span>
          <div className="chart-bar-track">
            <div
              className="chart-bar-fill"
              style={{
                width: `${(item.value / max) * 100}%`,
                background: item.color,
              }}
            />
          </div>
          <span className="chart-bar-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

interface LinePoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LinePoint[]
}

export function LineChart({ data }: LineChartProps) {
  const width = 320
  const height = 140
  const padX = 12
  const padY = 16
  const max = Math.max(...data.map((d) => d.value), 1)
  const min = 0
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  if (data.length === 0) {
    return <p className="chart-empty">No timeline data yet</p>
  }

  const points = data.map((d, i) => {
    const x = padX + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW)
    const y = padY + innerH - ((d.value - min) / (max - min)) * innerH
    return { ...d, x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + innerH} L ${points[0].x} ${padY + innerH} Z`

  return (
    <div className="chart-line-wrap">
      <svg
        className="chart-line-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tests created over time"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#384EC7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#384EC7" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={width - padX}
            y1={padY + innerH * (1 - t)}
            y2={padY + innerH * (1 - t)}
            stroke="#eef0f4"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill="url(#lineFill)" />
        <path d={linePath} fill="none" stroke="#384EC7" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="3.5" fill="#384EC7" />
        ))}
      </svg>
      <div className="chart-line-labels">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}

interface ChartLegendProps {
  data: ChartSlice[]
}

export function ChartLegend({ data }: ChartLegendProps) {
  return (
    <ul className="chart-legend">
      {data.map((item) => (
        <li key={item.label}>
          <span className="chart-legend-dot" style={{ background: item.color }} />
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </li>
      ))}
    </ul>
  )
}
