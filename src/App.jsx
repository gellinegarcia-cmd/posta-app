import { useState } from 'react'
import './App.css'

const ROLES = [
  { id: 'medico', label: 'Médico', sub: 'Evoluciones y pase de sala' },
  { id: 'enfermeria', label: 'Enfermería', sub: 'Registro de turno' },
  { id: 'kinesiologia', label: 'Kinesiología', sub: 'Evolución funcional' },
]

export default function App() {
  const [rol, setRol] = useState(null)

  if (!rol) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0D1F16' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#52B788', marginBottom: 16 }} />
      <div style={{ fontSize: 32, fontWeight: 700, color: '#52B788', letterSpacing: '0.1em', marginBottom: 6 }}>POSTA</div>
      <div style={{ fontSize: 12, color: '#74A98A', marginBottom: 56, letterSpacing: '0.06em' }}>La verdad de cada guardia</div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ROLES.map(r => (
          <button
            key={r.id}
            onClick={() => setRol(r.id)}
            style={{
              background: '#152A1E',
              border: '0.5px solid rgba(82,183,136,0.2)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 500, color: '#E8F5EE', marginBottom: 3 }}>{r.label}</span>
            <span style={{ fontSize: 12, color: '#74A98A' }}>{r.sub}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D1F16', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#74A98A', fontSize: 14 }}>Módulo {rol} — próximamente</div>
    </div>
  )
}
