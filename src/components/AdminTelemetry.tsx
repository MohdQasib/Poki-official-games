/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, RefreshCw, Layers, CalendarCheck, Zap, UserX, Database, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { synth } from '../utils/audioSynth';

interface AdminTelemetryProps {
  currentBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  isInvincible: boolean;
  onToggleInvincible: (val: boolean) => void;
  onTriggerCheckIn: () => void;
  onInjectTransactions: () => void;
  onResetScratch: () => void;
  onResetWheel: () => void;
  testerEmail: string;
}

export default function AdminTelemetry({
  currentBalance,
  onBalanceUpdate,
  isInvincible,
  onToggleInvincible,
  onTriggerCheckIn,
  onInjectTransactions,
  onResetScratch,
  onResetWheel,
  testerEmail,
}: AdminTelemetryProps) {
  const [logs, setLogs] = useState<string[]>(['DEBUG GERMINATOR: SYSTEM LIVE', 'Consensus ledger is watching vector ports.']);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 4)]);
  };

  const handleInjectPoki = () => {
    synth.playLevelUp();
    const bonus = 500;
    const nextBal = currentBalance + bonus;
    onBalanceUpdate(nextBal);
    addLog(`INJECT +500 POKI: Balance updated securely to ${nextBal.toFixed(4)} POKI.`);
  };

  const handleSimulateTrans = () => {
    synth.playLevelUp();
    onInjectTransactions();
    addLog(`SIMULATED +1000 POKI TRANS: ledger entries written to core blockchain stack.`);
  };

  const handleWheelAction = () => {
    synth.playCoin();
    onResetWheel();
    addLog(`TELEMETRY STRIKE: Lucky Spinner state reset successfully.`);
  };

  const handleScratchAction = () => {
    synth.playCoin();
    onResetScratch();
    addLog(`TELEMETRY STRIKE: Scratch Layer state re-metallized.`);
  };

  const handleCheckInAction = () => {
    synth.playCoin();
    onTriggerCheckIn();
    addLog(`TELEMETRY STRIKE: Consecutive Check-In days incremented. Stamp signed.`);
  };

  return (
    <div id="admin-telemetry-panel" className="bg-[#0b0c10]/95 border border-[#ffb703]/30 rounded-lg p-5 mt-5 shadow-xl relative text-left">
      {/* Small Glowing Status Beacon */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 font-mono text-[9px] text-[#ffb703] tracking-widest uppercase">
        <span className="w-1.5 h-1.5 bg-[#ffb703] rounded-full animate-ping" />
        <span>Live Debug Vector</span>
      </div>

      {/* Header Container */}
      <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px] uppercase tracking-wider font-semibold">
        <Sliders className="w-4 h-4 text-emerald-400" />
        <span>Admin System Telemetry</span>
        <span className="text-gray-500 font-normal lowercase">({testerEmail})</span>
      </div>

      {/* Grid of Action Buttons exactly like the screenshot UI layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <button
          onClick={handleWheelAction}
          id="admin-wheel-btn"
          className="py-2.5 px-3 bg-[#151821] hover:bg-[#ffb703]/10 border border-[#2a2f3b] hover:border-[#ffb703]/50 text-xs font-mono text-gray-300 hover:text-white rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Wheel</span>
        </button>

        <button
          onClick={handleScratchAction}
          id="admin-scratch-btn"
          className="py-2.5 px-3 bg-[#151821] hover:bg-[#ffb703]/10 border border-[#2a2f3b] hover:border-[#ffb703]/50 text-xs font-mono text-gray-300 hover:text-white rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Scratch</span>
        </button>

        <button
          onClick={handleCheckInAction}
          id="admin-checkin-btn"
          className="py-2.5 px-3 bg-[#151821] hover:bg-[#ffb703]/10 border border-[#2a2f3b] hover:border-[#ffb703]/50 text-xs font-mono text-gray-300 hover:text-white rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Check-In</span>
        </button>

        <button
          onClick={() => {
            synth.playCoin();
            addLog("Missions registry scanned and set to ACTIVE.");
          }}
          id="admin-mission-btn"
          className="py-2.5 px-3 bg-[#151821] hover:bg-[#ffb703]/10 border border-[#2a2f3b] hover:border-[#ffb703]/50 text-xs font-mono text-gray-300 hover:text-white rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mission</span>
        </button>

        <button
          onClick={() => {
            synth.playCrash();
            addLog("Team consensus registers reset to null base parameters.");
          }}
          id="admin-reset-team-btn"
          className="py-2.5 px-3 bg-[#151821] hover:bg-red-500/10 border border-[#2a2f3b] hover:border-red-500/50 text-xs font-mono text-gray-300 hover:text-white rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserX className="w-3.5 h-3.5 text-red-400" />
          <span>Reset Team</span>
        </button>

        <button
          onClick={handleInjectPoki}
          id="admin-add-poki-btn"
          className="py-2.5 px-3 bg-[#0d1c1a] hover:bg-[#1a3834] border border-[#1b4332] text-xs font-mono text-emerald-400 hover:text-white rounded transition-all flex items-center justify-center gap-2 col-span-1 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>+500 POKI</span>
        </button>

        <button
          onClick={handleSimulateTrans}
          id="admin-sim-trans-btn"
          className="py-2.5 px-3 bg-[#0d1c1a] hover:bg-[#1a3834] border border-[#1b4332] text-xs font-mono text-emerald-400 hover:text-white rounded transition-all flex items-center justify-center gap-2 col-span-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>+1k Trans</span>
        </button>
      </div>

      {/* Advanced Debug Overrides (Sandbox Invincibility for Endless Runner testing) */}
      <div className="mt-4 pt-4 border-t border-[#2a2f3b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isInvincible}
              onChange={(e) => {
                onToggleInvincible(e.target.checked);
                addLog(`DEV ACCESS: Invincibility override toggled ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
              }}
            />
            <div className="w-9 h-5 bg-[#151821] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#ffb703] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500 border border-[#2a2f3b]"></div>
            <span className="ml-3 text-xs font-mono text-gray-300">
              Invincibility Sandbox Override <span className="text-emerald-400">(Test Lanes Seamlessly)</span>
            </span>
          </label>
        </div>

        <div className="bg-[#151821] p-2.5 rounded border border-[#2a2f3b] flex items-center gap-2 w-full md:w-auto">
          <ShieldAlert className="w-4 h-4 text-[#ffb703] flex-shrink-0" />
          <span className="text-[10px] font-mono text-gray-400 leading-tight">
            Safety Warning: Sandbox override prevents critical gaming session failure triggers. Enjoy debugging!
          </span>
        </div>
      </div>

      {/* Real-time Telemetry Dev Logs for complete professional look */}
      <div className="mt-4 p-3 bg-black/40 rounded border border-[#1c1f26] font-mono text-[9px] text-gray-500">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          <AlertCircle className="w-3 h-3 text-[#ffb703]" />
          <span>REAL-TIME KERNEL EVENTS</span>
        </div>
        <div className="flex flex-col gap-1">
          {logs.map((log, i) => (
            <div key={i} className="truncate select-text">
              <span className="text-gray-600">&gt;&gt;</span> {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
