/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, QuranVerse } from '../types';

const DB_NAME = 'QuranPlatformCacheDB';
const DB_VERSION = 1;
const LESSONS_STORE = 'lessons';
const QURAN_STORE = 'quran_verses';

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LESSONS_STORE)) {
        db.createObjectStore(LESSONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(QURAN_STORE)) {
        db.createObjectStore(QURAN_STORE, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Cache all lessons in IndexedDB
 */
export async function cacheLessons(lessons: Lesson[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LESSONS_STORE, 'readwrite');
    const store = transaction.objectStore(LESSONS_STORE);

    // Clear old lessons first
    const clearReq = store.clear();
    clearReq.onsuccess = () => {
      let activeRequests = 0;
      let hasError = false;

      if (lessons.length === 0) {
        resolve();
        return;
      }

      lessons.forEach((lesson) => {
        activeRequests++;
        const putReq = store.put(lesson);
        putReq.onsuccess = () => {
          activeRequests--;
          if (activeRequests === 0 && !hasError) {
            resolve();
          }
        };
        putReq.onerror = () => {
          hasError = true;
          reject(putReq.error);
        };
      });
    };

    clearReq.onerror = () => {
      reject(clearReq.error);
    };
  });
}

/**
 * Retrieve all cached lessons from IndexedDB
 */
export async function getCachedLessons(): Promise<Lesson[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LESSONS_STORE, 'readonly');
    const store = transaction.objectStore(LESSONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Cache Quran verses in IndexedDB
 */
export async function cacheQuranVerses(verses: QuranVerse[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QURAN_STORE, 'readwrite');
    const store = transaction.objectStore(QURAN_STORE);

    const clearReq = store.clear();
    clearReq.onsuccess = () => {
      let activeRequests = 0;
      let hasError = false;

      if (verses.length === 0) {
        resolve();
        return;
      }

      verses.forEach((verse, idx) => {
        activeRequests++;
        // Create unique key for verse: surahNumber_ayahNumber
        const id = `${verse.surahNumber}_${verse.ayahNumber}`;
        const putReq = store.put({ ...verse, id });
        putReq.onsuccess = () => {
          activeRequests--;
          if (activeRequests === 0 && !hasError) {
            resolve();
          }
        };
        putReq.onerror = () => {
          hasError = true;
          reject(putReq.error);
        };
      });
    };

    clearReq.onerror = () => {
      reject(clearReq.error);
    };
  });
}

/**
 * Retrieve cached Quran verses
 */
export async function getCachedQuranVerses(): Promise<QuranVerse[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QURAN_STORE, 'readonly');
    const store = transaction.objectStore(QURAN_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Cache new Quran verses in IndexedDB without clearing existing ones
 */
export async function cacheNewQuranVerses(verses: QuranVerse[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QURAN_STORE, 'readwrite');
    const store = transaction.objectStore(QURAN_STORE);
    let activeRequests = 0;
    let hasError = false;

    if (verses.length === 0) {
      resolve();
      return;
    }

    verses.forEach((verse) => {
      activeRequests++;
      const id = `${verse.surahNumber}_${verse.ayahNumber}`;
      const putReq = store.put({ ...verse, id });
      putReq.onsuccess = () => {
        activeRequests--;
        if (activeRequests === 0 && !hasError) {
          resolve();
        }
      };
      putReq.onerror = () => {
        hasError = true;
        reject(putReq.error);
      };
    });
  });
}
