import Badge from '../ui/Badge'
import { IconBook, IconClock, IconEdit, IconMarks, IconQuestions } from '../icons/Icons'
import { capitalizeFirst } from '../../helpers/string'
import type { Test } from '../../types'

interface TestSummaryCardProps {
  test: Test
  onEdit?: () => void
}

export default function TestSummaryCard({ test, onEdit }: TestSummaryCardProps) {
  return (
    <div className="test-summary-card">
      <div className="test-summary-top">
        <Badge tone="navy">
          {test.type === 'chapterwise' ? 'Chapter Wise' : test.type}
        </Badge>
        {onEdit && (
          <button type="button" className="ui-icon-btn" onClick={onEdit} aria-label="Edit test">
            <IconEdit />
          </button>
        )}
      </div>

      <div className="test-summary-body">
        <div className="test-summary-left">
          <div className="test-summary-title-row">
            <IconBook />
            <h3>{test.name ? capitalizeFirst(test.name) : '—'}</h3>
            <Badge tone="teal" className="difficulty-chip">
              {test.difficulty === 'hard' ? 'Difficult' : test.difficulty}
            </Badge>
          </div>
          <div className="test-summary-meta">
            <div className="test-summary-meta-row">
              <span className="test-summary-meta-label">Subject</span>
              <span className="test-summary-meta-sep">:</span>
              <span className="test-summary-meta-value">{test.subject}</span>
            </div>
            <div className="test-summary-meta-row">
              <span className="test-summary-meta-label">Topic</span>
              <span className="test-summary-meta-sep">:</span>
              <div className="tag-list">
                {test.topics.map((topic) => (
                  <Badge key={topic} tone="yellow">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="test-summary-meta-row">
              <span className="test-summary-meta-label">Sub Topic</span>
              <span className="test-summary-meta-sep">:</span>
              <div className="tag-list">
                {test.sub_topics.length > 0
                  ? test.sub_topics.map((sub) => (
                      <Badge key={sub} tone="yellow">
                        {sub}
                      </Badge>
                    ))
                  : <span className="muted">—</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="test-summary-stats">
          <div className="test-summary-stat">
            <IconClock />
            <span>{test.total_time} Min</span>
          </div>
          <span className="test-summary-stat-divider" aria-hidden />
          <div className="test-summary-stat">
            <IconQuestions />
            <span>{test.total_questions} Q&apos;s</span>
          </div>
          <span className="test-summary-stat-divider" aria-hidden />
          <div className="test-summary-stat">
            <IconMarks />
            <span>{test.total_marks} Marks</span>
          </div>
        </div>
      </div>
    </div>
  )
}
