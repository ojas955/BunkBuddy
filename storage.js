/**
 * BunkBuddy Storage Manager
 * Uses IndexedDB for reliable PWA data persistence
 */

const DB_NAME = "BunkBuddyDB";
const DB_VERSION = 1;
const STORE_NAME = "appState";

class StorageManager {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("❌ IndexedDB failed to open:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("✅ IndexedDB opened successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
          console.log("✅ IndexedDB object store created");
        }
      };
    });
  }

  async saveData(key, value) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        console.log("✅ Data saved to IndexedDB");
        resolve();
      };

      request.onerror = () => {
        console.error("❌ Failed to save to IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  async loadData(key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("❌ Failed to load from IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }

  async clearData(key) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log("✅ Data cleared from IndexedDB");
        resolve();
      };

      request.onerror = () => {
        console.error("❌ Failed to clear IndexedDB:", request.error);
        reject(request.error);
      };
    });
  }
}

// Create global instance
const storage = new StorageManager();
