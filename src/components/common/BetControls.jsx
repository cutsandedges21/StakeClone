import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'

export default function BetControls({
  bet, onBetChange,
  onPlay, playing,
  cashout, onCashout,
  disabled, playLabel = 'Bet',
  children,
}) {
  const { user } = useAuth()
  const { balance } = useWallet()
  const isGuest = !user

  const clamp = v => Math.max(0.01, Math.min(parseFloat(v) || 0, balance))
  const half   = () => onBetChange(clamp(bet / 2))
  const double = () => onBetChange(clamp(bet * 2))
  const max    = () => onBetChange(balance)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div>
        <div className="bet-label">Bet Amount</div>
        <div className="bet-input-row">
          <input
            className="bet-input"
            type="number" min="0.01" step="0.01"
            value={isGuest ? 0 : bet}
            onChange={e => onBetChange(parseFloat(e.target.value) || 0)}
            disabled={isGuest || playing}
          />
          <button className="bet-quick-btn" onClick={half}   disabled={isGuest || playing}>½</button>
          <button className="bet-quick-btn" onClick={double} disabled={isGuest || playing}>2×</button>
          {!isGuest && <button className="bet-quick-btn" onClick={max} disabled={playing}>Max</button>}
        </div>
        {isGuest && <div className="guest-hint">Log in to place real bets</div>}
      </div>

      {children}

      {cashout ? (
        <button className="play-btn cashout" onClick={onCashout}>
          Cash Out
        </button>
      ) : (
        <button
          className="play-btn"
          onClick={onPlay}
          disabled={disabled || playing}
        >
          {playing ? '...' : playLabel}
        </button>
      )}
    </div>
  )
}
