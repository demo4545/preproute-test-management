import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../components/ui/Breadcrumb'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import DatePickerInput from '../components/ui/DatePickerInput'
import QuestionSidebar from '../components/tests/QuestionSidebar'
import TestSummaryCard from '../components/tests/TestSummaryCard'
import QuestionPreviewList from '../components/tests/QuestionPreviewList'
import { IconCheck } from '../components/icons/Icons'
import {
  fetchQuestionsBulk,
  getTestById,
  updateTest,
} from '../api/services'
import { showError, showSuccess } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import PageLoader from '../components/ui/PageLoader'
import { addLiveUntil, combineDateAndTime, toApiDateTime } from '../utils/datetime'
import { toFullTestPutPayload } from '../utils/testPayload'
import type { Question, Test } from '../types'

const LIVE_OPTIONS = [
  { value: 'always', label: 'Always Available' },
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  { value: '3w', label: '3 Weeks' },
  { value: '1m', label: '1 Month' },
  { value: 'custom', label: 'Custom Duration' },
]

function isPublishedStatus(status: string | null | undefined) {
  const value = (status ?? '').toLowerCase()
  return value === 'live' || value === 'scheduled' || value === 'expired'
}

function publishedStatusLabel(status: string | null | undefined) {
  const value = (status ?? 'draft').toLowerCase()
  if (value === 'live') return 'Published'
  if (value === 'scheduled') return 'Scheduled'
  if (value === 'expired') return 'Expired'
  return 'Draft'
}

