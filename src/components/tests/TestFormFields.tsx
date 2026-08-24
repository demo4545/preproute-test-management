import Tabs from '../ui/Tabs'
import Input from '../ui/Input'
import Select from '../ui/Select'
import MultiSelect from '../ui/MultiSelect'
import RadioGroup from '../ui/RadioGroup'
import NumberStepper from '../ui/NumberStepper'
import type { Subject, SubTopic, Topic, CreateTestPayload, UpdateTestPayload } from '../../types'

export const TEST_TYPE_TABS = [
  { value: 'chapterwise', label: 'Chapterwise' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'mock', label: 'Mock Test' },
]

export const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Difficult' },
]

export interface TestFormValues {
  name: string
  type: string
  subjectId: string
  topicIds: string[]
  subTopicIds: string[]
  difficulty: string
  correct_marks: number
  wrong_marks: number
  unattempt_marks: number
  total_time: number | ''
  total_marks: number | ''
  total_questions: number | ''
}

interface TestFormFieldsProps {
  values: TestFormValues
  subjects: Subject[]
  topics: Topic[]
  subTopics: SubTopic[]
  errors?: Partial<Record<keyof TestFormValues, string>>
  onChange: <K extends keyof TestFormValues>(key: K, value: TestFormValues[K]) => void
  showTypeTabs?: boolean
}

export default function TestFormFields({
  values,
  subjects,
  topics,
  subTopics,
  errors = {},
  onChange,
  showTypeTabs = true,
}: TestFormFieldsProps) {
  return (
    <div className="test-form-fields">
      {showTypeTabs && (
        <Tabs
          items={TEST_TYPE_TABS}
          value={values.type}
          onChange={(type) => onChange('type', type)}
        />
      )}

      <div className="form-two-col">
        <Select
          label="Subject"
          value={values.subjectId}
          onChange={(e) => onChange('subjectId', e.target.value)}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.subjectId}
        />
        <Input
          label="Name of Test"
          placeholder="Enter name of Test"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          error={errors.name}
        />

        <MultiSelect
          label="Topic"
          value={values.topicIds}
          onChange={(topicIds) => onChange('topicIds', topicIds)}
          options={topics.map((t) => ({ value: t.id, label: t.name }))}
          error={errors.topicIds}
          placeholder="Choose from Drop-down"
        />
        <MultiSelect
          label="Sub Topic"
          value={values.subTopicIds}
          onChange={(subTopicIds) => onChange('subTopicIds', subTopicIds)}
          options={subTopics.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.subTopicIds}
          placeholder="Choose from Drop-down"
        />

        <Input
          label="Duration (Minutes)"
          placeholder="Enter the time"
          type="number"
          value={values.total_time}
          onChange={(e) =>
            onChange('total_time', e.target.value === '' ? '' : Number(e.target.value))
          }
          error={errors.total_time}
        />
        <RadioGroup
          label="Test Difficulty Level"
          name="difficulty"
          value={values.difficulty}
          options={DIFFICULTY_OPTIONS}
          onChange={(difficulty) => onChange('difficulty', difficulty)}
        />
      </div>

      <div className="marking-block">
        <h3>Marking Scheme:</h3>
        <div className="marking-row">
          <NumberStepper
            label="Wrong Answer"
            value={values.wrong_marks}
            onChange={(v) => onChange('wrong_marks', v)}
          />
          <NumberStepper
            label="Unattempted"
            value={values.unattempt_marks}
            onChange={(v) => onChange('unattempt_marks', v)}
          />
          <NumberStepper
            label="Correct Answer"
            value={values.correct_marks}
            onChange={(v) => onChange('correct_marks', v)}
          />
          <Input
            label="No of Questions"
            placeholder="Ex: 250 Marks"
            type="number"
            value={values.total_questions}
            onChange={(e) =>
              onChange('total_questions', e.target.value === '' ? '' : Number(e.target.value))
            }
            error={errors.total_questions}
          />
          <Input
            label="Total Marks"
            placeholder="Ex: 250 Marks"
            type="number"
            value={values.total_marks}
            onChange={(e) =>
              onChange('total_marks', e.target.value === '' ? '' : Number(e.target.value))
            }
            error={errors.total_marks}
          />
        </div>
      </div>
    </div>
  )
}

export function validateTestForm(values: TestFormValues) {
  const errors: Partial<Record<keyof TestFormValues, string>> = {}
  if (!values.name.trim()) errors.name = 'Test name is required'
  if (!values.subjectId) errors.subjectId = 'Subject is required'
  if (values.topicIds.length === 0) errors.topicIds = 'Topic is required'
  if (values.total_time === '' || Number(values.total_time) < 1) {
    errors.total_time = 'Duration is required'
  }
  if (values.total_questions === '' || Number(values.total_questions) < 1) {
    errors.total_questions = 'No of questions is required'
  }
  if (values.total_marks === '' || Number(values.total_marks) < 1) {
    errors.total_marks = 'Total marks is required'
  }
  return errors
}

/** Keep only errors that still fail validation for the latest values. */
export function pruneResolvedErrors(
  values: TestFormValues,
  currentErrors: Partial<Record<keyof TestFormValues, string>>
) {
  if (Object.keys(currentErrors).length === 0) return currentErrors
  const stillInvalid = validateTestForm(values)
  const next: Partial<Record<keyof TestFormValues, string>> = {}
  ;(Object.keys(currentErrors) as (keyof TestFormValues)[]).forEach((key) => {
    if (stillInvalid[key]) next[key] = stillInvalid[key]
  })
  return next
}

export function toCreatePayload(values: TestFormValues, status: string): CreateTestPayload
export function toCreatePayload(values: TestFormValues): UpdateTestPayload
export function toCreatePayload(
  values: TestFormValues,
  status?: string
): CreateTestPayload | UpdateTestPayload {
  const payload = {
    name: values.name.trim(),
    type: values.type,
    subject: values.subjectId,
    topics: values.topicIds,
    sub_topics: values.subTopicIds,
    correct_marks: values.correct_marks,
    wrong_marks: values.wrong_marks,
    unattempt_marks: values.unattempt_marks,
    difficulty: values.difficulty,
    total_time: Number(values.total_time),
    total_marks: Number(values.total_marks),
    total_questions: Number(values.total_questions),
  }
  if (status !== undefined) {
    return { ...payload, status }
  }
  return payload
}

export const defaultTestFormValues: TestFormValues = {
  name: '',
  type: 'chapterwise',
  subjectId: '',
  topicIds: [],
  subTopicIds: [],
  difficulty: 'easy',
  correct_marks: 0,
  wrong_marks: 0,
  unattempt_marks: 0,
  total_time: '',
  total_marks: '',
  total_questions: '',
}
