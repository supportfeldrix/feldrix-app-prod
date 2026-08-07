/**
 * ============================================================
 * Feldrix — Offline Database (IndexedDB)
 * Version 1.1
 *
 * Manages the offline sync queue using IndexedDB.
 * CRITICAL: All functions are fully safe — they never throw.
 * If IndexedDB is unavailable (private browsing, mobile WebView),
 * functions return safe defaults and the app continues normally.
 * ============================================================
 */

const DB_NAME = "feldrix_offline";
const DB_VERSION = 1;
const STORE_NAME = "sync_queue";

/**
 * Check if IndexedDB is available in this environment.
 */
function isIndexedDBAvailable() {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Open the IndexedDB database.
 * Returns null if IndexedDB is unavailable.
 */
function openDb() {
  if (!isIndexedDBAvailable()) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            store.createIndex("module", "module", { unique: false });
            store.createIndex("status", "status", { unique: false });
            store.createIndex("createdAt", "createdAt", { unique: false });
          }
        } catch {
          // Schema creation failed — continue without offline support
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Add an operation to the offline queue.
 * Returns false if IndexedDB is unavailable.
 */
export async function addToQueue(entry) {
  try {
    const db = await openDb();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const record = {
          ...entry,
          status: "pending",
          retryCount: 0,
          createdAt: new Date().toISOString(),
        };

        const request = store.add(record);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/**
 * Get all items from the queue.
 */
export async function getPendingQueue() {
  try {
    const db = await openDb();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

/**
 * Get the count of pending items.
 */
export async function getPendingCount() {
  try {
    const db = await openDb();
    if (!db) return 0;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("status");
        const request = index.count(IDBKeyRange.only("pending"));
        request.onsuccess = () => resolve(request.result || 0);
        request.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  } catch {
    return 0;
  }
}

/**
 * Update an item's status and retry count.
 */
export async function updateQueueItem(id, updates) {
  try {
    const db = await openDb();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          const record = getReq.result;
          if (!record) return resolve(null);

          const updated = { ...record, ...updates };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve(updated);
          putReq.onerror = () => resolve(null);
        };

        getReq.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Remove a synced item from the queue.
 */
export async function removeFromQueue(id) {
  try {
    const db = await openDb();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/**
 * Clear all synced items from the queue.
 */
export async function clearSyncedItems() {
  try {
    const queue = await getPendingQueue();
    const db = await openDb();
    if (!db) return false;

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const item of queue) {
      if (item.status === "synced") {
        store.delete(item.id);
      }
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}
