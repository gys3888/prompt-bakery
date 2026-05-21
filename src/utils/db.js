const DB_NAME = 'PromptManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'prompts';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject('Failed to open database: ' + event.target.error);
    };
  });
};

export const getAllPrompts = () => {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject('Failed to get prompts: ' + request.error);
      };
    });
  });
};

export const addPrompt = (prompt) => {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(prompt);

      request.onsuccess = () => {
        resolve(prompt.id);
      };

      request.onerror = () => {
        reject('Failed to add prompt: ' + request.error);
      };
    });
  });
};

export const updatePrompt = (prompt) => {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(prompt);

      request.onsuccess = () => {
        resolve(prompt.id);
      };

      request.onerror = () => {
        reject('Failed to update prompt: ' + request.error);
      };
    });
  });
};

export const deletePrompt = (id) => {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject('Failed to delete prompt: ' + request.error);
      };
    });
  });
};

export const incrementUsageCount = (id) => {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.usageCount = (data.usageCount || 0) + 1;
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve(data.usageCount);
          updateRequest.onerror = () => reject('Failed to update count');
        } else {
          reject('Prompt not found');
        }
      };

      request.onerror = () => {
        reject('Failed to fetch prompt: ' + request.error);
      };
    });
  });
};
