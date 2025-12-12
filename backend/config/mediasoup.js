const mediasoup = require('mediasoup');

let worker = null;
const routers = new Map(); // Map<callId, Router>
const transports = new Map(); // Map<transportId, Transport>
const transportToCallId = new Map(); // Map<transportId, callId> - for reliable callId lookup
const producers = new Map(); // Map<producerId, Producer>
const consumers = new Map(); // Map<consumerId, Consumer>

/**
 * Initialize mediasoup worker
 */
async function createWorker() {
  const numWorkers = 1; // Single worker for now, can scale later
  
  const worker = await mediasoup.createWorker({
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    rtcMinPort: parseInt(process.env.MEDIA_UDP_MIN) || 40000,
    rtcMaxPort: parseInt(process.env.MEDIA_UDP_MAX) || 49999,
  });

  worker.on('died', () => {
    console.error('mediasoup worker died, exiting in 2 seconds...');
    setTimeout(() => process.exit(1), 2000);
  });

  console.log('✅ mediasoup worker created [pid:%d]', worker.pid);
  return worker;
}

/**
 * Get or create mediasoup worker
 */
async function getWorker() {
  if (!worker) {
    worker = await createWorker();
  }
  return worker;
}

/**
 * Get ICE servers (STUN + TURN if configured)
 */
function getIceServers() {
  const iceServers = [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ];

  // Add TURN servers if configured
  if (process.env.TURN_URIS && process.env.TURN_USER && process.env.TURN_PASS) {
    const turnUris = process.env.TURN_URIS.split(',').map(uri => uri.trim());
    turnUris.forEach(uri => {
      iceServers.push({
        urls: [uri],
        username: process.env.TURN_USER,
        credential: process.env.TURN_PASS,
      });
    });
  }

  return iceServers;
}

/**
 * Create router for a call
 */
async function createRouter(callId) {
  if (routers.has(callId)) {
    return routers.get(callId);
  }

  const mediasoupWorker = await getWorker();
  
  const router = await mediasoupWorker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
    ],
  });

  routers.set(callId, router);
  console.log(`✅ Router created for callId: ${callId}`);
  
  return router;
}

/**
 * Get router for a call
 */
function getRouter(callId) {
  return routers.get(callId);
}

/**
 * Get callId for a router (reverse lookup)
 */
function getCallIdForRouter(router) {
  if (!router) {
    return null;
  }
  
  // Iterate through routers map to find matching router
  for (const [callId, storedRouter] of routers.entries()) {
    if (storedRouter === router) {
      return callId;
    }
  }
  
  return null;
}

/**
 * Get RTP capabilities for a router
 */
async function getRtpCapabilities(callId) {
  const router = await createRouter(callId);
  return router.rtpCapabilities;
}

/**
 * Create WebRTC transport
 */
async function createWebRtcTransport(callId, options = {}) {
  const router = await createRouter(callId);
  
  const { listenIps, enableUdp, enableTcp, preferUdp } = options;
  
  const transport = await router.createWebRtcTransport({
    listenIps: listenIps || [
      {
        ip: process.env.PUBLIC_IP || '127.0.0.1',
        announcedIp: process.env.PUBLIC_IP || undefined,
      },
    ],
    enableUdp: enableUdp !== false,
    enableTcp: enableTcp !== false,
    preferUdp: preferUdp !== false,
    initialAvailableOutgoingBitrate: 100000,
  });

  transports.set(transport.id, transport);
  // Store transportId -> callId mapping for reliable lookup
  transportToCallId.set(transport.id, callId);
  console.log(`✅ Transport created: ${transport.id} for callId: ${callId}`);

  // Clean up transport on close
  transport.on('close', () => {
    transports.delete(transport.id);
    transportToCallId.delete(transport.id);
    console.log(`✅ Transport closed: ${transport.id}, removed from mapping`);
  });

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
}

/**
 * Connect transport
 */
async function connectTransport(transportId, dtlsParameters) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }
  await transport.connect({ dtlsParameters });
}

/**
 * Create producer
 */
async function createProducer(transportId, rtpParameters, kind) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }

  const producer = await transport.produce({
    kind,
    rtpParameters,
  });

  producers.set(producer.id, producer);

  // Clean up producer on close
  producer.on('close', () => {
    producers.delete(producer.id);
  });

  return {
    id: producer.id,
    kind: producer.kind,
    rtpParameters: producer.rtpParameters,
  };
}

/**
 * Create consumer
 */
