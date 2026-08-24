import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteTest, getTests } from '../api/services'
import { showError, showSuccess } from '../utils/toast'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Pagination from '../components/ui/Pagination'
import { TableSkeleton } from '../components/ui/PageLoader'
import DashboardAnalytics from '../components/dashboard/DashboardAnalytics'
import { IconEdit, IconEye, IconTrash, IconChevronDown } from '../components/icons/Icons'
import { useAuthStore } from '../store/authStore'
import { resolveAuthUserId } from '../utils/authUser'
import type { Test } from '../types'

const PAGE_SIZE = 10

type StatusFilter = 'all' | 'live' | 'draft' | 'scheduled' | 'expired'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function isOwnTest(test: Test, authUserId: string | null) {
  if (!authUserId || test.created_by == null || test.created_by === '') return false
  return String(test.created_by) === String(authUserId)
}

function normalizedStatus(test: Test) {
  return (test.status ?? 'draft').toLowerCase()
}

function matchesStatus(test: Test, filter: StatusFilter) {
  const status = normalizedStatus(test)
  if (filter === 'all') return true
  if (filter === 'draft') return status === 'draft' || status === 'unpublished'
  return status === filter
}

function statusBadgeTone(status: string | null) {
  if (status === 'live') return 'green' as const
  if (status === 'scheduled') return 'blue' as const
  if (status === 'expired') return 'yellow' as const
  return 'gray' as const
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const authUserId = resolveAuthUserId(user, token)
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadTests = async () => {
    setLoading(true)
    try {
      const data = await getTests()
      setTests(data)
    } catch {
      showError('Failed to load tests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTests()
  }, [])

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tests.filter((test) => {
      if (!matchesStatus(test, statusFilter)) return false
      if (!query) return true
      return (
        test.name.toLowerCase().includes(query) ||
        test.subject.toLowerCase().includes(query) ||
        normalizedStatus(test).includes(query)
      )
    })
  }, [tests, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTests.length / PAGE_SIZE))
    if (page > totalPages) setPage(totalPages)
  }, [filteredTests.length, page])

  const pagedTests = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredTests.slice(start, start + PAGE_SIZE)
  }, [filteredTests, page])

  const stats = useMemo(() => {
    const total = tests.length
    const live = tests.filter((t) => t.status === 'live').length
    const draft = tests.filter(
      (t) => t.status === 'draft' || t.status === 'unpublished' || !t.status
    ).length
    return { total, live, draft }
  }, [tests])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteTest(deleteTarget.id)
      setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      showSuccess(result.message || 'Test deleted successfully')
      setDeleteTarget(null)
    } catch {
      showError('Failed to delete test.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-wrap dashboard-page">
      <div className="page-heading-row">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage and track all your tests</p>
        </div>
        <Link to="/tests/new">
          <Button variant="primary">Create New Test</Button>
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Tests</p>
          <h3>{loading ? '—' : stats.total}</h3>
        </div>
        <div className="stat-card">
          <p>Live</p>
          <h3>{loading ? '—' : stats.live}</h3>
        </div>
        <div className="stat-card">
          <p>Drafts</p>
          <h3>{loading ? '—' : stats.draft}</h3>
        </div>
      </div>

      {!loading && <DashboardAnalytics tests={tests} />}

      <div className="page-card dashboard-table-card">
        <div className="dashboard-toolbar">
          <div className="dashboard-toolbar-left">
            <h2 className="dashboard-table-title">All tests</h2>
            <span className="dashboard-table-count">
              {loading ? 'Loading…' : `${filteredTests.length} result${filteredTests.length === 1 ? '' : 's'}`}
            </span>
          </div>
          <div className="dashboard-toolbar-right">
            <div className="ui-select-wrap status-filter has-value">
              <select
                className="ui-input ui-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
              >
                <option value="all">All</option>
                <option value="live">Live</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
              </select>
              <span className="ui-select-chevron" aria-hidden>
                <IconChevronDown />
              </span>
            </div>
            <input
              type="search"
              className="ui-input search-input"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={PAGE_SIZE} />
        ) : filteredTests.length === 0 ? (
          <div className="empty-state">
            {tests.length === 0 ? (
              <>
                <p>No tests found.</p>
                <Link to="/tests/new">
                  <Button variant="primary">Create your first test</Button>
                </Link>
              </>
            ) : (
              <p>No tests match this filter.</p>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="tests-table">
                <thead>
                  <tr>
                    <th className="col-name">Test Name</th>
                    <th className="col-subject">Subject</th>
                    <th className="col-status">Status</th>
                    <th className="col-questions">Questions</th>
                    <th className="col-created">Created</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedTests.map((test) => (
                    <tr key={test.id}>
                      <td className="col-name">
                        <span className="test-name-cell">{test.name}</span>
                      </td>
                      <td className="col-subject">{test.subject}</td>
                      <td className="col-status">
                        <Badge tone={statusBadgeTone(test.status)}>
                          {test.status ?? 'draft'}
                        </Badge>
                      </td>
                      <td className="col-questions">{test.total_questions}</td>
                      <td className="col-created">{formatDate(test.created_at)}</td>
                      <td className="col-actions">
                        {isOwnTest(test, authUserId) ? (
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action-btn table-action-edit"
                              aria-label={`Edit ${test.name}`}
                              title="Edit"
                              onClick={() => navigate(`/tests/${test.id}/edit`)}
                            >
                              <IconEdit />
                            </button>
                            <button
                              type="button"
                              className="table-action-btn table-action-view"
                              aria-label={`View ${test.name}`}
                              title="View"
                              onClick={() => navigate(`/tests/${test.id}/questions`)}
                            >
                              <IconEye />
                            </button>
                            <button
                              type="button"
                              className="table-action-btn table-action-delete"
                              aria-label={`Delete ${test.name}`}
                              title="Delete"
                              onClick={() => setDeleteTarget({ id: test.id, name: test.name })}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={filteredTests.length}
              onChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete test?"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ''
        }
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
        confirming={deleting}
        confirmLabel="Delete"
      />
    </div>
  )
}
