import { useMemo } from 'react'
import type { Test } from '../../types'
import { BarChart, ChartLegend, DonutChart, LineChart } from './DashboardCharts'

const SUBJECT_COLORS = ['#384EC7', '#2AB7A9', '#E9B406', '#7C3AED', '#F97316', '#0EA5E9']

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short' })
}

interface DashboardAnalyticsProps {
  tests: Test[]
}

export default function DashboardAnalytics({ tests }: DashboardAnalyticsProps) {
  const statusData = useMemo(() => {
    let live = 0
    let draft = 0
    tests.forEach((t) => {
      if (t.status === 'live') live += 1
      else draft += 1
    })
    return [
      { label: 'Live', value: live, color: '#16a34a' },
      { label: 'Draft', value: draft, color: '#9ca3af' },
    ]
  }, [tests])

  const subjectData = useMemo(() => {
    const counts = new Map<string, number>()
    tests.forEach((t) => {
      const subject = t.subject?.trim() || 'Unknown'
      counts.set(subject, (counts.get(subject) || 0) + 1)
    })
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], index) => ({
        label,
        value,
        color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
      }))
  }, [tests])

  const timelineData = useMemo(() => {
    const counts = new Map<string, number>()
    tests.forEach((t) => {
      const key = monthKey(t.created_at)
      if (!key) return
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    const now = new Date()
    const months: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push({ label: monthLabel(key), value: counts.get(key) || 0 })
    }
    return months
  }, [tests])

  return (
    <div className="dashboard-charts">
      <div className="dashboard-chart-card">
        <div className="dashboard-chart-head">
          <h3>Status breakdown</h3>
          <p>Live vs draft tests</p>
        </div>
        <div className="dashboard-chart-body donut">
          <DonutChart data={statusData} />
          <ChartLegend data={statusData} />
        </div>
      </div>

      <div className="dashboard-chart-card">
        <div className="dashboard-chart-head">
          <h3>Tests by subject</h3>
          <p>Top subjects in your library</p>
        </div>
        <div className="dashboard-chart-body">
          <BarChart data={subjectData} />
        </div>
      </div>

      <div className="dashboard-chart-card">
        <div className="dashboard-chart-head">
          <h3>Created over time</h3>
          <p>Last 6 months</p>
        </div>
        <div className="dashboard-chart-body">
          <LineChart data={timelineData} />
        </div>
      </div>
    </div>
  )
}
