import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GAMES = [
  { path: '/crash',        label: 'Crash',        icon: '📈', desc: 'Cash out before it crashes' },
  { path: '/mines',        label: 'Mines',        icon: '💎', desc: 'Find the gems, dodge the mines' },
  { path: '/plinko',       label: 'Plinko',       icon: '🎯', desc: 'Drop and watch it bounce' },
  { path: '/dice',         label: 'Dice',         icon: '🎲', desc: 'Roll over or under' },
  { path: '/limbo',        label: 'Limbo',        icon: '🚀', desc: 'How high will it go?' },
  { path: '/keno',         label: 'Keno',         icon: '🔢', desc: 'Pick your lucky numbers' },
  { path: '/dragon-tower', label: 'Dragon Tower', icon: '🐉', desc: 'Climb without falling' },
  { path: '/chicken',      label: 'Chicken',      icon: '🐔', desc: 'Cross the road, cash out' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{padding:'28px 24px',maxWidth:'1100px',margin:'0 auto'}}>
      {/* Hero */}
      <div
        className="animate-fadein"
        style={{
          borderRadius:'16px',
          padding:'48px 36px',
          marginBottom:'32px',
          background:'linear-gradient(135deg, rgba(87,181,86,0.18), rgba(30,43,58,0.6))',
          border:'1px solid var(--border)',
        }}
      >
        <div style={{fontSize:'13px',fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--accent)',marginBottom:'12px'}}>
          Welcome{user ? `, ${user.username}` : ''}
        </div>
        <h1 style={{fontSize:'40px',fontWeight:900,letterSpacing:'-1.5px',lineHeight:1.05,marginBottom:'14px'}}>
          Play the Originals.
        </h1>
        <p style={{color:'var(--text-secondary)',fontSize:'16px',maxWidth:'520px',marginBottom:'24px'}}>
          Eight provably-fun casino games. {user ? 'Your balance is ready — pick a game and play.' : 'Log in to start playing with your balance.'}
        </p>
        <Link to="/crash" className="btn btn-primary" style={{padding:'12px 24px',fontSize:'15px',display:'inline-block'}}>
          Play Crash →
        </Link>
      </div>

      {/* Game grid */}
      <div style={{fontSize:'12px',color:'var(--text-secondary)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'14px'}}>
        Stake Originals
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))',gap:'14px'}}>
        {GAMES.map(g => (
          <Link
            key={g.path}
            to={g.path}
            className="card home-game-card"
            style={{display:'flex',flexDirection:'column',gap:'10px',transition:'all 0.15s'}}
          >
            <div style={{fontSize:'34px'}}>{g.icon}</div>
            <div style={{fontWeight:700,fontSize:'16px'}}>{g.label}</div>
            <div style={{fontSize:'13px',color:'var(--text-muted)'}}>{g.desc}</div>
          </Link>
        ))}
      </div>

      <style>{`
        .home-game-card:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}