async function createConsumer(transportId, producerId, rtpCapabilities, callId) {
  const transport = transports.get(transportId);
  if (!transport) {
    throw new Error(`Transport not found: ${transportId}`);
  }

  // Check if transport is closed
  if (transport.closed) {
    // Remove closed transport from map
    transports.delete(transportId);
    throw new Error(`Transport ${transportId} is closed and cannot be used`);
  }

  const producer = producers.get(producerId);
  if (!producer) {
    throw new Error(`Producer not found: ${producerId}`);
  }

  // Get router from transport (transport.router is the router it belongs to)
  let router = transport.router;
  
  // If transport.router is null (transport was closed or router was closed),
  // try to get router from callId as fallback
  if (!router && callId) {
    router = routers.get(callId);
    if (!router) {
      // Transport exists but router is missing - this indicates the call/router was cleaned up
      // Remove the stale transport from the map
      transports.delete(transportId);
      throw new Error(`Router not found for transport: ${transportId}. The call (${callId}) may have been ended or the router was closed.`);
    }
  }
  
  if (!router) {
    // Remove stale transport from map
    transports.delete(transportId);
    throw new Error(`Router not found for transport: ${transportId}. The transport may have been closed or the router was cleaned up.`);
  }

  // Verify router is not closed
  if (router.closed) {
    throw new Error(`Router for call ${callId} is closed and cannot be used`);
  }

  if (!router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error('Cannot consume this producer');
  }

  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
  });

  consumers.set(consumer.id, consumer);

  // Clean up consumer on close
  consumer.on('close', () => {
    consumers.delete(consumer.id);
  });

  return {
    id: consumer.id,
    producerId: consumer.producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
}

/**
 * Get producer by ID
 */
function getProducer(producerId) {
  return producers.get(producerId);
}

/**
 * Get consumer by ID
 */
function getConsumer(consumerId) {
  return consumers.get(consumerId);
}

/**
 * Resume consumer (consumers are paused by default in mediasoup)
 */
async function resumeConsumer(consumerId) {
  const consumer = consumers.get(consumerId);
  if (!consumer) {
    throw new Error(`Consumer not found: ${consumerId}`);
  }
  await consumer.resume();
  return true;
}

/**
 * Get all producers for a call
 */
function getProducersForCall(callId) {
  const router = routers.get(callId);
  if (!router) {
    return [];
  }
  
  // Get all producers that belong to transports in this router
  const callProducers = [];
  for (const [producerId, producer] of producers.entries()) {
    // Check if producer's transport belongs to this router
    // producer.transport.router is the router this producer belongs to
    if (producer.transport && producer.transport.router === router) {
      callProducers.push({
        id: producer.id,
        kind: producer.kind,
      });
    }
  }
  return callProducers;
}

/**
 * Get callId for a transport
 */
function getCallIdForTransport(transportId) {
  return transportToCallId.get(transportId);
}

/**
 * Get transport by ID (for router lookup)
 */
function getTransport(transportId) {
  return transports.get(transportId);
}

/**
 * Close transport
 */
async function closeTransport(transportId) {
  const transport = transports.get(transportId);
  if (transport) {
    transport.close();
    transports.delete(transportId);
    transportToCallId.delete(transportId);
    console.log(`✅ Transport ${transportId} closed and removed from mapping`);
  }
}

/**
 * Close router and clean up all related resources
 */
async function closeRouter(callId) {
  const router = routers.get(callId);
  if (router) {
    // Close all transports for this router
    // Only close transports that belong to this router
    const transportsToClose = [];
    for (const [transportId, transport] of transports.entries()) {
      // Check if transport belongs to this router
      if (transport.router === router) {
        transportsToClose.push(transportId);
      }
    }
    
    // Close transports that belong to this router
    for (const transportId of transportsToClose) {
      const transport = transports.get(transportId);
      if (transport) {
        try {
          transport.close();
          // The transport's 'close' event handler will remove it from the map
        } catch (error) {
          console.error(`Error closing transport ${transportId}:`, error);
          // Manually remove if close failed
          transports.delete(transportId);
        }
      }
    }
    
    router.close();
    routers.delete(callId);
    console.log(`✅ Router closed for callId: ${callId}, closed ${transportsToClose.length} transport(s)`);
  }
}

/**
 * Cleanup all resources for a call
 */
async function cleanupCall(callId) {
  // Close all producers for this call
  const callProducers = getProducersForCall(callId);
  for (const producer of callProducers) {
    try {
      producer.close();
    } catch (error) {
      console.error(`Error closing producer ${producer.id}:`, error);
    }
  }

  // Close router (which will close transports)
  await closeRouter(callId);
}

module.exports = {
  getWorker,
  createRouter,
  getRouter,
  getCallIdForRouter,
  getRtpCapabilities,
  createWebRtcTransport,
  connectTransport,
  getTransport,
  createProducer,
  createConsumer,
  getProducer,
  getConsumer,
  resumeConsumer,
  getProducersForCall,
  getCallIdForTransport,
  closeTransport,
  closeRouter,
  cleanupCall,
  getIceServers,
};

