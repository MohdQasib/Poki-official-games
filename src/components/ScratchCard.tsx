/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../utils/audioSynth';
import { Sparkles, Archive, RefreshCw } from 'lucide-react';

interface ScratchCardProps {
  onSuccess: (amount: number) => void;
  onResetTrigger?: any;
}

export default function ScratchCard({ onSuccess }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const [isScratched, setIsScratched] = useState<boolean>(false);
  const [revealedAmount, setRevealedAmount] = useState<number>(0);
  const [scratchPercent, setScratchPercent] = useState<number>(0);

  // Initialize a random secret amount inside the ticket
  const secretAmountRef = useRef<number>(0.5);

  useEffect(() => {
    initScratchTicket();
  }, []);

  const getRandomReward = () => {
    const rewards = [0.25, 0.5, 0.75, 1.25, 1.5, 2.0, 3.5];
    return rewards[Math.floor(Math.random() * rewards.length)];
  };

  const initScratchTicket = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset local states
    setIsScratched(false);
    setScratchPercent(0);
    const amt = getRandomReward();
    secretAmountRef.current = amt;
    setRevealedAmount(amt);

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw the Top Scraping Cover Layer (Futuristic Amber-Grid Pattern)
    ctx.fillStyle = '#1c1f26';
    ctx.fillRect(0, 0, w, h);

    // Border line
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, w, h);

    // Cyber design on top of scratch shield
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 12) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(w - i, h);
      ctx.stroke();
    }

    // High Tech Center Core Watermark
    ctx.fillStyle = '#ffb703';
    ctx.shadowColor = '#ffb703';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH PLATINUM LAYER', w / 2, h / 2 - 5);

    ctx.fillStyle = '#ffd166';
    ctx.font = '9px monospace';
    ctx.fillText('RUB OR SWIPE WITH CURSOR', w / 2, h / 2 + 15);
  };

  const getPercentageScratched = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const w = canvas.width;
    const h = canvas.height;
    // Sample only a subset of pixels to prevent lagging performance
    const pixels = ctx.getImageData(0, 0, w, h).data;
    let transparent = 0;

    for (let i = 0; i < pixels.length; i += 24) {
      if (pixels[i + 3] === 0) {
        transparent++;
      }
    }

    const totalSamples = pixels.length / 24;
    return Math.floor((transparent / totalSamples) * 100);
  };

  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isScratched) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Occasional rubbing audio sweep
    if (Math.random() > 0.85) {
      synth.playSlide();
    }

    // Periodically update percentage
    const currentPercent = getPercentageScratched();
    setScratchPercent(currentPercent);

    if (currentPercent > 45) {
      // Auto complete wipeout
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsScratched(true);
      synth.playLevelUp();
      onSuccess(secretAmountRef.current);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  // Touch Handlers for smartphones/tablets
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const touch = e.touches[0];
    scratch(touch.clientX, touch.clientY);
  };

  return (
    <div id="scratch-card-widget" className="bg-[#151821] border border-[#2a2f3b] rounded-lg p-5 flex flex-col items-center">
      
      {/* Container holding underlying target and top scraping cover */}
      <div className="relative w-full max-w-[260px] h-32 bg-[#0b0c10] border border-[#2a2f3b] flex flex-col items-center justify-center rounded overflow-hidden select-none">
        
        {/* UNDERLYING GOLD TICKET (Exposed on Scratch) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#12141c] to-[#040508] p-4 text-center z-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] tracking-wider uppercase font-semibold">
            <Sparkles className="w-4 h-4 text-[#ffb703] animate-pulse" />
            <span>Telemetry Match Found</span>
          </div>

          <div className="mt-1 text-2xl font-mono text-[#ffb703] font-extrabold tracking-tight">
            +{revealedAmount.toFixed(2)} POKI
          </div>

          <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase">
            Mining Ticket Verified
          </div>
        </div>

        {/* TOP SCRAPING CANVAS LAYER */}
        <canvas
          ref={canvasRef}
          width={260}
          height={128}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="absolute inset-0 z-10 touch-none cursor-crosshair block"
        />
      </div>

      {/* Controller Buttons / Text Indicators */}
      <div className="w-full mt-4 flex items-center justify-between gap-4 font-mono text-[11px]">
        {isScratched ? (
          <button
            onClick={initScratchTicket}
            id="reset-scratch-card-btn"
            className="w-full py-2 bg-[#ffb703]/10 hover:bg-[#ffb703]/20 border border-[#ffb703]/30 text-[#ffb703] rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>CLAIM & METALLIZE NEW COVER</span>
          </button>
        ) : (
          <>
            <span className="text-gray-400">Scrubbed Area:</span>
            <span className="text-[#ffd166] font-bold">{scratchPercent}% / 45% TARGET</span>
          </>
        )}
      </div>
    </div>
  );
}
