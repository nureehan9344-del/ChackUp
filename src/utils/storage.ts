import { BodyCompositionRecord, PersonSummary } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_CUSTOM_RECORDS = 'health_dashboard_custom_records';
const STORAGE_DATASOURCE_MODE = 'health_dashboard_datasource_mode';
const STORAGE_SHEET_URL = 'health_dashboard_sheet_url';
const STORAGE_LAST_SYNC = 'health_dashboard_last_sync';

export interface StorageState {
  hasCustomData: boolean;
  records: BodyCompositionRecord[];
  sheetUrl: string;
  lastSync: string | null;
  mode: 'default' | 'custom' | 'sheet_live';
}

/**
 * Load persisted health data from LocalStorage
 */
export function loadPersistedState(): StorageState {
  try {
    const rawRecords = localStorage.getItem(STORAGE_CUSTOM_RECORDS);
    const mode = (localStorage.getItem(STORAGE_DATASOURCE_MODE) as 'default' | 'custom' | 'sheet_live') || 'default';
    const sheetUrl = localStorage.getItem(STORAGE_SHEET_URL) || '';
    const lastSync = localStorage.getItem(STORAGE_LAST_SYNC) || null;

    if (rawRecords) {
      const records = JSON.parse(rawRecords) as BodyCompositionRecord[];
      if (Array.isArray(records) && records.length > 0) {
        return {
          hasCustomData: true,
          records,
          sheetUrl,
          lastSync,
          mode: mode === 'default' ? 'custom' : mode,
        };
      }
    }

    return {
      hasCustomData: false,
      records: [],
      sheetUrl,
      lastSync,
      mode: 'default',
    };
  } catch (err) {
    console.warn('Failed to read from localStorage:', err);
    return {
      hasCustomData: false,
      records: [],
      sheetUrl: '',
      lastSync: null,
      mode: 'default',
    };
  }
}

/**
 * Save custom records and sheet settings to LocalStorage
 */
export function saveCustomState(records: BodyCompositionRecord[], sheetUrl?: string, mode: 'custom' | 'sheet_live' = 'custom'): void {
  try {
    localStorage.setItem(STORAGE_CUSTOM_RECORDS, JSON.stringify(records));
    localStorage.setItem(STORAGE_DATASOURCE_MODE, mode);
    if (sheetUrl !== undefined) {
      localStorage.setItem(STORAGE_SHEET_URL, sheetUrl);
    }
    const timestamp = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    localStorage.setItem(STORAGE_LAST_SYNC, timestamp);
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

/**
 * Clear custom records and revert to default dataset mode
 */
export function clearCustomState(): void {
  try {
    localStorage.removeItem(STORAGE_CUSTOM_RECORDS);
    localStorage.setItem(STORAGE_DATASOURCE_MODE, 'default');
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }
}

/**
 * Sync custom dataset to Firestore (if authenticated)
 */
export async function syncDatasetToFirestore(records: BodyCompositionRecord[], sheetUrl?: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const docPath = `users/${user.uid}/dataset/latest`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      lastUpdated: new Date().toISOString(),
      email: user.email,
    }, { merge: true });

    // Store dataset chunk in user document
    await setDoc(doc(db, 'users', user.uid, 'settings', 'dataset'), {
      recordsCount: records.length,
      sheetUrl: sheetUrl || '',
      updatedAt: new Date().toISOString(),
      recordsSummary: records.slice(0, 100), // store top slice in config
    }, { merge: true });

    return true;
  } catch (err) {
    console.warn('Firestore backup note:', err);
    return false;
  }
}
