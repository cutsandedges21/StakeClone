import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import AuthModal from '../Auth/AuthModal'

export default function Header({ onMenuClick }) {
  const { user, logOut } = useAuth()
  const { balance } = useWallet()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <header className="app-header">
        <button className="btn-icon" id="menu-btn" onClick={onMenuClick} title="Menu">☰</button>
        <Link to="/" className="header-logo">STAKE</Link>

        <div className="header-balance">
          <span className="coin">💰</span>
          <span>{user ? balance.toFixed(2) : '0.00'}</span>
          {!user && <span style={{fontSize:'10px',color:'var(--text-muted)',marginLeft:'2px'}}>guest</span>}
        </div>

        <div className="header-actions">
          {user ? (
            <>
              <span className="header-user" style={{maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {user.username}
              </span>
              <button className="btn btn-outline" onClick={logOut}>Log Out</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Log In</button>
          )}
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      <style>{`
        #menu-btn { display: none; }
        @media(max-width:900px) { #menu-btn { display: flex !important; } }
        @media(max-width:480px) { .header-user { display: none; } }
      `}</style>
    </>
  )
}
