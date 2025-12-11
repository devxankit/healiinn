import { useState, useEffect, useRef } from 'react'
import * as mediasoupClient from 'mediasoup-client'
import { io } from 'socket.io-client'
import { IoCallOutline, IoMicOutline, IoMicOffOutline, IoCloseOutline } from 'react-icons/io5'
import { formatCallDuration, isWebRTCSupported } from '../../utils/callService'
import { getAuthToken } from '../../utils/apiClient'
import { useCall } from '../../contexts/CallContext'
import { getSocket } from '../../utils/socketClient'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '').replace(/\/$/, '')

const CallPopup = () => {
  const { activeCall, endCall } = useCall()
  const callId = activeCall?.callId
  
  const [status, setStatus] = useState('connecting') // connecting, connected, ended, error
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState(null)
  const [remoteParticipant, setRemoteParticipant] = useState(activeCall?.remoteParticipant || 'Participant')

  // Refs
  const socketRef = useRef(null)
  const deviceRef = useRef(null)
  const sendTransportRef = useRef(null)
  const recvTransportRef = useRef(null)
  const producerRef = useRef(null)
  const consumerRef = useRef(null)
  const localStreamRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const callStartTimeRef = useRef(null)
  const durationIntervalRef = useRef(null)

  // Determine module from token
  const getModule = () => {
    const token = getAuthToken('doctor') || getAuthToken('patient')
    if (getAuthToken('doctor')) return 'doctor'
    if (getAuthToken('patient')) return 'patient'
    return 'patient' // default
  }

  useEffect(() => {
    if (!callId) {
      return // Don't initialize if no call
    }

    if (!isWebRTCSupported()) {
      setError('WebRTC is not supported in this browser')
      setStatus('error')
      return
    }

    // Reset state when callId changes
    setStatus('connecting')
    setError(null)
    setCallDuration(0)
    setIsMuted(false)

    initializeCall()

    return () => {
      cleanup()
    }
  }, [callId])

  // Update remoteParticipant when activeCall changes
  useEffect(() => {
    if (activeCall?.remoteParticipant) {
      setRemoteParticipant(activeCall.remoteParticipant)
    }
  }, [activeCall?.remoteParticipant])

  const initializeCall = async () => {
    try {
      const module = getModule()
      
      // Try to use existing socket first (for patient to ensure same connection)
      let socket = getSocket()
      let isNewSocket = false
      
      if (!socket || !socket.connected) {
        // Fallback to creating new socket if shared socket not available
        const token = getAuthToken(module) || getAuthToken('patient') || getAuthToken('doctor')
        
        if (!token) {
          setError('Authentication required')
          setStatus('error')
          return
        }

        console.log('📞 [CallPopup] Creating new socket connection for call')
        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['polling', 'websocket'],
        })
        isNewSocket = true
        
        // Set up socket event listeners before connect
        const handleDisconnect = () => {
          console.log('📞 [CallPopup] Socket disconnected')
          setStatus('error')
          setError('Connection lost')
        }

        const handleCallError = (data) => {
          console.error('📞 [CallPopup] Call error:', data)
          setError(data.message || 'Call error occurred')
          setStatus('error')
        }

        const handleCallEnded = () => {
          handleEndCall()
        }

        const handleNewProducer = async (data) => {
          console.log('📞 [CallPopup] New producer available:', data)
          if (data.producerId && !consumerRef.current) {
            await consumeRemoteAudio(data.producerId)
          }
        }

        socket.on('disconnect', handleDisconnect)
        socket.on('call:error', handleCallError)
        socket.on('call:ended', handleCallEnded)
        socket.on('mediasoup:newProducer', handleNewProducer)

        socket.on('connect', () => {
          console.log('📞 [CallPopup] Socket connected for call')
          socketRef.current = socket
          
          // Store cleanup function after socketRef is set
          if (socketRef.current) {
            socketRef.current._callPopupCleanup = () => {
              socket.off('disconnect', handleDisconnect)
              socket.off('call:error', handleCallError)
              socket.off('call:ended', handleCallEnded)
              socket.off('mediasoup:newProducer', handleNewProducer)
            }
          }
          
          joinCall()
        })
      } else {
        console.log('📞 [CallPopup] Using existing socket connection')
        socketRef.current = socket
        
        // Set up socket event listeners for existing socket
        const handleDisconnect = () => {
          console.log('📞 [CallPopup] Socket disconnected')
          setStatus('error')
          setError('Connection lost')
        }

        const handleCallError = (data) => {
          console.error('📞 [CallPopup] Call error:', data)
          setError(data.message || 'Call error occurred')
          setStatus('error')
        }

        const handleCallEnded = () => {
          handleEndCall()
        }

        const handleNewProducer = async (data) => {
          console.log('📞 [CallPopup] New producer available:', data)
          if (data.producerId && !consumerRef.current) {
            await consumeRemoteAudio(data.producerId)
          }
        }

        socket.on('disconnect', handleDisconnect)
        socket.on('call:error', handleCallError)
        socket.on('call:ended', handleCallEnded)
        socket.on('mediasoup:newProducer', handleNewProducer)

        // Store cleanup function for listeners (socketRef.current is already set)
        if (socketRef.current) {
          socketRef.current._callPopupCleanup = () => {
            socket.off('disconnect', handleDisconnect)
            socket.off('call:error', handleCallError)
            socket.off('call:ended', handleCallEnded)
            socket.off('mediasoup:newProducer', handleNewProducer)
          }
        }
        
        // Socket already connected, join call immediately
        joinCall()
      }
    } catch (error) {
      console.error('Error initializing call:', error)
      setError(error.message || 'Failed to initialize call')
      setStatus('error')
    }
  }

  const joinCall = async () => {
    try {
      const socket = socketRef.current
      if (!socket) return

      // Get RTP capabilities
      const { rtpCapabilities, iceServers } = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:getRtpCapabilities', { callId }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response)
          }
        })
      })

      // Create device
      const device = new mediasoupClient.Device()
      await device.load({ routerRtpCapabilities: rtpCapabilities })
      deviceRef.current = device

      // Create send transport
      const sendTransportData = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:createWebRtcTransport', { callId }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response.transport)
          }
        })
      })

      const sendTransport = device.createSendTransport({
        id: sendTransportData.id,
        iceParameters: sendTransportData.iceParameters,
        iceCandidates: sendTransportData.iceCandidates,
        dtlsParameters: sendTransportData.dtlsParameters,
        iceServers,
      })

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket.emit('mediasoup:connectTransport', {
            transportId: sendTransport.id,
            dtlsParameters,
          }, (response) => {
            if (response.error) {
              errback(new Error(response.error))
            } else {
              callback()
            }
          })
        } catch (error) {
          errback(error)
        }
      })

      sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        try {
          socket.emit('mediasoup:produce', {
            transportId: sendTransport.id,
            rtpParameters,
            kind,
          }, (response) => {
            if (response.error) {
              errback(new Error(response.error))
            } else {
              callback({ id: response.producer.id })
            }
          })
        } catch (error) {
          errback(error)
        }
      })

      sendTransportRef.current = sendTransport

      // Create recv transport
      const recvTransportData = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:createWebRtcTransport', { callId }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response.transport)
          }
        })
      })

      const recvTransport = device.createRecvTransport({
        id: recvTransportData.id,
        iceParameters: recvTransportData.iceParameters,
        iceCandidates: recvTransportData.iceCandidates,
        dtlsParameters: recvTransportData.dtlsParameters,
        iceServers,
      })

      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          socket.emit('mediasoup:connectTransport', {
            transportId: recvTransport.id,
            dtlsParameters,
          }, (response) => {
            if (response.error) {
              errback(new Error(response.error))
            } else {
              callback()
            }
          })
        } catch (error) {
          errback(error)
        }
      })

      recvTransportRef.current = recvTransport

      // Get user media and produce
      await produceLocalAudio()

      setStatus('connected')
      callStartTimeRef.current = Date.now()
      startDurationTimer()

      // Notify server that we've successfully joined the call (for doctor notification)
      const module = getModule()
      const currentSocket = socketRef.current
      
      if (module === 'patient' && currentSocket) {
        // Ensure socket is connected before emitting
        if (currentSocket.connected) {
          console.log('📞 [CallPopup] Emitting call:joined event for callId:', callId)
          console.log('📞 [CallPopup] Socket state:', {
            connected: currentSocket.connected,
            id: currentSocket.id,
            authenticated: !!currentSocket.auth
          })
          
          currentSocket.emit('call:joined', { callId }, (response) => {
            if (response) {
              console.log('📞 [CallPopup] call:joined acknowledgment:', response)
            }
          })
        } else {
          console.warn('📞 [CallPopup] Socket not connected, waiting for connection before emitting call:joined')
          const connectHandler = () => {
            console.log('📞 [CallPopup] Socket connected, now emitting call:joined')
            currentSocket.emit('call:joined', { callId })
            currentSocket.off('connect', connectHandler)
          }
          currentSocket.on('connect', connectHandler)
        }
      } else if (module === 'patient') {
        console.error('📞 [CallPopup] No socket available to emit call:joined')
      }
    } catch (error) {
      console.error('Error joining call:', error)
      setError(error.message || 'Failed to join call')
      setStatus('error')
    }
  }

  const produceLocalAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      const track = stream.getAudioTracks()[0]
      const params = {
        track,
        codecOptions: {
          opusStereo: true,
          opusFec: true,
          opusDtx: true,
          opusMaxPlaybackRate: 48000,
        },
      }

      const producer = await sendTransportRef.current.produce(params)
      producerRef.current = producer

      console.log('Producer created:', producer.id)

      // Note: We'll consume when we receive mediasoup:newProducer event
    } catch (error) {
      console.error('Error producing local audio:', error)
      setError('Failed to access microphone: ' + error.message)
      setStatus('error')
    }
  }

  const consumeRemoteAudio = async (producerId) => {
    try {
      if (consumerRef.current) {
        return // Already consuming
      }

      const device = deviceRef.current
      const recvTransport = recvTransportRef.current
      const socket = socketRef.current

      if (!device || !recvTransport || !socket) {
        return
      }

      const { consumer } = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:consume', {
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
          callId,
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response)
          }
        })
      })

      // Create consumer using mediasoup-client
      const consumerInstance = await recvTransport.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      })

      consumerRef.current = consumerInstance

      // Create audio element for remote audio
      const stream = new MediaStream([consumerInstance.track])
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream
        remoteAudioRef.current.play().catch(err => console.error('Error playing remote audio:', err))
      }
    } catch (error) {
      console.error('Error consuming remote audio:', error)
    }
  }

  const startDurationTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
        setCallDuration(elapsed)
      }
    }, 1000)
  }

  const handleMuteToggle = () => {
    if (producerRef.current) {
      const newMutedState = !isMuted
      if (newMutedState) {
        producerRef.current.pause()
      } else {
        producerRef.current.resume()
      }
      setIsMuted(newMutedState)
      
      // Notify DoctorCallStatus of mute state change
      const event = new CustomEvent('call:muteStateUpdate', { detail: { muted: newMutedState } })
      window.dispatchEvent(event)
    }
  }

  // Listen for mute toggle events from DoctorCallStatus
  useEffect(() => {
    const handleMuteToggleEvent = (event) => {
      const { muted } = event.detail
      if (producerRef.current) {
        if (muted) {
          producerRef.current.pause()
        } else {
          producerRef.current.resume()
        }
        setIsMuted(muted)
      }
    }

    window.addEventListener('call:muteToggle', handleMuteToggleEvent)
    return () => {
      window.removeEventListener('call:muteToggle', handleMuteToggleEvent)
    }
  }, [isMuted])

  const handleEndCall = async () => {
    try {
      const socket = socketRef.current
      if (socket) {
        socket.emit('call:end', { callId })
      }
    } catch (error) {
      console.error('Error ending call:', error)
    } finally {
      cleanup()
      setStatus('ended')
      // Close the call UI after showing "ended" state briefly
      setTimeout(() => {
        endCall() // Use context to close call
      }, 2000)
    }
  }

  const cleanup = () => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Close producer
    if (producerRef.current) {
      producerRef.current.close()
      producerRef.current = null
    }

    // Close consumer
    if (consumerRef.current) {
      consumerRef.current.close()
      consumerRef.current = null
    }

    // Close transports
    if (sendTransportRef.current) {
      sendTransportRef.current.close()
      sendTransportRef.current = null
    }

    if (recvTransportRef.current) {
      recvTransportRef.current.close()
      recvTransportRef.current = null
    }

    // Clean up socket listeners and disconnect if it was created by CallPopup
    if (socketRef.current) {
      // Clean up event listeners
      try {
        if (socketRef.current._callPopupCleanup && typeof socketRef.current._callPopupCleanup === 'function') {
          socketRef.current._callPopupCleanup()
          delete socketRef.current._callPopupCleanup
        }
      } catch (error) {
        console.warn('Error cleaning up socket listeners:', error)
      }

      try {
        socketRef.current.emit('call:leave', { callId })
      } catch (error) {
        console.warn('Error emitting call:leave:', error)
      }
      
      // Only disconnect if this is not the shared socket
      const sharedSocket = getSocket()
      if (socketRef.current !== sharedSocket) {
        try {
          socketRef.current.disconnect()
        } catch (error) {
          console.warn('Error disconnecting socket:', error)
        }
      }
      
      socketRef.current = null
    }
  }

  // Don't render if no active call
  if (!activeCall || !callId) {
    return null
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Call Error</h2>
          <p className="text-slate-600 mb-4">{error || 'An error occurred'}</p>
          <button
            onClick={() => endCall()}
            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  if (status === 'ended') {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Call Ended</h2>
          <p className="text-slate-600">Duration: {formatCallDuration(callDuration)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <IoCallOutline className="text-3xl text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Audio Call</h2>
          <p className="text-slate-600 text-sm">{remoteParticipant}</p>
          {status === 'connected' && (
            <p className="text-slate-500 text-xs mt-2">{formatCallDuration(callDuration)}</p>
          )}
          {status === 'connecting' && (
            <p className="text-slate-500 text-xs mt-2">Connecting...</p>
          )}
        </div>

        {/* Audio element for remote audio */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={handleMuteToggle}
            disabled={status !== 'connected'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
              isMuted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <IoMicOffOutline className="text-2xl" /> : <IoMicOutline className="text-2xl" />}
          </button>

          <button
            onClick={handleEndCall}
            disabled={status === 'ended'}
            className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="End Call"
          >
            <IoCloseOutline className="text-3xl" />
          </button>
        </div>

        {/* Status indicator */}
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`}></div>
            {status === 'connected' ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallPopup

