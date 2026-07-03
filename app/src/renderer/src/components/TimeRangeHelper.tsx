import { useState } from 'react'

/** Parse a "m:ss" or "h:mm:ss" string into seconds; returns null if invalid. */
function toSeconds(s: string): number | null {
  const parts = s.split(':').map((p) => p.trim())
  if (parts.some((p) => p === '' || Number.isNaN(Number(p)))) return null
  const nums = parts.map(Number)
  if (nums.length === 2) return nums[0] * 60 + nums[1]
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2]
  return null
}

/**
 * A helper for inserting time-range text (e.g. "17:22 - 20:22") into a client
 * work description — mirrors the existing Hot Wheels item.
 */
export function TimeRangeHelper({
  onInsert
}: {
  onInsert: (text: string) => void
}): JSX.Element {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const valid = toSeconds(from) !== null && toSeconds(to) !== null

  function add(): void {
    if (!valid) return
    onInsert(`${from.trim()} - ${to.trim()}`)
    setFrom('')
    setTo('')
  }

  return (
    <div className="range-helper">
      <span className="range-label">Add a scene time-range:</span>
      <input
        className="range-input"
        placeholder="17:22"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />
      <span>–</span>
      <input
        className="range-input"
        placeholder="20:22"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <button type="button" className="btn small" onClick={add} disabled={!valid}>
        Insert
      </button>
    </div>
  )
}
