const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const axios = require('axios');

const BASE_URL = 'https://www.noobs-api.rf.gd/dipto/baby';
const UID = '555';

const generateRandomString = (len = 4) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

if (isMainThread) {
  const TOTAL_REQUESTS = 1000;
  const CORES = os.cpus().length;
  const WORK_PER_THREAD = Math.ceil(TOTAL_REQUESTS / CORES);

  let completed = 0;
  let success = 0;

  for (let i = 0; i < CORES; i++) {
    const worker = new Worker(__filename, {
      workerData: { count: WORK_PER_THREAD, id: i + 1 }
    });

    worker.on('message', (msg) => {
      success += msg.success;
      completed += msg.total;
      if (completed >= TOTAL_REQUESTS) {
        console.log(`\n✅ All threads done. Success: ${success}/${TOTAL_REQUESTS}`);
      }
    });

    worker.on('error', err => console.error(`❌ Worker ${i + 1} failed:`, err));
  }

} else {
  const run = async () => {
    let success = 0;
    const promises = [];

    for (let i = 0; i < workerData.count; i++) {
      const question = `tor nam ki? ${generateRandomString()}`;
      const reply = `amar nam baby 💞`;
      const url = `${BASE_URL}?teach=${encodeURIComponent(question)}&reply=${encodeURIComponent(reply)}&senderID=${UID}`;

      const p = axios.get(url)
        .then(res => {
          if (res.data.message) success++;
        })
        .catch(() => {});

      promises.push(p);
    }

    await Promise.all(promises);
    parentPort.postMessage({ success, total: workerData.count });
  };

  run();
}