function publishedStatusTone(status: string | null | undefined) {
  const value = (status ?? '').toLowerCase()
  if (value === 'live') return 'green' as const
  if (value === 'scheduled') return 'blue' as const
  if (value === 'expired') return 'yellow' as const
  return 'gray' as const
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const savedPreviewQuestions = (
    location.state as { previewQuestions?: Question[] } | null
  )?.previewQuestions
  const [searchParams] = useSearchParams()
  const justPublished = searchParams.get('published') === '1'
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [liveUntil, setLiveUntil] = useState('always')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')

  const loadPreview = async () => {
    if (!id) return
    setLoading(true)
    try {
      const testData = await getTestById(id)
      setTest(testData)
      if (testData.questions.length > 0) {
        const qs = await fetchQuestionsBulk(testData.questions)
        setQuestions(
          savedPreviewQuestions?.length ? savedPreviewQuestions : qs
        )
      } else {
        setQuestions(savedPreviewQuestions ?? [])
      }
    } catch (error) {
      showError(getApiErrorMessage(error, 'Failed to load test preview.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPreview()
  }, [id])

  const handlePublish = async () => {
    if (!id || !test) return

    let startAt: Date
    if (mode === 'schedule') {
      const scheduledAt = combineDateAndTime(scheduleDate, scheduleTime)
      if (!scheduledAt) {
        showError('Please select schedule date and time.')
        return
      }
      if (scheduledAt.getTime() <= Date.now()) {
        showError('Schedule date and time must be in the future.')
        return
      }
      startAt = scheduledAt
    } else {
      startAt = new Date()
    }

    let expiryAt: Date | null = null
    if (liveUntil === 'custom') {
      expiryAt = combineDateAndTime(endDate, endTime)
      if (!expiryAt) {
        showError('Please select custom end date and time.')
        return
      }
    } else {
      expiryAt = addLiveUntil(startAt, liveUntil)
    }

    if (expiryAt && expiryAt.getTime() <= startAt.getTime()) {
      showError('Live Until must be after the publish time.')
      return
    }

    setPublishing(true)
    try {
      const extra: Record<string, unknown> = {
        status: mode === 'schedule' ? 'scheduled' : 'live',
        questions: test.questions || questions.map((q) => q.id).filter(Boolean),
      }
      if (mode === 'schedule') extra.scheduled_date = toApiDateTime(startAt)
      if (expiryAt) extra.expiry_date = toApiDateTime(expiryAt)

      const payload = await toFullTestPutPayload(test, extra)
      const result = await updateTest(test.id, payload)
      showSuccess(
        result.message ||
          (mode === 'now' ? 'Test published successfully!' : 'Test scheduled successfully!')
      )
      navigate(`/tests/${test.id}/preview?published=1`, { replace: true })
      await loadPreview()
      setPublishing(false)
    } catch (error) {
      showError(getApiErrorMessage(error, 'Failed to publish test.'))
      setPublishing(false)
    }
  }

  if (loading || !test) {
    return <PageLoader label="Loading preview" />
  }

  const allDone =
    questions.length > 0 && questions.length >= (test.total_questions || questions.length)
  const isPublished = isPublishedStatus(test.status)
  const showPublishPanel = !isPublished

  return (
    <div className="questions-layout">
      <QuestionSidebar
        totalQuestions={test.total_questions || questions.length}
        currentIndex={0}
        questionsCount={questions.length}
        onSelect={() => navigate(`/tests/${id}/questions`)}
      />

      <div className="questions-main">
        <div className="questions-top">
          <Breadcrumb items={[{ label: 'Test creation' }, { label: 'Preview' }]} />
        </div>

        <div className="publish-status">
          <div className="publish-status-row">
            <span>{isPublished ? 'Test status' : 'Test created'}</span>
            <Badge tone={isPublished ? publishedStatusTone(test.status) : 'green'}>
              <div className="q-check done">
                <IconCheck />
              </div>
              {isPublished
                ? `${publishedStatusLabel(test.status)} · ${questions.length} question(s)`
                : allDone
                  ? `All ${questions.length} Questions done.`
                  : `${questions.length} Questions added.`}
            </Badge>
          </div>
          {justPublished && test.status === 'live' ? (
            <p className="publish-success-note">
              Your test is now live. Review the published output below.
            </p>
          ) : null}
        </div>

        <TestSummaryCard
          test={test}
          onEdit={
            showPublishPanel ? () => navigate(`/tests/${id}/edit`) : undefined
          }
        />

        <QuestionPreviewList
          questions={questions}
          title={isPublished ? 'Published test output' : 'Preview all questions'}
        />

        {showPublishPanel ? (
          <div className="card-panel publish-panel">
            <div className="publish-mode">
              <button
                type="button"
                className={`publish-mode-btn${mode === 'now' ? ' active' : ''}`}
                onClick={() => setMode('now')}
              >
                Publish Now
              </button>
              <button
                type="button"
                className={`publish-mode-btn${mode === 'schedule' ? ' active' : ''}`}
                onClick={() => setMode('schedule')}
              >
                Schedule Publish
              </button>
            </div>

            {mode === 'schedule' && (
              <div className="ui-field" style={{ marginBottom: 24 }}>
                <label>Select Date and Time</label>
                <div className="form-two-col">
                  <DatePickerInput
                    value={scheduleDate}
                    onChange={setScheduleDate}
                    placeholder="Select Date"
                  />
                  <input
                    type="time"
                    className="ui-input"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="live-until">
              <h3>Live Until</h3>
              <p>Choose how long this test should remain available on the platform.</p>
              <div className="live-until-grid">
                {LIVE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="ui-radio">
                    <input
                      type="radio"
                      name="liveUntil"
                      checked={liveUntil === opt.value}
                      onChange={() => setLiveUntil(opt.value)}
                    />
                    <span className="ui-radio-mark" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {liveUntil === 'custom' && (
                <div className="form-two-col" style={{ marginTop: 20 }}>
                  <DatePickerInput
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="Select End Date"
                  />
                  <input
                    type="time"
                    className="ui-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="page-actions">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/tests/${id}/questions`)}
                disabled={publishing}
              >
                Back to questions
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="ui-btn-publish"
                onClick={handlePublish}
                disabled={publishing || questions.length === 0}
              >
                {publishing ? 'Confirming...' : 'Confirm'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="page-actions">
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </Button>
            {test.status === 'live' || test.status === 'scheduled' ? (
              <Button variant="primary" onClick={() => navigate(`/tests/${id}/questions`)}>
                View questions
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
