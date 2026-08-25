import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../components/ui/Breadcrumb'
import Button from '../components/ui/Button'
import ConfirmModal from '../components/ui/ConfirmModal'
import Select from '../components/ui/Select'
import RichTextEditor from '../components/ui/RichTextEditor'
import QuestionSidebar from '../components/tests/QuestionSidebar'
import TestSummaryCard from '../components/tests/TestSummaryCard'
import EditTestModal from '../components/tests/EditTestModal'
import {
  toCreatePayload,
  type TestFormValues,
} from '../components/tests/TestFormFields'
import { IconChevronLeft, IconChevronRight, IconTrash } from '../components/icons/Icons'
import {
  bulkCreateQuestions,
  fetchQuestionsBulk,
  getSubjects,
  getSubTopicsByTopics,
  getTestById,
  getTopicsBySubject,
  updateTest,
} from '../api/services'
import { showError, showSuccess } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { stripHtml } from '../helpers/string'
import { parseQuestionCsv } from '../utils/parseQuestionCsv'
import { buildQuestionPayload, resolveQuestionTopic } from '../utils/questionPayload'
import PageLoader from '../components/ui/PageLoader'
import { useAuthStore } from '../store/authStore'
import { resolveAuthUserId } from '../utils/authUser'
import type { SubTopic, Test, Topic } from '../types'

interface DraftQuestion {
  id?: string
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: 'option1' | 'option2' | 'option3' | 'option4' | ''
  explanation: string
  difficulty: string
  topic: string
  sub_topic: string
  media_url: string
}

type QuestionFieldKey =
  | 'question'
  | 'option1'
  | 'option2'
  | 'option3'
  | 'option4'
  | 'correct_option'
  | 'topic'
  | 'sub_topic'

type QuestionFieldErrors = Partial<Record<QuestionFieldKey, string>>

const emptyQuestion = (defaults?: { topic?: string; sub_topic?: string }): DraftQuestion => ({
  question: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correct_option: '',
  explanation: '',
  difficulty: 'easy',
  topic: defaults?.topic ?? '',
  sub_topic: defaults?.sub_topic ?? '',
  media_url: '',
})

function topicNameForSubTopic(
  subTopicName: string,
  topics: Topic[],
  subTopics: SubTopic[]
): string | undefined {
  const sub = subTopics.find((s) => s.name === subTopicName)
  if (!sub) return undefined
  return topics.find((t) => t.id === sub.topic_id)?.name
}

function subTopicsForTopic(
  topicName: string,
  selectedSubTopics: string[],
  topics: Topic[],
  subTopics: SubTopic[]
): string[] {
  const topic = topics.find((t) => t.name === topicName)
  if (!topic) return []
  return selectedSubTopics.filter((name) =>
    subTopics.some((s) => s.name === name && s.topic_id === topic.id)
  )
}

function defaultTopicSubTopic(
  selectedTopics: string[],
  selectedSubTopics: string[],
  topics: Topic[],
  subTopics: SubTopic[]
): { topic: string; sub_topic: string } {
  for (const subName of selectedSubTopics) {
    const parent = topicNameForSubTopic(subName, topics, subTopics)
    if (parent && selectedTopics.includes(parent)) {
      return { topic: parent, sub_topic: subName }
    }
  }
  return {
    topic: selectedTopics[0] ?? '',
    sub_topic: selectedSubTopics[0] ?? '',
  }
}

/** Any content that means the user started this question (solution counts; difficulty does not). */
function isQuestionStarted(q: DraftQuestion): boolean {
  return Boolean(
    stripHtml(q.question) ||
      q.option1.trim() ||
      q.option2.trim() ||
      q.option3.trim() ||
      q.option4.trim() ||
      q.correct_option ||
      q.explanation.trim()
  )
}

function getRequiredErrors(q: DraftQuestion): QuestionFieldErrors {
  const errors: QuestionFieldErrors = {}
  if (!stripHtml(q.question)) errors.question = 'Question is required'
  if (!q.option1.trim()) errors.option1 = 'Option is required'
  if (!q.option2.trim()) errors.option2 = 'Option is required'
  if (!q.option3.trim()) errors.option3 = 'Option is required'
  if (!q.option4.trim()) errors.option4 = 'Option is required'
  if (!q.correct_option) errors.correct_option = 'Select the correct option'
  if (!q.topic) errors.topic = 'Topic is required'
  if (!q.sub_topic) errors.sub_topic = 'Sub-topic is required'
  return errors
}

