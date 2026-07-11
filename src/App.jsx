import { useState, useRef, useCallback, useEffect } from 'react'
import { jsPDF } from 'jspdf'
import './App.css'

const API = 'https://kiosco-ai.onrender.com'

const S = {
  verde: '#52B788',
  verdeOsc: '#1B4332',
  verdeCard: '#152A1E',
  bg: '#0D1F16',
  muted: '#74A98A',
  border: 'rgba(82,183,136,0.15)',
  amber: '#EF9F27',
  amberBg: 'rgba(186,117,23,0.06)',
  amberBorder: 'rgba(186,117,23,0.3)',
  text: '#E8F5EE',
  rojo: '#EF4444',
}

const ROLES = [
  { id: 'medico', label: 'Médico', sub: 'Evoluciones y pase de sala' },
  { id: 'enfermeria', label: 'Enfermería', sub: 'Registro de turno' },
  { id: 'kinesiologia', label: 'Kinesiología', sub: 'Evolución funcional' },
]

const SERVICIOS = ['UCI / UTI', 'Guardia general', 'Demanda espontánea', 'Pediatría', 'Neonatología', 'Clínica médica', 'Cirugía', 'Otro']
const TURNOS = ['Mañana', 'Tarde', 'Noche', '24 hs']

function generarTurnoId() {
  return 'T' + Date.now().toString(36).toUpperCase()
}

function fechaHoy() {
  return new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function limpiarTexto(texto) {
  if (!texto) return ''
  return texto
    .replace(/###\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/^-\s+/gm, '• ')
    .replace(/^•\s*/gm, '• ')
    .trim()
}

function PantallaRol({ onSelect, onCambiarProfesional }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: S.bg }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: S.verde, marginBottom: 16 }} />
      <div style={{ fontSize: 32, fontWeight: 700, color: S.verde, letterSpacing: '0.1em', marginBottom: 6 }}>POSTA</div>
      <div style={{ fontSize: 12, color: S.muted, marginBottom: 56, letterSpacing: '0.06em' }}>La verdad de cada guardia</div>
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => onSelect(r.id)} style={{ background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: S.text, marginBottom: 3 }}>{r.label}</span>
            <span style={{ fontSize: 12, color: S.muted }}>{r.sub}</span>
          </button>
        ))}
      </div>
      <button onClick={onCambiarProfesional} style={{ marginTop: 24, width: '100%', maxWidth: 320, background: 'transparent', color: S.muted, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>
        Cambiar profesional
      </button>
    </div>
  )
}

function PantallaRegistro({ onGuardar, onSaltear, onVolver }) {
  const hayMedicoGuardado = !!localStorage.getItem('posta_medico')
  const [form, setForm] = useState(() => {
    try {
      const guardado = localStorage.getItem('posta_medico')
      if (guardado) return JSON.parse(guardado)
    } catch {}
    return { nombre: '', matriculaProv: '', matriculaNac: '', especialidad: '', institucionDefault: '' }
  })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const campos = [
    ['nombre', 'Nombre completo', 'Dr. García, Juan Carlos'],
    ['matriculaProv', 'Matrícula provincial', 'Ej: 28.450'],
    ['matriculaNac', 'Matrícula nacional', 'Ej: 156.230 (opcional)'],
    ['especialidad', 'Especialidad', 'Médico Intensivista'],
    ['institucionDefault', 'Institución habitual', 'Hospital / Clínica'],
  ]
  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '14px 16px', borderBottom: `0.5px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        {hayMedicoGuardado && (
          <button onClick={onVolver} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        )}
        <div style={{ flex: 1, textAlign: hayMedicoGuardado ? 'left' : 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: S.verde, letterSpacing: '0.08em' }}>POSTA</div>
          <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>Tus datos aparecerán al pie de cada evolución</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16 }}>
        {campos.map(([k, l, p]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 5 }}>{l}</label>
            <input value={form[k]} onChange={e => upd(k, e.target.value)} placeholder={p}
              style={{ width: '100%', background: S.verdeCard, border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: S.text, outline: 'none' }} />
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => form.nombre && onGuardar(form)} style={{ width: '100%', background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Guardar y entrar a guardia →
        </button>
        {hayMedicoGuardado && (
          <button onClick={onSaltear} style={{ width: '100%', background: 'transparent', color: S.muted, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>
            Continuar sin cambios
          </button>
        )}
      </div>
    </div>
  )
}

function PantallaInicioTurno({ medico, onComenzar, onVolver }) {
  const [institucion, setInstitucion] = useState(medico.institucionDefault || '')
  const [servicio, setServicio] = useState('UCI / UTI')
  const [turno, setTurno] = useState('Mañana')
  const selectStyle = { width: '100%', background: S.verdeCard, border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: S.text, outline: 'none', cursor: 'pointer' }
  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '14px 16px', borderBottom: `0.5px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.verde, letterSpacing: '0.08em' }}>POSTA</div>
          <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>¿Dónde estás hoy?</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16 }}>
        <div style={{ fontSize: 13, color: S.muted, marginBottom: 20, lineHeight: 1.6 }}>
          Estos datos van en el encabezado de todas las evoluciones de este turno.
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 5 }}>Institución</label>
          <input value={institucion} onChange={e => setInstitucion(e.target.value)} placeholder="UPA 5 Longchamps"
            style={{ width: '100%', background: S.verdeCard, border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: S.text, outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 5 }}>Servicio</label>
          <select value={servicio} onChange={e => setServicio(e.target.value)} style={selectStyle}>
            {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 5 }}>Turno</label>
          <select value={turno} onChange={e => setTurno(e.target.value)} style={selectStyle}>
            {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: '10px 13px', marginTop: 8 }}>
          <div style={{ fontSize: 10, color: S.muted, marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Encabezado del PDF</div>
          <div style={{ fontSize: 12, color: S.text, lineHeight: 1.7 }}>
            {institucion || 'Institución'} · {servicio}<br />
            {fechaHoy()} · Turno {turno}<br />
            <span style={{ color: S.muted }}>{medico.nombre || 'Dr.'} · {medico.especialidad || ''} · Mat. Prov. {medico.matriculaProv || '-'}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}` }}>
        <button onClick={() => onComenzar({ institucion: institucion || medico.institucionDefault, servicio, turno })}
          style={{ width: '100%', background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          Comenzar guardia →
        </button>
      </div>
    </div>
  )
}

function ModalPaciente({ onGuardar, onCerrar }) {
  const [form, setForm] = useState({ cama: '', nombre: '', dni: '', edad: '', dx: '' })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const campos = [
    ['cama', 'Cama', 'Ej: 8'],
    ['nombre', 'Apellido y nombre', 'Pérez, Juan Carlos'],
    ['dni', 'DNI', '18.432.901'],
    ['edad', 'Edad', '58'],
    ['dx', 'Diagnóstico principal', 'Neumonía grave · ARM día 7'],
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={e => e.target === e.currentTarget && onCerrar()}>
      <div style={{ background: S.verdeCard, borderRadius: '16px 16px 0 0', padding: '20px 16px', width: '100%', border: `0.5px solid rgba(82,183,136,0.2)`, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: S.text, marginBottom: 4 }}>Nuevo paciente</div>
        <div style={{ fontSize: 11, color: S.muted, marginBottom: 16 }}>Completá antes de entrar a la habitación</div>
        {campos.map(([k, l, p]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: S.muted, display: 'block', marginBottom: 5 }}>{l}</label>
            <input value={form[k]} onChange={e => upd(k, e.target.value)} placeholder={p}
              style={{ width: '100%', background: S.bg, border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 8, padding: '10px 12px', fontSize: 14, color: S.text, outline: 'none' }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onCerrar} style={{ flex: 1, background: 'transparent', color: S.muted, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: 11, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => form.cama && form.nombre && onGuardar(form)}
            style={{ flex: 2, background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 8, padding: 11, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Entrar a la habitación →
          </button>
        </div>
      </div>
    </div>
  )
}

function PanelCamas({ rol, turnoInfo, medico, pacientes, onPaciente, onAgregar, onEliminar, onPdfTurno, onFinalizar, onVolver, onEditarPerfil }) {
  const [swipedId, setSwipedId] = useState(null)
  const touchStartX = useRef(0)
  const pasados = pacientes.filter(p => p.estado === 'pasado').length
  const pendientes = pacientes.filter(p => p.estado !== 'pasado').length
  const alertas = pacientes.filter(p => p.alerta).length
  const ordenados = [
    ...pacientes.filter(p => p.alerta),
    ...pacientes.filter(p => !p.alerta && p.estado !== 'pasado'),
    ...pacientes.filter(p => p.estado === 'pasado'),
  ]

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e, id) {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (dx > 40) setSwipedId(id)
    else if (dx < -20) setSwipedId(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '14px 16px', borderBottom: `0.5px solid ${S.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => onVolver()} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
            <button onClick={onEditarPerfil} style={{ background: 'none', border: 'none', color: S.muted, cursor: 'pointer', fontSize: 18, padding: 0 }} title="Editar perfil">
              ⚙
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: S.verde, letterSpacing: '0.08em' }}>POSTA</div>
          </div>
          <div style={{ fontSize: 11, color: S.verde, background: 'rgba(82,183,136,0.12)', padding: '3px 10px', borderRadius: 99, border: `0.5px solid rgba(82,183,136,0.2)`, textTransform: 'capitalize' }}>{rol}</div>
        </div>
        <div style={{ fontSize: 11, color: S.muted }}>{turnoInfo.institucion} · {turnoInfo.servicio} · Turno {turnoInfo.turno}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: S.muted }}>Total <strong style={{ color: S.verde }}>{pacientes.length}</strong></span>
          <span style={{ fontSize: 11, color: S.muted }}>Pasados <strong style={{ color: S.verde }}>{pasados}</strong></span>
          <span style={{ fontSize: 11, color: S.muted }}>Pendientes <strong style={{ color: S.verde }}>{pendientes}</strong></span>
          {alertas > 0 && <span style={{ fontSize: 11, color: S.muted }}>Alertas <strong style={{ color: S.amber }}>{alertas}</strong></span>}
        </div>
      </div>

      <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: S.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Mis pacientes · deslizá para eliminar</div>

        {ordenados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: S.muted, fontSize: 13 }}>
            No hay pacientes todavía.<br />Tocá + para agregar el primero.
          </div>
        )}

        {ordenados.map(p => (
          <div key={p.id} style={{ position: 'relative', marginBottom: 8, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 72, background: 'rgba(239,68,68,0.15)', border: `0.5px solid rgba(239,68,68,0.3)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => { if (window.confirm(`¿Eliminás a ${p.nombre} del turno?`)) { onEliminar(p.id); setSwipedId(null) } }}>
              <span style={{ fontSize: 20, color: S.rojo }}>🗑</span>
            </div>
            <button
              onTouchStart={handleTouchStart}
              onTouchEnd={e => handleTouchEnd(e, p.id)}
              onClick={() => { if (swipedId === p.id) { setSwipedId(null); return } onPaciente(p) }}
              style={{ background: p.alerta ? S.amberBg : S.verdeCard, border: `0.5px solid ${p.alerta ? S.amberBorder : p.estado === 'pasado' ? 'rgba(82,183,136,0.2)' : S.border}`, borderRadius: 10, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', opacity: p.estado === 'pasado' ? 0.7 : 1, textAlign: 'left', width: '100%', position: 'relative', transition: 'transform 0.2s ease', transform: swipedId === p.id ? 'translateX(-72px)' : 'translateX(0)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: p.alerta ? 'rgba(186,117,23,0.15)' : p.estado === 'pasado' ? 'rgba(82,183,136,0.06)' : 'rgba(82,183,136,0.12)', color: p.alerta ? S.amber : S.verde, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                {p.cama}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: S.text, marginBottom: 2 }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: S.muted }}>{p.dx}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: p.alerta ? 'rgba(186,117,23,0.1)' : p.estado === 'pasado' ? 'rgba(82,183,136,0.1)' : 'rgba(82,183,136,0.06)', color: p.alerta ? S.amber : p.estado === 'pasado' ? '#40916C' : S.muted, flexShrink: 0 }}>
                {p.alerta ? '⚠ Alerta' : p.estado === 'pasado' ? '✓ Pasado' : 'Pendiente'}
              </span>
            </button>
          </div>
        ))}

        <div style={{ height: '0.5px', background: 'rgba(82,183,136,0.1)', margin: '12px 0' }} />

        <button onClick={onAgregar} style={{ width: '100%', background: 'rgba(82,183,136,0.04)', border: '0.5px dashed rgba(82,183,136,0.15)', borderRadius: 10, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(82,183,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.verde, fontSize: 18 }}>+</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: S.verde }}>Agregar paciente</div>
            <div style={{ fontSize: 11, color: '#4a7c5f' }}>Nuevo ingreso o transferencia</div>
          </div>
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pasados > 0 && (
          <button onClick={onPdfTurno} style={{ width: '100%', background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Descargar PDF del turno ({pasados} pacientes)
          </button>
        )}
        <button onClick={() => {
          localStorage.removeItem('posta_turno_info')
          localStorage.removeItem('posta_pacientes')
          localStorage.removeItem('posta_paciente_actual')
          localStorage.removeItem('posta_rol')
          onFinalizar()
        }} style={{ width: '100%', background: 'transparent', color: S.muted, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>
          Finalizar turno
        </button>
      </div>
    </div>
  )
}

function PantallaPase({ paciente, rol, turnoId, onFinalizar, onCancelar }) {
  const [grabando, setGrabando] = useState(false)
  const [pausado, setPausado] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const iniciarGrabacion = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstart = () => {
        setGrabando(true)
        setError(null)
        let count = 0
        timerRef.current = setInterval(() => { count++; setSegundos(count) }, 1000)
      }
      mr.onerror = e => setError('Error en la grabación: ' + e.message)
      mediaRef.current = mr
      mr.start(500)
    } catch (e) {
      setError(e.name === 'NotAllowedError' ? 'Permiso de micrófono denegado.' : 'Error al iniciar: ' + e.message)
    }
  }, [])

  const pausarReanudar = useCallback(() => {
    if (!mediaRef.current) return
    if (pausado) {
      mediaRef.current.resume()
      let count = segundos
      timerRef.current = setInterval(() => { count++; setSegundos(count) }, 1000)
    } else {
      mediaRef.current.pause()
      clearInterval(timerRef.current)
    }
    setPausado(p => !p)
  }, [pausado, segundos])

  const finalizarYAnalizar = useCallback(async () => {
    if (!mediaRef.current) { setError('No hay grabación activa.'); return }
    clearInterval(timerRef.current)
    setProcesando(true)
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    await new Promise(r => setTimeout(r, 1000))
    const mimeType = chunksRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    if (blob.size < 1000) { setError('Audio muy corto. Grabá al menos 10 segundos.'); setProcesando(false); return }
    const ext = mimeType.includes('mp4') ? 'pase.mp4' : 'pase.webm'
    const formData = new FormData()
    formData.append('audio', blob, ext)
    formData.append('turno_id', turnoId)
    formData.append('cama', paciente.cama)
    formData.append('nombre', paciente.nombre)
    formData.append('dni', paciente.dni || '')
    formData.append('edad', paciente.edad || '')
    formData.append('dx', paciente.dx || '')
    formData.append('rol', rol)
    try {
      const resAudio = await fetch(`${API}/posta/audio`, { method: 'POST', body: formData })
      const audioData = await resAudio.json()
      if (!resAudio.ok) throw new Error(audioData.error || 'Error al subir audio')
      const resAnalisis = await fetch(`${API}/posta/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turnoId, cama: paciente.cama, nombre: paciente.nombre, edad: paciente.edad, dx: paciente.dx, rol })
      })
      const data = await resAnalisis.json()
      if (!resAnalisis.ok) throw new Error(data.error || 'Error al analizar')
      onFinalizar({ ...paciente, evolucion: data.evolucion, estado: 'pasado' })
    } catch (e) {
      setError('Error: ' + e.message)
      setProcesando(false)
    }
  }, [paciente, rol, turnoId, onFinalizar])

  const min = Math.floor(segundos / 60).toString().padStart(2, '0')
  const seg = (segundos % 60).toString().padStart(2, '0')

  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '12px 16px', borderBottom: `0.5px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onCancelar} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.verde, letterSpacing: '0.06em' }}>POSTA</div>
          <div style={{ fontSize: 11, color: S.muted }}>Cama {paciente.cama} · {paciente.nombre}</div>
        </div>
        {grabando && <div style={{ fontSize: 10, color: S.rojo, background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: 99 }}>● Grabando</div>}
      </div>

      {grabando && (
        <div style={{ background: S.verdeOsc, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: pausado ? S.muted : S.rojo }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{min}:{seg}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pausado ? 'Pausado' : 'Grabando pase'}</div>
            </div>
          </div>
          <button onClick={pausarReanudar} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>
            {pausado ? 'Reanudar' : 'Pausar'}
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <div style={{ background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 12, padding: '14px 18px', width: '100%', maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: S.muted, marginBottom: 3 }}>Cama {paciente.cama} · {paciente.edad} años</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: S.text, marginBottom: 3 }}>{paciente.nombre}</div>
          <div style={{ fontSize: 12, color: S.verde }}>{paciente.dx}</div>
        </div>

        {error && <div style={{ fontSize: 12, color: S.rojo, textAlign: 'center', padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, width: '100%' }}>{error}</div>}

        {procesando ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚕</div>
            <div style={{ fontSize: 14, color: S.muted }}>Analizando el pase...</div>
            <div style={{ fontSize: 12, color: '#4a7c5f', marginTop: 6 }}>POSTA está organizando la evolución</div>
          </div>
        ) : !grabando ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button onClick={iniciarGrabacion} style={{ width: 80, height: 80, borderRadius: '50%', background: S.verdeOsc, border: `2px solid rgba(82,183,136,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, cursor: 'pointer' }}>🎙</button>
            <div style={{ fontSize: 13, color: S.muted, textAlign: 'center', lineHeight: 1.5 }}>
              Te escucho<br/>
              <span style={{ fontSize: 11, color: '#4a7c5f' }}>hagamos esta guardia más ligera</span>
            </div>
          </div>
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.verdeOsc, border: `2px solid rgba(82,183,136,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎙</div>
        )}
      </div>

      {grabando && !procesando && (
        <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}` }}>
          <button onClick={finalizarYAnalizar} style={{ width: '100%', background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Finalizar paciente →
          </button>
        </div>
      )}
    </div>
  )
}

