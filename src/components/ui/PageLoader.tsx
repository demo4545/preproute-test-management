interface PageLoaderProps {
  /** Accessible label only; not shown as visible text */
  label?: string
  compact?: boolean
}

export default function PageLoader({ label = 'Loading', compact = false }: PageLoaderProps) {
  return (
    <div
      className={`page-loader${compact ? ' page-loader-compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="page-loader-ring" aria-hidden>
        <span />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-wrap" role="status" aria-label="Loading tests">
      <table className="tests-table tests-table-skeleton">
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Questions</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i}>
              <td>
                <span className="skeleton-block skeleton-lg" />
              </td>
              <td>
                <span className="skeleton-block skeleton-md" />
              </td>
              <td>
                <span className="skeleton-block skeleton-pill" />
              </td>
              <td>
                <span className="skeleton-block skeleton-sm" />
              </td>
              <td>
                <span className="skeleton-block skeleton-md" />
              </td>
              <td>
                <div className="table-actions table-actions-skeleton">
                  <span className="skeleton-block skeleton-btn" />
                  <span className="skeleton-block skeleton-btn" />
                  <span className="skeleton-block skeleton-btn" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
