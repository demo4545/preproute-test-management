import { Outlet, useLocation } from 'react-router-dom'
import TopHeader, { MainSidebar } from './layout/Header'

export default function Layout() {
  const { pathname } = useLocation()
  const isQuestionFlow = /\/tests\/[^/]+\/(questions|preview)/.test(pathname)
  const isCreateTestFlow =
    pathname === '/tests/new' || /^\/tests\/[^/]+\/edit$/.test(pathname)

  const shellClass = [
    'app-shell',
    isQuestionFlow ? 'question-flow' : '',
    isCreateTestFlow ? 'create-test-flow' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      {!isQuestionFlow && <MainSidebar />}
      <div className="app-main">
        <TopHeader showLogo={isQuestionFlow} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
