/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { synth } from '../utils/audioSynth';
import { Send, Shield, Search, ArrowRightLeft, Users, FileText, CheckCircle2 } from 'lucide-react';

interface WalletExchangeProps {
  pokiBalance: number;
  onSendCredits: (amount: number) => boolean;
  importedLogs?: Array<{
    hash: string;
    gain: number;
    gameScore: number;
    timestamp: number;
  }>;
}

interface PeerTransaction {
  id: string;
  recipientVector: string;
  amount: number;
  fee: number;
  timestamp: number;
  state: string;
}

export default function WalletExchange({ pokiBalance, onSendCredits, importedLogs = [] }: WalletExchangeProps) {
  const [recipient, setRecipient] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('0.00');
  const [kycCompleted, setKycCompleted] = useState<boolean>(false);
  const [transactionProcessing, setTransactionProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Default transactions backlog
  const [ledger, setLedger] = useState<PeerTransaction[]>([
    {
      id: '0xfa3910c283bbd7a0492c10',
      recipientVector: 'PokiNode_Seed_Alpha_Beta_0091',
      amount: 15.0,
      fee: 0.0001,
      timestamp: Date.now() - 4 * 60 * 60 * 1000,
      state: 'CONFIRMED',
    },
    {
      id: '0xc1bc0192ea019a3bfa22ea10',
      recipientVector: 'PokiNode_Core_Mainnet_Gate_01',
      amount: 2.5,
      fee: 0.0001,
      timestamp: Date.now() - 12 * 60 * 60 * 1000,
      state: 'CONFIRMED',
    },
  ]);

  const peerVectors = [
    { name: 'Alpha Core Vector', vector: '0x992fbda1e00ffa1bb201e' },
    { name: 'Gateway Node 02', vector: '0xcc1bc0ac91da9180ae21c' },
    { name: 'Consensus Validator Beta', vector: '0xbb192cfbaee1d0ea1' },
  ];

  const handleSelectPeer = (vector: string) => {
    synth.playCoin();
    setRecipient(vector);
  };

  const handleAuthorizeTransfer = () => {
    const amt = parseFloat(amountStr);
    if (!recipient || recipient.trim().length === 0) {
      synth.playCrash();
      setNotification('ERROR: Recipient Public Vector is required.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      synth.playCrash();
      setNotification('ERROR: Enter a valid POKI amount.');
      return;
    }
    if (amt > pokiBalance - 0.0001) {
      synth.playCrash();
      setNotification('ERROR: Insufficient core balance (Consensus fee 0.0001 POKI).');
      return;
    }

    setTransactionProcessing(true);
    setNotification(null);
    synth.playJump();

    // 1.5s simulated proof of work mining validation cycle
    setTimeout(() => {
      const success = onSendCredits(amt + 0.0001); // deduct fee as well

      if (success) {
        // Generate random vector hex hash
        const buffer = new Uint32Array(4);
        window.crypto.getRandomValues(buffer);
        const signedTxHash = `0x${Array.from(buffer).map(b => b.toString(16).padStart(8, '0')).join('')}`.slice(0, 24);

        const nextTx: PeerTransaction = {
          id: signedTxHash,
          recipientVector: recipient,
          amount: amt,
          fee: 0.0001,
          timestamp: Date.now(),
          state: 'CONFIRMED',
        };

        setLedger((prev) => [nextTx, ...prev]);
        setRecipient('');
        setAmountStr('0.00');
        synth.playLevelUp();
        setNotification(`SUCCESS: Transaction verified in blockchain! Ledger ID: ${signedTxHash}`);
      } else {
        synth.playCrash();
        setNotification('ERROR: Sync failure during consensus validation. Please retry.');
      }
      setTransactionProcessing(false);
    }, 1800);
  };

  const calculateInr = (pokiAmount: number) => {
    return (pokiAmount * 0.50).toFixed(2);
  };

  return (
    <div className="space-y-5">
      {/* 2 Card Side-By-Side: Referral bonus vs Core balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        {/* Card 1: Unverified Referral Bonus */}
        <div className="bg-[#151821] border border-[#2a2f3b] rounded-lg p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rotate-45 transform translate-x-12 -translate-y-12" />
          
          <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase font-medium">
            UNVERIFIED KYC BONUS
          </span>
          
          <div className="text-2xl font-mono text-[#ffb703] font-extrabold tracking-tight mt-1.5">
            {(pokiBalance * 0.05).toFixed(4)} <span className="text-xs text-[#ffd166]">POKI</span>
          </div>
          
          <p className="text-xs font-mono text-gray-500 mt-1">
            ₹ {calculateInr(pokiBalance * 0.05)} INR
          </p>
          
          <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
            Peer reference tokens that unlock dynamically as circle contacts complete KYC validation.
          </p>
        </div>

        {/* Card 2: Transferable Core */}
        <div className="bg-[#151821] border border-[#ffb703]/20 rounded-lg p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-[#ffb703] tracking-widest uppercase font-semibold">
                TRANSFERABLE CORE
              </span>
              <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                KYC Ready
              </span>
            </div>

            <div className="text-2xl font-mono text-[#ffd166] font-extrabold tracking-tight mt-1.5 animate-pulse">
              {(pokiBalance * 0.95).toFixed(4)} <span className="text-xs text-white">POKI</span>
            </div>

            <p className="text-xs font-mono text-gray-500 mt-1">
              ₹ {calculateInr(pokiBalance * 0.95)} INR
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a2f3b] flex items-center justify-between gap-4">
            <button
              onClick={() => {
                synth.playLevelUp();
                setKycCompleted(true);
                setNotification('SUCCESS: Biometrics KYC Vector validation completed instantly.');
              }}
              className="py-1.5 px-3 bg-gradient-to-r from-[#ffb703]/20 to-[#ffd166]/20 border border-[#ffb703]/40 text-black text-[9px] font-mono font-extrabold uppercase rounded tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#ffb703] fill-[#ffb703]/10" />
              <span className="text-[#ffb703]">VERIFY USER DETAILS</span>
            </button>
            <span className="text-[9px] font-mono text-gray-500 text-right">
              Only verified balance is transferable.
            </span>
          </div>
        </div>
      </div>

      {/* CORE TRANSFER PEER PANEL (REPLICATED SCREENSHOT 2) */}
      <div id="transfer-peer-panel" className="bg-[#0f1115] border border-[#2a2f3b] rounded-lg p-5 text-left">
        <div className="flex items-center gap-2 border-b border-[#2a2f3b] pb-3 mb-4">
          <ArrowRightLeft className="w-4 h-4 text-[#ffb703]" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
            TRANSFER PEER EXCHANGE
          </h3>
        </div>

        {notification && (
          <div className={`p-3 mb-4 rounded font-mono text-[11px] border ${
            notification.startsWith('ERROR')
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {notification}
          </div>
        )}

        <div className="space-y-4">
          {/* Recipient Input Row */}
          <div>
            <label className="block text-[9px] font-mono text-gray-400 uppercase tracking-widest mb-1.5">
              Recipient Public ID or Peer Vector
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="G... node public vector index"
                  className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs text-white placeholder-gray-600 focus:outline-none transition-all"
                />
              </div>

              {/* CHOOSE CONTACT... Dropdown selector */}
              <select
                onChange={(e) => handleSelectPeer(e.target.value)}
                id="choose-contact-dropdown"
                className="bg-[#151821] border border-[#2a2f3b] text-gray-400 focus:text-white rounded-lg px-3 text-[11px] font-mono focus:outline-none focus:border-[#ffb703] cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>Choose Contact...</option>
                {peerVectors.map((peer, idx) => (
                  <option key={idx} value={peer.vector}>{peer.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount inputs */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                Amount POKI Koin
              </label>
              <button
                onClick={() => setAmountStr((pokiBalance * 0.94).toFixed(4))}
                className="text-[9px] font-mono text-[#ffb703] hover:underline"
              >
                Max Core: {(pokiBalance * 0.94).toFixed(4)} POKI
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0b0c10] border border-[#2a2f3b] focus:border-[#ffb703] rounded-lg px-4 py-3 font-mono text-lg text-[#ffb703] font-bold focus:outline-none transition-all"
              />
              <div className="absolute right-4 top-4 text-[10px] font-mono text-gray-500">
                Limit: {(pokiBalance * 0.95).toFixed(2)} Max
              </div>
            </div>

            <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-1.5">
              <span>Fee: <span className="text-gray-300">0.0001 POKI consensus</span></span>
              <span>Rate equivalence: <span className="text-gray-300">₹{(parseFloat(amountStr || '0') * 0.50).toFixed(2)} INR</span></span>
            </div>
          </div>

          {/* Authorize Transaction Action button */}
          <button
            onClick={handleAuthorizeTransfer}
            disabled={transactionProcessing}
            id="authorize-tx-btn"
            className="w-full py-4 bg-[#ffb703] hover:bg-[#ffd166] disabled:bg-[#1a1c22] text-[#0b0c10] font-mono font-extrabold text-sm tracking-widest uppercase rounded shadow shadow-[#ffb703]/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#0b0c10] fill-[#0b0c10]/20" />
            {transactionProcessing ? 'AUTONOMOUS VERIFYING PAYLOAD...' : 'AUTHORIZE TRANSACTION'}
          </button>
        </div>
      </div>

      {/* VERIFIABLE BLOCKCHAIN LEDGER BLOCK (SCREENSHOT 2) */}
      <div id="blockchain-ledger" className="bg-[#0f1115] border border-[#2a2f3b] rounded-lg p-5 text-left">
        <div className="flex items-center gap-2 border-b border-[#2a2f3b] pb-3 mb-3">
          <FileText className="w-4 h-4 text-[#ffd166]" />
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
            VERIFIABLE BLOCKCHAIN LEDGER
          </h3>
        </div>

        {/* Display logs and recent peer events */}
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {ledger.map((tx, idx) => (
            <div key={idx} className="bg-[#13151c] p-3 rounded border border-[#2a2f3b] flex items-center justify-between text-[11px] font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-white font-bold">{tx.recipientVector.slice(0, 18)}...</span>
                </div>
                <div className="text-[9px] text-gray-500">
                  Block Validation Anchor: <span className="text-gray-300 select-all">{tx.id}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[#ffb703] font-bold">-{tx.amount.toFixed(2)} POKI</span>
                <div className="text-[9px] text-gray-500">
                  {new Date(tx.timestamp).toLocaleTimeString()} UTC
                </div>
              </div>
            </div>
          ))}

          {/* Merge in continuous Arcade Gaming logs dynamically for ledger consistency */}
          {importedLogs.map((log, lidx) => (
            <div key={`arcade-${lidx}`} className="bg-[#0d1614] p-3 rounded border border-emerald-800/30 flex items-center justify-between text-[11px] font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">Arcade Node Performance Reward</span>
                </div>
                <div className="text-[9px] text-gray-500">
                  Proof of Run: <span className="text-[#ffd166]">{log.gameScore}m</span> | Anchor: <span className="text-gray-300">{log.hash.slice(0, 20)}...</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-emerald-400 font-bold">+{log.gain.toFixed(4)} POKI</span>
                <div className="text-[9px] text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()} UTC
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
