import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

function comb(n, k) {
  if (k > n) return 0
  if (k === 0 || k === n) return 1
  let r = 1
  for (let i = 0; i < k; i++) { r = r * (n - i) / (i + 1) }
  return r
}

function calcMult(revealed, mines) {
  const safe = 25 - mines
  if (revealed === 0) return 1
  let m = 1
  for (let i = 0; i < revealed; i++) {
    m *= (safe - i) / (25 - mines - i)
  }
  return parseFloat(((1 / m) * 0.99).toFixed(2))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const SIZE = 25

export default function Mines() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]         = useState(1)
  const [mineCount, setMineCount] = useState(3)
  const [phase, setPhase]     = useState('idle')  // idle | playing | ended
  const [tiles, setTiles]     = useState(Array(SIZE).fill({ state:'hidden' }))
  const [mines, setMines]     = useState([])
  const [revealed, setRevealed] = useState(0)
  const [currentMult, setCurrentMult] = useState(1)
  const [result, setResult]   = useState(null)

  const startGame = useCallback(() => {
    if (phase === 'playing') return
    const mineSet = new Set()
    while (mineSet.size < mineCount) mineSet.add(Math.floor(Math.random() * SIZE))
    setMines([...mineSet])
    setTiles(Array(SIZE).fill({ state:'hidden' }))
    setRevealed(0)
    setCurrentMult(calcMult(0, mineCount))
    setPhase('playing')
    setResult(null)
  }, [phase, mineCount])

  const reveal = useCallback(async (i) => {
    if (phase !== 'playing' || tiles[i].state !== 'hidden') return
    const isMine = mines.includes(i)
    const newTiles = tiles.map((t, idx) => idx === i ? { state: isMine ? 'mine' : 'gem' } : t)

    if (isMine) {
      const finalTiles = newTiles.map((t, idx) => mines.includes(idx) ? { state:'mine' } : t)
      setTiles(finalTiles)
      setPhase('ended')
      setResult({ win: false })
      if (user && bet > 0) {
        await recordBet({ game:'mines', betAmount:bet, payout:0, multiplier:0, result:'loss' })
      }
    } else {
      const newRev = revealed + 1
      const newMult = calcMult(newRev, mineCount)
      setTiles(newTiles)
      setRevealed(newRev)
      setCurrentMult(newMult)
      if (newRev === SIZE - mineCount) {
        setPhase('ended')
        setResult({ win: true, profit: bet * newMult - bet })
        if (user && bet > 0) {
          await recordBet({ game:'mines', betAmount:bet, payout:bet*newMult, multiplier:newMult, result:'win' })
        }
      }
    }
  }, [phase, tiles, mines, revealed, mineCount, bet, user, recordBet])

  const cashout = async () => {
    if (phase !== 'playing' || revealed === 0) return
    setPhase('ended')
    const payout = bet * currentMult
    setResult({ win: true, profit: payout - bet })
    if (user && bet > 0) {
      await recordBet({ game:'mines', betAmount:bet, payout, multiplier:currentMult, result:'win' })
    }
  }

  const tileEmoji = (tile, i) => {
    if (tile.state === 'gem')  return '💎'
    if (tile.state === 'mine') return '💣'
    if (phase === 'ended' && mines.includes(i)) return '💣'
    return ''
  }

  const tileClass = (tile, i) => {
    let base = 'grid-tile'
    if (tile.state === 'gem') return base + ' revealed-gem'
    if (tile.state === 'mine') return base + ' revealed-mine'
    if (phase === 'ended' && mines.includes(i)) return base + ' revealed-mine'
    if (phase !== 'playing') return base + ' disabled'
    return base
  }

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls
          bet={bet} onBetChange={setBet}
          onPlay={startGame}
          playing={phase === 'playing'}
          cashout={phase === 'playing' && revealed > 0}
          onCashout={cashout}
          disabled={phase === 'playing'}
        >
          <div>
            <div className="bet-label">Mines: {mineCount}</div>
            <input
              type="range" min="1" max="24" value={mineCount}
              onChange={e => setMineCount(+e.target.value)}
              className="range-slider"
              disabled={phase === 'playing'}
            />
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'var(--text-muted)',marginTop:'3px'}}>
              <span>1</span><span>24</span>
            </div>
          </div>
          {phase === 'playing' && (
            <div className="card" style={{textAlign:'center'}}>
              <div style={{fontSize:'11px',color:'var(--text-secondary)',marginBottom:'4px'}}>Potential payout</div>
              <div style={{fontSize:'22px',fontWeight:800,color:'var(--accent)'}}>{currentMult.toFixed(2)}×</div>
              <div style={{fontSize:'13px',color:'var(--accent)'}}>= ${(bet * currentMult).toFixed(2)}</div>
            </div>
          )}
        </BetControls>
        {result && (
          <div className={`card animate-popin ${result.win ? 'result-win' : 'result-loss'}`} style={{textAlign:'center',fontWeight:700,fontSize:'16px'}}>
            {result.win ? `+$${result.profit.toFixed(2)} 🎉` : `💣 Mine hit! -$${bet.toFixed(2)}`}
          </div>
        )}
      </div>

      <div className="game-area">
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(5, 1fr)',
          gap:'8px', width:'100%', maxWidth:'380px',
        }}>
          {tiles.map((tile, i) => (
            <div
              key={i}
              className={tileClass(tile, i)}
              onClick={() => reveal(i)}
              style={{fontSize: tile.state !== 'hidden' ? '24px' : '0'}}
            >
              {tileEmoji(tile, i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
