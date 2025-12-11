import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { IoCallOutline, IoMicOutline, IoMicOffOutline, IoCloseOutline, IoRemoveOutline } from 'react-icons/io5'
import { useCall } from '../../contexts/CallContext'
import { formatCallDuration } from '../../utils/callService'
import { getSocket } from '../../utils/socketClient'

const DoctorCallStatus = () => {
  const location = useLocation()
  const {
    callStatus,
    callInfo,
    isMinimized,
    minimize,
    maximize,
    updateCallStatus,
    updateCallInfo,
    endCall,
  } = useCall()

  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const durationIntervalRef = useRef(null)
  const containerRef = useRef(null)

  // Load position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('doctorCallPosition')
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition)
        setPosition(pos)
      } catch (e) {
        console.error('Error loading call position:', e)
      }
    } else {
      // Default position: bottom-right
      setPosition({ x: window.innerWidth - 320, y: window.innerHeight - 200 })
    }
  }, [])

  // Save position to localStorage
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('doctorCallPosition', JSON.stringify(position))
    }
  }, [position])

  // Auto-minimize when on consultations page
  useEffect(() => {
    if (location.pathname === '/doctor/consultations' && callStatus === 'started') {
      minimize()
    }
  }, [location.pathname, callStatus, minimize])

  // Start duration timer when call starts
  useEffect(() => {
    if (callStatus === 'started' && callInfo?.startTime) {
      const startTime = new Date(callInfo.startTime).getTime()
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setCallDuration(elapsed)
      }, 1000)
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      setCallDuration(0)
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [callStatus, callInfo?.startTime])

  // Listen to socket events
  useEffect(() => {
    // Define setupListeners before it's used
    const setupListeners = (socketInstance) => {
      if (!socketInstance) return

      console.log('📞 [DoctorCallStatus] Setting up socket listeners, connected:', socketInstance.connected, 'socket ID:', socketInstance.id)

      const handleCallInitiated = (data) => {
        console.log('📞 [DoctorCallStatus] Call initiated:', data)
        if (data && data.callId) {
          updateCallInfo({ callId: data.callId })
        }
      }

      const handleCallAccepted = (data) => {
        console.log('📞 [DoctorCallStatus] Call accepted by patient (waiting for them to join):', data)
        // Patient accepted but hasn't joined yet - update status to 'accepted' if needed
        if (data && data.callId) {
          updateCallInfo((prev) => ({
            ...(prev || {}),
            callId: data.callId,
          }))
        }
      }

      const handlePatientJoined = (data) => {
        console.log('📞 [DoctorCallStatus] ====== PATIENT JOINED EVENT RECEIVED ======')
        console.log('📞 [DoctorCallStatus] Event data:', JSON.stringify(data, null, 2))
        console.log('📞 [DoctorCallStatus] Current callStatus before update:', callStatus)
        console.log('📞 [DoctorCallStatus] Current callInfo before update:', callInfo)
        
        if (data && data.callId) {
          console.log('📞 [DoctorCallStatus] Updating status to started, callId:', data.callId)
          
          // Patient has actually joined - update status to started
          updateCallStatus('started')
          
          // Update call info
          updateCallInfo((prev) => {
            const updated = {
              ...(prev || {}),
              callId: data.callId,
              startTime: new Date().toISOString() 
            }
            console.log('📞 [DoctorCallStatus] Updated call info:', updated)
            return updated
          })
          
          // Force a re-render by logging
          console.log('📞 [DoctorCallStatus] Status update completed. New status should be: started')
        } else {
          console.warn('📞 [DoctorCallStatus] call:patientJoined event missing callId:', data)
        }
      }

      const handleCallEnded = (data) => {
        console.log('📞 [DoctorCallStatus] Call ended:', data)
        updateCallStatus('ended')
        setTimeout(() => {
          endCall()
        }, 2000)
      }

      const handleCallDeclined = (data) => {
        console.log('📞 [DoctorCallStatus] Call declined by patient:', data)
        if (data && data.callId) {
          console.log('📞 [DoctorCallStatus] Ending call due to patient decline, callId:', data.callId)
          updateCallStatus('idle')
          endCall()
        } else {
          console.warn('📞 [DoctorCallStatus] call:declined event missing callId:', data)
          updateCallStatus('idle')
          endCall()
        }
      }

      // Listen for mute state updates from CallPopup
      const handleMuteStateUpdate = (event) => {
        setIsMuted(event.detail.muted)
      }

      // Debug: Listen to ALL socket events to see what's being received
      const debugHandler = (eventName, ...args) => {
        if (eventName.startsWith('call:')) {
          console.log(`📞 [DoctorCallStatus] ====== SOCKET EVENT RECEIVED ======`)
          console.log(`📞 [DoctorCallStatus] Event name: ${eventName}`)
          console.log(`📞 [DoctorCallStatus] Event args:`, args)
          console.log(`📞 [DoctorCallStatus] Socket connected: ${socketInstance.connected}`)
          console.log(`📞 [DoctorCallStatus] Socket ID: ${socketInstance.id}`)
        }
      }
      socketInstance.onAny(debugHandler)

      // Set up listeners - use 'on' instead of 'once' to ensure we catch the event
      socketInstance.on('call:initiated', handleCallInitiated)
      socketInstance.on('call:accepted', handleCallAccepted)
      socketInstance.on('call:patientJoined', handlePatientJoined)
      socketInstance.on('call:ended', handleCallEnded)
      socketInstance.on('call:declined', handleCallDeclined)
      window.addEventListener('call:muteStateUpdate', handleMuteStateUpdate)

      // If socket is not connected, wait for connection
      if (!socketInstance.connected) {
        console.log('📞 [DoctorCallStatus] Socket not connected, waiting for connection...')
        const connectHandler = () => {
          console.log('📞 [DoctorCallStatus] Socket connected, listeners are ready')
        }
        socketInstance.on('connect', connectHandler)
        return () => {
          socketInstance.off('connect', connectHandler)
          socketInstance.offAny(debugHandler)
          socketInstance.off('call:initiated', handleCallInitiated)
          socketInstance.off('call:accepted', handleCallAccepted)
          socketInstance.off('call:patientJoined', handlePatientJoined)
          socketInstance.off('call:ended', handleCallEnded)
          socketInstance.off('call:declined', handleCallDeclined)
          window.removeEventListener('call:muteStateUpdate', handleMuteStateUpdate)
        }
      }

      return () => {
        console.log('📞 [DoctorCallStatus] Cleaning up socket listeners')
        socketInstance.offAny(debugHandler)
        socketInstance.off('call:initiated', handleCallInitiated)
        socketInstance.off('call:accepted', handleCallAccepted)
        socketInstance.off('call:patientJoined', handlePatientJoined)
        socketInstance.off('call:ended', handleCallEnded)
        socketInstance.off('call:declined', handleCallDeclined)
        window.removeEventListener('call:muteStateUpdate', handleMuteStateUpdate)
      }
    }

    let socket = getSocket()
    if (!socket) {
      console.warn('📞 [DoctorCallStatus] Socket not available, will retry...')
      // Retry after a short delay
      const retryTimer = setTimeout(() => {
        socket = getSocket()
        if (socket) {
          setupListeners(socket)
        }
      }, 1000)
      return () => clearTimeout(retryTimer)
    }

    const cleanup = setupListeners(socket)
    return cleanup
  }, [updateCallStatus, updateCallInfo, endCall]) // Removed callInfo and callStatus from deps to avoid stale closures

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return // Don't drag if clicking a button
    setIsDragging(true)
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  // Handle drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Constrain to viewport
    const maxX = window.innerWidth - (isMinimized ? 60 : 300)
    const maxY = window.innerHeight - (isMinimized ? 60 : 200)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }, [isDragging, dragStart, isMinimized])

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Attach global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleMuteToggle = () => {
    // Emit custom event that CallPopup can listen to for mute toggle
    const event = new CustomEvent('call:muteToggle', { detail: { muted: !isMuted } })
    window.dispatchEvent(event)
    setIsMuted(!isMuted)
  }

  const handleEndCall = () => {
    const socket = getSocket()
    if (socket && callInfo?.callId) {
      socket.emit('call:end', { callId: callInfo.callId })
    }
    endCall()
  }

  // Debug: Log current status and force re-render check
  useEffect(() => {
    console.log('📞 [DoctorCallStatus] ====== RENDER ======')
    console.log('📞 [DoctorCallStatus] Current callStatus:', callStatus)
    console.log('📞 [DoctorCallStatus] Current callInfo:', callInfo)
    console.log('📞 [DoctorCallStatus] Should show:', callStatus === 'calling' ? 'Calling...' : callStatus === 'started' ? 'Call Started' : 'Nothing')
  }, [callStatus, callInfo])

  // Don't render if no active call or status is idle/ended
  if (!callInfo || (callStatus !== 'calling' && callStatus !== 'started')) {
    return null
  }

  // Minimized view - floating button
  if (isMinimized) {
    return (
      <div
        ref={containerRef}
        className="fixed z-[10001] cursor-move select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={maximize}
          className="relative flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition active:scale-95"
          title="Click to expand call"
        >
          {/* Pulsing animation */}
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          <IoCallOutline className="text-white text-xl relative z-10" />
          
          {/* Duration badge */}
          {callStatus === 'started' && callDuration > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {formatCallDuration(callDuration).split(':')[1]}
            </span>
          )}
        </button>
      </div>
    )
  }

  // Full view - call status card
  return (
    <div
      ref={containerRef}
      className="fixed z-[10001] w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'move',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header - draggable area */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-semibold">
            {callStatus === 'calling' ? 'Calling...' : 'Call Started'}
          </span>
        </div>
        <button
          onClick={minimize}
          className="text-white hover:bg-white/20 rounded p-1 transition"
          title="Minimize"
        >
          <IoRemoveOutline className="text-lg" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Patient info */}
        <div className="text-center">
          <p className="text-slate-900 font-semibold text-lg">
            {callInfo.patientName || 'Patient'}
          </p>
          {callStatus === 'started' && callDuration > 0 && (
            <p className="text-slate-600 text-sm mt-1">
              {formatCallDuration(callDuration)}
            </p>
          )}
          {callStatus === 'calling' && (
            <p className="text-slate-500 text-xs mt-1">Waiting for patient...</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleMuteToggle}
            disabled={callStatus !== 'started'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
              isMuted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <IoMicOffOutline className="text-xl" /> : <IoMicOutline className="text-xl" />}
          </button>

          <button
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
            title="End Call"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoctorCallStatus

