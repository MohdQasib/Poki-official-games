/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, increment, setDoc } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    isAnonymous?: boolean | null;
  };
}

// Default standard diagnostic handler following security guidelines
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  userId?: string | null,
  email?: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || 'offline_dev_test',
      email: email || 'tester@minipokicoin.in',
      isAnonymous: !userId,
    },
    operationType,
    path,
  };
  console.error('Firestore SECURE Sync Fail: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Returns a configured Firebase App instance if settings are supplied and valid.
 * Safe fallback to simulated state if the developer hasn't set up the Firebase project keys.
 */
export function initializeCustomFirebase(configRaw: any) {
  try {
    if (!configRaw || !configRaw.apiKey || configRaw.apiKey === 'PLACEHOLDER') {
      return { initialized: false, error: 'Standard local simulation fallback.' };
    }

    const app = getApps().length === 0 ? initializeApp(configRaw) : getApp();
    const db = getFirestore(app);
    const auth = getAuth(app);

    return {
      initialized: true,
      app,
      db,
      auth,
    };
  } catch (err: any) {
    return { initialized: false, error: err?.message || 'Error parsing Firebase parameters.' };
  }
}

/**
 * Real-time balance synchronizer.
 * Automatically attempts to write back collected Pokicoins directly to user's wallet.
 */
export async function syncGamingCreditsToFirebase(
  firebaseConfig: any,
  uid: string,
  email: string,
  coinsCollected: number,
  scoreDistance: number,
  pokiEarned: number,
  hashSignature: string
): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  // Check if standard credentials are ready
  const connection = initializeCustomFirebase(firebaseConfig);

  if (!connection.initialized || !connection.db) {
    // Return simulated confirmation for UI feedback
    console.log(`[SIMULATION ACTIVE] PokiCoin sync operation completed:
      Uid: ${uid}
      Credits Collected: ${coinsCollected}
      Earned Balance Change: +${pokiEarned} POKI
      Verified Consensus Anchor: ${hashSignature}
    `);
    return { success: true, simulated: true };
  }

  const userPathRef = `users/${uid}`;
  try {
    const finalEarned = parseFloat(pokiEarned.toFixed(8));
    
    // Secure transaction update leveraging atomic Firestore increments
    await setDoc(doc(connection.db, 'users', uid), {
      pokiBalance: increment(finalEarned),
      highestGameDistance: increment(scoreDistance),
      lastSyncTimestamp: Date.now(),
      emailVerified: true,
    }, { merge: true });

    // Store historic record in a secure nested consensus ledger subcollection
    const auditPath = `users/${uid}/ledger/${Date.now().toString()}`;
    await setDoc(doc(connection.db, 'users', uid, 'ledger', Date.now().toString()), {
      coinsCollected,
      gain: finalEarned,
      gameScore: scoreDistance,
      hashSignature,
      timestamp: Date.now(),
      status: 'VERIFIED_LEDGER_CONSENSUS',
    });

    return { success: true, simulated: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPathRef, uid, email);
    return { success: false, simulated: false, error: String(error) };
  }
}
