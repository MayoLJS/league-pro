'use client'

import { useState } from 'react'
import { updatePlayerPosition } from '@/lib/actions/player-actions'

type Position = 'DEF' | 'MID' | 'ATT'

const POSITIONS: { value: Position; label: string; emoji: string }[] = [
    { value: 'DEF', label: 'Defender', emoji: '🛡️' },
    { value: 'MID', label: 'Midfielder', emoji: '⚙️' },
    { value: 'ATT', label: 'Attacker', emoji: '⚡' },
]

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface PositionSelectorProps {
    playerId: string
    initialPosition: Position
}

export default function PositionSelector({ playerId, initialPosition }: PositionSelectorProps) {
    const [position, setPosition] = useState<Position>(initialPosition)
    const [saveState, setSaveState] = useState<SaveState>('idle')

    const handleChange = async (newPosition: Position) => {
        if (newPosition === position) return

        setPosition(newPosition)     // optimistic update
        setSaveState('saving')

        const result = await updatePlayerPosition(playerId, newPosition)

        if (result.success) {
            setSaveState('saved')
            setTimeout(() => setSaveState('idle'), 2000)
        } else {
            // Rollback on failure
            setPosition(position)
            setSaveState('error')
            setTimeout(() => setSaveState('idle'), 3000)
        }
    }

    const current = POSITIONS.find((p) => p.value === position)

    return (
        <div
            style={{
                backgroundColor: '#1e293b',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '2px solid #334155',
            }}
        >
            {/* Label row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                }}
            >
                <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Position</div>

                {/* Save state badge */}
                {saveState === 'saving' && (
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Saving…</span>
                )}
                {saveState === 'saved' && (
                    <span
                        style={{
                            color: '#10b981',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            animation: 'fadeIn 0.2s ease',
                        }}
                    >
                        ✓ Saved
                    </span>
                )}
                {saveState === 'error' && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Failed — try again</span>
                )}
            </div>

            {/* Position buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {POSITIONS.map((pos) => {
                    const isActive = pos.value === position
                    return (
                        <button
                            key={pos.value}
                            onClick={() => handleChange(pos.value)}
                            disabled={saveState === 'saving'}
                            title={pos.label}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: `2px solid ${isActive ? '#10b981' : '#334155'}`,
                                backgroundColor: isActive ? '#10b98118' : 'transparent',
                                color: isActive ? '#10b981' : '#64748b',
                                fontSize: '0.8rem',
                                fontWeight: isActive ? '700' : '500',
                                cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.2rem',
                                opacity: saveState === 'saving' ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive && saveState !== 'saving') {
                                    e.currentTarget.style.borderColor = '#475569'
                                    e.currentTarget.style.color = '#94a3b8'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.borderColor = '#334155'
                                    e.currentTarget.style.color = '#64748b'
                                }
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>{pos.emoji}</span>
                            <span>{pos.value}</span>
                        </button>
                    )
                })}
            </div>

            {/* Current label */}
            <div style={{ color: 'white', fontSize: '0.8rem', marginTop: '0.6rem', textAlign: 'center' }}>
                {current?.emoji} {current?.label}
            </div>
        </div>
    )
}
