import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

const TOTAL = 40
const DRAW  = 10

const PAYTABLE = {
  1:  [0,2.80],
  2:  [0,0,3.8],
  3:  [0,0,1.4,26],
  4:  [0,0,0.5,2.5,15],
  5:  [0,0,0,1.4,4,25],
  6:  [0,0,0,0.5,2,8,50],
  7:  [0,0,0,0,0.5,2,15,150],
  8:  [0,0,0,0,0.5,1.5,8,50,300],
  9:  [0,0,0,0,0.5,1,3,12,60,400],
  10: [0,0,0,0,0.5,1,2,6,25,100,1000],
}

export default function Keno() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]       = useState(1)
  const [picked, setPicked] = useState(new Set())
  const [drawn, setDrawn]   = useState(new Set())
  const [drawing, setDrawing] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const toggle = useCallback((n) => {
    if (drawing) return
    setPicked(prev => {
      const s = new Set(prev)
      if (s.has(n)) s.delete(n)
      else if (s.size < 10) s.add(n)
      return s
    })
    setDrawn(new Set())
    setResult(null)
  }, [drawing])

  const play = async () => {
    if (picked.size === 0 || drawing) return
    setDrawing(true)
    setDrawn(new Set())
    setResult(null)

    const pool = Array.from({length:TOTAL},(_,i)=>i+1)
    const drawArr = []
    for (let i = 0; i < DRAW; i++) {
      const idx = Math.floor(Math.random() * pool.length)
      drawArr.push(pool.splice(idx,1)[0])
    }

    for (let i = 0; i < drawArr.length; i++) {
      await new Promise(r => setTimeout(r, 150))
      setDrawn(prev => new Set([...prev, drawArr[i]]))
    }

    const matches = drawArr.filter(n => picked.has(n)).length
    const pt = PAYTABLE[picked.size] || []
    const mult = pt[matches] || 0
    const payout = bet * mult
    const win = mult > 0
    setResult({ matches, mult, payout, win })
    setHistory(h => [{matches, mult, win}, ...h].slice(0,15))
    if (user && bet > 0) {
      await recordBet({ game:'keno', betAmount:bet, payout, multiplier:mult, result:win?'win':'loss' })
    }
    setDrawing(false)
  }

  const getBg = (n) => {
    const isPicked = picked.has(n)
    const isDrawn  = drawn.has(n)
    if (isPicked && isDrawn) return 'var(--accent)'
    if (isPicked) return 'rgba(87,181,86,0.25)'
    if (isDrawn)  return 'rgba(240,192,64,0.3)'
    return 'var(--bg-hover)'
  }
  const getColor = (n) => {
    const isPicked = picked.has(n)
    const isDrawn  = drawn.has(n)
    if (isPicked && isDrawn) return '#fff'
    if (isPicked) return 'var(--accent)'
    if (isDrawn)  return 'var(--gold)'
    return 'var(--text-secondary)'
  }

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls bet={bet} onBetChange={setBet} onPlay={play} playing={drawing}
          disabled={picked.size === 0} playLabel={`Pick ${picked.size}/10 — Bet`}>
          <div style={{fontSize:'12px',color:'var(--text-muted)'}}>
            {picked.size === 0 ? 'Click numbers to pick (max 10)' : `${picked.size} number${picked.size>1?'s':''} selected`}
          </div>
          {picked.size > 0 && PAYTABLE[picked.size] && (
            <div>
              <div className="bet-label">Payouts for {picked.size} picks</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                {PAYTABLE[picked.size].map((v,i) => v > 0 && (
                  <span key={i} className="chip win" style={{fontSize:'11px'}}>{i} match = {v}×</span>
                ))}
              </div>
            </div>
          )}
        </BetControls>
        {result && (
          <div className={`card animate-popin ${result.win?'result-win':'result-loss'}`} style={{textAlign:'center'}}>
            <div style={{fontSize:'20px',fontWeight:800}}>{result.matches} match{result.matches!==1?'es':''}</div>
            <div style={{fontWeight:600}}>{result.win ? `${result.mult}× · +$${(result.payout-bet).toFixed(2)} 🎉` : `-$${bet.toFixed(2)}`}</div>
          </div>
        )}
      </div>

      <div className="game-area" style={{alignItems:'stretch',justifyContent:'flex-start',padding:'20px'}}>
        <div style={{
          display:'grid',gridTemplateColumns:'repeat(8,1fr)',
          gap:'6px',width:'100%',maxWidth:'480px',margin:'0 auto',
        }}>
          {Array.from({length:TOTAL},(_,i)=>i+1).map(n => (
            <div
              key={n}
              onClick={() => toggle(n)}
              style={{
                aspectRatio:'1',borderRadius:'8px',display:'flex',alignItems:'center',
                justifyContent:'center',fontWeight:700,fontSize:'14px',
                cursor: drawing ? 'not-allowed' : 'pointer',
                background: getBg(n),
                color: getColor(n),
                border: `2px solid ${picked.has(n)&&drawn.has(n)?'var(--accent)':picked.has(n)?'rgba(87,181,86,0.5)':drawn.has(n)?'rgba(240,192,64,0.5)':'transparent'}`,
                transition:'all 0.15s',
                transform: drawn.has(n) ? 'scale(1.08)' : 'scale(1)',
              }}
            >{n}</div>
          ))}
        </div>
        <div className="recent-chips" style={{marginTop:'16px',justifyContent:'center'}}>
          {history.map((h,i)=>(
            <span key={i} className={`chip ${h.win?'win':'loss'}`}>{h.matches}m {h.mult>0?h.mult+'×':''}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
