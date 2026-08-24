import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Breadcrumb from '../components/ui/Breadcrumb'
import Button from '../components/ui/Button'
import TestFormFields, {
  defaultTestFormValues,
  pruneResolvedErrors,
  toCreatePayload,
  validateTestForm,
  type TestFormValues,
} from '../components/tests/TestFormFields'
import {
  createTest,
  getSubjects,
  getSubTopicsByTopics,
  getTestById,
  getTopicsBySubject,
  updateTest,
} from '../api/services'
import { showError, showSuccess } from '../utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import PageLoader from '../components/ui/PageLoader'
import type { Subject, SubTopic, Topic } from '../types'

export default function TestFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [values, setValues] = useState<TestFormValues>(defaultTestFormValues)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof TestFormValues, string>>>({})
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const skipSubjectReset = useRef(false)
  const skipTopicReset = useRef(false)
  const [questionIds, setQuestionIds] = useState<string[]>([])

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => showError('Failed to load subjects.'))
  }, [])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const test = await getTestById(id)
        const subjectList = await getSubjects()
        setSubjects(subjectList)
        const matchedSubject = subjectList.find(
          (s) => s.name === test.subject || s.id === test.subject
        )
        const subjectTopics = matchedSubject ? await getTopicsBySubject(matchedSubject.id) : []
        setTopics(subjectTopics)
        setQuestionIds(Array.isArray(test.questions) ? test.questions : [])
        const matchedTopicIds = subjectTopics
          .filter((t) => test.topics.includes(t.name) || test.topics.includes(t.id))
          .map((t) => t.id)

        let matchedSubTopicIds: string[] = []
        if (matchedTopicIds.length > 0) {
          const subs = await getSubTopicsByTopics(matchedTopicIds)
          setSubTopics(subs)
          matchedSubTopicIds = subs
            .filter((s) => test.sub_topics.includes(s.name) || test.sub_topics.includes(s.id))
            .map((s) => s.id)
        }

        skipSubjectReset.current = true
        skipTopicReset.current = true
        setValues({
          name: test.name,
          type: test.type || 'chapterwise',
          subjectId: matchedSubject?.id ?? '',
          topicIds: matchedTopicIds,
          subTopicIds: matchedSubTopicIds,
          difficulty: test.difficulty || 'easy',
          correct_marks: test.correct_marks,
          wrong_marks: test.wrong_marks ?? 0,
          unattempt_marks: test.unattempt_marks,
          total_time: test.total_time,
          total_marks: test.total_marks,
          total_questions: test.total_questions,
        })
      } catch {
        showError('Failed to load test.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!values.subjectId) {
      setTopics([])
      setSubTopics([])
      return
    }
    if (skipSubjectReset.current) {
      skipSubjectReset.current = false
      return
    }
    getTopicsBySubject(values.subjectId)
      .then((data) => {
        setTopics(data)
        setSubTopics([])
        setValues((prev) => {
          const next = { ...prev, topicIds: [], subTopicIds: [] }
          setErrors((errs) => pruneResolvedErrors(next, errs))
          return next
        })
      })
      .catch(() => showError('Failed to load topics.'))
  }, [values.subjectId])

  useEffect(() => {
    if (values.topicIds.length === 0) {
      setSubTopics([])
      return
    }
    if (skipTopicReset.current) {
      skipTopicReset.current = false
      return
    }
    getSubTopicsByTopics(values.topicIds)
      .then(setSubTopics)
      .catch(() => showError('Failed to load sub-topics.'))
  }, [values.topicIds])

  const onChange = <K extends keyof TestFormValues>(key: K, value: TestFormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      setErrors((errs) => pruneResolvedErrors(next, errs))
      return next
    })
  }

  const handleNext = async () => {
    const nextErrors = validateTestForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSaving(true)
    try {
      if (isEdit && id) {
        const result = await updateTest(id, {
          ...toCreatePayload(values),
          questions: questionIds,
        })
        showSuccess(result.message || 'Test updated')
        navigate(`/tests/${id}/questions`)
      } else {
        const result = await createTest(toCreatePayload(values, 'draft'))
        showSuccess(result.message || 'Test created')
        navigate(`/tests/${result.data.id}/questions`)
      }
    } catch (error) {
      showError(getApiErrorMessage(error, 'Failed to save test.'))
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading test" />
  }

  return (
    <div className="page-wrap test-creation-page">
      <Breadcrumb
        items={[
          { label: 'Test Creation', to: '/tests/new' },
          { label: isEdit ? 'Edit Test' : 'Create Test' },
          { label: 'Chapter Wise' },
        ]}
      />

      <TestFormFields
        values={values}
        subjects={subjects}
        topics={topics}
        subTopics={subTopics}
        errors={errors}
        onChange={onChange}
      />

      <div className="page-actions">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/dashboard')}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button variant="primary" size="lg" onClick={handleNext} disabled={saving}>
          {saving ? 'Saving...' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
