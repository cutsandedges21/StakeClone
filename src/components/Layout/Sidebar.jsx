import { NavLink } from 'react-router-dom'

const GAMES = [
  { path: '/crash',        label: 'Crash',        icon: '📈' },
  { path: '/mines',        label: 'Mines',        icon: '💎' },
  { path: '/plinko',       label: 'Plinko',       icon: '🎯' },
  { path: '/dice',         label: 'Dice',         icon: '🎲' },
  { path: '/limbo',        label: 'Limbo',        icon: '🚀' },
  { path: '/keno',         label: 'Keno',         icon: '🔢' },
  { path: '/dragon-tower', label: 'Dragon Tower', icon: '🐉' },
  { path: '/chicken',      label: 'Chicken',      icon: '🐔' },
]

export default function Sidebar({ open, onClose }) {
  return (
    <nav className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-section">
        <div className="sidebar-label">Originals</div>
        {GAMES.map(g => (
          <NavLink
            key={g.path}
            to={g.path}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <span className="game-icon">{g.icon}</span>
            <span>{g.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-section">
        <div className="sidebar-label">Account</div>
        <NavLink to="/stats"    className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="game-icon">📊</span><span>Stats</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`} onClick={onClose}>
          <span className="game-icon">⚙️</span><span>Settings</span>
        </NavLink>
      </div>
    </nav>
  )
}
