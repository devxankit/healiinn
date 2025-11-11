const { Queue, Worker } = require('bullmq');
const { redisUrl, isRedisEnabled } = require('../config/redis');
const appointmentQueueService = require('./appointmentQueueService');
const { JOB_NAMES } = require('../utils/constants');

const queues = {};

const getConnection = () => ({
  connection: {
    url: redisUrl,
  },
});

const registerQueue = (name) => {
  if (queues[name]) {
    return queues[name];
  }

  const queue = new Queue(name, getConnection());
  queues[name] = { queue };
  return queues[name];
};

const initWorkers = (io) => {
  if (!isRedisEnabled || !redisUrl) {
    console.warn('[BullMQ] Workers not started because Redis is disabled.');
    return null;
  }

  const appointmentWorker = new Worker(
    'appointment-jobs',
    async (job) => {
      switch (job.name) {
        case JOB_NAMES.ETA_RECALCULATION:
          await appointmentQueueService.recalculateSessionState({
            sessionId: job.data.sessionId,
            io,
          });
          break;
        case JOB_NAMES.AUTO_NOSHOW:
          // Placeholder: auto mark tokens as no-show based on SLA
          break;
        case JOB_NAMES.NOTIFICATION_DISPATCH:
          // Placeholder: dispatch queued notifications
          break;
        case JOB_NAMES.PAYOUT_RECONCILIATION:
          // Placeholder: integrate with Razorpay payouts
          break;
        default:
          break;
      }
    },
    getConnection()
  );

  appointmentWorker.on('error', (error) => {
    console.error('[BullMQ] worker error', error);
  });

  return appointmentWorker;
};

const scheduleRecurringJobs = async () => {
  if (!isRedisEnabled || !redisUrl) {
    return;
  }

  const { queue } = registerQueue('appointment-jobs');

  await queue.add(
    JOB_NAMES.ETA_RECALCULATION,
    {},
    {
      repeat: {
        cron: process.env.QUEUE_RECALC_CRON || '*/5 * * * *',
      },
    }
  );

  await queue.add(
    JOB_NAMES.AUTO_NOSHOW,
    {},
    {
      repeat: {
        cron: process.env.QUEUE_NOSHOW_CRON || '*/10 * * * *',
      },
    }
  );
};

module.exports = {
  registerQueue,
  initWorkers,
  scheduleRecurringJobs,
};

