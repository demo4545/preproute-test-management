import { stripHtml } from '../helpers/string'

export interface ParsedCsvQuestion {
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

const HEADER_ALIASES: Record<string, keyof ParsedCsvQuestion> = {
  question: 'question',
  option1: 'option1',
  option2: 'option2',
  option3: 'option3',
  option4: 'option4',
  correct_option: 'correct_option',
  correct: 'correct_option',
  answer: 'correct_option',
  explanation: 'explanation',
  solution: 'explanation',
  difficulty: 'difficulty',
  level: 'difficulty',
  topic: 'topic',
  sub_topic: 'sub_topic',
  subtopic: 'sub_topic',
  'sub-topic': 'sub_topic',
  media_url: 'media_url',
  image: 'media_url',
  image_url: 'media_url',
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }
    current += char
  }
  cells.push(current)
  return cells.map((c) => c.trim())
}

function normalizeCorrectOption(value: string): ParsedCsvQuestion['correct_option'] {
  const raw = value.trim().toLowerCase()
  if (!raw) return ''
  if (raw === '1' || raw === 'option1' || raw === 'a') return 'option1'
  if (raw === '2' || raw === 'option2' || raw === 'b') return 'option2'
  if (raw === '3' || raw === 'option3' || raw === 'c') return 'option3'
  if (raw === '4' || raw === 'option4' || raw === 'd') return 'option4'
  return ''
}

function normalizeDifficulty(value: string, fallback: string): string {
  const raw = value.trim().toLowerCase()
  if (!raw) return fallback
  if (raw === 'easy' || raw === 'medium' || raw === 'hard') return raw
  if (raw === 'difficult') return 'hard'
  return fallback
}

function emptyRow(): ParsedCsvQuestion {
  return {
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option: '',
    explanation: '',
    difficulty: 'easy',
    topic: '',
    sub_topic: '',
    media_url: '',
  }
}

export interface ParseQuestionCsvOptions {
  defaultDifficulty?: string
  defaultTopic?: string
  defaultSubTopic?: string
  allowedTopics?: string[]
  allowedSubTopics?: string[]
}

export interface ParseQuestionCsvResult {
  rows: ParsedCsvQuestion[]
  errors: string[]
}

export function parseQuestionCsv(
  text: string,
  options: ParseQuestionCsvOptions = {}
): ParseQuestionCsvResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV file is empty.'] }
  }

  const headerCells = parseCsvLine(lines[0]).map(normalizeHeader)
  const columnMap = headerCells.map((cell) => HEADER_ALIASES[cell] ?? null)

  if (!columnMap.includes('question')) {
    return {
      rows: [],
      errors: [
        'CSV must include a "question" column. Expected headers: question, option1, option2, option3, option4, correct_option, explanation, difficulty, topic, sub_topic, media_url',
      ],
    }
  }

  const rows: ParsedCsvQuestion[] = []
  const errors: string[] = []
  const {
    defaultDifficulty = 'easy',
    defaultTopic = '',
    defaultSubTopic = '',
    allowedTopics = [],
    allowedSubTopics = [],
  } = options

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const cells = parseCsvLine(lines[lineIndex])
    const row = emptyRow()

    columnMap.forEach((key, colIndex) => {
      if (!key) return
      const value = cells[colIndex] ?? ''
      if (key === 'correct_option') {
        row.correct_option = normalizeCorrectOption(value)
      } else {
        row[key] = value
      }
    })

    row.difficulty = normalizeDifficulty(row.difficulty, defaultDifficulty)
    row.topic = row.topic || defaultTopic
    row.sub_topic = row.sub_topic || defaultSubTopic

    const hasContent =
      stripHtml(row.question) ||
      row.option1 ||
      row.option2 ||
      row.option3 ||
      row.option4

    if (!hasContent) continue

    if (allowedTopics.length > 0 && row.topic && !allowedTopics.includes(row.topic)) {
      errors.push(`Row ${lineIndex + 1}: topic "${row.topic}" is not allowed for this test.`)
      continue
    }
    if (
      allowedSubTopics.length > 0 &&
      row.sub_topic &&
      !allowedSubTopics.includes(row.sub_topic)
    ) {
      errors.push(`Row ${lineIndex + 1}: sub-topic "${row.sub_topic}" is not allowed for this test.`)
      continue
    }

    rows.push(row)
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('No valid question rows found in CSV.')
  }

  return { rows, errors }
}
