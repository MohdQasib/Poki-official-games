/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LuckySpinner from './LuckySpinner';
import ScratchCard from './ScratchCard';
import { synth } from '../utils/audioSynth';
import { Sparkles, Compass, PlayCircle, Stamp, Calendar, CheckSquare, Trophy, Eye, RefreshCw, XCircle } from 'lucide-react';

interface DailyTasksProps {
  onAwardBalance: (amt: number) => void;
  pokiBalance: number;
}

export default function DailyTasks({ onAwardBalance, pokiBalance }: DailyTasksProps) {
  const [activeSubTab, setActiveSubTab] = useState<'wheel' | 'scratch' | 'stamp' | 'survey'>('wheel');
  
  // Daily login stamp dates
  const [consecutiveDays, setConsecutiveDays] = useState<number>(3);
  const [stampClaimedToday, setStampClaimedToday] = useState<boolean>(false);
  
  // Watch Ads states
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(10);
  const [adSuccess, setAdSuccess] = useState<boolean>(false);

  const handleStampClaim = () => {
    if (stampClaimedToday) return;

    synth.playLevelUp();
    const nextDays = consecutiveDays + 1;
    setConsecutiveDays(nextDays);
    setStampClaimedToday(true);

    const bonus = 0.5 + nextDays * 0.1; // escalating rewards
    onAwardBalance(bonus);
  };

  const handleStartSimulatAd = () => {
    setIsWatchingAd(true);
    setAdCountdown(10);
    setAdSuccess(false);
    synth.playJump();
  };

  // Countdown timer for Simulated Ad Video Stream
  useEffect(() => {
    if (!isWatchingAd || adCountdown <= 0) {
      if (isWatchingAd && adCountdown === 0) {
        setIsWatchingAd(false);
        setAdSuccess(true);
        synth.playLevelUp();
        onAwardBalance(1.50); // releasing +1.5 POKI reward
      }
      return;
    }

    const interval = setInterval(() => {
      setAdCountdown((prev) => prev - 1);
      // Soft tracking beeps
      synth.playCoin();
    }, 1000);

    return () => clearInterval(interval);
  }, [isWatchingAd, adCountdown]);

  return (
    <div className="bg-[#0f1115] border border-[#2a2f3b] rounded-lg p-5 shadow-xl relative text-left">
      
      {/* Tab Header title */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#ffb703]" />
          <h2 className="text-md font-sans font-bold text-white uppercase tracking-wider">DAILY REWARDS HUB</h2>
        </div>
        <div className="text-[10px] font-mono text-gray-500 bg-[#151821] px-2 py-0.5 border border-[#2a2f3b] rounded uppercase">
          Earning telemetry active
        </div>
      </div>

      {/* Mini Tabs Selector Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-5 pb-1 border-b border-[#2a2f3b] scrollbar-thin select-none">
        <button
          onClick={() => { synth.playCoin(); setActiveSubTab('wheel'); }}
          className={`px-3 py-2 text-xs font-mono font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'wheel'
              ? 'bg-[#ffb703] text-black font-semibold shadow shadow-[#ffb703]/20'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-[#2a2f3b]'
          }`}
        >
          Lucky Spinner
        </button>

        <button
          onClick={() => { synth.playCoin(); setActiveSubTab('scratch'); }}
          className={`px-3 py-2 text-xs font-mono font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'scratch'
              ? 'bg-[#ffb703] text-black font-semibold shadow shadow-[#ffb703]/20'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-[#2a2f3b]'
          }`}
        >
          Scratch Vector
        </button>

        <button
          onClick={() => { synth.playCoin(); setActiveSubTab('stamp'); }}
          className={`px-3 py-2 text-xs font-mono font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'stamp'
              ? 'bg-[#ffb703] text-black font-semibold shadow shadow-[#ffb703]/20'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-[#2a2f3b]'
          }`}
        >
          Stamp Sign-In
        </button>

        <button
          onClick={() => { synth.playCoin(); setActiveSubTab('survey'); }}
          className={`px-3 py-2 text-xs font-mono font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'survey'
              ? 'bg-[#ffb703] text-black font-semibold shadow shadow-[#ffb703]/20'
              : 'bg-[#151821] text-gray-400 hover:text-white border border-[#2a2f3b]'
          }`}
        >
          Watch Ads (+1.5 POKI)
        </button>
      </div>

      {/* SUB TAB SUB-VIEWS */}
      {activeSubTab === 'wheel' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-2">
            <LuckySpinner onSuccess={(amt) => onAwardBalance(amt)} />
          </div>
          <div className="md:col-span-3 text-left">
            <div className="flex items-center gap-1.5 font-sans font-bold text-white text-md uppercase">
              <Sparkles className="w-4 h-4 text-[#ffb703]" />
              <span>ORBIT SPINNER ENGINE</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Activate the spinning rotor node to align decentralized cryptocurrency hashes. Every 24 hours, you qualify for 1 lucky telemetry override, awarding up to <span className="text-[#ffb703] font-bold">5.00 POKI</span> immediately credited into your authenticated wallet.
            </p>
            <div className="mt-4 flex flex-col gap-2 font-mono text-[10px] text-gray-500 bg-[#0b0c10] p-3 rounded border border-[#2a2f3b]">
              <div className="flex justify-between">
                <span>Rotor Core Status:</span>
                <span className="text-[#ffd166] uppercase font-bold">Consensus Armed</span>
              </div>
              <div className="flex justify-between">
                <span>Max Target Prize:</span>
                <span className="text-emerald-400 font-bold">+5.00000000 POKI</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'scratch' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-2">
            <ScratchCard onSuccess={(amt) => onAwardBalance(amt)} />
          </div>
          <div className="md:col-span-3 text-left">
            <div className="flex items-center gap-1.5 font-sans font-bold text-white text-md uppercase">
              <Trophy className="w-4 h-4 text-[#ffb703]" />
              <span>CORES SCRATH LAYER</span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Rub or swipe off the platinum core shielding material above using your pointer cursor or finger touch. This action exposes the certified reward index on the decentralized mining node underneath.
            </p>
            <div className="mt-4 flex flex-col gap-2 font-mono text-[10px] text-gray-500 bg-[#0b0c10] p-3 rounded border border-[#2a2f3b]">
              <div className="flex justify-between">
                <span>Verification State:</span>
                <span className="text-emerald-400 font-bold uppercase">Ready</span>
              </div>
              <div className="flex justify-between">
                <span>Ticket Value Bounds:</span>
                <span className="text-gray-300">0.25 to 3.50 POKI</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'stamp' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-sans font-bold text-white text-sm uppercase">
            <Stamp className="w-4 h-4 text-[#ffb703]" />
            <span>DAILY SIGNIN LANDING PATH</span>
          </div>
          
          <p className="text-xs text-gray-400">
            Sign block validation stamps consecutively for 7 days to trigger multipliers! Daily stamps award standard mining speed boosts and coin multipliers.
          </p>

          {/* 7-day Stamps container row */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const isStamped = dayNum <= consecutiveDays;
              const isTodayTrigger = dayNum === consecutiveDays + 1;
              return (
                <div
                  key={dayNum}
                  className={`p-2 rounded border flex flex-col items-center justify-center font-mono transition-all ${
                    isStamped
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 text-center'
                      : isTodayTrigger && !stampClaimedToday
                      ? 'bg-[#ffb703]/10 border-[#ffb703] text-[#ffb703] animate-pulse cursor-pointer'
                      : 'bg-[#151821] border-[#2a2f3b] text-gray-600'
                  }`}
                  onClick={isTodayTrigger && !stampClaimedToday ? handleStampClaim : undefined}
                >
                  <span className="text-[9px] uppercase tracking-wider">Day {dayNum}</span>
                  <div className="text-[14px] font-bold mt-1">
                    {isStamped ? '✓' : `+${(0.5 + dayNum * 0.1).toFixed(1)}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-3 bg-[#0b0c10]/50 rounded border border-[#2a2f3b]">
            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Streak: <span className="text-[#ffd166] font-bold">{consecutiveDays} Consecutive Days</span></span>
            </div>

            <button
              disabled={stampClaimedToday}
              onClick={handleStampClaim}
              id="stamp-landing-poki-btn"
              className={`px-4 py-1.5 rounded font-mono text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                stampClaimedToday
                  ? 'bg-gray-800 border border-[#2a2f3b] text-gray-500'
                  : 'bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 active:scale-95 text-black'
              }`}
            >
              {stampClaimedToday ? 'Already Signed' : 'SIGN BLOCK STAMP'}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'survey' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 font-sans font-bold text-white text-sm uppercase">
            <Eye className="w-4 h-4 text-[#ffb703]" />
            <span>TELEMETRY GRAPHICS SPONSORED STREAM</span>
          </div>

          <p className="text-xs text-gray-400">
            Simulate and watch brief decentralized compiler validation streams to trigger high-reward consensus releases. Completing a sponsor stream instantly injects <span className="text-[#ffb703] font-bold">+1.50 POKI</span> to verified ledger bounds.
          </p>

          {adSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-xs font-mono flex items-center justify-between">
              <span>PROJECTION REWARD DEPLOYED: +1.50 POKI WALLET BOOST RELEASED!</span>
              <button onClick={() => setAdSuccess(false)} className="text-emerald-300 font-bold hover:text-white uppercase">[Dismiss]</button>
            </div>
          )}

          <div className="bg-[#151821] p-5 rounded border border-[#2a2f3b] flex flex-col items-center justify-center text-center">
            {isWatchingAd ? (
              /* Simulated Full-screen ad streams overlay */
              <div className="w-full max-w-sm space-y-3 p-4 bg-black rounded border border-red-500/30 font-mono text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                
                <div className="flex items-center justify-between text-red-500 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    STREAMING SOLIDITY SPONSOR LEDGER
                  </span>
                  <span>{adCountdown}s SECURE LOCK</span>
                </div>

                <div className="bg-[#0b0c10] p-3 rounded border border-gray-800 text-[9px] text-gray-500 font-mono space-y-1 h-20 overflow-hidden leading-relaxed">
                  <div>&gt; GETH NODE INGRESS: establishing peer secure sockets...</div>
                  <div>&gt; CONCENTRIC QUORUM: synchronized at block 12,897,412</div>
                  <div>&gt; VERIFYING SHA-256 PARALLEL SCRAPING CAPABILITIES...</div>
                  <div>&gt; INJECTING DUMMY TELEMETRY CREDITS AD RECORD...</div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#ffd166] mt-2">
                  <span>Sponsor: PokiCoin DeFi Vaults</span>
                  <span className="text-red-400 text-xs font-bold">Compiling...</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartSimulatAd}
                id="watch-ad-stream-btn"
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-[#ffb703] hover:brightness-110 text-white font-mono font-bold text-xs uppercase rounded flex items-center gap-2 shadow-lg shadow-red-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                STREAM REWARD TELEMETRY COMPILER AD (+1.50 POKI)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
