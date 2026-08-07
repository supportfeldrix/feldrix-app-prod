/**
 * ============================================================
 * Feldrix — Offline Database (IndexedDB)
 * Version 1.0
 *
 * Manages the offline sync queue using IndexedDB.
 * Stores pending operations when the app is offline.
 * ============================================================
 */

const DB_NAME = "feldrix_offline";
const DB_VERSION = 1;
const STORE_NAME = "sync_queue";

/**
 * Open the IndexedDB database.
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("module", "module", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add an operation to the offline queue.
 *
 * @param {object} entry
 * @param {string} entry.action - "insert", "update", "delete"
 * @param {string} entry.module - "livestock", "health", "crops", "planner", "finance"
 * @param {string} entry.table - Supabase table name
 * @param {object} entry.payload - Data to send
 * @param {string} [entry.recordId] - For updates/deletes
 */
export async function addToQueue(entry) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record = {
      ...entry,
      status: "pending",
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending items from the queue.
 */
export async function getPendingQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get the count of pending items.
 */
export async function getPendingCount() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("status");
    const request = index.count(IDBKeyRange.only("pending"));
    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an item's status and retry count.
 */
export async function updateQueueItem(id, updates) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) return resolve(null);

      const updated = { ...record, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Remove a synced item from the queue.
 */
export async function removeFromQueue(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all synced items from the queue.
 */
export async function clearSyncedItems() {
  const queue = await getPendingQueue();
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  for (const item of queue) {
    if (item.status === "synced") {
      store.delete(item.id);
    }
  }

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true);
  });
}
