import { useEffect, useState } from 'react'
import {
  IconCheck,
  IconChevronsLeft,
  IconChevronsRight,
  IconMinus,
} from '../icons/Icons'
import SidebarIcon from '../icons/SidebarIcon'
import { NavLink } from 'react-router-dom'
import dashboardIcon from '../../assets/icons/dashboard.png'
import testCreationIcon from '../../assets/icons/test-creation.png'
import testTrackingIcon from '../../assets/icons/test-tracking.png'

const COLLAPSE_KEY = 'preproute_question_sidebar_collapsed'

interface QuestionSidebarProps {
  totalQuestions: number
  currentIndex: number
  questionsCount: number
  onSelect: (index: number) => void
}

export default function QuestionSidebar({
  totalQuestions,
  currentIndex,
  questionsCount,
  onSelect,
}: QuestionSidebarProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(collapsed))
    } catch {
      // ignore storage errors
    }
  }, [collapsed])

  const slots = Math.max(totalQuestions, questionsCount, 1)
  const total = totalQuestions || questionsCount

  return (
    <aside className={`question-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="question-rail">
        {collapsed ? (
          <button
            type="button"
            className="rail-btn question-rail-expand"
            title="Expand question list"
            aria-label="Expand question list"
            onClick={() => setCollapsed(false)}
          >
            <IconChevronsRight />
          </button>
        ) : null}
        <NavLink to="/dashboard" className="rail-btn" title="Dashboard">
          <SidebarIcon src={dashboardIcon} />
        </NavLink>
        <NavLink to="/tests/new" className="rail-btn active" title="Test Creation">
          <SidebarIcon src={testCreationIcon} />
        </NavLink>
        <button type="button" className="rail-btn" title="Test Tracking">
          <SidebarIcon src={testTrackingIcon} />
        </button>
      </div>

      <div className="question-list-panel" aria-hidden={collapsed}>
        <div className="question-list-head">
          <div className="question-list-title-row">
            <h3>Question creation</h3>
            <button
              type="button"
              className="question-list-collapse"
              aria-label="Collapse question list"
              title="Collapse"
              onClick={() => setCollapsed(true)}
            >
              <IconChevronsLeft />
            </button>
          </div>
          <p>
            Total Questions <span className="question-list-dot">·</span> {total}
          </p>
        </div>
        <div className="question-list-scroll">
          <div className="question-list">
            {Array.from({ length: slots }, (_, index) => {
              const filled = index < questionsCount
              const active = index === currentIndex
              return (
                <button
                  key={index}
                  type="button"
                  className={`question-list-item${filled ? ' filled' : ''}${active ? ' active' : ''}`}
                  onClick={() => onSelect(index)}
                >
                  <span className={`q-check${filled ? ' done' : ''}`}>
                    {filled ? <IconCheck /> : <IconMinus />}
                  </span>
                  <span>Question {index + 1}</span>
                  <IconChevronsRight className="question-list-chevron" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
