import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { loadData } from '../lib/store'

const ICONS = { crash:'📈', mines:'💎', plinko:'🎯', dice:'🎲', limbo:'🚀', keno:'🔢', 'dragon-tower':'🐉', chicken:'🐔' }

export default function Stats() {
  const { user } = useAuth()
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const data = loadData()
    const rows = Object.entries(data.stats).map(([game, s]) => ({ game, ...s }))
    setStats(rows)
    setLoading(false)
  }, [user])

  if (!user) return (
    <div style={{padding:'60px 24px',textAlign:'center',color:'var(--text-secondary)'}}>
      <div style={{fontSize:'52px',marginBottom:'16px'}}>📊</div>
      <div style={{fontSize:'18px',fontWeight:600,marginBottom:'8px',color:'var(--text-primary)'}}>Log in to view stats</div>
      <div>Your game statistics are saved to your account</div>
    </div>
  )

  const overall = stats.reduce((a, s) => ({
    total_bets:    a.total_bets    + s.total_bets,
    total_wagered: a.total_wagered + s.total_wagered,
    total_won:     a.total_won     + s.total_won,
    net_profit:    a.net_profit    + s.net_profit,
    biggest_win:   Math.max(a.biggest_win, s.biggest_win),
  }), { total_bets:0, total_wagered:0, total_won:0, net_profit:0, biggest_win:0 })

  const overallCards = [
    { label:'Total Bets',    value: overall.total_bets.toLocaleString() },
    { label:'Total Wagered', value: `$${overall.total_wagered.toFixed(2)}` },
    { label:'Total Won',     value: `$${overall.total_won.toFixed(2)}` },
    { label:'Net Profit',    value: `${overall.net_profit >= 0 ? '+' : ''}$${overall.net_profit.toFixed(2)}`, color: overall.net_profit >= 0 ? 'var(--accent)' : 'var(--red)' },
    { label:'Biggest Win',   value: `$${overall.biggest_win.toFixed(2)}`, color:'var(--gold)' },
  ]

  return (
    <div style={{padding:'24px',maxWidth:'920px'}}>
      <h1 style={{fontSize:'20px',fontWeight:700,marginBottom:'20px'}}>Statistics</h1>

      <div style={{marginBottom:'28px'}}>
        <div style={{fontSize:'12px',color:'var(--text-secondary)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'12px'}}>Overall</div>
        <div className="stats-grid">
          {overallCards.map(c => (
            <div className="stat-card" key={c.label}>
              <div className="stat-value" style={{color:c.color||'var(--text-primary)'}}>{loading ? '—' : c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{fontSize:'12px',color:'var(--text-secondary)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:'12px'}}>Per Game</div>
        {stats.length === 0 ? (
          <div style={{color:'var(--text-muted)',padding:'20px 0',fontSize:'14px'}}>No bets placed yet. Start playing!</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {stats.map(s => {
              const wr = s.total_bets > 0 ? ((s.total_won / s.total_wagered) * 100).toFixed(1) : '0.0'
              return (
                <div key={s.game} className="card animate-fadein" style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                  <span style={{fontSize:'26px'}}>{ICONS[s.game]||'🎮'}</span>
                  <div style={{flex:1,minWidth:'120px'}}>
                    <div style={{fontWeight:600,fontSize:'14px',textTransform:'capitalize'}}>{s.game.replace(/-/g,' ')}</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'2px'}}>{s.total_bets} bets · ${s.total_wagered.toFixed(2)} wagered</div>
                  </div>
                  <div style={{display:'flex',gap:'20px',flexWrap:'wrap'}}>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontWeight:700,color:s.net_profit>=0?'var(--accent)':'var(--red)'}}>{s.net_profit>=0?'+':''}${s.net_profit.toFixed(2)}</div>
                      <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Net P/L</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontWeight:700,color:'var(--gold)'}}>+${s.biggest_win.toFixed(2)}</div>
                      <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Best Win</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
