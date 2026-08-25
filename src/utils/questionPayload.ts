import type { Question } from '../types'

interface DraftLike {
  question: string
  option1: string
  option2: string
  option3: string
  option4: string
  correct_option: string
  explanation: string
  difficulty: string
  topic: string
  sub_topic: string
  media_url?: string
}

interface BuildQuestionPayloadContext {
  testId: string
  subject: string
  topic: string
  subTopic: string
}

export function buildQuestionPayload(
  question: DraftLike,
  ctx: BuildQuestionPayloadContext
): Question {
  return {
    type: 'mcq',
    question: question.question,
    option1: question.option1,
    option2: question.option2,
    option3: question.option3,
    option4: question.option4,
    correct_option: question.correct_option,
    explanation: question.explanation || undefined,
    difficulty: question.difficulty || undefined,
    subject: ctx.subject,
    topic: question.topic || ctx.topic,
    sub_topic: question.sub_topic || ctx.subTopic,
    media_url: question.media_url || undefined,
    test_id: ctx.testId,
  }
}

export function resolveQuestionTopic(
  question: DraftLike,
  allowedSubTopics: string[],
  fallbackTopic: string,
  topicNameForSubTopic: (subTopic: string) => string | undefined
): string {
  if (allowedSubTopics.includes(question.sub_topic)) return question.topic
  return topicNameForSubTopic(question.sub_topic) || fallbackTopic
}