function generarTextoPDFIndividual(paciente, turnoInfo, medico) {
  const evolucion = paciente.evolucion || ''
  const partes = evolucion.split('---EVOLUCIÓN PARA HISTORIA CLÍNICA---')
  const seccionesRaw = partes[0] || ''

  const getSec = (titulo) => {
    const regex = new RegExp(`###\\s*${titulo}\\s*\\n([\\s\\S]*?)(?=###|---EVOLUCIÓN|$)`, 'i')
    const match = seccionesRaw.match(regex)
    if (!match) return ''
    return match[1].trim().split('\n').filter(l => l.trim())
      .map(l => '  • ' + l.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim())
      .join('\n')
  }

  const situacion = getSec('Situación actual')
  const evolucionDia = getSec('Evolución del día')
  const conducta = getSec('Conducta / Plan')
  const medicacion = getSec('Medicación')
  const urgente = getSec('Urgente hoy')
  const pendiente = getSec('Pendiente próximos días')
  const sep = '─'.repeat(48)

  let contenido = `EVOLUCIÓN MÉDICA
${sep}
${turnoInfo.institucion} · ${turnoInfo.servicio}
${fechaHoy()} · Turno ${turnoInfo.turno} · Cama ${paciente.cama}
${sep}
Paciente    : ${paciente.nombre}
Edad / DNI  : ${paciente.edad} años · DNI ${paciente.dni}
Diagnóstico : ${paciente.dx}
${sep}
`
  if (situacion) contenido += `\nDIAGNÓSTICO / SITUACIÓN ACTUAL\n${situacion}\n`
  if (evolucionDia) contenido += `\nEVOLUCIÓN DEL DÍA\n${evolucionDia}\n`
  if (conducta) contenido += `\nAL PIE DE CAMA / CONDUCTA\n${conducta}\n`
  if (medicacion) contenido += `\nINDICACIONES\n${medicacion}\n`
  if (urgente) contenido += `\nURGENTE HOY\n${urgente}\n`
  if (pendiente) contenido += `\nPENDIENTE\n${pendiente}\n`

  contenido += `
${sep}
Firma y sello

${medico.nombre}
${medico.especialidad}${medico.matriculaProv ? ` · Mat. Prov. ${medico.matriculaProv}` : ''}${medico.matriculaNac ? ` · Mat. Nac. ${medico.matriculaNac}` : ''}
${sep}`

  return contenido
}

