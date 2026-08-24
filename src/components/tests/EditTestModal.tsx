import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import TestFormFields, {
  defaultTestFormValues,
  pruneResolvedErrors,
  toCreatePayload,
  validateTestForm,
  type TestFormValues,
} from './TestFormFields'
import Modal from '../ui/Modal'
import {
  getSubjects,
  getSubTopicsByTopics,
  getTopicsBySubject,
  updateTest,
} from '../../api/services'
import { showError, showSuccess } from '../../utils/toast'
import type { Subject, SubTopic, Topic } from '../../types'

interface EditTestModalProps {
  open: boolean
  testId: string
  initialValues: TestFormValues
  questionIds?: string[]
  onClose: () => void
  onSaved: () => void
}

export default function EditTestModal({
  open,
  testId,
  initialValues,
  questionIds = [],
  onClose,
  onSaved,
}: EditTestModalProps) {
  const [values, setValues] = useState<TestFormValues>({
    ...initialValues,
    wrong_marks: initialValues.wrong_marks ?? 0,
  })
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subTopics, setSubTopics] = useState<SubTopic[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof TestFormValues, string>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues({
      ...initialValues,
      wrong_marks: initialValues.wrong_marks ?? 0,
    })
    getSubjects().then(setSubjects).catch(() => showError('Failed to load subjects.'))
  }, [open, initialValues])

  useEffect(() => {
    if (!values.subjectId) {
      setTopics([])
      return
    }
    getTopicsBySubject(values.subjectId)
      .then(setTopics)
      .catch(() => showError('Failed to load topics.'))
  }, [values.subjectId])

  useEffect(() => {
    if (values.topicIds.length === 0) {
      setSubTopics([])
      return
    }
    getSubTopicsByTopics(values.topicIds)
      .then(setSubTopics)
      .catch(() => showError('Failed to load sub-topics.'))
  }, [values.topicIds])

  const onChange = <K extends keyof TestFormValues>(key: K, value: TestFormValues[K]) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'subjectId') {
        next.topicIds = []
        next.subTopicIds = []
      }
      if (key === 'topicIds') {
        next.subTopicIds = []
      }
      setErrors((errs) => pruneResolvedErrors(next, errs))
      return next
    })
  }

  const handleSave = async () => {
    const nextErrors = validateTestForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const result = await updateTest(testId, {
        ...toCreatePayload(values),
        questions: questionIds,
      })
      showSuccess(result.message || 'Test updated successfully')
      onSaved()
      onClose()
    } catch {
      showError('Failed to update test.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Edit Test creation"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <TestFormFields
        values={values}
        subjects={subjects}
        topics={topics}
        subTopics={subTopics}
        errors={errors}
        onChange={onChange}
      />
    </Modal>
  )
}

export { defaultTestFormValues }
