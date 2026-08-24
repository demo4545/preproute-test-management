import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { IconChevronDown } from '../icons/Icons'
import SidebarIcon from '../icons/SidebarIcon'
import logo from '../../assets/logo.svg'
import bellIcon from '../../assets/icons/bell.png'
import dashboardIcon from '../../assets/icons/dashboard.png'
import testCreationIcon from '../../assets/icons/test-creation.png'
import testTrackingIcon from '../../assets/icons/test-tracking.png'

function getInitials(name?: string) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TopHeader({ showLogo = false }: { showLogo?: boolean }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <img
        src={logo}
        alt="Preproute"
        className={showLogo ? 'app-header-logo' : 'app-header-logo app-header-logo-mobile-only'}
      />
      <div className="app-header-right">
        <button type="button" className="app-notify" aria-label="Notifications">
          <img src={bellIcon} alt="" className="nav-icon" />
          <span className="app-notify-dot" />
        </button>

        <div className="app-user" ref={menuRef}>
          <button
            type="button"
            className={`app-user-trigger${menuOpen ? ' open' : ''}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <div className="app-avatar" aria-hidden>
              {getInitials(user?.name)}
            </div>
            <div className="app-user-meta">
              <p className="app-user-name">
                {user?.name ?? user?.userId}
                <IconChevronDown />
              </p>
              <p className="app-user-role">{user?.role ?? 'Admin'}</p>
            </div>
          </button>

          {menuOpen && (
            <div className="app-user-menu" role="menu">
              <button type="button" className="app-user-menu-item" role="menuitem" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export function MainSidebar() {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard'
  const isTestCreation = pathname.startsWith('/tests')

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <img src={logo} alt="Preproute" />
      </div>
      <nav className="app-sidebar-nav">
        <NavLink
          to="/dashboard"
          end
          className={isDashboard ? 'app-nav active' : 'app-nav'}
        >
          <SidebarIcon src={dashboardIcon} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/tests/new"
          className={isTestCreation ? 'app-nav active' : 'app-nav'}
        >
          <SidebarIcon src={testCreationIcon} />
          <span>Test Creation</span>
        </NavLink>
        <button type="button" className="app-nav">
          <SidebarIcon src={testTrackingIcon} />
          <span>Test Tracking</span>
        </button>
      </nav>
    </aside>
  )
}