function generarTextoPDFTurno(pacientes, turnoInfo, medico) {
  const sep = '─'.repeat(48)
  const pasados = pacientes.filter(p => p.estado === 'pasado' && p.evolucion)

  const resumen = pasados.map(p => {
    const evolucion = p.evolucion || ''
    const partes = evolucion.split('---EVOLUCIÓN PARA HISTORIA CLÍNICA---')
    const seccionesRaw = partes[0] || ''

    const getSec = (titulo) => {
      const regex = new RegExp(`###\\s*${titulo}\\s*\\n([\\s\\S]*?)(?=###|---EVOLUCIÓN|$)`, 'i')
      const match = seccionesRaw.match(regex)
      if (!match) return ''
      return match[1].trim().split('\n').filter(l => l.trim())
        .map(l => '  • ' + l.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim())
        .join('\n')
    }

    const situacion = getSec('Situación actual')
    const evolucionDia = getSec('Evolución del día')
    const conducta = getSec('Conducta / Plan')
    const urgente = getSec('Urgente hoy')
    const pendiente = getSec('Pendiente próximos días')

    let bloque = `CAMA ${p.cama} · ${p.nombre} · ${p.edad} años · DNI ${p.dni}
Diagnóstico: ${p.dx}
`
    if (situacion) bloque += `\nSITUACIÓN ACTUAL\n${situacion}\n`
    if (evolucionDia) bloque += `\nEVOLUCIÓN DEL DÍA\n${evolucionDia}\n`
    if (conducta) bloque += `\nCONDUCTA\n${conducta}\n`
    if (urgente) bloque += `\nURGENTE HOY\n${urgente}\n`
    if (pendiente) bloque += `\nPENDIENTE\n${pendiente}\n`

    return bloque
  }).join(`\n${sep}\n\n`)

  return `PASE DE GUARDIA
${sep}
${turnoInfo.institucion} · ${turnoInfo.servicio}
${fechaHoy()} · Turno ${turnoInfo.turno}
${sep}
${medico.nombre} · ${medico.especialidad}${medico.matriculaProv ? ` · Mat. Prov. ${medico.matriculaProv}` : ''}
${sep}

${resumen}

${sep}
Total pacientes: ${pasados.length}
${sep}`
}

