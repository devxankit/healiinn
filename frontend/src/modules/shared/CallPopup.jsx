import { useState, useEffect, useRef, useCallback } from 'react'
import * as mediasoupClient from 'mediasoup-client'
import { io } from 'socket.io-client'
import { IoCallOutline, IoMicOutline, IoMicOffOutline, IoCloseOutline, IoRemoveOutline } from 'react-icons/io5'
import { formatCallDuration, isWebRTCSupported } from '../../utils/callService'
import { getAuthToken } from '../../utils/apiClient'
import { useCall } from '../../contexts/CallContext'
import { getSocket } from '../../utils/socketClient'

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
            resolve(false)
            return
          }
          
          if (socketInstance.connected) {
            console.log('📞 [CallPopup] Joining call room:', `call-${currentCallId}`)
            socketInstance.emit('call:joinRoom', { callId: currentCallId }, (response) => {
              if (response && response.error) {
                console.warn('📞 [CallPopup] Failed to join call room:', response.error)
                resolve(false)
              } else {
                console.log('📞 [CallPopup] ✅ Successfully joined call room')
                resolve(true)
              }
            })
          } else {
            // Wait for connection then join
            console.log('📞 [CallPopup] Socket not connected, waiting for connection before joining room')
            const connectHandler = () => {
              socketInstance.off('connect', connectHandler)
              console.log('📞 [CallPopup] Socket connected, joining call room:', `call-${currentCallId}`)
              socketInstance.emit('call:joinRoom', { callId: currentCallId }, (response) => {
                if (response && response.error) {
                  console.warn('📞 [CallPopup] Failed to join call room:', response.error)
                  resolve(false)
                } else {
                  console.log('📞 [CallPopup] ✅ Successfully joined call room')
                  resolve(true)
                }
              })
            }
            socketInstance.once('connect', connectHandler)
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
          console.log('📞 [CallPopup] New producer available:', data)
          // Don't consume if call is ending or ended
          if (isEndingRef.current || status === 'ended' || status === 'error') {
            console.log('📞 [CallPopup] Ignoring new producer - call is ending or ended')
            return
          }
          if (data.producerId) {
            if (producerRef.current && producerRef.current.id !== data.producerId) {
              await consumeRemoteAudio(data.producerId)
            } else if (!producerRef.current) {
              await consumeRemoteAudio(data.producerId)
            }
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
          await joinCallRoom(socket)
          
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
          console.log('📞 [CallPopup] New producer available:', data)
          // Don't consume if call is ending or ended
          if (isEndingRef.current || status === 'ended' || status === 'error') {
            console.log('📞 [CallPopup] Ignoring new producer - call is ending or ended')
            return
          }
          if (data.producerId) {
            if (producerRef.current && producerRef.current.id !== data.producerId) {
              await consumeRemoteAudio(data.producerId)
            } else if (!producerRef.current) {
              await consumeRemoteAudio(data.producerId)
            }
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
        await joinCallRoom(socket)
        
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

      const currentCallId = callIdRef.current // Use ref to get current callId
      if (!currentCallId) {
        console.warn('📞 [CallPopup] No callId available, cannot join call')
        return
      }

      // Get RTP capabilities
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

      // Request existing producers for this call (to handle race condition)
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

        console.log('📞 [CallPopup] Existing producers:', existingProducersResponse.producers)
        
        // Consume all existing producers (from other participants who joined earlier)
        if (existingProducersResponse.producers && existingProducersResponse.producers.length > 0) {
          for (const producer of existingProducersResponse.producers) {
            // Only consume if we haven't already consumed this producer
            // and it's not our own producer
            if (producer.id && producer.id !== producerRef.current?.id) {
              console.log('📞 [CallPopup] Consuming existing producer:', producer.id)
              await consumeRemoteAudio(producer.id)
            }
          }
        }
      } catch (error) {
        console.warn('📞 [CallPopup] Error getting existing producers (non-critical):', error)
        // Don't fail the call if this fails - we'll still listen for new producers
      }

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
      // Don't consume if call is ending or ended
      if (isEndingRef.current || status === 'ended' || status === 'error') {
        console.log('📞 [CallPopup] Cannot consume - call is ending or ended')
        return
      }

      // Close existing consumer if we're replacing it (for 1-to-1 calls, there should only be one remote producer)
      if (consumerRef.current) {
        console.log('📞 [CallPopup] Replacing existing consumer with new producer:', producerId)
        try {
          consumerRef.current.close()
        } catch (error) {
          console.warn('📞 [CallPopup] Error closing existing consumer:', error)
        }
        consumerRef.current = null
      }

      const device = deviceRef.current
      const recvTransport = recvTransportRef.current
      const socket = socketRef.current

      if (!device || !recvTransport || !socket) {
        console.warn('📞 [CallPopup] Cannot consume - missing device, transport, or socket')
        return
      }

      const currentCallId = callIdRef.current
      if (!currentCallId) {
        console.warn('📞 [CallPopup] No callId available, cannot consume')
        return
      }

      const { consumer } = await new Promise((resolve, reject) => {
        socket.emit('mediasoup:consume', {
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities,
          callId: currentCallId,
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error))
          } else {
            resolve(response)
          }
        })
      })

      // Check if recvTransport is still valid before consuming
      if (!recvTransportRef.current || recvTransportRef.current.closed) {
        console.warn('📞 [CallPopup] Receive transport is closed, cannot consume')
        return
      }

      // Create consumer using mediasoup-client
      const consumerInstance = await recvTransport.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      })

      consumerRef.current = consumerInstance

      // Resume consumer on server (consumers are paused by default in mediasoup)
      try {
        await new Promise((resolve, reject) => {
          socket.emit('mediasoup:resumeConsumer', {
            consumerId: consumerInstance.id,
          }, (response) => {
            if (response.error) {
              reject(new Error(response.error))
            } else {
              resolve(response)
            }
          })
        })
        console.log('📞 [CallPopup] Consumer resumed on server:', consumerInstance.id)
      } catch (error) {
        console.error('📞 [CallPopup] Error resuming consumer:', error)
        // Don't fail the call if resume fails - try to continue anyway
      }

      // Ensure the track is enabled
      if (consumerInstance.track) {
        consumerInstance.track.enabled = true
        console.log('📞 [CallPopup] Consumer track enabled:', {
          id: consumerInstance.track.id,
          kind: consumerInstance.track.kind,
          enabled: consumerInstance.track.enabled,
          readyState: consumerInstance.track.readyState
        })
      }

      // Wait for audio element to be ready
      const setupAudioElement = () => {
        if (!remoteAudioRef.current) {
          console.warn('📞 [CallPopup] Audio element not available, retrying...')
          // Retry after a short delay if element is not ready
          setTimeout(() => {
            if (remoteAudioRef.current) {
              setupAudioElement()
            } else {
              console.error('📞 [CallPopup] Audio element still not available after retry')
            }
          }, 100)
          return
        }

        const audioElement = remoteAudioRef.current

        // Create audio element for remote audio
        const stream = new MediaStream([consumerInstance.track])
        
        // Set up audio element properties
        audioElement.srcObject = stream
        audioElement.volume = 1.0 // Ensure volume is at maximum
        audioElement.muted = false // Ensure not muted
        
        // Add event listeners for debugging
        audioElement.addEventListener('loadedmetadata', () => {
          console.log('📞 [CallPopup] Audio metadata loaded')
        })
        
        audioElement.addEventListener('canplay', () => {
          console.log('📞 [CallPopup] Audio can play')
        })
        
        audioElement.addEventListener('play', () => {
          console.log('📞 [CallPopup] Audio started playing')
        })
        
        audioElement.addEventListener('error', (e) => {
          console.error('📞 [CallPopup] Audio element error:', e)
        })

        // Play the audio with retry logic
        const playAudio = async () => {
          try {
            await audioElement.play()
            console.log('📞 [CallPopup] Remote audio playing successfully')
          } catch (playError) {
            console.warn('📞 [CallPopup] Initial play() failed, retrying...', playError)
            // Retry after a short delay
            setTimeout(async () => {
              try {
                await audioElement.play()
                console.log('📞 [CallPopup] Remote audio playing after retry')
              } catch (retryError) {
                console.error('📞 [CallPopup] Failed to play remote audio after retry:', retryError)
                // Some browsers require user interaction - log but don't fail
                if (retryError.name === 'NotAllowedError') {
                  console.warn('📞 [CallPopup] Browser blocked autoplay - user interaction may be required')
                }
              }
            }, 200)
          }
        }

        playAudio()
      }

      // Setup audio element (with retry if not ready)
      setupAudioElement()
      
      console.log('📞 [CallPopup] Successfully consuming remote audio from producer:', producerId)
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
      </div>
    </div>
  )
}

export default CallPopup

