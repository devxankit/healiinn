import { useState, useEffect, useRef, useCallback } from 'react'
import * as mediasoupClient from 'mediasoup-client'
import { io } from 'socket.io-client'
import { IoCallOutline, IoMicOutline, IoMicOffOutline, IoCloseOutline, IoRemoveOutline } from 'react-icons/io5'
import { formatCallDuration, isWebRTCSupported } from '../../utils/callService'
import { getAuthToken } from '../../utils/apiClient'
import { useCall } from '../../contexts/CallContext'
import { getSocket } from '../../utils/socketClient'
import P2PCallManager from '../../utils/p2pCallManager'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '').replace(/\/$/, '')

const CallPopup = () => {
  const { activeCall, endCall, isMinimized, minimize, maximize } = useCall()
  const callId = activeCall?.callId
  
  const [status, setStatus] = useState('connecting') // connecting, connected, ended, error
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState(null)
  const [remoteParticipant, setRemoteParticipant] = useState(activeCall?.remoteParticipant || 'Participant')
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [diagnosticLogs, setDiagnosticLogs] = useState([])
  const [useP2P, setUseP2P] = useState(true) // P2P enabled by default (SFU has issues)
  const p2pManagerRef = useRef(null)
  const roomJoinedRef = useRef(false) // Track if we successfully joined the call room

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
  const isEndingRef = useRef(false) // Prevent duplicate call end
  const callIdRef = useRef(callId) // Store callId in ref to avoid stale closures

  // Determine module from token
  const getModule = () => {
    const token = getAuthToken('doctor') || getAuthToken('patient')
    if (getAuthToken('doctor')) return 'doctor'
    if (getAuthToken('patient')) return 'patient'
    return 'patient' // default
  }

  // Store activeCall in ref to avoid stale closures
  const activeCallRef = useRef(activeCall)
  
  // Update activeCall ref when it changes
  useEffect(() => {
    activeCallRef.current = activeCall
  }, [activeCall])

  // Unified handler for call:ended events from any socket
  const handleCallEndedUnified = useCallback((data) => {
    const currentCallId = callIdRef.current
    const currentActiveCall = activeCallRef.current
    
    console.log('📞 [CallPopup] ====== call:ended EVENT RECEIVED ======')
    console.log('📞 [CallPopup] Event data:', data)
    console.log('📞 [CallPopup] Current callId (from ref):', currentCallId)
    console.log('📞 [CallPopup] Current activeCall (from ref):', currentActiveCall)
    console.log('📞 [CallPopup] isEndingRef.current:', isEndingRef.current)
    
    // Prevent duplicate processing
    if (isEndingRef.current) {
      console.log('📞 [CallPopup] Call already ending, ignoring duplicate call:ended event')
      return
    }
    
    // Process if:
    // 1. CallId matches exactly, OR
    // 2. We have an activeCall (fallback - process even if callId doesn't match)
    const callIdMatches = data && data.callId && data.callId === currentCallId
    const hasActiveCall = currentActiveCall && currentActiveCall.callId
    
    if (!callIdMatches && !hasActiveCall) {
      console.log('📞 [CallPopup] Ignoring call:ended - no callId match and no active call')
      return
    }
    
    if (!callIdMatches && hasActiveCall) {
      console.warn('📞 [CallPopup] call:ended event callId mismatch, but processing anyway because we have activeCall')
      console.warn('📞 [CallPopup] Expected:', currentCallId, 'Received:', data?.callId)
    }
    
    console.log('📞 [CallPopup] ✅ Processing call:ended event - ending call')
    isEndingRef.current = true
    
    // End the call (don't emit to server as it's already ended by other party)
    cleanup()
    setStatus('ended')
    setTimeout(() => {
      console.log('📞 [CallPopup] Closing call UI from call:ended event')
      endCall()
      isEndingRef.current = false
    }, 500)
  }, [endCall])

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
    isEndingRef.current = false // Reset ending flag for new call
    callIdRef.current = callId // Update ref with current callId

    // Set up call:ended listener on shared socket immediately (before socket connects)
    // This ensures we receive the event even if CallPopup creates a new socket
    const sharedSocket = getSocket()
    let sharedSocketCleanup = null
    
    if (sharedSocket) {
      console.log('📞 [CallPopup] Setting up call:ended listener on shared socket')
      console.log('📞 [CallPopup] Shared socket connected:', sharedSocket.connected)
      
      // Use the unified handler
      sharedSocket.on('call:ended', handleCallEndedUnified)
      
      sharedSocketCleanup = () => {
        sharedSocket.off('call:ended', handleCallEndedUnified)
      }
    }

    // Also listen for window-level force end event as fallback
    const handleForceEnd = () => {
      console.log('📞 [CallPopup] Received call:forceEnd window event')
      if (!isEndingRef.current && callIdRef.current) {
        console.log('📞 [CallPopup] Processing force end event')
        isEndingRef.current = true
        cleanup()
        setStatus('ended')
        setTimeout(() => {
          endCall()
          isEndingRef.current = false
        }, 500)
      }
    }
    
    window.addEventListener('call:forceEnd', handleForceEnd)

    initializeCall()

    return () => {
      cleanup()
      if (sharedSocketCleanup) {
        sharedSocketCleanup()
      }
      window.removeEventListener('call:forceEnd', handleForceEnd)
    }
  }, [callId, handleCallEndedUnified, endCall])

  // Update remoteParticipant when activeCall changes
  useEffect(() => {
    if (activeCall?.remoteParticipant) {
      setRemoteParticipant(activeCall.remoteParticipant)
    }
  }, [activeCall?.remoteParticipant])

  const initializeCall = async () => {
    try {
      const module = getModule()
      const currentCallId = callIdRef.current
      
      if (!currentCallId) {
        console.warn('📞 [CallPopup] No callId available, cannot initialize call')
        return
      }
      
      // Try to use existing socket first (for patient to ensure same connection)
      let socket = getSocket()
      let isNewSocket = false
      
      // Helper function to join call room (returns promise)
      const joinCallRoom = (socketInstance) => {
        return new Promise((resolve) => {
          if (!socketInstance || !currentCallId) {
            console.error('📞 [CallPopup] Cannot join room: missing socket or callId', {
              hasSocket: !!socketInstance,
              callId: currentCallId
            })
            resolve(false)
            return
          }
          
          const joinRoomWithTimeout = () => {
            console.log('📞 [CallPopup] Joining call room:', `call-${currentCallId}`)
            console.log('📞 [CallPopup] Socket state:', {
              id: socketInstance.id,
              connected: socketInstance.connected,
              disconnected: socketInstance.disconnected
            })
            
            // Set timeout for room join (5 seconds)
            const timeout = setTimeout(() => {
              console.error('📞 [CallPopup] ⏱️ Room join timeout - no response from server')
              resolve(false)
            }, 5000)
            
            socketInstance.emit('call:joinRoom', { callId: currentCallId }, (response) => {
              clearTimeout(timeout)
              
              if (response && response.error) {
                console.error('📞 [CallPopup] ❌ Failed to join call room:', response.error)
                console.error('📞 [CallPopup] Response details:', response)
                resolve(false)
              } else {
                console.log('📞 [CallPopup] ✅ Successfully joined call room')
                console.log('📞 [CallPopup] Server response:', response)
                
                // Verify room join by checking socket state
                // Note: socket.rooms is not available on client, but we trust server response
                // We can verify by checking if socket is still connected
                if (socketInstance.connected) {
                  console.log('📞 [CallPopup] Socket still connected after room join')
                  roomJoinedRef.current = true // Mark as joined
                  resolve(true)
                } else {
                  console.warn('📞 [CallPopup] ⚠️ Socket disconnected after room join')
                  roomJoinedRef.current = false
                  resolve(false)
                }
              }
            })
          }
          
          if (socketInstance.connected) {
            joinRoomWithTimeout()
          } else {
            // Wait for connection then join
            console.log('📞 [CallPopup] Socket not connected, waiting for connection before joining room')
            const connectHandler = () => {
              socketInstance.off('connect', connectHandler)
              console.log('📞 [CallPopup] Socket connected, joining call room:', `call-${currentCallId}`)
              joinRoomWithTimeout()
            }
            socketInstance.once('connect', connectHandler)
            
            // Also set a timeout for connection wait
            setTimeout(() => {
              if (!socketInstance.connected) {
                console.error('📞 [CallPopup] ⏱️ Socket connection timeout')
                socketInstance.off('connect', connectHandler)
                resolve(false)
              }
            }, 10000) // 10 seconds for connection
          }
        })
      }
      
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

      // Use unified handler for call:ended
      const handleCallEnded = handleCallEndedUnified

        // Handle call declined (patient declined before call started)
        const handleCallDeclined = (data) => {
          const currentCallId = callIdRef.current
          const currentActiveCall = activeCallRef.current
          
          console.log('📞 [CallPopup] ====== call:declined EVENT RECEIVED ======')
          console.log('📞 [CallPopup] Event data:', data)
          console.log('📞 [CallPopup] Current callId (from ref):', currentCallId)
          console.log('📞 [CallPopup] Current activeCall (from ref):', currentActiveCall)
          
          // Process if we have an active call
          const callIdMatches = data && data.callId && data.callId === currentCallId
          const hasActiveCall = currentActiveCall && currentActiveCall.callId
          
          if (!callIdMatches && !hasActiveCall) {
            console.log('📞 [CallPopup] Ignoring call:declined - no callId match and no active call')
            return
          }
          
          console.log('📞 [CallPopup] ✅ Processing call:declined event - closing call')
          cleanup()
          setStatus('ended')
          setTimeout(() => {
            console.log('📞 [CallPopup] Closing call UI from call:declined event')
            endCall()
          }, 500)
        }

        const handleNewProducer = async (data) => {
          const eventTimestamp = Date.now()
          console.log('📞 [CallPopup] ====== mediasoup:newProducer EVENT RECEIVED ======')
          console.log('📞 [CallPopup] Producer data:', data)
          console.log('📞 [CallPopup] Our producer ID:', producerRef.current?.id)
          console.log('📞 [CallPopup] New producer ID:', data.producerId)
          
          // DIAGNOSTIC: Event flow tracking
          console.log(`🔍 [DIAGNOSTIC] Event received at:`, new Date(eventTimestamp).toISOString())
          const currentSocket = socketRef.current || socket
          console.log(`🔍 [DIAGNOSTIC] Call room membership check:`, {
            socketId: currentSocket?.id,
            socketConnected: currentSocket?.connected,
            callId: callIdRef.current,
            roomJoined: roomJoinedRef.current // socket.rooms not available on client
          })
          
          // Don't consume if call is ending or ended
          if (isEndingRef.current || status === 'ended' || status === 'error') {
            console.log('📞 [CallPopup] Ignoring new producer - call is ending or ended')
            console.log(`🔍 [DIAGNOSTIC] Event ignored due to call state:`, {
              isEnding: isEndingRef.current,
              status: status
            })
            return
          }
          
          if (!data.producerId) {
            console.warn('📞 [CallPopup] New producer event missing producerId')
            console.warn(`🔍 [DIAGNOSTIC] Invalid event data:`, data)
            return
          }
          
          // Never consume our own producer
          const isOurOwnProducer = producerRef.current && producerRef.current.id === data.producerId
          if (isOurOwnProducer) {
            console.log('📞 [CallPopup] Ignoring new producer - this is our own producer')
            console.log(`🔍 [DIAGNOSTIC] Event ignored - our own producer:`, {
              ourProducerId: producerRef.current.id,
              eventProducerId: data.producerId
            })
            return
          }
          
          // DIAGNOSTIC: Timing check - when was our producer created?
          const producerCreatedTime = producerRef.current?._createdAt || 'unknown'
          console.log(`🔍 [DIAGNOSTIC] Producer timing:`, {
            ourProducerCreated: producerCreatedTime !== 'unknown' ? new Date(producerCreatedTime).toISOString() : 'unknown',
            remoteProducerReceived: new Date(eventTimestamp).toISOString(),
            timeSinceOurProducer: producerCreatedTime !== 'unknown' ? (eventTimestamp - producerCreatedTime) + 'ms' : 'unknown'
          })
          
          // Consume the remote producer
          console.log('📞 [CallPopup] ✅ Consuming remote producer:', data.producerId)
          const consumeStartTime = Date.now()
          try {
            await consumeRemoteAudio(data.producerId)
            const consumeDuration = Date.now() - consumeStartTime
            console.log(`🔍 [DIAGNOSTIC] Consumer creation completed in ${consumeDuration}ms`)
          } catch (error) {
            console.error('📞 [CallPopup] Error consuming remote audio in handleNewProducer:', error)
            console.error(`🔍 [DIAGNOSTIC] Consumer creation failed after ${Date.now() - consumeStartTime}ms:`, error)
          }
        }

        socket.on('disconnect', handleDisconnect)
        socket.on('call:error', handleCallError)
        socket.on('call:ended', handleCallEnded)
        socket.on('call:declined', handleCallDeclined)
        socket.on('mediasoup:newProducer', handleNewProducer)

        socket.on('connect', async () => {
          console.log('📞 [CallPopup] Socket connected for call')
          socketRef.current = socket
          
          // Join call room BEFORE starting the call
          console.log('📞 [CallPopup] Joining call room before starting call...')
          const roomJoined = await joinCallRoom(socket)
          if (!roomJoined) {
            console.error('📞 [CallPopup] ❌ CRITICAL: Failed to join call room! Cannot proceed with call setup.')
            setError('Failed to join call room. Please try again.')
            setStatus('error')
            return // Don't proceed if room join failed
          } else {
            console.log('📞 [CallPopup] ✅ Successfully joined call room, now starting call')
          }
          
          // Store cleanup function after socketRef is set
          if (socketRef.current) {
            socketRef.current._callPopupCleanup = () => {
              socket.off('disconnect', handleDisconnect)
              socket.off('call:error', handleCallError)
              socket.off('call:ended', handleCallEnded)
              socket.off('call:declined', handleCallDeclined)
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

      // Use unified handler for call:ended
      const handleCallEnded = handleCallEndedUnified

        // Handle call declined (patient declined before call started)
        const handleCallDeclined = (data) => {
          const currentCallId = callIdRef.current
          const currentActiveCall = activeCallRef.current
          
          console.log('📞 [CallPopup] ====== call:declined EVENT RECEIVED ======')
          console.log('📞 [CallPopup] Event data:', data)
          console.log('📞 [CallPopup] Current callId (from ref):', currentCallId)
          console.log('📞 [CallPopup] Current activeCall (from ref):', currentActiveCall)
          
          // Process if we have an active call
          const callIdMatches = data && data.callId && data.callId === currentCallId
          const hasActiveCall = currentActiveCall && currentActiveCall.callId
          
          if (!callIdMatches && !hasActiveCall) {
            console.log('📞 [CallPopup] Ignoring call:declined - no callId match and no active call')
            return
          }
          
          console.log('📞 [CallPopup] ✅ Processing call:declined event - closing call')
          cleanup()
          setStatus('ended')
          setTimeout(() => {
            console.log('📞 [CallPopup] Closing call UI from call:declined event')
            endCall()
          }, 500)
        }

        const handleNewProducer = async (data) => {
          const eventTimestamp = Date.now()
          console.log('📞 [CallPopup] ====== mediasoup:newProducer EVENT RECEIVED ======')
          console.log('📞 [CallPopup] Producer data:', data)
          console.log('📞 [CallPopup] Our producer ID:', producerRef.current?.id)
          console.log('📞 [CallPopup] New producer ID:', data.producerId)
          
          // DIAGNOSTIC: Event flow tracking
          console.log(`🔍 [DIAGNOSTIC] Event received at:`, new Date(eventTimestamp).toISOString())
          const currentSocket = socketRef.current || socket
          console.log(`🔍 [DIAGNOSTIC] Call room membership check:`, {
            socketId: currentSocket?.id,
            socketConnected: currentSocket?.connected,
            callId: callIdRef.current,
            roomJoined: roomJoinedRef.current // socket.rooms not available on client
          })
          
          // Don't consume if call is ending or ended
          if (isEndingRef.current || status === 'ended' || status === 'error') {
            console.log('📞 [CallPopup] Ignoring new producer - call is ending or ended')
            console.log(`🔍 [DIAGNOSTIC] Event ignored due to call state:`, {
              isEnding: isEndingRef.current,
              status: status
            })
            return
          }
          
          if (!data.producerId) {
            console.warn('📞 [CallPopup] New producer event missing producerId')
            console.warn(`🔍 [DIAGNOSTIC] Invalid event data:`, data)
            return
          }
          
          // Never consume our own producer
          const isOurOwnProducer = producerRef.current && producerRef.current.id === data.producerId
          if (isOurOwnProducer) {
            console.log('📞 [CallPopup] Ignoring new producer - this is our own producer')
            console.log(`🔍 [DIAGNOSTIC] Event ignored - our own producer:`, {
              ourProducerId: producerRef.current.id,
              eventProducerId: data.producerId
            })
            return
          }
          
          // DIAGNOSTIC: Timing check - when was our producer created?
          const producerCreatedTime = producerRef.current?._createdAt || 'unknown'
          console.log(`🔍 [DIAGNOSTIC] Producer timing:`, {
            ourProducerCreated: producerCreatedTime !== 'unknown' ? new Date(producerCreatedTime).toISOString() : 'unknown',
            remoteProducerReceived: new Date(eventTimestamp).toISOString(),
            timeSinceOurProducer: producerCreatedTime !== 'unknown' ? (eventTimestamp - producerCreatedTime) + 'ms' : 'unknown'
          })
          
          // Consume the remote producer
          console.log('📞 [CallPopup] ✅ Consuming remote producer:', data.producerId)
          const consumeStartTime = Date.now()
          try {
            await consumeRemoteAudio(data.producerId)
            const consumeDuration = Date.now() - consumeStartTime
            console.log(`🔍 [DIAGNOSTIC] Consumer creation completed in ${consumeDuration}ms`)
          } catch (error) {
            console.error('📞 [CallPopup] Error consuming remote audio in handleNewProducer:', error)
            console.error(`🔍 [DIAGNOSTIC] Consumer creation failed after ${Date.now() - consumeStartTime}ms:`, error)
          }
        }

        socket.on('disconnect', handleDisconnect)
        socket.on('call:error', handleCallError)
        socket.on('call:ended', handleCallEnded)
        socket.on('call:declined', handleCallDeclined)
        socket.on('mediasoup:newProducer', handleNewProducer)

        // Store cleanup function for listeners
        if (socketRef.current) {
          socketRef.current._callPopupCleanup = () => {
            socket.off('disconnect', handleDisconnect)
            socket.off('call:error', handleCallError)
            socket.off('call:ended', handleCallEnded)
            socket.off('call:declined', handleCallDeclined)
            socket.off('mediasoup:newProducer', handleNewProducer)
          }
        }
        
        // Join call room BEFORE starting the call (for existing socket)
        console.log('📞 [CallPopup] Joining call room before starting call...')
        const roomJoined = await joinCallRoom(socket)
        if (!roomJoined) {
          console.error('📞 [CallPopup] ❌ CRITICAL: Failed to join call room! Cannot proceed with call setup.')
          setError('Failed to join call room. Please try again.')
          setStatus('error')
          return // Don't proceed if room join failed
        } else {
          console.log('📞 [CallPopup] ✅ Successfully joined call room, now starting call')
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
      if (!socket) {
        console.error('📞 [CallPopup] No socket available, cannot join call')
        return
      }

      const currentCallId = callIdRef.current // Use ref to get current callId
      if (!currentCallId) {
        console.warn('📞 [CallPopup] No callId available, cannot join call')
        return
      }
      
      console.log('📞 [CallPopup] ====== JOINING CALL ======')
      console.log('📞 [CallPopup] Call ID:', currentCallId)
      console.log('📞 [CallPopup] Socket connected:', socket.connected)
      console.log('📞 [CallPopup] Socket ID:', socket.id)

      // P2P/SFU Selection Logic
      const shouldUseP2P = useP2P
      const module = getModule()
      const isInitiator = module === 'doctor' // Doctor initiates the call
      
      if (shouldUseP2P) {
        console.log('🔗 [P2P] Using P2P connection mode')
        console.log('🔗 [P2P] Is initiator:', isInitiator)
        
        // Initialize P2P manager
        const p2pManager = new P2PCallManager(currentCallId, socket, () => {
          const module = getModule()
          return getAuthToken(module) || getAuthToken('patient') || getAuthToken('doctor')
        })
        p2pManagerRef.current = p2pManager
        
        // Set up remote stream handler
        p2pManager.onRemoteStream = (remoteStream) => {
          console.log('🔗 [P2P] Remote stream received, setting up audio element')
          const audioElement = remoteAudioRef.current
          if (audioElement && remoteStream) {
            audioElement.srcObject = remoteStream
            audioElement.volume = 1.0
            audioElement.muted = false
            
            // Try to play
            audioElement.play().catch(err => {
              console.error('🔗 [P2P] Error playing remote audio:', err)
            })
            
            console.log('🔗 [P2P] ✅ Remote audio stream configured')
          }
        }
        
        // Set up connection state handler
        p2pManager.onConnectionStateChange = (state) => {
          console.log('🔗 [P2P] Connection state changed:', state)
          if (state === 'connected') {
            setStatus('connected')
            if (!callStartTimeRef.current) {
              callStartTimeRef.current = Date.now()
              startDurationTimer()
            }
          } else if (state === 'failed' || state === 'disconnected') {
            console.error('🔗 [P2P] Connection failed:', state)
            setError('P2P connection failed')
            setStatus('error')
          }
        }
        
        // Set up P2P event handlers
        socket.on('p2p:offer', async (data) => {
          if (data.callId === currentCallId && !isInitiator) {
            console.log('🔗 [P2P] Received offer')
            try {
              await p2pManager.handleOffer(data.offer)
            } catch (error) {
              console.error('🔗 [P2P] Error handling offer:', error)
            }
          }
        })
        
        socket.on('p2p:answer', async (data) => {
          if (data.callId === currentCallId && isInitiator) {
            console.log('🔗 [P2P] Received answer')
            try {
              await p2pManager.handleAnswer(data.answer)
            } catch (error) {
              console.error('🔗 [P2P] Error handling answer:', error)
            }
          }
        })
        
        socket.on('p2p:iceCandidate', async (data) => {
          if (data.callId === currentCallId && data.candidate) {
            console.log('🔗 [P2P] Received ICE candidate')
            try {
              await p2pManager.handleIceCandidate(data.candidate)
            } catch (error) {
              console.error('🔗 [P2P] Error handling ICE candidate:', error)
            }
          }
        })
        
        // Initialize P2P connection
        const p2pInitialized = await p2pManager.initialize(isInitiator)
        if (!p2pInitialized) {
          console.error('🔗 [P2P] Failed to initialize P2P connection')
          setError('Failed to initialize P2P connection')
          setStatus('error')
          return
        }
        
        console.log('🔗 [P2P] ✅ P2P connection initialized')
        setStatus('connected')
        if (!callStartTimeRef.current) {
          callStartTimeRef.current = Date.now()
          startDurationTimer()
        }
        
        return // Exit early, P2P flow complete
      } else {
        console.log('📞 [SFU] Using SFU (mediasoup) connection mode')
      }

      // Get RTP capabilities (SFU flow continues below)
      const { rtpCapabilities, iceServers } = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:getRtpCapabilities', { callId: currentCallId }, (response) => {
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
        socket.emit('mediasoup:createWebRtcTransport', { callId: currentCallId }, (response) => {
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

      // DIAGNOSTIC: Monitor send transport connection state
      sendTransport.on('connectstatechange', (state) => {
        console.log(`🔍 [DIAGNOSTIC] Send transport connectionState changed: ${state}`)
        console.log(`🔍 [DIAGNOSTIC] Send transport details:`, {
          id: sendTransport.id,
          connectionState: sendTransport.connectionState,
          iceState: sendTransport.iceState,
          dtlsState: sendTransport.dtlsState,
          state: state
        })
        
        if (state === 'failed' || state === 'disconnected') {
          console.error(`🔍 [DIAGNOSTIC] ⚠️ Send transport connection issue: ${state}`)
          console.error(`🔍 [DIAGNOSTIC] Send transport failure details:`, {
            id: sendTransport.id,
            connectionState: sendTransport.connectionState,
            iceState: sendTransport.iceState,
            dtlsState: sendTransport.dtlsState,
            closed: sendTransport.closed,
            iceServers: iceServers
          })
        }
      })
      
      // DIAGNOSTIC: Monitor ICE state changes
      sendTransport.on('icegatheringstatechange', (state) => {
        console.log(`🔍 [DIAGNOSTIC] Send transport ICE gathering state: ${state}`)
      })
      
      // DIAGNOSTIC: Monitor ICE connection state
      sendTransport.on('iceconnectionstatechange', (state) => {
        console.log(`🔍 [DIAGNOSTIC] Send transport ICE connection state: ${state}`)
        if (state === 'failed' || state === 'disconnected') {
          console.error(`🔍 [DIAGNOSTIC] ⚠️ Send transport ICE connection issue: ${state}`)
        }
      })
      
      // DIAGNOSTIC: Monitor DTLS state changes
      sendTransport.on('dtlsstatechange', (state) => {
        console.log(`🔍 [DIAGNOSTIC] Send transport DTLS state: ${state}`)
        if (state === 'failed') {
          console.error(`🔍 [DIAGNOSTIC] ⚠️ Send transport DTLS failed`)
        }
      })

      sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        console.log(`🔍 [DIAGNOSTIC] Send transport connecting...`)
        console.log(`🔍 [DIAGNOSTIC] DTLS parameters:`, {
          role: dtlsParameters.role,
          fingerprints: dtlsParameters.fingerprints?.length || 0
        })
        try {
          // Add timeout for transport connection
          const timeout = setTimeout(() => {
            console.error(`🔍 [DIAGNOSTIC] ⏱️ Send transport connection timeout (10s)`)
            errback(new Error('Transport connection timeout'))
          }, 10000)
          
          socket.emit('mediasoup:connectTransport', {
            transportId: sendTransport.id,
            dtlsParameters,
            callId: currentCallId, // Include callId for verification
          }, (response) => {
            clearTimeout(timeout)
            if (response && response.error) {
              console.error(`🔍 [DIAGNOSTIC] ❌ Send transport DTLS connection failed:`, response.error)
              console.error(`🔍 [DIAGNOSTIC] Server response:`, response)
              errback(new Error(response.error))
            } else {
              console.log(`🔍 [DIAGNOSTIC] ✅ Send transport DTLS connected successfully`)
              console.log(`🔍 [DIAGNOSTIC] Server response:`, response)
              callback()
            }
          })
        } catch (error) {
          console.error(`🔍 [DIAGNOSTIC] Send transport connect error:`, error)
          console.error(`🔍 [DIAGNOSTIC] Error stack:`, error.stack)
          errback(error)
        }
      })

      // DIAGNOSTIC: Monitor ICE connection state
      if (sendTransport.observer) {
        sendTransport.observer.on('newtransport', (transport) => {
          console.log(`🔍 [DIAGNOSTIC] Send transport observer: new transport`, transport)
        })
      }

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
        socket.emit('mediasoup:createWebRtcTransport', { callId: currentCallId }, (response) => {
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

      // DIAGNOSTIC: Monitor recv transport connection state
      recvTransport.on('connectstatechange', (state) => {
        console.log(`🔍 [DIAGNOSTIC] Recv transport connectionState changed: ${state}`)
        console.log(`🔍 [DIAGNOSTIC] Recv transport details:`, {
          id: recvTransport.id,
          connectionState: recvTransport.connectionState,
          state: state
        })
      })

      recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        console.log(`🔍 [DIAGNOSTIC] Recv transport connecting...`)
        try {
          socket.emit('mediasoup:connectTransport', {
            transportId: recvTransport.id,
            dtlsParameters,
          }, (response) => {
            if (response.error) {
              console.error(`🔍 [DIAGNOSTIC] Recv transport DTLS connection failed:`, response.error)
              errback(new Error(response.error))
            } else {
              console.log(`🔍 [DIAGNOSTIC] ✅ Recv transport DTLS connected successfully`)
              callback()
            }
          })
        } catch (error) {
          console.error(`🔍 [DIAGNOSTIC] Recv transport connect error:`, error)
          errback(error)
        }
      })

      // DIAGNOSTIC: Log initial transport states
      console.log(`🔍 [DIAGNOSTIC] Send transport initial state:`, {
        id: sendTransport.id,
        connectionState: sendTransport.connectionState,
        closed: sendTransport.closed
      })
      console.log(`🔍 [DIAGNOSTIC] Recv transport initial state:`, {
        id: recvTransport.id,
        connectionState: recvTransport.connectionState,
        closed: recvTransport.closed
      })

      // DIAGNOSTIC: Monitor ICE connection state
      const monitorTransportStates = setInterval(() => {
        if (!sendTransportRef.current || !recvTransportRef.current) {
          clearInterval(monitorTransportStates)
          return
        }
        
        const sendState = sendTransportRef.current.connectionState
        const recvState = recvTransportRef.current.connectionState
        
        console.log(`🔍 [DIAGNOSTIC] Transport states periodic check:`, {
          sendTransport: {
            id: sendTransportRef.current.id,
            connectionState: sendState,
            closed: sendTransportRef.current.closed
          },
          recvTransport: {
            id: recvTransportRef.current.id,
            connectionState: recvState,
            closed: recvTransportRef.current.closed
          },
          timestamp: new Date().toISOString()
        })

        // Check for connection issues
        if (sendState === 'failed' || sendState === 'disconnected') {
          console.error(`🔍 [DIAGNOSTIC] ⚠️ Send transport connection issue: ${sendState}`)
        }
        if (recvState === 'failed' || recvState === 'disconnected') {
          console.error(`🔍 [DIAGNOSTIC] ⚠️ Recv transport connection issue: ${recvState}`)
        }
      }, 5000) // Check every 5 seconds

      // Store interval for cleanup
      if (sendTransportRef.current) {
        sendTransportRef.current._monitorInterval = monitorTransportStates
      }

      recvTransportRef.current = recvTransport

      // CRITICAL: Ensure we're in the call room before producing audio
      // This prevents race condition where producer event is emitted before room join completes
      console.log('📞 [CallPopup] Verifying call room membership before producing...')
      if (socket && socket.connected) {
        // Double-check room membership
        const verifyRoomJoin = () => {
          return new Promise((resolve) => {
            socket.emit('call:joinRoom', { callId: currentCallId }, (response) => {
              if (response && response.error) {
                console.warn('📞 [CallPopup] Room join verification failed:', response.error)
                resolve(false)
              } else {
                console.log('📞 [CallPopup] ✅ Confirmed in call room, proceeding with audio production')
                resolve(true)
              }
            })
          })
        }
        
        const roomJoined = await verifyRoomJoin()
        if (!roomJoined) {
          console.warn('📞 [CallPopup] ⚠️ Room join verification failed, but continuing with production')
        }
      } else {
        console.warn('📞 [CallPopup] ⚠️ Socket not available for room verification')
      }

      // Get user media and produce
      await produceLocalAudio()

      // Request existing producers for this call (to handle race condition)
      // This ensures we consume audio from participants who joined before us
      console.log('📞 [CallPopup] Fetching existing producers for call:', currentCallId)
      try {
        const existingProducersResponse = await new Promise((resolve, reject) => {
          socket.emit('mediasoup:getProducers', { callId: currentCallId }, (response) => {
            if (response.error) {
              reject(new Error(response.error))
            } else {
              resolve(response)
            }
          })
        })

        const existingProducers = existingProducersResponse.producers || []
        console.log('📞 [CallPopup] Found', existingProducers.length, 'existing producer(s):', existingProducers.map(p => p.id))
        console.log('📞 [CallPopup] Our producer ID:', producerRef.current?.id)
        
        // Consume all existing producers (from other participants who joined earlier)
        if (existingProducers.length > 0) {
          for (const producer of existingProducers) {
            // Only consume if:
            // 1. Producer has a valid ID
            // 2. It's not our own producer
            // 3. We haven't already consumed it (check consumerRef)
            const isOurProducer = producer.id === producerRef.current?.id
            const alreadyConsumed = consumerRef.current && 
              consumerRef.current.producerId === producer.id
            
            if (producer.id && !isOurProducer && !alreadyConsumed) {
              console.log('📞 [CallPopup] ✅ Consuming existing producer:', producer.id)
              try {
                await consumeRemoteAudio(producer.id)
                console.log('📞 [CallPopup] ✅ Successfully consumed existing producer:', producer.id)
              } catch (error) {
                console.error('📞 [CallPopup] Error consuming existing producer:', producer.id, error)
                // Continue with other producers even if one fails
              }
            } else {
              if (isOurProducer) {
                console.log('📞 [CallPopup] Skipping existing producer - this is our own:', producer.id)
              } else if (alreadyConsumed) {
                console.log('📞 [CallPopup] Skipping existing producer - already consumed:', producer.id)
              } else {
                console.warn('📞 [CallPopup] Skipping existing producer - invalid ID:', producer)
              }
            }
          }
        } else {
          console.log('📞 [CallPopup] No existing producers found - will wait for new producer events')
        }
      } catch (error) {
        console.warn('📞 [CallPopup] Error getting existing producers (non-critical):', error)
        console.warn('📞 [CallPopup] Will rely on mediasoup:newProducer events for remote audio')
        // Don't fail the call if this fails - we'll still listen for new producers
      }

      setStatus('connected')
      callStartTimeRef.current = Date.now()
      startDurationTimer()

      // Notify server that we've successfully joined the call (for doctor notification)
      // Note: module is already declared at the start of joinCall function
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
          
          currentSocket.emit('call:joined', { callId: currentCallId }, (response) => {
            if (response) {
              console.log('📞 [CallPopup] call:joined acknowledgment:', response)
            }
          })
        } else {
          console.warn('📞 [CallPopup] Socket not connected, waiting for connection before emitting call:joined')
          const connectHandler = () => {
            console.log('📞 [CallPopup] Socket connected, now emitting call:joined')
            currentSocket.emit('call:joined', { callId: currentCallId })
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
      console.log('📞 [CallPopup] ====== PRODUCING LOCAL AUDIO ======')
      console.log('📞 [CallPopup] Requesting microphone access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      
      const audioTracks = stream.getAudioTracks()
      console.log('📞 [CallPopup] Microphone access granted, audio tracks:', audioTracks.length)
      if (audioTracks.length > 0) {
        console.log('📞 [CallPopup] Audio track details:', {
          id: audioTracks[0].id,
          label: audioTracks[0].label,
          enabled: audioTracks[0].enabled,
          muted: audioTracks[0].muted,
          readyState: audioTracks[0].readyState
        })
      }

      if (!sendTransportRef.current) {
        throw new Error('Send transport not available')
      }
      
      const track = audioTracks[0]
      const params = {
        track,
        codecOptions: {
          opusStereo: true,
          opusFec: true,
          opusDtx: true,
          opusMaxPlaybackRate: 48000,
        },
      }

      console.log('📞 [CallPopup] Creating producer with send transport:', sendTransportRef.current.id)
      const producerCreateStartTime = Date.now()
      const producer = await sendTransportRef.current.produce(params)
      const producerCreateDuration = Date.now() - producerCreateStartTime
      producerRef.current = producer
      producer._createdAt = producerCreateStartTime // Store creation time for diagnostics

      console.log('📞 [CallPopup] ✅ Producer created successfully:', {
        id: producer.id,
        kind: producer.kind,
        trackId: producer.track?.id,
        creationTime: producerCreateDuration + 'ms'
      })
      console.log('📞 [CallPopup] Producer will notify other participants via mediasoup:newProducer event')
      
      // DIAGNOSTIC: Log producer creation timing
      console.log(`🔍 [DIAGNOSTIC] Producer creation:`, {
        producerId: producer.id,
        createdAt: new Date(producerCreateStartTime).toISOString(),
        creationDuration: producerCreateDuration + 'ms',
        transportId: sendTransportRef.current.id,
        callId: callIdRef.current
      })

      // DIAGNOSTIC: Monitor producer state
      console.log(`🔍 [DIAGNOSTIC] Producer details:`, {
        id: producer.id,
        kind: producer.kind,
        paused: producer.paused,
        closed: producer.closed,
        track: producer.track ? {
          id: producer.track.id,
          kind: producer.track.kind,
          enabled: producer.track.enabled,
          muted: producer.track.muted,
          readyState: producer.track.readyState
        } : null
      })

      // DIAGNOSTIC: Monitor producer events
      producer.on('transportclose', () => {
        console.warn(`🔍 [DIAGNOSTIC] ⚠️ Producer transport closed:`, producer.id)
      })

      // DIAGNOSTIC: Check if producer is actually sending data
      if (producer.track) {
        const checkProducerActivity = setInterval(() => {
          if (producer.closed) {
            clearInterval(checkProducerActivity)
            return
          }
          console.log(`🔍 [DIAGNOSTIC] Producer activity check:`, {
            id: producer.id,
            paused: producer.paused,
            trackEnabled: producer.track.enabled,
            trackMuted: producer.track.muted,
            trackReadyState: producer.track.readyState
          })
        }, 5000) // Check every 5 seconds

        // Clean up interval on component unmount
        if (producerRef.current) {
          producerRef.current._activityCheckInterval = checkProducerActivity
        }
      }

      // Note: We'll consume when we receive mediasoup:newProducer event
    } catch (error) {
      console.error('📞 [CallPopup] ❌ Error producing local audio:', error)
      console.error('📞 [CallPopup] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      setError('Failed to access microphone: ' + error.message)
      setStatus('error')
    }
  }

  const consumeRemoteAudio = async (producerId) => {
    try {
      console.log('📞 [CallPopup] ====== CONSUMING REMOTE AUDIO ======')
      console.log('📞 [CallPopup] Producer ID:', producerId)
      
      // Don't consume if call is ending or ended
      if (isEndingRef.current || status === 'ended' || status === 'error') {
        console.log('📞 [CallPopup] Cannot consume - call is ending or ended')
        return
      }

      // Close existing consumer if we're replacing it (for 1-to-1 calls, there should only be one remote producer)
      if (consumerRef.current) {
        console.log('📞 [CallPopup] Replacing existing consumer with new producer:', producerId)
        console.log('📞 [CallPopup] Old consumer ID:', consumerRef.current.id)
        try {
          consumerRef.current.close()
          console.log('📞 [CallPopup] Old consumer closed')
        } catch (error) {
          console.warn('📞 [CallPopup] Error closing existing consumer:', error)
        }
        consumerRef.current = null
      }

      const device = deviceRef.current
      const recvTransport = recvTransportRef.current
      const socket = socketRef.current

      if (!device || !recvTransport || !socket) {
        console.warn('📞 [CallPopup] Cannot consume - missing required components:', {
          device: !!device,
          recvTransport: !!recvTransport,
          socket: !!socket
        })
        return
      }

      const currentCallId = callIdRef.current
      if (!currentCallId) {
        console.warn('📞 [CallPopup] No callId available, cannot consume')
        return
      }

      console.log('📞 [CallPopup] Requesting consumer from server...')
      console.log('📞 [CallPopup] Transport ID:', recvTransport.id)
      console.log('📞 [CallPopup] Call ID:', currentCallId)
      
      const { consumer } = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:consume', {
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
          callId: currentCallId,
        }, (response) => {
          if (response.error) {
            console.error('📞 [CallPopup] Server error creating consumer:', response.error)
            reject(new Error(response.error))
          } else {
            console.log('📞 [CallPopup] ✅ Consumer created on server:', response.consumer?.id)
            resolve(response)
          }
        })
      })

      // Check if recvTransport is still valid before consuming
      if (!recvTransportRef.current || recvTransportRef.current.closed) {
        console.warn('📞 [CallPopup] Receive transport is closed, cannot consume')
        return
      }

      console.log('📞 [CallPopup] Creating consumer instance with mediasoup-client...')
      // Create consumer using mediasoup-client
      const consumerInstance = await recvTransport.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      })

      consumerRef.current = consumerInstance
      console.log('📞 [CallPopup] ✅ Consumer instance created:', {
        id: consumerInstance.id,
        producerId: consumerInstance.producerId,
        kind: consumerInstance.kind,
        hasTrack: !!consumerInstance.track
      })

      // DIAGNOSTIC: Monitor consumer state
      console.log(`🔍 [DIAGNOSTIC] Consumer details:`, {
        id: consumerInstance.id,
        producerId: consumerInstance.producerId,
        kind: consumerInstance.kind,
        paused: consumerInstance.paused,
        closed: consumerInstance.closed,
        track: consumerInstance.track ? {
          id: consumerInstance.track.id,
          kind: consumerInstance.track.kind,
          enabled: consumerInstance.track.enabled,
          muted: consumerInstance.track.muted,
          readyState: consumerInstance.track.readyState
        } : null
      })

      // DIAGNOSTIC: Monitor consumer events
      consumerInstance.on('transportclose', () => {
        console.warn(`🔍 [DIAGNOSTIC] ⚠️ Consumer transport closed:`, consumerInstance.id)
      })

      consumerInstance.on('producerclose', () => {
        console.warn(`🔍 [DIAGNOSTIC] ⚠️ Consumer producer closed:`, consumerInstance.producerId)
      })

      // Resume consumer on server (consumers are paused by default in mediasoup)
      console.log('📞 [CallPopup] Resuming consumer on server...')
      try {
        await new Promise((resolve, reject) => {
          socket.emit('mediasoup:resumeConsumer', {
            consumerId: consumerInstance.id,
          }, (response) => {
            if (response.error) {
              console.error('📞 [CallPopup] Server error resuming consumer:', response.error)
              reject(new Error(response.error))
            } else {
              console.log('📞 [CallPopup] ✅ Consumer resumed on server')
              
              // DIAGNOSTIC: Verify consumer is actually resumed
              console.log(`🔍 [DIAGNOSTIC] Consumer resume verification:`, {
                id: consumerInstance.id,
                paused: consumerInstance.paused,
                closed: consumerInstance.closed
              })
              
              resolve(response)
            }
          })
        })
      } catch (error) {
        console.error('📞 [CallPopup] ❌ Error resuming consumer:', error)
        console.error(`🔍 [DIAGNOSTIC] Consumer resume failed - consumer may be paused!`)
        // Don't fail the call if resume fails - try to continue anyway
      }

      // Ensure the track is enabled
      if (consumerInstance.track) {
        consumerInstance.track.enabled = true
        console.log('📞 [CallPopup] Consumer track details:', {
          id: consumerInstance.track.id,
          kind: consumerInstance.track.kind,
          enabled: consumerInstance.track.enabled,
          readyState: consumerInstance.track.readyState,
          muted: consumerInstance.track.muted
        })
      } else {
        console.error('📞 [CallPopup] ❌ Consumer instance has no track!')
      }

      // Wait for audio element to be ready and set up remote audio playback
      console.log('📞 [CallPopup] Setting up audio element for remote audio...')
      const setupAudioElement = (retryCount = 0) => {
        const maxRetries = 10
        if (!remoteAudioRef.current) {
          if (retryCount < maxRetries) {
            console.warn(`📞 [CallPopup] Audio element not available, retrying... (${retryCount + 1}/${maxRetries})`)
            // Retry after a short delay if element is not ready
            setTimeout(() => {
              setupAudioElement(retryCount + 1)
            }, 100)
            return
          } else {
            console.error('📞 [CallPopup] ❌ Audio element still not available after', maxRetries, 'retries')
            return
          }
        }

        const audioElement = remoteAudioRef.current
        console.log('📞 [CallPopup] Audio element found, setting up remote audio stream...')

        // DIAGNOSTIC: Check audio element initial state
        console.log(`🔍 [DIAGNOSTIC] Audio element initial state:`, {
          paused: audioElement.paused,
          muted: audioElement.muted,
          volume: audioElement.volume,
          readyState: audioElement.readyState,
          srcObject: !!audioElement.srcObject,
          error: audioElement.error
        })

        // Create audio element for remote audio
        const stream = new MediaStream([consumerInstance.track])
        console.log('📞 [CallPopup] Created MediaStream with track:', {
          trackId: consumerInstance.track.id,
          kind: consumerInstance.track.kind,
          enabled: consumerInstance.track.enabled
        })
        
        // DIAGNOSTIC: Check MediaStream state
        console.log(`🔍 [DIAGNOSTIC] MediaStream details:`, {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().map(t => ({
            id: t.id,
            kind: t.kind,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState
          }))
        })
        
        // Set up audio element properties
        audioElement.srcObject = stream
        audioElement.volume = 1.0 // Ensure volume is at maximum
        audioElement.muted = false // Ensure not muted
        
        console.log('📞 [CallPopup] Audio element configured:', {
          volume: audioElement.volume,
          muted: audioElement.muted,
          paused: audioElement.paused,
          readyState: audioElement.readyState
        })

        // DIAGNOSTIC: Verify audio element configuration
        console.log(`🔍 [DIAGNOSTIC] Audio element after configuration:`, {
          srcObject: !!audioElement.srcObject,
          srcObjectTracks: audioElement.srcObject ? audioElement.srcObject.getTracks().length : 0,
          volume: audioElement.volume,
          muted: audioElement.muted,
          paused: audioElement.paused,
          readyState: audioElement.readyState,
          autoplay: audioElement.autoplay
        })
        
        // Add event listeners for debugging
        const onLoadedMetadata = () => {
          console.log('📞 [CallPopup] ✅ Audio metadata loaded')
        }
        
        const onCanPlay = () => {
          console.log('📞 [CallPopup] ✅ Audio can play')
        }
        
        const onPlay = () => {
          console.log('📞 [CallPopup] ✅ Audio started playing')
        }
        
        const onError = (e) => {
          console.error('📞 [CallPopup] ❌ Audio element error:', e)
          console.error('📞 [CallPopup] Error details:', {
            error: audioElement.error,
            code: audioElement.error?.code,
            message: audioElement.error?.message
          })
          console.error(`🔍 [DIAGNOSTIC] Audio element error state:`, {
            paused: audioElement.paused,
            muted: audioElement.muted,
            volume: audioElement.volume,
            readyState: audioElement.readyState,
            srcObject: !!audioElement.srcObject,
            error: audioElement.error
          })
        }

        const onStalled = () => {
          console.warn(`🔍 [DIAGNOSTIC] ⚠️ Audio element stalled`)
        }

        const onWaiting = () => {
          console.warn(`🔍 [DIAGNOSTIC] ⚠️ Audio element waiting for data`)
        }

        const onSuspend = () => {
          console.warn(`🔍 [DIAGNOSTIC] ⚠️ Audio element suspended`)
        }
        
        audioElement.addEventListener('loadedmetadata', onLoadedMetadata)
        audioElement.addEventListener('canplay', onCanPlay)
        audioElement.addEventListener('play', onPlay)
        audioElement.addEventListener('error', onError)
        audioElement.addEventListener('stalled', onStalled)
        audioElement.addEventListener('waiting', onWaiting)
        audioElement.addEventListener('suspend', onSuspend)

        // DIAGNOSTIC: Monitor audio element state periodically
        const monitorAudioElement = setInterval(() => {
          if (!audioElement || audioElement.ended) {
            clearInterval(monitorAudioElement)
            return
          }
          console.log(`🔍 [DIAGNOSTIC] Audio element periodic check:`, {
            paused: audioElement.paused,
            muted: audioElement.muted,
            volume: audioElement.volume,
            readyState: audioElement.readyState,
            currentTime: audioElement.currentTime,
            duration: audioElement.duration,
            srcObject: !!audioElement.srcObject,
            srcObjectActive: audioElement.srcObject ? audioElement.srcObject.active : false,
            error: audioElement.error
          })
        }, 5000) // Check every 5 seconds

        // Store interval for cleanup
        if (remoteAudioRef.current) {
          remoteAudioRef.current._monitorInterval = monitorAudioElement
        }

        // Play the audio with retry logic
        const playAudio = async (playRetryCount = 0) => {
          const maxPlayRetries = 3
          try {
            console.log('📞 [CallPopup] Attempting to play remote audio...')
            await audioElement.play()
            console.log('📞 [CallPopup] ✅ Remote audio playing successfully')
          } catch (playError) {
            console.warn('📞 [CallPopup] Initial play() failed:', playError.name, playError.message)
            if (playRetryCount < maxPlayRetries) {
              // Retry after a short delay
              console.log(`📞 [CallPopup] Retrying play()... (${playRetryCount + 1}/${maxPlayRetries})`)
              setTimeout(async () => {
                try {
                  await audioElement.play()
                  console.log('📞 [CallPopup] ✅ Remote audio playing after retry')
                } catch (retryError) {
                  console.error('📞 [CallPopup] ❌ Failed to play remote audio after retry:', retryError)
                  // Some browsers require user interaction - log but don't fail
                  if (retryError.name === 'NotAllowedError') {
                    console.warn('📞 [CallPopup] Browser blocked autoplay - user interaction may be required')
                  } else {
                    // Try one more time if not a permission error
                    if (playRetryCount < maxPlayRetries - 1) {
                      playAudio(playRetryCount + 1)
                    }
                  }
                }
              }, 200 * (playRetryCount + 1)) // Exponential backoff
            } else {
              console.error('📞 [CallPopup] ❌ Failed to play remote audio after', maxPlayRetries, 'retries')
              if (playError.name === 'NotAllowedError') {
                console.warn('📞 [CallPopup] Browser blocked autoplay - user interaction may be required')
              }
            }
          }
        }

        playAudio()
      }

      // Setup audio element (with retry if not ready)
      setupAudioElement()
      
      console.log('📞 [CallPopup] ✅ Successfully consuming remote audio from producer:', producerId)
    } catch (error) {
      // Check if error is due to call being ended or transport/router being closed
      const errorMessage = error.message || error.toString()
      const isCallEndedError = 
        errorMessage.includes('Router not found') ||
        errorMessage.includes('Transport') && errorMessage.includes('closed') ||
        errorMessage.includes('call') && errorMessage.includes('ended')
      
      if (isCallEndedError) {
        // Call was likely ended, this is expected - don't log as error
        console.log('📞 [CallPopup] Cannot consume remote audio - call may have ended:', errorMessage)
      } else {
        // Other errors should be logged
        console.error('📞 [CallPopup] Error consuming remote audio:', error)
      }
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
    // Handle P2P mute
    if (p2pManagerRef.current) {
      const newMutedState = !isMuted
      p2pManagerRef.current.setMuted(newMutedState)
      setIsMuted(newMutedState)
      
      // Notify DoctorCallStatus of mute state change
      const event = new CustomEvent('call:muteStateUpdate', { detail: { muted: newMutedState } })
      window.dispatchEvent(event)
      return
    }
    
    // Handle SFU mute
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

  const handleEndCall = async (emitToServer = true) => {
    // Prevent duplicate call end
    if (isEndingRef.current) {
      console.log('📞 [CallPopup] handleEndCall called but already ending, ignoring')
      return
    }
    isEndingRef.current = true

    // Ensure emitToServer is a boolean (in case event object was passed)
    const shouldEmitToServer = typeof emitToServer === 'boolean' ? emitToServer : true

    const currentCallId = callIdRef.current // Use ref to get current callId
    console.log('📞 [CallPopup] ====== ENDING CALL ======')
    console.log('📞 [CallPopup] callId (from ref):', currentCallId)
    console.log('📞 [CallPopup] emitToServer:', shouldEmitToServer)

    try {
      const socket = socketRef.current
      // Only emit to server if we're the one initiating the end
      // If emitToServer is false, it means the call was ended by the other party
      if (socket && shouldEmitToServer && currentCallId) {
        console.log('📞 [CallPopup] Emitting call:end to server')
        socket.emit('call:end', { callId: currentCallId }, (response) => {
          if (response) {
            console.log('📞 [CallPopup] call:end acknowledgment:', response)
          }
        })
      } else {
        console.log('📞 [CallPopup] Not emitting call:end to server (call ended by other party)')
      }
    } catch (error) {
      console.error('📞 [CallPopup] Error ending call:', error)
    } finally {
      console.log('📞 [CallPopup] Cleaning up call resources')
      cleanup()
      setStatus('ended')
      // Close the call UI immediately (reduced from 2000ms to 500ms for faster response)
      setTimeout(() => {
        console.log('📞 [CallPopup] Closing call UI')
        endCall() // Use context to close call
        isEndingRef.current = false // Reset for next call
      }, 500) // Reduced delay for faster UI response
    }
  }

  const cleanup = () => {
    console.log('📞 [CallPopup] Cleaning up call resources')
    isEndingRef.current = true
    roomJoinedRef.current = false // Reset room join status
    
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current)
    }

    // Cleanup P2P connection
    if (p2pManagerRef.current) {
      console.log('🔗 [P2P] Cleaning up P2P connection')
      p2pManagerRef.current.cleanup()
      p2pManagerRef.current = null
      
      // Remove P2P event listeners
      const socket = socketRef.current
      if (socket) {
        socket.off('p2p:offer')
        socket.off('p2p:answer')
        socket.off('p2p:iceCandidate')
      }
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // Close producer (SFU)
    if (producerRef.current) {
      producerRef.current.close()
      producerRef.current = null
    }

    // Close consumer (SFU)
    if (consumerRef.current) {
      consumerRef.current.close()
      consumerRef.current = null
    }

    // Close transports (SFU)
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
        const currentCallId = callIdRef.current
        if (currentCallId) {
          socketRef.current.emit('call:leave', { callId: currentCallId })
        }
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

  // Minimized view - floating button (for doctors)
  if (isMinimized && getModule() === 'doctor') {
    return (
      <div className="fixed bottom-6 right-6 z-[10000]">
        <button
          onClick={maximize}
          className="relative flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition active:scale-95"
          title="Click to expand call"
        >
          {/* Pulsing animation */}
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          <IoCallOutline className="text-white text-2xl relative z-10" />
          
          {/* Duration badge */}
          {status === 'connected' && callDuration > 0 && (
            <span className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {formatCallDuration(callDuration).split(':')[1]}
            </span>
          )}
        </button>
      </div>
    )
  }

  // DIAGNOSTIC: Get current diagnostic state
  const getDiagnosticState = () => {
    return {
      callId: callIdRef.current,
      status: status,
      socket: socketRef.current ? {
        id: socketRef.current.id,
        connected: socketRef.current.connected,
        roomJoined: roomJoinedRef.current, // Track room join status (socket.rooms not available on client)
        // Note: socket.rooms is server-side only, we track join status via roomJoinedRef
      } : null,
      sendTransport: sendTransportRef.current ? {
        id: sendTransportRef.current.id,
        connectionState: sendTransportRef.current.connectionState,
        closed: sendTransportRef.current.closed
      } : null,
      recvTransport: recvTransportRef.current ? {
        id: recvTransportRef.current.id,
        connectionState: recvTransportRef.current.connectionState,
        closed: recvTransportRef.current.closed
      } : null,
      producer: producerRef.current ? {
        id: producerRef.current.id,
        paused: producerRef.current.paused,
        closed: producerRef.current.closed,
        track: producerRef.current.track ? {
          enabled: producerRef.current.track.enabled,
          muted: producerRef.current.track.muted,
          readyState: producerRef.current.track.readyState
        } : null
      } : null,
      consumer: consumerRef.current ? {
        id: consumerRef.current.id,
        producerId: consumerRef.current.producerId,
        paused: consumerRef.current.paused,
        closed: consumerRef.current.closed,
        track: consumerRef.current.track ? {
          enabled: consumerRef.current.track.enabled,
          muted: consumerRef.current.track.muted,
          readyState: consumerRef.current.track.readyState
        } : null
      } : null,
      audioElement: remoteAudioRef.current ? {
        paused: remoteAudioRef.current.paused,
        muted: remoteAudioRef.current.muted,
        volume: remoteAudioRef.current.volume,
        readyState: remoteAudioRef.current.readyState,
        srcObject: !!remoteAudioRef.current.srcObject,
        error: remoteAudioRef.current.error
      } : null
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        {/* Minimize button (for doctors) */}
        {getModule() === 'doctor' && (
          <button
            onClick={minimize}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 rounded p-1 transition"
            title="Minimize"
          >
            <IoRemoveOutline className="text-xl" />
          </button>
        )}
        
        {/* Diagnostic Toggle Button */}
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="absolute top-4 left-4 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition"
          title="Toggle Diagnostics"
        >
          🔍 {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
        </button>
        
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
        <audio 
          ref={remoteAudioRef} 
          autoPlay 
          playsInline 
          volume={1.0}
          style={{ display: 'none' }}
        />

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
            onClick={() => handleEndCall(true)}
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

        {/* Diagnostic Panel */}
        {showDiagnostics && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-2">🔍 Diagnostic Information</h3>
            <div className="space-y-2 text-xs">
              <div>
                <strong>Call ID:</strong> {callIdRef.current || 'N/A'}
              </div>
              <div>
                <strong>Status:</strong> {status}
              </div>
              
              {socketRef.current && (
                <div className="mt-2">
                  <strong>Socket:</strong>
                  <div className="ml-2 text-slate-600">
                    ID: {socketRef.current.id}<br/>
                    Connected: {socketRef.current.connected ? '✅' : '❌'}<br/>
                    Room Joined: {roomJoinedRef.current ? '✅ Yes' : '❌ No'}
                  </div>
                </div>
              )}

              {sendTransportRef.current && (
                <div className="mt-2">
                  <strong>Send Transport:</strong>
                  <div className="ml-2 text-slate-600">
                    ID: {sendTransportRef.current.id}<br/>
                    State: <span className={sendTransportRef.current.connectionState === 'connected' ? 'text-green-600' : 'text-yellow-600'}>{sendTransportRef.current.connectionState}</span><br/>
                    Closed: {sendTransportRef.current.closed ? '❌' : '✅'}
                  </div>
                </div>
              )}

              {recvTransportRef.current && (
                <div className="mt-2">
                  <strong>Recv Transport:</strong>
                  <div className="ml-2 text-slate-600">
                    ID: {recvTransportRef.current.id}<br/>
                    State: <span className={recvTransportRef.current.connectionState === 'connected' ? 'text-green-600' : 'text-yellow-600'}>{recvTransportRef.current.connectionState}</span><br/>
                    Closed: {recvTransportRef.current.closed ? '❌' : '✅'}
                  </div>
                </div>
              )}

              {producerRef.current && (
                <div className="mt-2">
                  <strong>Producer:</strong>
                  <div className="ml-2 text-slate-600">
                    ID: {producerRef.current.id}<br/>
                    Paused: {producerRef.current.paused ? '⏸️' : '▶️'}<br/>
                    Closed: {producerRef.current.closed ? '❌' : '✅'}<br/>
                    {producerRef.current.track && (
                      <>
                        Track Enabled: {producerRef.current.track.enabled ? '✅' : '❌'}<br/>
                        Track Muted: {producerRef.current.track.muted ? '🔇' : '🔊'}
                      </>
                    )}
                  </div>
                </div>
              )}

              {consumerRef.current && (
                <div className="mt-2">
                  <strong>Consumer:</strong>
                  <div className="ml-2 text-slate-600">
                    ID: {consumerRef.current.id}<br/>
                    Producer ID: {consumerRef.current.producerId}<br/>
                    Paused: {consumerRef.current.paused ? '⏸️' : '▶️'}<br/>
                    Closed: {consumerRef.current.closed ? '❌' : '✅'}<br/>
                    {consumerRef.current.track && (
                      <>
                        Track Enabled: {consumerRef.current.track.enabled ? '✅' : '❌'}<br/>
                        Track Muted: {consumerRef.current.track.muted ? '🔇' : '🔊'}<br/>
                        Track State: {consumerRef.current.track.readyState}
                      </>
                    )}
                  </div>
                </div>
              )}

              {remoteAudioRef.current && (
                <div className="mt-2">
                  <strong>Audio Element:</strong>
                  <div className="ml-2 text-slate-600">
                    Paused: {remoteAudioRef.current.paused ? '⏸️' : '▶️'}<br/>
                    Muted: {remoteAudioRef.current.muted ? '🔇' : '🔊'}<br/>
                    Volume: {remoteAudioRef.current.volume}<br/>
                    Ready State: {remoteAudioRef.current.readyState}<br/>
                    Has Source: {remoteAudioRef.current.srcObject ? '✅' : '❌'}<br/>
                    {remoteAudioRef.current.error && (
                      <span className="text-red-600">Error: {remoteAudioRef.current.error.message}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-slate-500">
                <em>Check browser console (F12) for detailed diagnostic logs</em>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CallPopup

