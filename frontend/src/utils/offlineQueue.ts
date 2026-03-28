import api from '../lib/api';

const QUEUE_KEY = 'vv_offline_audio_queue';

interface QueuedItem {
  id: string;
  blobBase64: string;
  vendorId: string;
  timestamp: string;
}

/**
 * Converts a Blob to a Base64 string for localStorage persistence.
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Saves a recording to the offline queue.
 */
export async function queueAudioOffline(blob: Blob, vendorId: string) {
  const base64 = await blobToBase64(blob);
  const queue: QueuedItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  
  const newItem: QueuedItem = {
    id: `offline_${Date.now()}`,
    blobBase64: base64,
    vendorId,
    timestamp: new Date().toISOString(),
  };

  queue.push(newItem);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Returns the number of items waiting to be synced.
 */
export function getOfflineQueueCount(): number {
  return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length;
}

/**
 * Attempts to upload all queued items to the server.
 * Stops and preserves the remainder if a network error occurs.
 */
export async function flushOfflineQueue(onProgress?: (msg: string) => void): Promise<boolean> {
  const queue: QueuedItem[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (queue.length === 0) return true;

  const remaining: QueuedItem[] = [...queue];
  let successCount = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    try {
      if (onProgress) onProgress(`Syncing recording ${i + 1} of ${queue.length}...`);
      
      // Convert base64 back to Blob
      const response = await fetch(item.blobBase64);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, `offline_${item.timestamp}.webm`);

      await api.post('/ingest', formData, {
        headers: { 'x-shop-id': item.vendorId }
      });

      remaining.shift(); // Remove from temporary queue
      successCount++;
    } catch (err) {
      console.error('Flush failed at item', item.id, err);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
      return false; // Stop flushing if offline again or error
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  return true;
}
