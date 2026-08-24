import {
  getSubjects,
  getSubTopicsByTopics,
  getTopicsBySubject,
} from '../api/services'
import type { Test } from '../types'

/** Staging PUT /tests/:id replaces the row. Partial bodies can drop the test. */
export async function toFullTestPutPayload(
  test: Test,
  extra: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const subjects = await getSubjects()
  const matchedSubject = subjects.find(
    (s) => s.name === test.subject || s.id === test.subject
  )
  const topics = matchedSubject ? await getTopicsBySubject(matchedSubject.id) : []
  const topicIds = topics
    .filter((t) => test.topics.includes(t.name) || test.topics.includes(t.id))
    .map((t) => t.id)
  const subs = topicIds.length ? await getSubTopicsByTopics(topicIds) : []
  const subIds = subs
    .filter((s) => test.sub_topics.includes(s.name) || test.sub_topics.includes(s.id))
    .map((s) => s.id)

  const payload: Record<string, unknown> = {
    name: test.name,
    type: test.type,
    subject: matchedSubject?.id ?? test.subject,
    topics: topicIds.length ? topicIds : test.topics,
    sub_topics: subIds.length ? subIds : test.sub_topics,
    correct_marks: test.correct_marks,
    wrong_marks: test.wrong_marks ?? 0,
    unattempt_marks: test.unattempt_marks,
    difficulty: test.difficulty,
    total_time: test.total_time,
    total_marks: test.total_marks,
    total_questions: test.total_questions,
    questions: test.questions || [],
    ...extra,
  }

  if (payload.scheduled_date == null) delete payload.scheduled_date
  if (payload.expiry_date == null) delete payload.expiry_date

  return payload
}
