import Badge from '../ui/Badge'
import { capitalizeFirst } from '../../helpers/string'
import type { Question } from '../../types'

interface QuestionPreviewListProps {
  questions: Question[]
  title?: string
}

const OPTION_KEYS = ['option1', 'option2', 'option3', 'option4'] as const

function difficultyTone(value?: string) {
  const level = (value || 'easy').toLowerCase()
  if (level === 'hard' || level === 'difficult') return 'yellow' as const
  if (level === 'medium') return 'blue' as const
  return 'green' as const
}

export default function QuestionPreviewList({
  questions,
  title = 'Questions preview',
}: QuestionPreviewListProps) {
  if (questions.length === 0) {
    return (
      <div className="card-panel preview-section">
        <h2>{title}</h2>
        <p className="preview-empty">No questions to preview yet.</p>
      </div>
    )
  }

  return (
    <div className="card-panel preview-section">
      <h2>
        {title} <span className="preview-count">({questions.length})</span>
      </h2>

      {questions.map((q, index) => (
        <article key={q.id ?? index} className="preview-question">
          <div className="preview-question-head">
            <strong>Q{index + 1}.</strong>
            <div className="preview-meta">
              {q.difficulty ? (
                <Badge tone={difficultyTone(q.difficulty)}>
                  {capitalizeFirst(q.difficulty)}
                </Badge>
              ) : null}
              {q.topic ? <Badge tone="gray">{q.topic}</Badge> : null}
              {q.sub_topic ? <Badge tone="teal">{q.sub_topic}</Badge> : null}
            </div>
          </div>

          <div
            className="preview-question-body ql-editor"
            dangerouslySetInnerHTML={{ __html: q.question }}
          />

          {q.media_url ? (
            <div className="preview-media">
              <img src={q.media_url} alt={`Question ${index + 1}`} />
            </div>
          ) : null}

          <div className="preview-options">
            {OPTION_KEYS.map((key, optIndex) => {
              const label = q[key]
              if (!label) return null
              const isCorrect = q.correct_option === key
              return (
                <div
                  key={key}
                  className={`preview-option${isCorrect ? ' correct' : ''}`}
                >
                  <span className="preview-option-label">{String.fromCharCode(65 + optIndex)}.</span>
                  <span>{label}</span>
                  {isCorrect ? <span className="preview-correct-tag">Correct</span> : null}
                </div>
              )
            })}
          </div>

          {q.explanation ? (
            <div className="preview-explanation">
              <span className="preview-explanation-label">Solution</span>
              <p>{q.explanation}</p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
