import { IconChevronsLeft, IconChevronsRight } from '../icons/Icons'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="pagination">
      <p className="pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong>
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onChange(1)}
          aria-label="Go to first page"
        >
          <IconChevronsLeft />
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>
        <span className="pagination-page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
        <button
          type="button"
          className="pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onChange(totalPages)}
          aria-label="Go to last page"
        >
          <IconChevronsRight />
        </button>
      </div>
    </div>
  )
}