function isQuestionComplete(q: DraftQuestion): boolean {
  return Object.keys(getRequiredErrors(q)).length === 0
}

function pruneQuestionErrors(
  q: DraftQuestion,
  current: QuestionFieldErrors | undefined
): QuestionFieldErrors | undefined {
  if (!current || Object.keys(current).length === 0) return undefined
  if (!isQuestionStarted(q)) return undefined
  const stillInvalid = getRequiredErrors(q)
  const next: QuestionFieldErrors = {}
  ;(Object.keys(current) as QuestionFieldKey[]).forEach((key) => {
    if (stillInvalid[key]) next[key] = stillInvalid[key]
  })
  return Object.keys(next).length > 0 ? next : undefined
}

export default function QuestionsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const authUserId = resolveAuthUserId(user, token)
  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editValues, setEditValues] = useState<TestFormValues | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<number, QuestionFieldErrors>>({})
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [topicCatalog, setTopicCatalog] = useState<Topic[]>([])
  const [subTopicCatalog, setSubTopicCatalog] = useState<SubTopic[]>([])
  const csvInputRef = useRef<HTMLInputElement>(null)

  const current = questions[currentIndex] ?? emptyQuestion()
  const currentErrors = fieldErrors[currentIndex] || {}
  const totalTarget = test?.total_questions || questions.length

  const loadTest = async () => {
    if (!id) return
    setLoading(true)
    try {
      const testData = await getTestById(id)
      setTest(testData)

      const subjects = await getSubjects()
      const matchedSubject = subjects.find(
        (s) => s.name === testData.subject || s.id === testData.subject
      )
      const topics = matchedSubject ? await getTopicsBySubject(matchedSubject.id) : []
      const topicIds = topics
        .filter((t) => testData.topics.includes(t.name) || testData.topics.includes(t.id))
        .map((t) => t.id)
      const subs = topicIds.length ? await getSubTopicsByTopics(topicIds) : []
      const subIds = subs
        .filter((s) => testData.sub_topics.includes(s.name) || testData.sub_topics.includes(s.id))
        .map((s) => s.id)
      const defaults = defaultTopicSubTopic(
        testData.topics || [],
        testData.sub_topics || [],
        topics,
        subs
      )

      setTopicCatalog(topics)
      setSubTopicCatalog(subs)

      if (testData.questions.length > 0) {
        const existing = await fetchQuestionsBulk(testData.questions)
        setQuestions(
          existing.map((q) => ({
            id: q.id,
            question: q.question,
            option1: q.option1,
            option2: q.option2,
            option3: q.option3,
            option4: q.option4,
            correct_option: (q.correct_option as DraftQuestion['correct_option']) || '',
            explanation: q.explanation || '',
            difficulty: q.difficulty || 'easy',
            topic: q.topic || defaults.topic,
            sub_topic: q.sub_topic || defaults.sub_topic,
            media_url: q.media_url || '',
          }))
        )
      } else {
        setQuestions([emptyQuestion(defaults)])
      }

      setEditValues({
        name: testData.name,
        type: testData.type || 'chapterwise',
        subjectId: matchedSubject?.id ?? '',
        topicIds,
        subTopicIds: subIds,
        difficulty: testData.difficulty || 'easy',
        correct_marks: testData.correct_marks,
        wrong_marks: testData.wrong_marks ?? 0,
        unattempt_marks: testData.unattempt_marks,
        total_time: testData.total_time,
        total_marks: testData.total_marks,
        total_questions: testData.total_questions,
      })
    } catch (error) {
      showError(getApiErrorMessage(error, 'Failed to load test.'))
    } finally {
      setLoading(false)
      setFieldErrors({})
    }
  }

  useEffect(() => {
    loadTest()
  }, [id])

  const filledCount = useMemo(
    () => questions.filter((q) => isQuestionComplete(q)).length,
    [questions]
  )

  const draftDefaults = useMemo(
    () =>
      defaultTopicSubTopic(
        test?.topics || [],
        test?.sub_topics || [],
        topicCatalog,
        subTopicCatalog
      ),
    [test?.topics, test?.sub_topics, topicCatalog, subTopicCatalog]
  )

  const currentSubTopicOptions = useMemo(
    () =>
      subTopicsForTopic(
        current.topic,
        test?.sub_topics || [],
        topicCatalog,
        subTopicCatalog
      ),
    [current.topic, test?.sub_topics, topicCatalog, subTopicCatalog]
  )

  const updateCurrent = (patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => {
      const next = prev.map((q, i) => (i === currentIndex ? { ...q, ...patch } : q))
      const updated = next[currentIndex]
      setFieldErrors((errs) => {
        const pruned = pruneQuestionErrors(updated, errs[currentIndex])
        if (!pruned) {
          if (!errs[currentIndex]) return errs
          const { [currentIndex]: _, ...rest } = errs
          return rest
        }
        return { ...errs, [currentIndex]: pruned }
      })
      return next
    })
  }

  const ensureSlot = (index: number) => {
    const maxIndex = Math.max(totalTarget - 1, 0)
    const safeIndex = Math.min(Math.max(index, 0), maxIndex)
    setQuestions((prev) => {
      if (safeIndex < prev.length) return prev
      const next = [...prev]
      while (next.length <= safeIndex && next.length < totalTarget) {
        next.push(emptyQuestion(draftDefaults))
      }
      return next
    })
    setCurrentIndex(safeIndex)
  }

  const handleCsvUpload = async (file: File) => {
    if (!test) return

    try {
      const text = await file.text()
      const { rows, errors } = parseQuestionCsv(text, {
        defaultDifficulty: test.difficulty || 'easy',
        defaultTopic: draftDefaults.topic,
        defaultSubTopic: draftDefaults.sub_topic,
        allowedTopics: test.topics || [],
        allowedSubTopics: test.sub_topics || [],
      })

      if (rows.length === 0) {
        showError(errors[0] || 'No valid rows found in CSV.')
        return
      }

      const imported: DraftQuestion[] = rows.map((row) => ({
        question: row.question,
        option1: row.option1,
        option2: row.option2,
        option3: row.option3,
        option4: row.option4,
        correct_option: row.correct_option,
        explanation: row.explanation,
        difficulty: row.difficulty,
        topic: row.topic,
        sub_topic: row.sub_topic,
        media_url: row.media_url,
      }))

      setQuestions((prev) => {
        const onlyEmptyDraft =
          prev.length === 1 && !isQuestionStarted(prev[0])
        const base = onlyEmptyDraft ? [] : prev.filter((q) => isQuestionStarted(q))
        const merged = [...base, ...imported].slice(0, totalTarget)
        const next = merged.length > 0 ? merged : [emptyQuestion(draftDefaults)]
        setCurrentIndex(Math.min(base.length, Math.max(next.length - 1, 0)))
        return next
      })
      setFieldErrors({})

      const skipped = imported.length - Math.min(imported.length, totalTarget)
      const message =
        skipped > 0
          ? `Imported ${Math.min(imported.length, totalTarget)} question(s). ${skipped} row(s) skipped (test limit: ${totalTarget}).`
          : `Imported ${imported.length} question(s) from CSV.`

      if (errors.length > 0) {
        showSuccess(`${message} ${errors.length} row(s) had validation warnings.`)
      } else {
        showSuccess(message)
      }
    } catch {
      showError('Failed to read CSV file.')
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = ''
    }
  }

  const addMcq = () => {
    if (questions.length >= totalTarget) {
      showError(`You can add at most ${totalTarget} questions for this test.`)
      return
    }
    setQuestions((prev) => [...prev, emptyQuestion(draftDefaults)])
    setCurrentIndex(questions.length)
  }

  const handleDeleteAllQuestions = () => {
    setQuestions([emptyQuestion(draftDefaults)])
    setCurrentIndex(0)
    setFieldErrors({})
    setClearConfirmOpen(false)
  }

  const validateQuestions = (): { complete: DraftQuestion[]; ok: boolean } => {
    const nextErrors: Record<number, QuestionFieldErrors> = {}
    let firstErrorIndex = -1

    questions.forEach((q, index) => {
      if (!isQuestionStarted(q)) return
      const errs = getRequiredErrors(q)
      if (Object.keys(errs).length === 0) return
      nextErrors[index] = errs
      if (firstErrorIndex < 0) firstErrorIndex = index
    })

    const complete = questions.filter((q) => isQuestionComplete(q))

    if (complete.length < 1 && Object.keys(nextErrors).length === 0) {
      nextErrors[0] = getRequiredErrors(questions[0] ?? emptyQuestion())
      firstErrorIndex = 0
    }

    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      if (firstErrorIndex >= 0) setCurrentIndex(firstErrorIndex)
      return { complete, ok: false }
    }

    return { complete, ok: true }
  }

  const handleSaveContinue = async (goPreview: boolean) => {
    if (!id || !test) return

    const { complete, ok } = validateQuestions()
    if (!ok) return

    setSaving(true)
    try {
      const payloadFor = (q: DraftQuestion) => {
        const allowed = subTopicsForTopic(
          q.topic,
          test.sub_topics || [],
          topicCatalog,
          subTopicCatalog
        )
        const topic = resolveQuestionTopic(
          q,
          allowed,
          draftDefaults.topic,
          (subName) => topicNameForSubTopic(subName, topicCatalog, subTopicCatalog)
        )
        return buildQuestionPayload(q, {
          testId: test.id,
          subject: test.subject,
          topic,
          subTopic: q.sub_topic || draftDefaults.sub_topic,
        })
      }

      const payloads = complete.map((q) => payloadFor(q))
      const created = await bulkCreateQuestions(payloads)
      const allIds = created.data.map((q) => q.id!).filter(Boolean)
      const previewQuestions = created.data
      const bulkMessage = created.message

      const metadata = editValues
        ? toCreatePayload(editValues)
        : {
            name: test.name,
            type: test.type,
            subject: test.subject,
            topics: test.topics,
            sub_topics: test.sub_topics,
            correct_marks: test.correct_marks,
            wrong_marks: test.wrong_marks ?? 0,
            unattempt_marks: test.unattempt_marks,
            difficulty: test.difficulty,
            total_time: test.total_time,
            total_marks: test.total_marks,
            total_questions: test.total_questions,
          }

      const updated = await updateTest(test.id, {
        ...metadata,
        questions: allIds,
      })

      showSuccess(
        bulkMessage || updated.message || 'Questions saved successfully'
      )
      if (goPreview) {
        navigate(`/tests/${updated.data.id || test.id}/preview`, {
          state: { previewQuestions },
        })
      } else {
        await loadTest()
        setSaving(false)
      }
    } catch (error) {
      showError(getApiErrorMessage(error, 'Failed to save questions.'))
      setSaving(false)
    }
  }

  if (loading || !test) {
    return <PageLoader label="Loading questions" />
  }

  return (
    <div className="questions-layout">
      <QuestionSidebar
        totalQuestions={totalTarget}
        currentIndex={currentIndex}
        questionsCount={Math.max(questions.length, filledCount)}
        onSelect={ensureSlot}
      />

      <div className="questions-main">
        <div className="questions-top">
          <Breadcrumb
            items={[
              { label: 'Test Creation', to: '/tests/new' },
              { label: 'Create Test' },
              { label: 'Chapter Wise' },
            ]}
          />
          {test.status !== 'live' ? (
            <Button
              variant="primary"
              className="ui-btn-publish"
              onClick={() => handleSaveContinue(true)}
              disabled={saving}
            >
              Publish
            </Button>
          ) : null}
        </div>

        <TestSummaryCard
          test={test}
          onEdit={
            authUserId && test.created_by != null && String(test.created_by) === String(authUserId)
              ? () => setEditOpen(true)
              : undefined
          }
        />

        <div className="question-editor card-panel">
          <div className="question-editor-head">
            <h3>
              Question {currentIndex + 1} {" "}
              <span className="question-editor-head-divider">
                / {totalTarget || questions.length}
              </span>
            </h3>
            <div className="question-editor-actions-container">
              <div className="question-editor-actions">
                <Button variant="soft" onClick={addMcq} disabled={questions.length >= totalTarget}>
                  + MCQ
                </Button>
                <Button
                  variant="soft"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={questions.length >= totalTarget}
                >
                  + CSV
                </Button>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleCsvUpload(file)
                  }}
                />
              </div>
            </div>
          </div>

          <button type="button" className="link-danger" onClick={() => setClearConfirmOpen(true)}>
            <IconTrash /> Delete All Edits
          </button>

          <div className="ui-field">
            <RichTextEditor
              key={currentIndex}
              value={current.question}
              onChange={(value) => updateCurrent({ question: value })}
              placeholder="Type here"
              onClear={() => updateCurrent({ question: '' })}
            />
            {currentErrors.question ? (
              <span className="ui-field-error">{currentErrors.question}</span>
            ) : null}
          </div>

          <div className="ui-field" style={{ marginTop: '20px' }}>
            <h5>Question image URL (optional)</h5>
            <input
              className="ui-input"
              placeholder="https://example.com/image.png"
              value={current.media_url}
              onChange={(e) => updateCurrent({ media_url: e.target.value })}
            />
            {current.media_url ? (
              <div className="question-media-preview">
                <img src={current.media_url} alt="Question preview" />
              </div>
            ) : null}
          </div>

          <div className="options-block">
            <h4>Type the options below</h4>
            {(['option1', 'option2', 'option3', 'option4'] as const).map((key) => (
              <div key={key} className="option-row-wrap">
                <label className="option-row">
                  <span className="option-row-radio">
                    <input
                      type="radio"
                      name={`correct-${currentIndex}`}
                      checked={current.correct_option === key}
                      onClick={(e) => {
                        if (current.correct_option === key) {
                          e.preventDefault()
                          updateCurrent({ correct_option: '' })
                        }
                      }}
                      onChange={() => updateCurrent({ correct_option: key })}
                    />
                    <span className="ui-radio-mark" />
                  </span>
                  <span className="option-row-input-wrap">
                    <input
                      className="ui-input"
                      placeholder="Type Option here"
                      value={current[key]}
                      onChange={(e) => updateCurrent({ [key]: e.target.value })}
                    />
                    <button
                      type="button"
                      className="option-row-clear"
                      aria-label="Clear option"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        updateCurrent({ [key]: '' })
                      }}
                    >
                      <IconTrash />
                    </button>
                  </span>
                </label>
                {currentErrors[key] ? (
                  <span className="ui-field-error">{currentErrors[key]}</span>
                ) : null}
              </div>
            ))}
            {currentErrors.correct_option ? (
              <span className="ui-field-error">{currentErrors.correct_option}</span>
            ) : null}
          </div>

          <div className="ui-field">
            <label>Add Solution</label>
            <div className="solution-textarea-wrap">
              <textarea
                className="ui-textarea solution-textarea"
                placeholder="Type here"
                rows={5}
                value={current.explanation}
                onChange={(e) => updateCurrent({ explanation: e.target.value })}
              />
              <button
                type="button"
                className="solution-textarea-clear"
                aria-label="Clear solution"
                onClick={() => updateCurrent({ explanation: '' })}
              >
                <IconTrash />
              </button>
            </div>
          </div>

          {questions.length > 1 ? (
            <div className="question-nav">
              <button
                type="button"
                className="ui-icon-btn"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                <IconChevronLeft />
              </button>
              <button
                type="button"
                className="ui-icon-btn"
                disabled={currentIndex >= questions.length - 1}
                onClick={() =>
                  setCurrentIndex((i) => Math.min(i + 1, Math.max(questions.length - 1, 0)))
                }
              >
                <IconChevronRight />
              </button>
            </div>
          ) : null}
        </div>

        <div className="card-panel">
          <h3 className="section-title">Question settings</h3>
          <div className="form-stack">
            <Select
              label="Level of Difficulty"
              value={current.difficulty}
              onChange={(e) => updateCurrent({ difficulty: e.target.value })}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Difficult' },
              ]}
              placeholder="Select from Drop-down"
            />
            <Select
              label="Topic"
              value={current.topic}
              onChange={(e) => {
                const topic = e.target.value
                const allowed = subTopicsForTopic(
                  topic,
                  test.sub_topics || [],
                  topicCatalog,
                  subTopicCatalog
                )
                updateCurrent({
                  topic,
                  sub_topic: allowed.includes(current.sub_topic)
                    ? current.sub_topic
                    : allowed[0] ?? '',
                })
              }}
              options={(test.topics || []).map((t) => ({ value: t, label: t }))}
              placeholder="Select from Drop-down"
              error={currentErrors.topic}
            />
            <Select
              label="Sub-topic"
              value={current.sub_topic}
              onChange={(e) => updateCurrent({ sub_topic: e.target.value })}
              options={currentSubTopicOptions.map((t) => ({ value: t, label: t }))}
              placeholder="Select from Drop-down"
              error={currentErrors.sub_topic}
            />
          </div>
        </div>

        <div className="page-actions between">
          <Button
            variant="danger"
            className="ui-btn-exit"
            onClick={() => navigate('/dashboard')}
            disabled={saving}
          >
            Exit Test Creation
          </Button>
          <Button
            variant="primary"
            className="ui-btn-publish"
            onClick={() => handleSaveContinue(true)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Next'}
          </Button>
        </div>
      </div>

      {editValues && (
        <EditTestModal
          open={editOpen}
          testId={test.id}
          initialValues={editValues}
          onClose={() => setEditOpen(false)}
          questionIds={test.questions || []}
          onSaved={loadTest}
        />
      )}

      <ConfirmModal
        open={clearConfirmOpen}
        title="Delete all questions?"
        message="This will remove all questions and edits for this test. This action cannot be undone until you add questions again."
        onClose={() => setClearConfirmOpen(false)}
        onConfirm={handleDeleteAllQuestions}
        confirmLabel="Delete"
      />
    </div>
  )
}
