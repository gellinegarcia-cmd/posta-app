import { useState, useRef, useCallback, useEffect } from 'react'
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

function generarTurnoId() {
  return 'T' + Date.now().toString(36).toUpperCase()
}

function PantallaRol({ onSelect }) {
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
    </div>
  )
}

function ModalPaciente({ onGuardar, onCerrar }) {
  const [form, setForm] = useState({ cama: '', nombre: '', dni: '', edad: '', dx: '' })
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const campos = [
    ['cama', 'Cama', 'Ej: 8'],
    ['nombre', 'Nombre completo', 'Apellido, Nombre'],
    ['dni', 'DNI', '12.345.678'],
    ['edad', 'Edad', '58'],
    ['dx', 'Diagnóstico principal', 'Ej: Neumonía grave · ARM día 7'],
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
      console.log('Solicitando permiso de micrófono...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      })
      console.log('Permiso concedido, iniciando grabación...')

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''

      console.log('MimeType seleccionado:', mimeType)

      const options = mimeType ? { mimeType } : {}
      const mr = new MediaRecorder(stream, options)
      chunksRef.current = []

      mr.ondataavailable = e => {
        console.log('Chunk recibido:', e.data.size, 'bytes')
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onerror = e => {
        console.error('Error en MediaRecorder:', e)
        setError('Error en la grabación: ' + e.message)
      }

      mr.start(500)
      console.log('MediaRecorder iniciado')
      mediaRef.current = mr
      setGrabando(true)
      setError(null)
      timerRef.current = setInterval(() => {
        if (mediaRef.current && mediaRef.current.state === 'recording') {
          setSegundos(s => s + 1)
        }
      }, 1000)
    } catch (e) {
      console.error('Error al iniciar grabación:', e.name, e.message)
      if (e.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado. Andá a configuración del navegador y permitilo.')
      } else if (e.name === 'NotFoundError') {
        setError('No se encontró micrófono en este dispositivo.')
      } else {
        setError('Error al iniciar grabación: ' + e.message)
      }
    }
  }, [])

  const pausarReanudar = useCallback(() => {
    if (!mediaRef.current) return
    if (pausado) {
      mediaRef.current.resume()
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000)
    } else {
      mediaRef.current.pause()
      clearInterval(timerRef.current)
    }
    setPausado(p => !p)
  }, [pausado])

  const finalizarYAnalizar = useCallback(async () => {
    if (!mediaRef.current) {
      console.error('mediaRef.current es null')
      setError('No hay grabación activa.')
      return
    }
    clearInterval(timerRef.current)
    setProcesando(true)
    console.log('Deteniendo MediaRecorder, estado:', mediaRef.current.state)
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    await new Promise(r => setTimeout(r, 1000))
    console.log('Chunks:', chunksRef.current.length, 'Total bytes:', chunksRef.current.reduce((a, c) => a + c.size, 0))
    const mimeType = chunksRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    console.log('Blob:', blob.size, 'bytes, tipo:', blob.type)
    if (blob.size < 1000) {
      setError('Audio muy corto. Grabá al menos 10 segundos.')
      setProcesando(false)
      return
    }
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
      console.log('Enviando a /posta/audio...')
      const resAudio = await fetch(`${API}/posta/audio`, { method: 'POST', body: formData })
      const audioData = await resAudio.json()
      console.log('Audio response:', resAudio.status, audioData)
      if (!resAudio.ok) throw new Error(audioData.error || 'Error al subir audio')
      console.log('Enviando a /posta/analizar...')
      const resAnalisis = await fetch(`${API}/posta/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turnoId, cama: paciente.cama, nombre: paciente.nombre, edad: paciente.edad, dx: paciente.dx, rol })
      })
      const data = await resAnalisis.json()
      console.log('Analisis response:', resAnalisis.status, data)
      if (!resAnalisis.ok) throw new Error(data.error || 'Error al analizar')
      onFinalizar({ ...paciente, evolucion: data.evolucion, estado: 'pasado' })
    } catch (e) {
      console.error('Error:', e.message)
      setError('Error: ' + e.message)
      setProcesando(false)
    }
  }, [paciente, rol, turnoId, onFinalizar])

  const min = Math.floor(segundos / 60).toString().padStart(2, '0')
  const seg = (segundos % 60).toString().padStart(2, '0')

  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '14px 16px', borderBottom: `0.5px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.verde, letterSpacing: '0.08em' }}>POSTA</div>
          <div style={{ fontSize: 10, color: S.muted }}>Cama {paciente.cama} · {paciente.nombre}</div>
        </div>
        <button onClick={onCancelar} style={{ background: 'none', border: 'none', color: '#74A98A', fontSize: 24, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>‹</button>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
        <div style={{ background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 12, padding: '14px 18px', width: '100%', maxWidth: 320 }}>
          <div style={{ fontSize: 11, color: S.muted, marginBottom: 3 }}>Cama {paciente.cama} · {paciente.edad} años</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: S.text, marginBottom: 3 }}>{paciente.nombre}</div>
          <div style={{ fontSize: 12, color: S.verde }}>{paciente.dx}</div>
        </div>

        {error && <div style={{ fontSize: 12, color: S.rojo, textAlign: 'center', padding: '8px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</div>}

        {procesando ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚕</div>
            <div style={{ fontSize: 14, color: S.muted }}>Analizando el pase...</div>
            <div style={{ fontSize: 12, color: '#4a7c5f', marginTop: 6 }}>POSTA está organizando la evolución</div>
          </div>
        ) : !grabando ? (
          <button onClick={iniciarGrabacion} style={{ width: 80, height: 80, borderRadius: '50%', background: S.verdeOsc, border: `2px solid rgba(82,183,136,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, cursor: 'pointer' }}>
            🎙
          </button>
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: S.verdeOsc, border: `2px solid rgba(82,183,136,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            🎙
          </div>
        )}

        {!grabando && !procesando && (
          <div style={{ fontSize: 13, color: S.muted, textAlign: 'center' }}>Tocá el micrófono para empezar a grabar</div>
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

function PantallaFichaPaciente({ paciente, rol, turnoId, onSiguiente, onVolver }) {
  const [tab, setTab] = useState('evolucion')
  const [mensajes, setMensajes] = useState([{ role: 'assistant', content: `Estoy al tanto de la evolución de ${paciente.nombre}. ¿Qué necesitás consultar?` }])
  const [inputChat, setInputChat] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [grabandoConsulta, setGrabandoConsulta] = useState(false)
  const [grabandoPase, setGrabandoPase] = useState(false)
  const [contextoCompleto, setContextoCompleto] = useState(paciente.evolucion || '')
  const mediaConsultaRef = useRef(null)
  const chunksConsultaRef = useRef([])
  const mediaPaseRef = useRef(null)
  const chunksPaseRef = useRef([])

  const evolucion = paciente.evolucion || ''
  const partes = evolucion.split('---EVOLUCIÓN PARA HISTORIA CLÍNICA---')
  const seccionesCli = partes[0] || ''
  const textoHC = partes[1]?.trim() || ''
  const [copiado, setCopiado] = useState(false)

  const secciones = seccionesCli.split('###').filter(s => s.trim()).map(s => {
    const lineas = s.trim().split('\n')
    return { titulo: lineas[0].trim(), contenido: lineas.slice(1).join('\n').trim() }
  })

  const colores = {
    'Situación actual': '#52B788',
    'Evolución del día': '#60A5FA',
    'Conducta / Plan': '#A78BFA',
    'Estudios pendientes': '#EF9F27',
    'Medicación': '#74A98A',
    'Urgente hoy': '#EF4444',
    'Pendiente próximos días': '#F97316',
    'Alerta POSTA': '#EF9F27',
  }

  function copiar() {
    navigator.clipboard.writeText(textoHC || evolucion)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function cargarContexto() {
    try {
      const res = await fetch(`${API}/posta/contexto/${turnoId}/${paciente.cama}`)
      if (res.ok) {
        const data = await res.json()
        if (data.contexto) setContextoCompleto(data.contexto + '\n\nEVOLUCIÓN GENERADA:\n' + (paciente.evolucion || ''))
      }
    } catch {}
  }

  useEffect(() => { cargarContexto() }, [])

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
          contexto_paciente: `Paciente: ${paciente.nombre}, ${paciente.edad} años, Cama ${paciente.cama}. Diagnóstico: ${paciente.dx}.\n\nCONTEXTO COMPLETO DEL PASE:\n${contextoCompleto}`,
          historial: nuevos.slice(-6),
        })
      })
      const data = await res.json()
      setMensajes([...nuevos, { role: 'assistant', content: data.respuesta || 'Error al procesar.' }])
    } catch {
      setMensajes([...nuevos, { role: 'assistant', content: 'No pude conectarme.' }])
    }
    setLoadingChat(false)
  }

  async function iniciarGrabacionConsulta() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      chunksConsultaRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksConsultaRef.current.push(e.data) }
      mr.start(500)
      mediaConsultaRef.current = mr
      setGrabandoConsulta(true)
    } catch (e) {
      alert('No se pudo acceder al micrófono: ' + e.message)
    }
  }

  async function detenerGrabacionConsulta() {
    if (!mediaConsultaRef.current) return
    mediaConsultaRef.current.stop()
    mediaConsultaRef.current.stream.getTracks().forEach(t => t.stop())
    setGrabandoConsulta(false)
    await new Promise(r => setTimeout(r, 500))
    const mimeType = chunksConsultaRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(chunksConsultaRef.current, { type: mimeType })
    if (blob.size < 500) return
    const ext = mimeType.includes('mp4') ? 'consulta.mp4' : 'consulta.webm'
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
      const res = await fetch(`${API}/posta/audio`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.transcripcion) await enviarChat(data.transcripcion)
    } catch {}
  }

  async function iniciarGrabacionPase() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      chunksPaseRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksPaseRef.current.push(e.data) }
      mr.start(500)
      mediaPaseRef.current = mr
      setGrabandoPase(true)
    } catch (e) {
      alert('No se pudo acceder al micrófono: ' + e.message)
    }
  }

  async function detenerGrabacionPase() {
    if (!mediaPaseRef.current) return
    mediaPaseRef.current.stop()
    mediaPaseRef.current.stream.getTracks().forEach(t => t.stop())
    setGrabandoPase(false)
    await new Promise(r => setTimeout(r, 500))
    const mimeType = chunksPaseRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(chunksPaseRef.current, { type: mimeType })
    if (blob.size < 500) return
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
      if (!resAudio.ok) return
      const resAnalisis = await fetch(`${API}/posta/analizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turno_id: turnoId, cama: paciente.cama, nombre: paciente.nombre, edad: paciente.edad, dx: paciente.dx, rol })
      })
      if (resAnalisis.ok) {
        const data = await resAnalisis.json()
        setContextoCompleto(prev => prev + '\n\nACTUALIZACIÓN:\n' + (data.evolucion || ''))
        alert('Evolución actualizada con el nuevo audio.')
      }
    } catch {}
  }

  const TABS = [
    { id: 'evolucion', label: 'Evolución hoy' },
    { id: 'historia', label: 'Historia clínica' },
    { id: 'consultar', label: 'Consultar' },
  ]

  return (
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
            {secciones.map((sec, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 500, color: colores[sec.titulo] || S.verde, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 8, borderLeft: `2px solid ${colores[sec.titulo] || S.verde}` }}>
                  {sec.titulo}
                </div>
                <div style={{ fontSize: 13, color: S.text, lineHeight: 1.6 }}>
                  {sec.contenido.split('\n').filter(l => l.trim()).map((l, j) => (
                    <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: S.muted, flexShrink: 0 }}>·</span>
                      <span>{l.replace(/^[-•]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}` }}>
            <div style={{ fontSize: 11, color: S.muted, textAlign: 'center', marginBottom: 8 }}>Agregá más contexto al pase</div>
            <button
              onClick={grabandoPase ? detenerGrabacionPase : iniciarGrabacionPase}
              style={{ width: '100%', background: grabandoPase ? 'rgba(239,68,68,0.06)' : S.verdeCard, border: `0.5px solid ${grabandoPase ? 'rgba(239,68,68,0.4)' : 'rgba(82,183,136,0.2)'}`, borderRadius: 10, padding: 12, fontSize: 13, color: grabandoPase ? '#EF4444' : S.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🎙</span>
              <span>{grabandoPase ? 'Grabando... tocá para detener y actualizar' : 'Agregar al pase por audio'}</span>
            </button>
          </div>
        </>
      )}

      {tab === 'historia' && (
        <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, color: S.muted, marginBottom: 12 }}>Evoluciones anteriores — solo lectura</div>
          <div style={{ background: S.verdeCard, border: `0.5px solid rgba(82,183,136,0.1)`, borderRadius: 8, padding: '10px 12px', marginBottom: 10, opacity: 0.5 }}>
            <div style={{ fontSize: 10, color: S.muted, marginBottom: 4 }}>Turno anterior</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>Sin registros anteriores en POSTA para este paciente.</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 500, color: S.verde, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 8, borderLeft: `2px solid ${S.verde}` }}>
            Evolución de hoy — para copiar
          </div>
          {textoHC ? (
            <div style={{ background: 'rgba(82,183,136,0.04)', border: `0.5px solid rgba(82,183,136,0.2)`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: S.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Lista para copiar</div>
                <button onClick={copiar} style={{ fontSize: 11, color: copiado ? S.verde : S.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {copiado ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>{textoHC}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: S.muted }}>El texto para historia clínica aparece después de finalizar el pase.</div>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={inputChat}
                onChange={e => setInputChat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarChat(inputChat)}
                placeholder="Preguntá por texto..."
                style={{ flex: 1, background: S.verdeCard, border: `0.5px solid ${S.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: S.text, outline: 'none' }}
              />
              <button onClick={() => enviarChat(inputChat)} disabled={loadingChat || !inputChat.trim()} style={{ width: 36, height: 36, borderRadius: '50%', background: S.verdeOsc, border: 'none', color: S.verde, cursor: 'pointer', fontSize: 16 }}>↑</button>
            </div>
            <button
              onClick={grabandoConsulta ? detenerGrabacionConsulta : iniciarGrabacionConsulta}
              style={{ width: '100%', background: grabandoConsulta ? 'rgba(239,68,68,0.06)' : S.verdeCard, border: `0.5px solid ${grabandoConsulta ? 'rgba(239,68,68,0.4)' : 'rgba(82,183,136,0.2)'}`, borderRadius: 10, padding: 12, fontSize: 13, color: grabandoConsulta ? '#EF4444' : S.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🎙</span>
              <span>{grabandoConsulta ? 'Grabando... tocá para enviar' : 'Preguntá por audio'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function PanelCamas({ rol, onNuevoPaciente, pacientes, onPaciente, onPDF }) {
  const pasados = pacientes.filter(p => p.estado === 'pasado').length
  const pendientes = pacientes.filter(p => p.estado !== 'pasado').length
  const alertas = pacientes.filter(p => p.alerta).length
  const ordenados = [...pacientes.filter(p => p.alerta), ...pacientes.filter(p => !p.alerta && p.estado !== 'pasado'), ...pacientes.filter(p => p.estado === 'pasado')]

  return (
    <div style={{ minHeight: '100vh', background: S.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: S.verdeCard, padding: '14px 16px', borderBottom: `0.5px solid ${S.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: S.verde, letterSpacing: '0.08em' }}>POSTA</div>
          <div style={{ fontSize: 11, color: S.verde, background: 'rgba(82,183,136,0.12)', padding: '3px 10px', borderRadius: 99, border: `0.5px solid rgba(82,183,136,0.2)`, textTransform: 'capitalize' }}>{rol}</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 11, color: S.muted }}>Total <strong style={{ color: S.verde }}>{pacientes.length}</strong></span>
          <span style={{ fontSize: 11, color: S.muted }}>Pasados <strong style={{ color: S.verde }}>{pasados}</strong></span>
          <span style={{ fontSize: 11, color: S.muted }}>Pendientes <strong style={{ color: S.verde }}>{pendientes}</strong></span>
          {alertas > 0 && <span style={{ fontSize: 11, color: S.muted }}>Alertas <strong style={{ color: S.amber }}>{alertas}</strong></span>}
        </div>
      </div>

      <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: S.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Mis pacientes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {ordenados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: S.muted, fontSize: 13 }}>
              No hay pacientes todavía.<br />Tocá + para agregar el primero.
            </div>
          )}
          {ordenados.map(p => (
            <button key={p.id} onClick={() => p.estado !== 'pasado' && onPaciente(p)}
              style={{ background: p.alerta ? S.amberBg : S.verdeCard, border: `0.5px solid ${p.alerta ? S.amberBorder : p.estado === 'pasado' ? 'rgba(82,183,136,0.2)' : S.border}`, borderRadius: 10, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 12, cursor: p.estado === 'pasado' ? 'default' : 'pointer', opacity: p.estado === 'pasado' ? 0.6 : 1, textAlign: 'left', width: '100%' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: p.alerta ? 'rgba(186,117,23,0.15)' : p.estado === 'pasado' ? 'rgba(82,183,136,0.06)' : 'rgba(82,183,136,0.12)', color: p.alerta ? S.amber : S.verde, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                {p.cama}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: S.text, marginBottom: 2 }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: S.muted }}>{p.dx}</div>
              </div>
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: p.alerta ? 'rgba(186,117,23,0.1)' : p.estado === 'pasado' ? 'rgba(82,183,136,0.1)' : 'rgba(82,183,136,0.06)', color: p.alerta ? S.amber : p.estado === 'pasado' ? '#40916C' : S.muted, flexShrink: 0 }}>
                {p.alerta ? '⚠ Alerta' : p.estado === 'pasado' ? 'Pasado' : 'Pendiente'}
              </span>
            </button>
          ))}
        </div>

        <div style={{ height: '0.5px', background: 'rgba(82,183,136,0.1)', margin: '12px 0' }} />

        <button onClick={onNuevoPaciente} style={{ width: '100%', background: 'rgba(82,183,136,0.04)', border: '0.5px dashed rgba(82,183,136,0.15)', borderRadius: 10, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(82,183,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.verde, fontSize: 18 }}>+</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: S.verde }}>Agregar paciente</div>
            <div style={{ fontSize: 11, color: '#4a7c5f' }}>Nuevo ingreso o transferencia</div>
          </div>
        </button>
      </div>

      <div style={{ padding: '12px 16px', borderTop: `0.5px solid ${S.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pasados > 0 && (
          <button onClick={onPDF} style={{ width: '100%', background: S.verdeOsc, color: S.verde, border: `0.5px solid rgba(82,183,136,0.3)`, borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Generar PDF del turno ({pasados} pacientes)
          </button>
        )}
        <button style={{ width: '100%', background: 'transparent', color: S.muted, border: `0.5px solid ${S.border}`, borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>
          Finalizar turno
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [rol, setRol] = useState('medico')
  const [pantalla, setPantalla] = useState('pase')
  const [pacientes, setPacientes] = useState([
    { id: 1, cama: '8', nombre: 'Pérez, Juan Carlos', dni: '18432901', edad: '58', dx: 'Neumonía grave · ARM día 7', estado: 'pendiente', alerta: false, evolucion: null }
  ])
  const [pacienteActual, setPacienteActual] = useState({ id: 1, cama: '8', nombre: 'Pérez, Juan Carlos', dni: '18432901', edad: '58', dx: 'Neumonía grave · ARM día 7', estado: 'pendiente', alerta: false, evolucion: null })
  const [showModal, setShowModal] = useState(false)
  const [turnoId] = useState(generarTurnoId)

  useEffect(() => {
    const handleBack = (e) => {
      if (pantalla === 'chat') {
        e.preventDefault()
        setPantalla('evolucion')
      } else if (pantalla === 'evolucion') {
        e.preventDefault()
        setPantalla('panel')
      } else if (pantalla === 'pase') {
        e.preventDefault()
        setPantalla('panel')
      }
    }
    window.addEventListener('popstate', handleBack)
    return () => window.removeEventListener('popstate', handleBack)
  }, [pantalla])

  useEffect(() => {
    if (pantalla !== 'panel') {
      window.history.pushState({ pantalla }, '')
    }
  }, [pantalla])

  if (!rol) return <PantallaRol onSelect={setRol} />

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
    setPantalla('evolucion')
  }

  if (pantalla === 'pase' && pacienteActual) {
    return <PantallaPase paciente={pacienteActual} rol={rol} turnoId={turnoId} onFinalizar={finalizarPase} onCancelar={() => setPantalla('panel')} />
  }

  if ((pantalla === 'evolucion' || pantalla === 'chat') && pacienteActual) {
    return <PantallaFichaPaciente
      paciente={pacienteActual}
      rol={rol}
      turnoId={turnoId}
      onSiguiente={() => { setPacienteActual(null); setShowModal(true); setPantalla('panel') }}
      onVolver={() => setPantalla('panel')}
    />
  }

  return (
    <>
      <PanelCamas rol={rol} pacientes={pacientes}
        onNuevoPaciente={() => setShowModal(true)}
        onPaciente={p => { setPacienteActual(p); setPantalla('pase') }}
        onPDF={() => alert('Generando PDF del turno...')}
      />
      {showModal && <ModalPaciente onGuardar={agregarPaciente} onCerrar={() => setShowModal(false)} />}
    </>
  )
}
