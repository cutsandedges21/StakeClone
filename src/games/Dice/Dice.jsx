import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

export default function Dice() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]     = useState(1)
  const [target, setTarget] = useState(50)
  const [mode, setMode]   = useState('under') // over | under
  const [rolling, setRolling] = useState(false)
  const [roll, setRoll]   = useState(null)
  const [history, setHistory] = useState([])

  const winChance = mode === 'under' ? target : 100 - target
  const mult = parseFloat((99 / winChance).toFixed(4))

  const play = async () => {
    setRolling(true)
    await new Promise(r => setTimeout(r, 600))
    const r = parseFloat((Math.random() * 100).toFixed(2))
    const win = mode === 'under' ? r < target : r > target
    const payout = win ? bet * mult : 0
    setRoll({ value: r, win })
    setHistory(h => [{ value:r, win }, ...h].slice(0, 15))
    if (user && bet > 0) {
      await recordBet({ game:'dice', betAmount:bet, payout, multiplier: win ? mult : 0, result: win?'win':'loss' })
    }
    setRolling(false)
  }

  const barLeft  = mode === 'under' ? 0 : target
  const barWidth = winChance
  const rollLeft = roll ? roll.value : null

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls bet={bet} onBetChange={setBet} onPlay={play} playing={rolling}>
          <div style={{display:'flex',gap:'6px'}}>
            {['under','over'].map(m => (
              <button key={m} onClick={() => setMode(m)} disabled={rolling}
                style={{
                  flex:1,padding:'8px',borderRadius:'7px',fontSize:'13px',fontWeight:700,
                  background: mode===m ? 'var(--accent)' : 'var(--bg-hover)',
                  color: mode===m ? '#fff' : 'var(--text-secondary)',
                  border:`1px solid ${mode===m?'var(--accent)':'var(--border)'}`,
                  textTransform:'capitalize',
                }}>Roll {m}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <div className="card" style={{flex:1,textAlign:'center',padding:'10px'}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'3px'}}>Win Chance</div>
              <div style={{fontSize:'18px',fontWeight:700,color:'var(--accent)'}}>{winChance.toFixed(1)}%</div>
            </div>
            <div className="card" style={{flex:1,textAlign:'center',padding:'10px'}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)',marginBottom:'3px'}}>Payout</div>
              <div style={{fontSize:'18px',fontWeight:700}}>{mult}×</div>
            </div>
          </div>
        </BetControls>
        {roll && (
          <div className={`card animate-popin ${roll.win ? 'result-win' : 'result-loss'}`} style={{textAlign:'center'}}>
            <div style={{fontSize:'28px',fontWeight:800}}>{roll.value.toFixed(2)}</div>
            <div style={{fontWeight:600}}>{roll.win ? `+$${(bet*mult-bet).toFixed(2)} 🎉` : `-$${bet.toFixed(2)}`}</div>
          </div>
        )}
      </div>

      <div className="game-area" style={{gap:'32px'}}>
        {/* Roll display */}
        {roll && (
          <div className={`multiplier-big animate-popin ${roll.win ? 'result-win' : 'result-loss'}`}>
            {roll.value.toFixed(2)}
          </div>
        )}
        {rolling && (
          <div className="multiplier-big animate-pulse" style={{color:'var(--text-secondary)'}}>
            ?
          </div>
        )}
        {!roll && !rolling && (
          <div className="multiplier-big" style={{color:'var(--border)'}}>—</div>
        )}

        {/* Target slider */}
        <div style={{width:'100%',maxWidth:'500px'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
            <span style={{fontSize:'13px',color:'var(--text-secondary)'}}>Target: {target}</span>
            <span style={{fontSize:'13px',color:'var(--accent)'}}>
              {mode === 'under' ? `Roll under ${target}` : `Roll over ${target}`}
            </span>
          </div>
          {/* Visual bar */}
          <div style={{position:'relative',height:'40px',background:'var(--bg-card)',borderRadius:'8px',overflow:'hidden',marginBottom:'10px'}}>
            <div style={{
              position:'absolute',left:`${barLeft}%`,width:`${barWidth}%`,
              height:'100%',background:'rgba(87,181,86,0.35)',
              borderRadius: mode==='under'?'8px 0 0 8px':'0 8px 8px 0',
            }} />
            {rollLeft !== null && (
              <div style={{
                position:'absolute',left:`${rollLeft}%`,top:0,bottom:0,
                width:'3px',marginLeft:'-1px',
                background: roll?.win ? 'var(--accent)' : 'var(--red)',
                transition:'left 0.3s',
              }} />
            )}
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'var(--text-muted)'}}>
              0 ——————————————— 100
            </div>
          </div>
          <input
            type="range" min="2" max="98" value={target}
            onChange={e => setTarget(+e.target.value)}
            className="range-slider" disabled={rolling}
            style={{width:'100%'}}
          />
        </div>

        {/* History */}
        <div className="recent-chips">
          {history.map((h,i) => (
            <span key={i} className={`chip ${h.win?'win':'loss'}`}>{h.value.toFixed(1)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
