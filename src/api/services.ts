import { apiClient } from './client'
import type {
  ApiResponse,
  CreateTestPayload,
  LoginResponse,
  Question,
  Subject,
  SubTopic,
  Test,
  Topic,
  User,
} from '../types'

/** Result of create / update / delete calls — includes API message for toasts. */
export type MutationResult<T> = {
  data: T
  message?: string
}

function apiMessage(payload: { message?: string }): string | undefined {
  const message = payload.message?.trim()
  return message || undefined
}

/** Staging API sometimes returns null for array fields on new tests. */
function normalizeTest(test: Test): Test {
  return {
    ...test,
    questions: Array.isArray(test.questions) ? test.questions : [],
    topics: Array.isArray(test.topics) ? test.topics : [],
    sub_topics: Array.isArray(test.sub_topics) ? test.sub_topics : [],
    scheduled_date: test.scheduled_date ?? null,
    expiry_date: test.expiry_date ?? null,
  }
}

export const login = async (
  userId: string,
  password: string
): Promise<MutationResult<LoginResponse>> => {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
    userId,
    password,
  })
  return { data: data.data, message: apiMessage(data) }
}

export const getTests = async () => {
  const { data } = await apiClient.get<ApiResponse<Test[]>>('/tests')
  return (data.data || []).map(normalizeTest)
}

export const getTestById = async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<Test>>(`/tests/${id}`)
  return normalizeTest(data.data)
}

export const createTest = async (
  payload: CreateTestPayload
): Promise<MutationResult<Test>> => {
  const { data } = await apiClient.post<ApiResponse<Test>>('/tests', payload)
  return { data: normalizeTest(data.data), message: apiMessage(data) }
}

export const updateTest = async (
  id: string,
  payload: Partial<Test> & Record<string, unknown>
): Promise<MutationResult<Test>> => {
  const { data } = await apiClient.put<ApiResponse<Test>>(`/tests/${id}`, payload)
  return { data: normalizeTest(data.data), message: apiMessage(data) }
}

export const deleteTest = async (id: string): Promise<MutationResult<void>> => {
  const { data } = await apiClient.delete<ApiResponse<unknown>>(`/tests/${id}`)
  return { data: undefined, message: apiMessage(data) }
}

export const getSubjects = async () => {
  const { data } = await apiClient.get<ApiResponse<Subject[]>>('/subjects')
  return data.data
}

export const getTopicsBySubject = async (subjectId: string) => {
  const { data } = await apiClient.get<ApiResponse<Topic[]>>(`/topics/subject/${subjectId}`)
  return data.data
}

export const getSubTopicsByTopic = async (topicId: string) => {
  const { data } = await apiClient.get<ApiResponse<SubTopic[]>>(`/sub-topics/topic/${topicId}`)
  return data.data
}

/** POST used for fetching — returns data only (no success toast). */
export const getSubTopicsByTopics = async (topicIds: string[]) => {
  const { data } = await apiClient.post<ApiResponse<SubTopic[]>>('/sub-topics/multi-topics', {
    topicIds,
  })
  return data.data
}

export const bulkCreateQuestions = async (
  questions: Question[]
): Promise<MutationResult<Question[]>> => {
  const { data } = await apiClient.post<ApiResponse<Question[]>>('/questions/bulk', {
    questions,
  })
  const created = Array.isArray(data.data) ? data.data : []
  return { data: created, message: apiMessage(data) }
}

/** POST used for fetching — returns data only (no success toast). */
export const fetchQuestionsBulk = async (questionIds: string[]) => {
  if (questionIds.length === 0) return []

  const { data } = await apiClient.post<ApiResponse<Question[]>>('/questions/fetchBulk', {
    question_ids: questionIds,
  })
  return data.data || []
}

export const getStoredUser = (): User | null => {
  const raw = localStorage.getItem('user')
  return raw ? (JSON.parse(raw) as User) : null
}

export const setAuthStorage = (token: string, user: User) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuthStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const isAuthenticated = () => Boolean(localStorage.getItem('token'))
