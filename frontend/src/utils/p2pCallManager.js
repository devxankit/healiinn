/**
 * P2P WebRTC Call Manager
 * Provides peer-to-peer WebRTC connection as fallback to SFU
 * Only for 1-to-1 calls
 */

import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '').replace(/\/$/, '')

class P2PCallManager {
  constructor(callId, socket, getAuthToken) {
    this.callId = callId
    this.socket = socket
    this.getAuthToken = getAuthToken
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    this.iceServers = [
      { urls: ['stun:stun.l.google.com:19302'] }
    ]
  }

  /**
   * Initialize P2P connection
   * @param {boolean} isInitiator - Whether this peer is the initiator
   * @returns {Promise<boolean>} - Success status
   */
  async initialize(isInitiator = false) {
    try {
      this.isInitiator = isInitiator
      console.log('🔗 [P2P] Initializing P2P connection, isInitiator:', isInitiator)

      // Check if WebRTC is supported
      if (!window.RTCPeerConnection) {
        console.error('🔗 [P2P] RTCPeerConnection not supported in this browser')
        throw new Error('WebRTC not supported in this browser')
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('🔗 [P2P] getUserMedia not supported in this browser')
        throw new Error('getUserMedia not supported in this browser')
      }

      // Create RTCPeerConnection
      console.log('🔗 [P2P] Creating RTCPeerConnection...')
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      })
      console.log('🔗 [P2P] ✅ RTCPeerConnection created')

      // Set up event handlers
      this.setupEventHandlers()
      console.log('🔗 [P2P] ✅ Event handlers set up')

      // Get local media stream
      console.log('🔗 [P2P] Requesting microphone access...')
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        })
        console.log('🔗 [P2P] ✅ Microphone access granted')
        console.log('🔗 [P2P] Local stream tracks:', this.localStream.getAudioTracks().length)
        
        this.localStream.getAudioTracks().forEach(track => {
          console.log('🔗 [P2P] Adding track to peer connection:', track.id)
          this.peerConnection.addTrack(track, this.localStream)
        })

        console.log('🔗 [P2P] ✅ Local stream added to peer connection')
      } catch (mediaError) {
        console.error('🔗 [P2P] ❌ Failed to get user media:', mediaError)
        console.error('🔗 [P2P] Error details:', {
          name: mediaError.name,
          message: mediaError.message,
          constraint: mediaError.constraint
        })
        throw new Error(`Microphone access denied or unavailable: ${mediaError.message}`)
      }

      // If initiator, create offer
      if (isInitiator) {
        console.log('🔗 [P2P] Creating offer (initiator)...')
        try {
          await this.createOffer()
          console.log('🔗 [P2P] ✅ Offer created and sent')
        } catch (offerError) {
          console.error('🔗 [P2P] ❌ Failed to create offer:', offerError)
          throw new Error(`Failed to create offer: ${offerError.message}`)
        }
      } else {
        console.log('🔗 [P2P] Waiting for offer (non-initiator)...')
      }

      console.log('🔗 [P2P] ✅ P2P connection initialized successfully')
      return true
    } catch (error) {
      console.error('🔗 [P2P] ❌ Error initializing P2P:', error)
      console.error('🔗 [P2P] Error stack:', error.stack)
      console.error('🔗 [P2P] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      })
      return false
    }
  }

  setupEventHandlers() {
    // ICE candidate handler
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🔗 [P2P] ICE candidate generated:', event.candidate)
        if (this.socket && this.socket.connected) {
          this.socket.emit('p2p:iceCandidate', {
            callId: this.callId,
            candidate: event.candidate
          })
        } else {
          console.warn('🔗 [P2P] ⚠️ Socket not connected, cannot send ICE candidate')
        }
      }
    }

    // Track handler (remote stream)
    this.peerConnection.ontrack = (event) => {
      console.log('🔗 [P2P] Remote track received:', event.track)
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0]
        // Trigger callback for remote stream
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream)
        }
      }
    }

    // Connection state handler
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔗 [P2P] Connection state:', this.peerConnection.connectionState)
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection.connectionState)
      }
    }

    // ICE connection state handler
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('🔗 [P2P] ICE connection state:', this.peerConnection.iceConnectionState)
    }
  }

  async createOffer() {
    try {
      console.log('🔗 [P2P] Creating offer...')
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)
      
      console.log('🔗 [P2P] Offer created, sending to peer')
      console.log('🔗 [P2P] Socket state before emitting offer:', {
        connected: this.socket?.connected,
        disconnected: this.socket?.disconnected,
        id: this.socket?.id
      })
      
      if (!this.socket || !this.socket.connected) {
        console.error('🔗 [P2P] ❌ Socket not connected, cannot send offer!')
        throw new Error('Socket not connected')
      }
      
      this.socket.emit('p2p:offer', {
        callId: this.callId,
        offer: offer
      })
      console.log('🔗 [P2P] ✅ Offer emitted successfully')
    } catch (error) {
      console.error('🔗 [P2P] Error creating offer:', error)
      throw error
    }
  }

  async handleOffer(offer) {
    try {
      console.log('🔗 [P2P] Received offer, setting remote description...')
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      
      console.log('🔗 [P2P] Creating answer...')
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      
      console.log('🔗 [P2P] Answer created, sending to peer')
      this.socket.emit('p2p:answer', {
        callId: this.callId,
        answer: answer
      })
    } catch (error) {
      console.error('🔗 [P2P] Error handling offer:', error)
      throw error
    }
  }

  async handleAnswer(answer) {
    try {
      console.log('🔗 [P2P] Received answer, setting remote description...')
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      console.log('🔗 [P2P] Answer processed successfully')
    } catch (error) {
      console.error('🔗 [P2P] Error handling answer:', error)
      throw error
    }
  }

  async handleIceCandidate(candidate) {
    try {
      console.log('🔗 [P2P] Received ICE candidate, adding to peer connection...')
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      console.log('🔗 [P2P] ICE candidate added successfully')
    } catch (error) {
      console.error('🔗 [P2P] Error handling ICE candidate:', error)
      throw error
    }
  }

  /**
   * Set mute state
   */
  setMuted(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted
      })
    }
  }

  /**
   * Cleanup P2P connection
   */
  cleanup() {
    console.log('🔗 [P2P] Cleaning up P2P connection...')
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.localStream
  }

  /**
   * Get remote stream
   */
  getRemoteStream() {
    return this.remoteStream
  }
}

export default P2PCallManager

