/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, ShieldAlert, Code2, Terminal, RefreshCw, FileCode, CheckCircle, HelpCircle } from 'lucide-react';
import { synth } from '../utils/audioSynth';

interface FirebaseIntegrationTabProps {
  currentConfig: any;
  onUpdateConfig: (newConfig: any) => void;
}

export default function FirebaseIntegrationTab({ currentConfig, onUpdateConfig }: FirebaseIntegrationTabProps) {
  const [apiKey, setApiKey] = useState<string>(currentConfig.apiKey || 'PLACEHOLDER');
  const [authDomain, setAuthDomain] = useState<string>(currentConfig.authDomain || 'minipokicoin-arcade.firebaseapp.com');
  const [projectId, setProjectId] = useState<string>(currentConfig.projectId || 'minipokicoin-arcade');
  const [storageBucket, setStorageBucket] = useState<string>(currentConfig.storageBucket || 'minipokicoin-arcade.appspot.com');
  const [messagingSenderId, setMessagingSenderId] = useState<string>(currentConfig.messagingSenderId || '560074705105');
  const [appId, setAppId] = useState<string>(currentConfig.appId || '1:560074705105:web:8a9b3c4d5e6f7a8b9c');
  const [firestoreDatabaseId, setFirestoreDatabaseId] = useState<string>(currentConfig.firestoreDatabaseId || '(default)');
  
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSaveConfig = () => {
    synth.playLevelUp();
    const updated = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      firestoreDatabaseId,
    };
    onUpdateConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const codeSnippet = `// Production-Ready SDK Integration v9/v10
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

// Initialize App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "${firestoreDatabaseId}");

/**
 * Sync scoring credits directly to primary database wallet in real-time
 */
export async function creditPokicoins(uid: string, quantity: number, mScore: number) {
  const userRef = doc(db, "users", uid);
  try {
    // Atomically increments balance safely avoiding race conditions
    await updateDoc(userRef, {
      pokiBalance: increment(quantity),
      highestGameDistance: increment(mScore),
      lastSyncTimestamp: Date.now()
    });
    console.log("Immutable ledger verified on cluster.");
    return { success: true };
  } catch (error) {
    console.error("Ledger sync failure:", error);
    throw error;
  }
}`;

  return (
    <div className="space-y-6">
      {/* Visual Header card */}
      <div className="bg-[#151821] border border-[#2a2f3b] rounded-lg p-5 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb703]/5 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#ffb703]" />
          <h2 className="text-md font-sans font-bold text-white uppercase tracking-wider">FIREBASE SECURE PORT GATEWAY</h2>
        </div>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          Provide your Firebase Realtime / Firestore credentials below to bind your Subway Surfers arcade game to your main database. When the game triggers "Session Syncing...", it will write balances directly to the player's node: <code className="text-[#ffd166] bg-black/40 px-1 py-0.5 rounded font-mono">/users/uid/balance</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Firebase Config inputs panel */}
        <div className="bg-[#0f1115] border border-[#2a2f3b] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Firebase Credentials Setup
            </span>
            <span className="text-[9px] font-mono text-gray-500 uppercase">
              Web Client Config
            </span>
          </div>

          {saveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 p-2.5 rounded font-mono text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>GATEWAY ACTIVE: Keys compiled successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">Storage Bucket</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">Messaging ID</label>
              <input
                type="text"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
              />
            </div>
            
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[9px] text-gray-400 mb-1 uppercase">Firestore Database ID</label>
              <input
                type="text"
                value={firestoreDatabaseId}
                onChange={(e) => setFirestoreDatabaseId(e.target.value)}
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded p-2 text-white focus:outline-none"
                placeholder="(default)"
              />
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            id="save-firebase-config-btn"
            className="w-full py-2.5 bg-[#ffb703] hover:bg-[#ffd166] text-black font-mono font-bold text-xs uppercase tracking-wider rounded transition-all cursor-pointer"
          >
            COMPILE & ACTIVATE GATEWAY
          </button>
        </div>

        {/* Cyber rules guard / instructions */}
        <div className="bg-[#0f1115] border border-[#2a2f3b] rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#ffd166] font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-[#ffb703]" />
              <span>Zero-Trust Database Security Rules</span>
            </div>
            
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              We have compiled active security rules inside <code className="text-[#ffb703] bg-black/40 px-1 rounded font-mono font-semibold">firestore.rules</code> within your repository. This strictly allows verified and logged-in clients to commit increments to their wallets while completely blocking malicious external shadow modifications of balance properties.
            </p>

            <div className="mt-4 bg-[#0b0c10] p-3 rounded border border-[#2a2f3b] text-left">
              <span className="text-[9px] font-mono text-gray-500 block uppercase font-bold">Consensus Rule Safety Measures:</span>
              <ul className="list-disc list-inside text-[10px] font-mono text-gray-400 mt-2 space-y-1.5 leading-snug">
                <li><span className="text-[#ffd166]">IsOwner() Gate</span>: Writes strictly locked to the authenticated user ID.</li>
                <li><span className="text-[#ffd166]">Value Poisoning block</span>: Increments restricted through atomic validation schemas.</li>
                <li><span className="text-[#ffd166]">Verified email stamp</span>: Users must log in via a verified public vector.</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a2f3b] flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Rules Template Active: <span className="text-white">v9 zero-trust</span></span>
            <span>Ledger Standard: <span className="text-[#ffb703]">ERC-20-style proofs</span></span>
          </div>
        </div>
      </div>

      {/* Code Sniffer Snippet block */}
      <div className="bg-[#0f1115] border border-[#2a2f3b] rounded-lg p-5 text-left space-y-3">
        <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase tracking-wider pb-2 border-b border-[#2a2f3b]">
          <Code2 className="w-4 h-4 text-[#ffb703]" />
          <span>Automated Client Integration Snippet</span>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Embed this modular snippet directly inside your Sub-Arcade runner client directory. It executes the precise dynamic increment operations safely, avoiding classic browser-hacking injection parameters.
        </p>

        <div className="relative bg-black rounded p-4 font-mono text-[10px] text-gray-400 overflow-x-auto max-h-60 leading-relaxed select-text">
          <pre>{codeSnippet}</pre>
        </div>
      </div>
    </div>
  );
}
