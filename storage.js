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
    this.initialized = false;
    this.initPromise = null;
  }

  async init() {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.initialized && this.db) {
      return Promise.resolve();
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.error("❌ IndexedDB not supported");
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("❌ IndexedDB failed to open:", request.error);
        this.initialized = false;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        console.log("✅ IndexedDB opened successfully");
        
        // Test write/read immediately
        this.testStorage().then(() => {
          console.log("✅ IndexedDB read/write test passed");
          resolve();
        }).catch(err => {
          console.error("❌ IndexedDB test failed:", err);
          reject(err);
        });
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
          console.log("✅ IndexedDB object store created");
        }
      };
    });

    return this.initPromise;
  }

  async testStorage() {
    const testKey = "_test_";
    const testValue = { test: "data", timestamp: Date.now() };
    await this.saveData(testKey, testValue);
    const result = await this.loadData(testKey);
    if (JSON.stringify(result) !== JSON.stringify(testValue)) {
      throw new Error("Storage test failed - data mismatch");
    }
    // Clean up test data
    await this.clearData(testKey);
  }

  async ensureInitialized() {
    if (!this.initialized || !this.db) {
      await this.init();
    }
  }

  async saveData(key, value) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);

        request.onsuccess = () => {
          console.log(`✅ Data saved to IndexedDB (key: ${key})`);
          resolve();
        };

        request.onerror = () => {
          console.error("❌ Failed to save to IndexedDB:", request.error);
          reject(request.error);
        };

        transaction.oncomplete = () => {
          console.log(`✅ Transaction completed for ${key}`);
        };

        transaction.onerror = () => {
          console.error("❌ Transaction failed:", transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error("❌ Exception in saveData:", error);
        reject(error);
      }
    });
  }

  async loadData(key) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          console.log(`✅ Data loaded from IndexedDB (key: ${key}, found: ${!!request.result})`);
          resolve(request.result);
        };

        request.onerror = () => {
          console.error("❌ Failed to load from IndexedDB:", request.error);
          reject(request.error);
        };
      } catch (error) {
        console.error("❌ Exception in loadData:", error);
        reject(error);
      }
    });
  }

  async clearData(key) {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      try {
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
      } catch (error) {
        console.error("❌ Exception in clearData:", error);
        reject(error);
      }
    });
  }
}

// Create global instance
const storage = new StorageManager();
