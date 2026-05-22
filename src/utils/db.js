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

// --- Supabase Cloud DB Helpers ---
import { getSupabaseClient } from './supabaseClient';

export const getCloudPrompts = async () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  
  const { data, error } = await client
    .from('prompts')
    .select('*')
    .order('createdAt', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

export const addCloudPrompt = async (prompt) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증 정보가 없습니다. 다시 로그인해 주세요.');
  
  const { data, error } = await client
    .from('prompts')
    .insert([{
      id: prompt.id,
      user_id: user.id,
      title: prompt.title,
      promptText: prompt.promptText,
      tags: prompt.tags || [],
      compressedImage: prompt.compressedImage || '',
      usageCount: prompt.usageCount || 0,
      createdAt: prompt.createdAt || new Date().toISOString()
    }]);
    
  if (error) throw error;
  return prompt.id;
};

export const updateCloudPrompt = async (prompt) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  
  const { data, error } = await client
    .from('prompts')
    .update({
      title: prompt.title,
      promptText: prompt.promptText,
      tags: prompt.tags || [],
      compressedImage: prompt.compressedImage || '',
      usageCount: prompt.usageCount || 0
    })
    .eq('id', prompt.id);
    
  if (error) throw error;
  return prompt.id;
};

export const deleteCloudPrompt = async (id) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  
  const { data, error } = await client
    .from('prompts')
    .delete()
    .eq('id', id);
    
  if (error) throw error;
  return id;
};

export const incrementCloudUsageCount = async (id) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  
  const { data: prompt, error: fetchError } = await client
    .from('prompts')
    .select('usageCount')
    .eq('id', id)
    .single();
    
  if (fetchError) throw fetchError;
  
  const newCount = (prompt?.usageCount || 0) + 1;
  
  const { error: updateError } = await client
    .from('prompts')
    .update({ usageCount: newCount })
    .eq('id', id);
    
  if (updateError) throw updateError;
  return newCount;
};

export const syncLocalToCloud = async () => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('인증 정보가 없습니다. 다시 로그인해 주세요.');
  
  const localPrompts = await getAllPrompts();
  if (localPrompts.length === 0) return 0;
  
  const { data: cloudPrompts, error: fetchError } = await client
    .from('prompts')
    .select('id');
    
  if (fetchError) throw fetchError;
  
  const cloudIds = new Set((cloudPrompts || []).map(p => p.id));
  
  const promptsToUpload = localPrompts
    .filter(p => !cloudIds.has(p.id))
    .map(p => ({
      id: p.id,
      user_id: user.id,
      title: p.title,
      promptText: p.promptText,
      tags: p.tags || [],
      compressedImage: p.compressedImage || '',
      usageCount: p.usageCount || 0,
      createdAt: p.createdAt || new Date().toISOString()
    }));
    
  if (promptsToUpload.length === 0) return 0;
  
  const { error: insertError } = await client
    .from('prompts')
    .insert(promptsToUpload);
    
  if (insertError) throw insertError;
  return promptsToUpload.length;
};

