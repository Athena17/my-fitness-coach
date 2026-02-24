const QUEUE_KEY = 'nt_offline_queue';

/** Get pending mutations from localStorage */
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

/** Add a mutation to the offline queue */
export function enqueue(mutation) {
  const queue = getQueue();
  queue.push({ ...mutation, _ts: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Clear the queue after successful flush */
export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

/** Check if we're online */
export function isOnline() {
  return navigator.onLine;
}
