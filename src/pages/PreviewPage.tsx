import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../components/ui/Breadcrumb'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import DatePickerInput from '../components/ui/DatePickerInput'
import QuestionSidebar from '../components/tests/QuestionSidebar'
import TestSummaryCard from '../components/tests/TestSummaryCard'
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

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const testData = await getTestById(id)
        setTest(testData)
        if (testData.questions.length > 0) {
          const qs = await fetchQuestionsBulk(testData.questions)
          setQuestions(qs)
        }
      } catch (error) {
        showError(getApiErrorMessage(error, 'Failed to load test preview.'))
      } finally {
        setLoading(false)
      }
    }
    load()
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
      setTimeout(() => navigate('/dashboard'), 1000)
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
          <Breadcrumb items={[{ label: 'Test creation' }]} />
        </div>

        <div className="publish-status">
          <div className="publish-status-row">
            <span>Test created</span>
            <Badge tone="green">
              <div className={`q-check done`}>
                <IconCheck /> 
              </div>
              {allDone ? `All ${questions.length} Questions done.` : `${questions.length} Questions added.`}
            </Badge>
          </div>
        </div>

        <TestSummaryCard
          test={test}
          onEdit={() => navigate(`/tests/${id}/edit`)}
        />

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
                  placeholder='Select Date'
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
              Cancel
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="ui-btn-publish"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'Confirming...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
