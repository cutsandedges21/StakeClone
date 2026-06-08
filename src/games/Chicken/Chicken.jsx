import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

const DIFFICULTIES = {
  easy:   { cols:3, safe:2, label:'Easy' },
  medium: { cols:4, safe:2, label:'Medium' },
  hard:   { cols:5, safe:2, label:'Hard' },
  extreme:{ cols:5, safe:1, label:'Extreme' },
}
const ROWS = 8

function buildLane(cols, safe) {
  const lane = Array(cols).fill('car')
  const positions = []
  while (positions.length < safe) {
    const p = Math.floor(Math.random() * cols)
    if (!positions.includes(p)) positions.push(p)
  }
  positions.forEach(p => lane[p] = 'safe')
  return lane
}

function calcMult(row, cfg) {
  const safeChance = cfg.safe / cfg.cols
  let m = 1
  for (let i = 0; i <= row; i++) m *= (1 / safeChance) * 0.97
  return parseFloat(m.toFixed(2))
}

export default function Chicken() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]     = useState(1)
  const [diff, setDiff]   = useState('medium')
  const [phase, setPhase] = useState('idle')
  const [board, setBoard] = useState([])
  const [currentRow, setCurrentRow] = useState(0)
  const [revealed, setRevealed] = useState([])
  const [result, setResult] = useState(null)
  const [chickenPos, setChickenPos] = useState(null)

  const cfg = DIFFICULTIES[diff]

  const start = useCallback(() => {
    const rows = Array.from({length:ROWS}, () => buildLane(cfg.cols, cfg.safe))
    setBoard(rows)
    setCurrentRow(0)
    setRevealed(Array.from({length:ROWS}, () => Array(cfg.cols).fill(null)))
    setPhase('playing')
    setResult(null)
    setChickenPos(null)
  }, [cfg])

  const pick = useCallback(async (rowIdx, colIdx) => {
    if (phase !== 'playing' || rowIdx !== currentRow) return
    const cell = board[rowIdx][colIdx]
    setChickenPos({ row:rowIdx, col:colIdx })
    const newRev = revealed.map((r,ri) => ri===rowIdx ? r.map((c,ci) => ci===colIdx ? cell : c) : r)
    setRevealed(newRev)

    if (cell === 'car') {
      const finalRev = newRev.map((r,ri) => ri===rowIdx
        ? board[rowIdx].map((c,ci) => c==='car' ? 'car' : (ci===colIdx?null:null))
        : r)
      setRevealed(finalRev)
      setPhase('ended')
      setResult({ win:false })
      if (user && bet > 0) {
        await recordBet({ game:'chicken', betAmount:bet, payout:0, multiplier:0, result:'loss' })
      }
    } else {
      const nextRow = currentRow + 1
      if (nextRow >= ROWS) {
        const mult = calcMult(ROWS - 1, cfg)
        const payout = bet * mult
        setPhase('ended')
        setResult({ win:true, mult, payout })
        if (user && bet > 0) {
          await recordBet({ game:'chicken', betAmount:bet, payout, multiplier:mult, result:'win' })
        }
      } else {
        setCurrentRow(nextRow)
      }
    }
  }, [phase, currentRow, board, revealed, cfg, bet, user, recordBet])

  const cashout = async () => {
    if (phase !== 'playing' || currentRow === 0) return
    const mult = calcMult(currentRow - 1, cfg)
    const payout = bet * mult
    setPhase('ended')
    setResult({ win:true, mult, payout })
    if (user && bet > 0) {
      await recordBet({ game:'chicken', betAmount:bet, payout, multiplier:mult, result:'win' })
    }
  }

  const currentMult = phase === 'playing' && currentRow > 0 ? calcMult(currentRow - 1, cfg) : null

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls
          bet={bet} onBetChange={setBet}
          onPlay={start}
          playing={phase === 'playing'}
          cashout={phase === 'playing' && currentRow > 0}
          onCashout={cashout}
          disabled={phase === 'playing'}
        >
          <div>
            <div className="bet-label">Difficulty</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px'}}>
              {Object.entries(DIFFICULTIES).map(([k,v]) => (
                <button key={k} onClick={() => setDiff(k)} disabled={phase==='playing'}
                  style={{
                    padding:'7px 4px',borderRadius:'6px',fontSize:'12px',fontWeight:600,
                    background: diff===k ? 'var(--accent)' : 'var(--bg-hover)',
                    color: diff===k ? '#fff' : 'var(--text-secondary)',
                    border:`1px solid ${diff===k?'var(--accent)':'var(--border)'}`,
                  }}>{v.label}</button>
              ))}
            </div>
          </div>
          {currentMult && (
            <div className="card" style={{textAlign:'center'}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Cashout now</div>
              <div style={{fontSize:'22px',fontWeight:800,color:'var(--accent)'}}>{currentMult}×</div>
            </div>
          )}
        </BetControls>
        {result && (
          <div className={`card animate-popin ${result.win?'result-win':'result-loss'}`} style={{textAlign:'center'}}>
            {result.win
              ? <><div style={{fontSize:'20px',fontWeight:800}}>{result.mult}× 🎉</div><div>+${(result.payout-bet).toFixed(2)}</div></>
              : <><div style={{fontSize:'24px'}}>🚗💥🐔</div><div style={{fontWeight:700}}>-${bet.toFixed(2)}</div></>
            }
          </div>
        )}
      </div>

      <div className="game-area" style={{padding:'16px',overflowY:'auto'}}>
        <div style={{display:'flex',flexDirection:'column-reverse',gap:'6px',width:'100%',maxWidth:'420px',margin:'0 auto'}}>
          {Array.from({length:ROWS}).map((_,rowIdx) => {
            const isActive = phase === 'playing' && rowIdx === currentRow
            const revRow   = revealed[rowIdx] || Array(cfg.cols).fill(null)
            const rowMult  = calcMult(rowIdx, cfg)
            const hasChicken = chickenPos?.row === rowIdx
            return (
              <div key={rowIdx} style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <div style={{
                  fontSize:'11px',fontWeight:700,
                  color: isActive?'var(--accent)':'var(--text-muted)',
                  width:'36px',textAlign:'right',flexShrink:0,
                }}>{rowMult}×</div>
                {Array.from({length:cfg.cols}).map((_,colIdx) => {
                  const rev = revRow[colIdx]
                  const isSafe = rev === 'safe'
                  const isCar  = rev === 'car'
                  const isChicken = hasChicken && chickenPos?.col === colIdx && isSafe
                  return (
                    <div
                      key={colIdx}
                      onClick={() => pick(rowIdx, colIdx)}
                      style={{
                        flex:1, height:'48px', borderRadius:'8px',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'20px',
                        cursor: isActive && !rev ? 'pointer' : 'default',
                        background: isSafe ? 'rgba(87,181,86,0.2)' : isCar ? 'rgba(231,76,60,0.2)' : isActive ? 'var(--bg-hover)' : 'var(--bg-card)',
                        border:`2px solid ${isActive&&!rev?'var(--border)':isSafe?'var(--accent)':isCar?'var(--red)':'transparent'}`,
                        transition:'all 0.15s',
                        transform: isActive && !rev ? 'scale(1.02)' : 'scale(0.96)',
                      }}
                    >
                      {isChicken ? '🐔' : isCar ? '🚗' : isSafe ? '✅' : isActive ? '?' : ''}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {/* Starting row */}
          <div style={{display:'flex',justifyContent:'center',padding:'8px 0',fontSize:'22px'}}>🐔</div>
        </div>
      </div>
    </div>
  )
}