function PantallaFichaPaciente({ paciente, rol, turnoId, turnoInfo, medico, onVolver, onSiguiente }) {
  const [editandoPDF, setEditandoPDF] = useState(false)
  const [textoPDF, setTextoPDF] = useState('')
  const [tab, setTab] = useState('evolucion')
  const [mensajes, setMensajes] = useState(() => {
    try {
      const guardados = localStorage.getItem(`posta_chat_${paciente.id}`)
      if (guardados) return JSON.parse(guardados)
    } catch {}
    return [{ role: 'assistant', content: `Analicemos juntos a ${paciente.nombre}. Estoy al tanto de todo lo que pasó hoy. Preguntame lo que necesitás.` }]
  })

  useEffect(() => {
    localStorage.setItem(`posta_chat_${paciente.id}`, JSON.stringify(mensajes))
  }, [mensajes, paciente.id])

  const [inputChat, setInputChat] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [grabandoConsulta, setGrabandoConsulta] = useState(false)
  const [grabandoPase, setGrabandoPase] = useState(false)
  const [contextoCompleto, setContextoCompleto] = useState(paciente.evolucion || '')
  const [copiado, setCopiado] = useState(false)
  const mediaConsultaRef = useRef(null)
  const chunksConsultaRef = useRef([])
  const mediaPaseRef = useRef(null)
  const chunksPaseRef = useRef([])

  const evolucion = paciente.evolucion || ''
  const partes = evolucion.split('---EVOLUCIÓN PARA HISTORIA CLÍNICA---')
  const seccionesCli = partes[0] || ''
  const textoHC = partes[1]?.trim() || ''

  const secciones = seccionesCli.split('###').filter(s => s.trim()).map(s => {
    const lineas = s.trim().split('\n')
    return { titulo: lineas[0].trim(), contenido: lineas.slice(1).join('\n').trim() }
  })

  const colores = {
    'Situación actual': S.verde,
    'Evolución del día': '#60A5FA',
    'Conducta / Plan': '#A78BFA',
    'Estudios pendientes': S.amber,
    'Medicación': '#74A98A',
    'Urgente hoy': S.rojo,
    'Pendiente próximos días': '#F97316',
    'Alerta POSTA': S.amber,
  }

  useEffect(() => {
    fetch(`${API}/posta/contexto/${turnoId}/${paciente.cama}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.contexto) setContextoCompleto(data.contexto + '\n\nEVOLUCIÓN:\n' + (paciente.evolucion || '')) })
      .catch(() => {})
  }, [])

  function copiar() {
    navigator.clipboard.writeText(textoHC || evolucion)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function abrirEditorPDF() {
    try {
      const texto = generarTextoPDFIndividual(
        paciente,
        turnoInfo || { institucion: '', servicio: '', turno: '' },
        medico || { nombre: '', especialidad: '', matriculaProv: '', matriculaNac: '' }
      )
      setTextoPDF(texto)
      setEditandoPDF(true)
    } catch(e) {
      alert('Error al generar PDF: ' + e.message)
    }
  }

  function descargarPDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margen = 15
    const anchoUtil = 180
    let y = 20

    const addLinea = (texto, size = 10, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lineas = doc.splitTextToSize(texto, anchoUtil)
      lineas.forEach(l => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(l, margen, y)
        y += size * 0.45
      })
    }

    const addSep = () => {
      doc.setDrawColor(180, 180, 180)
      doc.line(margen, y, margen + anchoUtil, y)
      y += 5
    }

    textoPDF.split('\n').forEach(linea => {
      const trimmed = linea.trim()
      if (trimmed.match(/^─+$/)) {
        addSep()
      } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('•')) {
        y += 2
        addLinea(trimmed, 10, true)
        y += 2
      } else {
        addLinea(linea, 9, false)
      }
    })

    const nombreArchivo = `POSTA_Cama${paciente.cama}_${paciente.nombre.replace(/,\s*/g,'_')}_${fechaHoy().replace(/\//g,'-')}.pdf`
    doc.save(nombreArchivo)
    setEditandoPDF(false)
  }

  async function enviarChat(texto) {
    if (!texto.trim() || loadingChat) return
    setInputChat('')
    const nuevos = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevos)
    setLoadingChat(true)
    try {
      const res = await fetch(`${API}/posta/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: texto,
          contexto_paciente: `Sos el asistente clínico POSTA. Conocés todo sobre este paciente y su guardia de hoy.
DATOS DEL PACIENTE:
- Nombre: ${paciente.nombre}
- Edad: ${paciente.edad} años
- DNI: ${paciente.dni}
- Cama: ${paciente.cama}
- Diagnóstico: ${paciente.dx}
- Servicio: ${turnoInfo?.servicio || ''}
- Institución: ${turnoInfo?.institucion || ''}

CONTEXTO DEL PASE DE HOY:
${contextoCompleto}

Respondé siempre en el contexto de este paciente específico. Sé preciso y cercano.`,
          historial: nuevos.slice(-8),
        })
      })
      const data = await res.json()
      setMensajes([...nuevos, { role: 'assistant', content: data.respuesta || 'Error al procesar.' }])
    } catch {
      setMensajes([...nuevos, { role: 'assistant', content: 'No pude conectarme.' }])
    }
    setLoadingChat(false)
  }

  async function grabarConsulta(iniciar) {
    if (iniciar) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
        chunksConsultaRef.current = []
        mr.ondataavailable = e => { if (e.data.size > 0) chunksConsultaRef.current.push(e.data) }
        mr.start(500)
        mediaConsultaRef.current = mr
        setGrabandoConsulta(true)
      } catch (e) { alert('Error micrófono: ' + e.message) }
    } else {
      mediaConsultaRef.current?.stop()
      mediaConsultaRef.current?.stream.getTracks().forEach(t => t.stop())
      setGrabandoConsulta(false)
      await new Promise(r => setTimeout(r, 500))
      const mimeType = chunksConsultaRef.current[0]?.type || 'audio/webm'
      const blob = new Blob(chunksConsultaRef.current, { type: mimeType })
      if (blob.size < 500) return
      const fd = new FormData()
      fd.append('audio', blob, mimeType.includes('mp4') ? 'consulta.mp4' : 'consulta.webm')
      fd.append('turno_id', turnoId); fd.append('cama', paciente.cama); fd.append('nombre', paciente.nombre)
      fd.append('dni', paciente.dni || ''); fd.append('edad', paciente.edad || ''); fd.append('dx', paciente.dx || ''); fd.append('rol', rol)
      try {
        const res = await fetch(`${API}/posta/audio`, { method: 'POST', body: fd })
        const data = await res.json()
        if (data.transcripcion) await enviarChat(data.transcripcion)
      } catch {}
    }
  }

  const TABS = [
    { id: 'evolucion', label: 'Evolución hoy' },
    { id: 'historia', label: 'Historia clínica' },
    { id: 'consultar', label: 'Consultar' },
  ]

  return (
    <>
      {editandoPDF && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: S.verdeCard, padding: '12px 16px', borderBottom: `0.5px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setEditandoPDF(false)} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: S.verde }}>Revisar evolución</div>
              <div style={{ fontSize: 11, color: S.muted }}>Editá antes de descargar</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: S.bg }}>
            <div style={{ fontSize: 11, color: S.muted, marginBottom: 8 }}>Podés corregir cualquier dato antes de descargar.</div>
            <textarea
              value={textoPDF}
              onChange={e => setTextoPDF(e.target.value)}
              style={{ width: '100%', minHeight: 400, background: S.verdeCard, border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 10, padding: 12, fontSize: 12, color: S.text, outline: 'none', lineHeight: 1.7, resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>
          <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}`, display: 'flex', gap: 8, background: S.bg, flexShrink: 0 }}>
            <button onClick={() => setEditandoPDF(false)} style={{ flex: 1, background: 'transparent', color: S.muted, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={descargarPDF} style={{ flex: 2, background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Descargar PDF →
            </button>
          </div>
        </div>
      )}
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '12px 16px', borderBottom: `0.5px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onVolver} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 24, cursor: 'pointer', padding: 0, lineHeight: 1 }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.verde, letterSpacing: '0.06em' }}>POSTA</div>
          <div style={{ fontSize: 11, color: S.muted }}>Cama {paciente.cama} · {paciente.nombre}</div>
        </div>
        <div style={{ fontSize: 10, color: S.verde, background: 'rgba(82,183,136,0.12)', padding: '3px 10px', borderRadius: 99, border: `0.5px solid rgba(82,183,136,0.2)` }}>
          {paciente.dx?.split('·')[1]?.trim() || 'Internado'}
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: `0.5px solid ${S.border}`, padding: '0 16px', background: S.bg }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ fontSize: 12, padding: '10px 12px', color: tab === t.id ? S.verde : S.muted, background: 'none', border: 'none', cursor: 'pointer', borderBottom: `2px solid ${tab === t.id ? S.verde : 'transparent'}`, marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'evolucion' && (
        <>
          <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
            <div style={{ background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: '10px 13px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>Cama {paciente.cama} · {paciente.edad} años · DNI {paciente.dni}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: S.text, marginBottom: 2 }}>{paciente.nombre}</div>
              <div style={{ fontSize: 12, color: S.verde }}>{paciente.dx}</div>
            </div>

            {secciones.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: S.verdeCard, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12 }}>⚕</div>
                <div style={{ fontSize: 14, color: S.text, fontWeight: 500, marginBottom: 6 }}>Esperando evolución de hoy</div>
                <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.6 }}>Grabá el pase para que POSTA organice la evolución de esta guardia.</div>
              </div>
            ) : secciones.map((sec, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: colores[sec.titulo] || S.verde, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${colores[sec.titulo] || S.verde}` }}>
                  {sec.titulo}
                </div>
                <div style={{ fontSize: 13, color: S.text, lineHeight: 1.6 }}>
                  {sec.contenido.split('\n').filter(l => l.trim()).map((l, j) => (
                    <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: S.muted, flexShrink: 0 }}>·</span>
                      <span>{l.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={grabandoPase ? async () => {
                mediaPaseRef.current?.stop()
                mediaPaseRef.current?.stream.getTracks().forEach(t => t.stop())
                setGrabandoPase(false)
              } : async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
                  const mr = new MediaRecorder(stream, { mimeType })
                  chunksPaseRef.current = []
                  mr.ondataavailable = e => { if (e.data.size > 0) chunksPaseRef.current.push(e.data) }
                  mr.start(500)
                  mediaPaseRef.current = mr
                  setGrabandoPase(true)
                } catch (e) { alert('Error micrófono') }
              }}
              style={{ width: '100%', background: grabandoPase ? 'rgba(239,68,68,0.06)' : S.verdeCard, border: `0.5px solid ${grabandoPase ? 'rgba(239,68,68,0.4)' : 'rgba(82,183,136,0.2)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: grabandoPase ? 'rgba(239,68,68,0.15)' : 'rgba(82,183,136,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎙</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: grabandoPase ? S.rojo : S.text }}>{grabandoPase ? 'Grabando... tocá para detener' : 'Te escucho, hagamos esta guardia más ligera'}</div>
                <div style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>{grabandoPase ? 'Hablá con normalidad' : 'Tocá para agregar al pase'}</div>
              </div>
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={abrirEditorPDF} style={{ flex: 1, background: 'transparent', color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>
                Descargar PDF
              </button>
              <button onClick={onSiguiente} style={{ flex: 2, background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                + Siguiente paciente
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'historia' && (
        <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, color: S.muted, marginBottom: 12 }}>Evoluciones anteriores — solo lectura</div>
          <div style={{ background: S.verdeCard, border: `0.5px solid rgba(82,183,136,0.1)`, borderRadius: 8, padding: '10px 12px', marginBottom: 10, opacity: 0.5 }}>
            <div style={{ fontSize: 10, color: S.muted, marginBottom: 4 }}>Sin registros anteriores en POSTA</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>Las evoluciones previas aparecerán aquí en los próximos turnos.</div>
          </div>
          {textoHC && (
            <>
              <div style={{ fontSize: 10, fontWeight: 500, color: S.verde, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 8, borderLeft: `2px solid ${S.verde}` }}>
                Evolución de hoy · para copiar
              </div>
              <div style={{ background: 'rgba(82,183,136,0.04)', border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: S.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Historia clínica</div>
                  <button onClick={copiar} style={{ fontSize: 11, color: copiado ? S.verde : S.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {copiado ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>{textoHC}</div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid rgba(82,183,136,0.1)`, fontSize: 11, color: S.muted }}>
                  {medico.nombre} · {medico.especialidad} · Mat. Prov. {medico.matriculaProv}
                </div>
              </div>
              <button onClick={abrirEditorPDF} style={{ width: '100%', background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Revisar y descargar PDF →
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'consultar' && (
        <>
          <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{ maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? S.verdeOsc : S.verdeCard, border: `0.5px solid ${m.role === 'user' ? 'rgba(82,183,136,0.3)' : S.border}`, padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6, color: S.text }}>
                {m.role === 'assistant' && <div style={{ fontSize: 9, color: S.verde, marginBottom: 4, letterSpacing: '0.06em', fontWeight: 500 }}>POSTA</div>}
                {m.content}
              </div>
            ))}
            {loadingChat && (
              <div style={{ alignSelf: 'flex-start', background: S.verdeCard, border: `0.5px solid ${S.border}`, padding: '10px 14px', borderRadius: 12, fontSize: 13, color: S.muted, fontStyle: 'italic' }}>
                Analizando...
              </div>
            )}
          </div>
          <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => grabarConsulta(!grabandoConsulta)}
              style={{ width: '100%', background: grabandoConsulta ? 'rgba(239,68,68,0.06)' : S.verdeCard, border: `0.5px solid ${grabandoConsulta ? 'rgba(239,68,68,0.4)' : 'rgba(82,183,136,0.2)'}`, borderRadius: 10, padding: 12, fontSize: 13, color: grabandoConsulta ? S.rojo : S.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🎙</span>
              <span>{grabandoConsulta ? 'Grabando... tocá para enviar' : 'Preguntá por audio'}</span>
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarChat(inputChat)}
                placeholder="O escribí tu pregunta aquí..."
                style={{ flex: 1, background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: S.text, outline: 'none' }}
              />
              <button onClick={() => enviarChat(inputChat)} disabled={loadingChat || !inputChat.trim()} style={{ width: 36, height: 36, borderRadius: '50%', background: S.verdeOsc, border: 'none', color: S.verde, cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>↑</button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  )
}

export default function App() {
  const [rol, setRol] = useState(() => {
    return localStorage.getItem('posta_rol') || null
  })
  const [medico, setMedico] = useState(null)
  const [pacientes, setPacientes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('posta_pacientes') || '[]') } catch { return [] }
  })
  const [turnoInfo, setTurnoInfo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('posta_turno_info') || 'null') } catch { return null }
  })
  const [pacienteActual, setPacienteActual] = useState(() => {
    try { return JSON.parse(localStorage.getItem('posta_paciente_actual') || 'null') } catch { return null }
  })
  const [pantalla, setPantalla] = useState(() => {
    const medicoGuardado = localStorage.getItem('posta_medico')
    const turnoGuardado = localStorage.getItem('posta_turno_info')
    const rolGuardado = localStorage.getItem('posta_rol')
    if (!medicoGuardado) return 'registro'
    if (!rolGuardado) return 'rol'
    if (!turnoGuardado) return 'turno'
    return 'panel'
  })
  const [showModal, setShowModal] = useState(false)
  const [turnoId] = useState(generarTurnoId)

  useEffect(() => {
    const medicoGuardado = localStorage.getItem('posta_medico')
    if (medicoGuardado) setMedico(JSON.parse(medicoGuardado))
  }, [])

  useEffect(() => {
    localStorage.setItem('posta_pacientes', JSON.stringify(pacientes))
  }, [pacientes])

  useEffect(() => {
    if (turnoInfo) localStorage.setItem('posta_turno_info', JSON.stringify(turnoInfo))
  }, [turnoInfo])

  useEffect(() => {
    if (pacienteActual) localStorage.setItem('posta_paciente_actual', JSON.stringify(pacienteActual))
  }, [pacienteActual])

  useEffect(() => {
    if (pantalla !== 'panel' && pantalla !== 'ficha') return
    const handleBack = () => {
      if (pantalla === 'ficha') setPantalla('panel')
    }
    window.history.pushState({}, '')
    window.addEventListener('popstate', handleBack)
    return () => window.removeEventListener('popstate', handleBack)
  }, [pantalla])

  function guardarMedico(datos) {
    localStorage.setItem('posta_medico', JSON.stringify(datos))
    setMedico(datos)
    const turnoGuardado = localStorage.getItem('posta_turno_info')
    setPantalla(turnoGuardado ? 'panel' : 'rol')
  }

  function agregarPaciente(form) {
    const nuevo = { id: Date.now(), ...form, estado: 'pendiente', alerta: false, evolucion: null }
    setPacientes(p => [...p, nuevo])
    setShowModal(false)
    setPacienteActual(nuevo)
    setPantalla('pase')
  }

  function finalizarPase(pacienteConEvolucion) {
    setPacientes(prev => prev.map(p => p.id === pacienteConEvolucion.id ? pacienteConEvolucion : p))
    setPacienteActual(pacienteConEvolucion)
    setPantalla('ficha')
  }

  function eliminarPaciente(id) {
    setPacientes(prev => prev.filter(p => p.id !== id))
  }

  function volverAtras() {
    if (pantalla === 'ficha') setPantalla('panel')
    else if (pantalla === 'pase') setPantalla('panel')
    else if (pantalla === 'panel') {
      localStorage.removeItem('posta_turno_info')
      setTurnoInfo(null)
      setPantalla('turno')
    }
    else if (pantalla === 'turno') {
      localStorage.removeItem('posta_rol')
      setRol(null)
      setPantalla('rol')
    }
    else if (pantalla === 'rol') setPantalla('registro')
  }

  function generarPdfTurno() {
    const pasados = pacientes.filter(p => p.estado === 'pasado' && p.evolucion)
    if (pasados.length === 0) { alert('No hay evoluciones generadas todavía.'); return }
    const texto = generarTextoPDFTurno(pacientes, turnoInfo, medico)

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const margen = 15
    const anchoUtil = 180
    let y = 20

    const addLinea = (texto, size = 10, bold = false) => {
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lineas = doc.splitTextToSize(texto, anchoUtil)
      lineas.forEach(l => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(l, margen, y)
        y += size * 0.45
      })
    }

    const addSeparador = () => {
      doc.setDrawColor(180, 180, 180)
      doc.line(margen, y, margen + anchoUtil, y)
      y += 5
    }

    texto.split('\n').forEach(linea => {
      const trimmed = linea.trim()
      if (trimmed.match(/^─+$/)) {
        addSeparador()
      } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('•')) {
        y += 2
        addLinea(trimmed, 10, true)
        y += 2
      } else {
        addLinea(linea, 9, false)
      }
    })

    doc.save(`POSTA_Pase_${turnoInfo.servicio.replace(/\s/g,'_')}_${fechaHoy().replace(/\//g,'-')}.pdf`)
  }

  if (pantalla === 'registro') return (
    <PantallaRegistro
      onGuardar={guardarMedico}
      onSaltear={() => {
        const rolGuardado = localStorage.getItem('posta_rol')
        const turnoGuardado = localStorage.getItem('posta_turno_info')
        setPantalla(turnoGuardado ? 'panel' : rolGuardado ? 'turno' : 'rol')
      }}
      onVolver={() => {
        const rolGuardado = localStorage.getItem('posta_rol')
        const turnoGuardado = localStorage.getItem('posta_turno_info')
        if (turnoGuardado) setPantalla('panel')
        else if (rolGuardado) setPantalla('turno')
        else setPantalla('rol')
      }}
    />
  )
  if (!rol) return (
    <PantallaRol
      onSelect={r => { setRol(r); localStorage.setItem('posta_rol', r); setPantalla('turno') }}
      onCambiarProfesional={() => {
        localStorage.removeItem('posta_medico')
        localStorage.removeItem('posta_rol')
        localStorage.removeItem('posta_turno_info')
        localStorage.removeItem('posta_pacientes')
        localStorage.removeItem('posta_paciente_actual')
        setMedico(null)
        setRol(null)
        setTurnoInfo(null)
        setPacientes([])
        setPacienteActual(null)
        setPantalla('registro')
      }}
    />
  )
  if (pantalla === 'turno') return <PantallaInicioTurno medico={medico} onComenzar={info => { setTurnoInfo(info); localStorage.setItem('posta_turno_info', JSON.stringify(info)); setPantalla('panel') }} onVolver={() => { localStorage.removeItem('posta_rol'); setRol(null); setPantalla('rol') }} />
  if (pantalla === 'pase' && pacienteActual) return <PantallaPase paciente={pacienteActual} rol={rol} turnoId={turnoId} onFinalizar={finalizarPase} onCancelar={() => setPantalla('panel')} />
  if (pantalla === 'ficha' && pacienteActual) return (
    <PantallaFichaPaciente
      paciente={pacienteActual}
      rol={rol}
      turnoId={turnoId}
      turnoInfo={turnoInfo}
      medico={medico}
      onVolver={() => setPantalla('panel')}
      onSiguiente={() => { setPacienteActual(null); setShowModal(true); setPantalla('panel') }}
    />
  )

  return (
    <>
      <PanelCamas
        rol={rol}
        turnoInfo={turnoInfo}
        medico={medico}
        pacientes={pacientes}
        onPaciente={p => { setPacienteActual(p); setPantalla('ficha') }}
        onAgregar={() => setShowModal(true)}
        onEliminar={eliminarPaciente}
        onPdfTurno={generarPdfTurno}
        onVolver={volverAtras}
        onEditarPerfil={() => setPantalla('registro')}
        onFinalizar={() => {
          setRol(null)
          setTurnoInfo(null)
          setPacientes([])
          setPacienteActual(null)
          setPantalla('rol')
        }}
      />
      {showModal && <ModalPaciente onGuardar={agregarPaciente} onCerrar={() => setShowModal(false)} />}
    </>
  )
}
