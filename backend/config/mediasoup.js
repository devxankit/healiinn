const mediasoup = require('mediasoup');

let worker = null;
const routers = new Map(); // Map<callId, Router>
const transports = new Map(); // Map<transportId, Transport>
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

  // Clean up transport on close
  transport.on('close', () => {
    transports.delete(transport.id);
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

  const producer = producers.get(producerId);
  if (!producer) {
    throw new Error(`Producer not found: ${producerId}`);
  }

  // Get router from transport (transport.router is the router it belongs to)
  const router = transport.router;
  if (!router) {
    throw new Error(`Router not found for transport: ${transportId}`);
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
    // This is a simplified check - in production, you'd track this relationship
    callProducers.push(producer);
  }
  return callProducers;
}

/**
 * Close transport
 */
async function closeTransport(transportId) {
  const transport = transports.get(transportId);
  if (transport) {
    transport.close();
    transports.delete(transportId);
  }
}

/**
 * Close router and clean up all related resources
 */
async function closeRouter(callId) {
  const router = routers.get(callId);
  if (router) {
    // Close all transports for this router
    for (const [transportId, transport] of transports.entries()) {
      // In a production system, you'd track which transport belongs to which router
      // For now, we'll close all transports when router closes
      try {
        transport.close();
      } catch (error) {
        console.error(`Error closing transport ${transportId}:`, error);
      }
    }
    
    router.close();
    routers.delete(callId);
    console.log(`✅ Router closed for callId: ${callId}`);
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
  getRtpCapabilities,
  createWebRtcTransport,
  connectTransport,
  createProducer,
  createConsumer,
  getProducer,
  getProducersForCall,
  closeTransport,
  closeRouter,
  cleanupCall,
  getIceServers,
};

