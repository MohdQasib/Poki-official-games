/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, Coins, Flame, Award, Sparkles, Trophy, Users, Check, Search, Play, ArrowLeft, 
  Layers, Rocket, TrendingUp, RefreshCw, Zap, Target, Circle, Dribbble, Square, 
  HelpCircle, Copy, Shuffle, Heart, Hash, Database, Volume2, VolumeX, ShieldAlert,
  ChevronRight, AlignJustify, Dices, Maximize, Minimize, Radio, Plus, Smartphone, History, Tv, ArrowRightLeft
} from 'lucide-react';
import { synth } from './utils/audioSynth';
import { syncGamingCreditsToFirebase } from './utils/firebaseSync';
import { GameSession } from './types';

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/auth';
import { initializeApp, getApp } from "firebase/app";
import { getDatabase, ref, set, get, update, child, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from "firebase/auth";

declare global {
  interface Window {
    currentUserId?: string;
  }
}

// DATABASE B: (Gaming Portal - Complete Game State & History)
const gamingAppConfig = {
  apiKey: import.meta.env.VITE_GAMING_FIREBASE_API_KEY || "AIzaSyB7xHrq-jo33eeHsWTNBII5RL_GHFW2vYQ",
  authDomain: "poki-game-website.firebaseapp.com",
  databaseURL: "https://poki-game-website-default-rtdb.firebaseio.com",
  projectId: "poki-game-website",
  storageBucket: "poki-game-website.firebasestorage.app",
  messagingSenderId: "559102716782",
  appId: "1:559102716782:web:c0d6e5b51b83404a756f7f"
};

// DATABASE A: (Main Website - Auth & Withdrawal Only)
const mainAppConfig = {
  apiKey: import.meta.env.VITE_MAIN_FIREBASE_API_KEY || "AIzaSyCq6SMp3fMg5qG0km6XJXjhK2R2Vz5Yxaw",
  authDomain: "minipokicoin.firebaseapp.com",
  databaseURL: "https://minipokicoin-default-rtdb.firebaseio.com",
  projectId: "minipokicoin",
  storageBucket: "minipokicoin.firebasestorage.app",
  messagingSenderId: "222755682323",
  appId: "1:222755682323:web:f673c85146488addace7e6"
};

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'https://minipokicoin.in';

// Temporary testing toggle: disable user ID (UID) verification check to allow direct access
const TESTING_MODE_DISABLE_UID_VERIFICATION = true;

// Initialization Instances (Compat first, which registers them in the global registry)
const gamingCompatApp = firebase.initializeApp(gamingAppConfig, "GamingWebsiteApp");
const mainCompatApp = firebase.initializeApp(mainAppConfig, "MainWebsiteApp");

const database = gamingCompatApp.database();
const databaseMain = mainCompatApp.database();

// Retrieve standard modular App references associated with the registered named apps
const gamingApp = getApp("GamingWebsiteApp");
const mainApp = getApp("MainWebsiteApp");

const gamingDB = getDatabase(gamingApp);
const mainDB = getDatabase(mainApp);

const auth = getAuth(gamingApp);

// Import All Arcade Games
import PokiJumpOverdrive from './components/games/PokiJumpOverdrive';
import FlappyPokiVector from './components/games/FlappyPokiVector';
import PlinkoCryptoDrop from './components/games/PlinkoCryptoDrop';
import PokiSpaceMiner from './components/games/PokiSpaceMiner';
import PokiTowerStacker from './components/games/PokiTowerStacker';
import CryptoMinesweeper from './components/games/CryptoMinesweeper';
import NeonGridBrickBreaker from './components/games/NeonGridBrickBreaker';
import PokiBallisticKnife from './components/games/PokiBallisticKnife';
import DinoRun from './components/games/DinoRun';
import Puzzle2048 from './components/games/Puzzle2048';
import NeonMathMaster from './components/games/NeonMathMaster';
import MemoryMatch from './components/games/MemoryMatch';

// Import All Casino Games
import PokiCrash from './components/casino/PokiCrash';
import CryptoRoulette from './components/casino/CryptoRoulette';
import CyberDice from './components/casino/CyberDice';
import PokiSlots from './components/casino/PokiSlots';
import WheelOfFortune from './components/casino/WheelOfFortune';
import HiloLedger from './components/casino/HiloLedger';
import CoinFlipBlitz from './components/casino/CoinFlipBlitz';
import BlackjackMini from './components/casino/BlackjackMini';
import KenoMatrix from './components/casino/KenoMatrix';
import PokiShellGame from './components/casino/PokiShellGame';

// 8 Brand New Premium Matte Black and Glossy Gold Casino Games
import DiceDuel from './components/casino/DiceDuel';
import LuckyMines from './components/casino/LuckyMines';
import BaccaratLite from './components/casino/BaccaratLite';
import SicBo from './components/casino/SicBo';
import WheelOfFortuneHype from './components/casino/WheelOfFortuneHype';

// Import All Gold Themed Game Thumbnails
import crashThumb from './assets/images/crash_aeroplane_thumb_1780671622174.png';
import slotsThumb from './assets/images/slots_thumbnail.png';
import rouletteThumb from './assets/images/roulette_thumbnail.png';
import plinkoThumb from './assets/images/plinko_thumbnail.png';
import fortuneThumb from './assets/images/fortune_thumbnail.png';
import blackjackThumb from './assets/images/blackjack_thumbnail.png';
import puzzle2048Thumb from './assets/images/puzzle_2048_thumbnail.png';
import memoryThumb from './assets/images/memory_thumbnail.png';
import dinoThumb from './assets/images/dino_thumbnail.png';
import mathThumb from './assets/images/math_thumbnail.png';

// Import All Newly Generated Sleek thematic Thumbnails
import jumpOverdriveThumb from './assets/images/jump_overdrive_premium_1780669612653.png';
import flappyVectorThumb from './assets/images/flappy_vector_premium_1780669631636.png';
import spaceMinerThumb from './assets/images/space_miner_thumbnail_1780664205611.png';
import towerStackerThumb from './assets/images/tower_stacker_premium_1780669648729.png';
import brickBreakerThumb from './assets/images/brick_breaker_thumbnail_1780664238758.png';
import ballisticKnifeThumb from './assets/images/ballistic_knife_thumbnail_1780664256436.png';
import minesweeperThumb from './assets/images/minesweeper_thumbnail_1780664274860.png';
import cyberDiceThumb from './assets/images/cyber_dice_thumbnail_1780664290900.png';
import kenoLotteryThumb from './assets/images/keno_lottery_thumbnail_1780664311609.png';
import diceDuelThumb from './assets/images/dice_duel_thumbnail_1780664329082.png';
import luckyMinesThumb from './assets/images/lucky_mines_thumbnail_1780664347198.png';
import baccaratLiteThumb from './assets/images/baccarat_lite_thumbnail_1780664363119.png';
import dragonTigerThumb from './assets/images/dragon_tiger_thumbnail_1780664379298.png';
import crashXThumb from './assets/images/crash_x_thumbnail_1780664396202.png';
import sicBoThumb from './assets/images/sic_bo_thumbnail_1780664414146.png';
import miniRouletteThumb from './assets/images/mini_roulette_thumbnail_1780664431335.png';
import wheelHypeThumb from './assets/images/wheel_hype_thumbnail_1780664448918.png';

// AI Generated Game Thumbnails
import jetpackRushThumb from './assets/images/jetpack_rush_thumb_1780767107880.png';
import hiloLedgerThumb from './assets/images/hilo_ledger_thumb_1780767136263.png';
import coinFlipThumb from './assets/images/coin_flip_thumb_1780767150834.png';
import shellGameThumb from './assets/images/shell_game_thumb_1780767163950.png';

interface GameItem {
  id: string;
  title: string;
  type: 'arcade' | 'casino';
  badge: string;
  category: string;
  gradient: string;
  multiplierScale: string;
  icon: React.ComponentType<any>;
  thumbnail?: string;
}

const liveWinnersMock = [
  "🏆 Rahul K. secured 540 Poki Gold (₹10.80 INR) in Dino Neon Run !",
  "🏆 Aman S. secured 1,200 Poki Gold (₹24.00 INR) in Poki 777 Jackpot !",
  "🏆 Priya M. secured 450 Poki Gold (₹9.00 INR) in Blackjack Deck 21 !",
  "🏆 Vikram S. secured 1,800 Poki Gold (₹36.00 INR) in Mini Roulette Radial !",
  "🏆 Jaspreet D. secured 320 Poki Gold (₹6.40 INR) in Star Miner Cannon !",
  "🏆 Karan G. secured 750 Poki Gold (₹15.00 INR) in Grand Jackpot Wheel !",
  "🏆 Nikhil J. secured 210 Poki Gold (₹4.20 INR) in Neon Grid Brick !",
  "🏆 Sonia T. secured 980 Poki Gold (₹19.60 INR) in Dragon Tiger Guess !",
  "🏆 Ritesh K. secured 1,500 Poki Gold (₹30.00 INR) in Multiplier Moon Crash !",
  "🏆 Deepak M. secured 645 Poki Gold (₹12.90 INR) in Dice Duel Bet 7 !",
  "🏆 Aayush N. secured 900 Poki Gold (₹18.00 INR) in Gold Memory Match !",
  "🏆 Sneha P. secured 355 Poki Gold (₹7.10 INR) in Apex Leap Board !",
  "🏆 Rajesh R. secured 1,250 Poki Gold (₹25.00 INR) in Baccarat Coupe Lite !",
  "🏆 Harish V. secured 420 Poki Gold (₹8.40 INR) in Neon Math Master !"
];

export default function App() {
  const testerAccountEmail = 'hunterhackingtv@gmail.com';

  // State hooks - STRICTLY ENFORCING ONLY TWO FUNCTIONAL VARIABLE/PATHS IN REACT STATE (Specification 2)
  const [pokiGamingGold, setPokiGamingGold] = useState<number>(() => {
    const cached = parseFloat(localStorage.getItem('poki_gaming_gold') || localStorage.getItem('poki_unplayed_tokens') || '250');
    return cached > 0 ? cached : 250;
  });
  const [pokiGoldWinning, setPokiGoldWinning] = useState<number>(() => {
    const cached = parseFloat(localStorage.getItem('poki_gold_winning') || localStorage.getItem('poki_winning_tokens') || '250');
    return cached > 0 ? cached : 250;
  });
  const pokiBalance = parseFloat((pokiGamingGold + pokiGoldWinning).toFixed(5));
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(6);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tickerItems, setTickerItems] = useState<string[]>(liveWinnersMock);
  const [onlinePlayers, setOnlinePlayers] = useState<number>(() => Math.floor(Math.random() * (500 - 40 + 1)) + 40);
  const [liveWins, setLiveWins] = useState<Array<{ id: string; text: string }>>([
    { id: '1', text: "👤 Amit (ID: #8327) won 6 Poki Gold" },
    { id: '2', text: "👤 Neha (ID: #4819) won 12 Poki Gold" },
    { id: '3', text: "👤 Rajesh (ID: #1940) won 4 Poki Gold" },
    { id: '4', text: "👤 Pooja (ID: #7411) won 15 Poki Gold" },
    { id: '5', text: "👤 Vikram (ID: #3928) won 8 Poki Gold" }
  ]);

  // Ad Trapping and Accumulator States
  const [arcadeCoinsPendingAd, setArcadeCoinsPendingAd] = useState<number>(() => {
    return parseFloat(localStorage.getItem('arcade_coins_pending_ad') || '0');
  });
  
  // Rule 2 & 3: Immutable Reward Dispatch & Ad-Trigger profile states
  const [sessionAccumulatedCoins, setSessionAccumulatedCoins] = useState<number>(() => {
    return parseFloat(localStorage.getItem('poki_session_accumulated_coins') || '0');
  });
  const [mustShowStartupAd, setMustShowStartupAd] = useState<boolean>(() => {
    return localStorage.getItem('poki_must_show_startup_ad') === 'true';
  });
  const [consecutiveGamesPlayed, setConsecutiveGamesPlayed] = useState<number>(() => {
    return parseInt(localStorage.getItem('poki_consecutive_games_played') || '0', 10);
  });
  const [lastPlayedGameId, setLastPlayedGameId] = useState<string | null>(() => {
    return localStorage.getItem('poki_last_played_game_id') || null;
  });
  const [sameGameConsecutiveCount, setSameGameConsecutiveCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('poki_same_game_consecutive_count') || '0', 10);
  });
  const [isLockoutActive, setIsLockoutActive] = useState<boolean>(() => {
    return localStorage.getItem('poki_is_lockout_active') === 'true';
  });
  const [lockoutMessage, setLockoutMessage] = useState<string>(() => {
    return localStorage.getItem('poki_lockout_message') || '';
  });

  // IMMUTABLE LUCKY ZONE / CASINO SECURITY ENGINE RULES - LOCKED BY SPECIFICATION
  const LUCKY_ZONE_SECURITY_RULES = Object.freeze({
    MARTINGALE_DOUBLE_LIMIT: 4,
    COOLDOWN_BET_INTERVAL_MS: 1500,
    MAX_CONSECUTIVE_SPAM_VIOLATIONS: 5,
    GAMES_PER_AD_THRESHOLD: 15,
    IMMUTABLE_VERSION: "1.0.0-SECURE-LOCKED"
  });

  const [casinoGamesPlayedCount, setCasinoGamesPlayedCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('poki_casino_games_played_count') || '0', 10);
  });
  const [lastBetDetails, setLastBetDetails] = useState<{ [gameId: string]: { betAmount: number; doubleUpCount: number } }>({});
  const [lastBetTimestamp, setLastBetTimestamp] = useState<number>(0);
  const [spamViolationCount, setSpamViolationCount] = useState<number>(0);
  const [poolBalance, setPoolBalance] = useState<number>(50000);
  const [isMultiTabLocked, setIsMultiTabLocked] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('poki_casino_games_played_count', String(casinoGamesPlayedCount));
  }, [casinoGamesPlayedCount]);

  const [pendingAdsCount, setPendingAdsCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('pending_ads_count') || '0', 10);
  });
  const [gamePlaysCount, setGamePlaysCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('game_plays_count') || '0', 10);
  });
  const [showFullscreenPostGameAd, setShowFullscreenPostGameAd] = useState<boolean>(false);
  const [fullscreenAdCountdown, setFullscreenAdCountdown] = useState<number>(0);
  const [currentAdSubtext, setCurrentAdSubtext] = useState<string>('');

  // Dynamic monetary value mapping: 1 Poki Gold (PKG) is standard baseline of ~0.016 INR (fluctuates between 0.0153 and 0.0169)
  const getDynamicInrRate = () => {
    const minutes = new Date().getMinutes();
    const fluctuation = (minutes % 17) * 0.0001; // deterministic fluctuation within the hourly cycle
    const rate = 0.0153 + fluctuation;
    return parseFloat(Math.min(0.0169, Math.max(0.0153, rate)).toFixed(5));
  };
  const POKI_GOLD_INR_RATE = getDynamicInrRate();

  const [consecutiveHighScoresCount, setConsecutiveHighScoresCount] = useState<number>(0);
  const [isExtremeHardMode, setIsExtremeHardMode] = useState<boolean>(false);
  const [pendingDualAdEnvelope, setPendingDualAdEnvelope] = useState<boolean>(false);
  const [enforceInterstitialOnGameOver, setEnforceInterstitialOnGameOver] = useState<boolean>(false);
  const [arcadeCoinsEarnedAccumulator, setArcadeCoinsEarnedAccumulator] = useState<number>(() => {
    return parseFloat(localStorage.getItem('poki_arcade_coins_earned_accumulator') || '0');
  });

  useEffect(() => {
    localStorage.setItem('arcade_coins_pending_ad', String(arcadeCoinsPendingAd));
  }, [arcadeCoinsPendingAd]);

  useEffect(() => {
    localStorage.setItem('poki_session_accumulated_coins', String(sessionAccumulatedCoins));
  }, [sessionAccumulatedCoins]);

  useEffect(() => {
    localStorage.setItem('poki_must_show_startup_ad', String(mustShowStartupAd));
  }, [mustShowStartupAd]);

  useEffect(() => {
    localStorage.setItem('poki_consecutive_games_played', String(consecutiveGamesPlayed));
  }, [consecutiveGamesPlayed]);

  useEffect(() => {
    if (lastPlayedGameId) {
      localStorage.setItem('poki_last_played_game_id', lastPlayedGameId);
    } else {
      localStorage.removeItem('poki_last_played_game_id');
    }
  }, [lastPlayedGameId]);

  useEffect(() => {
    localStorage.setItem('poki_same_game_consecutive_count', String(sameGameConsecutiveCount));
  }, [sameGameConsecutiveCount]);

  useEffect(() => {
    localStorage.setItem('poki_is_lockout_active', String(isLockoutActive));
  }, [isLockoutActive]);

  useEffect(() => {
    localStorage.setItem('poki_lockout_message', lockoutMessage);
  }, [lockoutMessage]);

  useEffect(() => {
    localStorage.setItem('pending_ads_count', String(pendingAdsCount));
  }, [pendingAdsCount]);

  useEffect(() => {
    localStorage.setItem('game_plays_count', String(gamePlaysCount));
  }, [gamePlaysCount]);

  useEffect(() => {
    const IndianFirstNames = ["Amit", "Neha", "Rajesh", "Pooja", "Vikram", "Suresh", "Rahul", "Priya", "Sunita", "Deepak", "Anil", "Karan", "Sneha", "Rohan", "Sanjay", "Aishwarya", "Kiran", "Nikhil", "Sonia", "Deepak", "Ritesh", "Sanjay"];
    
    const interval = setInterval(() => {
      const name = IndianFirstNames[Math.floor(Math.random() * IndianFirstNames.length)];
      const idStr = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      
      // Fake Bot Desynchronization Fix: Winnings adapt to real-time pool balance
      const baseMax = poolBalance < 10000 ? 3 : (poolBalance < 30000 ? 8 : 15);
      const goldWon = Math.floor(1 + Math.random() * (baseMax - 1 + 1));
      const newWinText = `👤 ${name} (ID: #${idStr}) won ${goldWon} Poki Gold`;
      
      setLiveWins((prev) => {
        const updated = [...prev, { id: String(Date.now() + Math.random()), text: newWinText }];
        if (updated.length > 5) {
          // Keep only 5 elements to prevent browser lag & memory bloat
          return updated.slice(updated.length - 5);
        }
        return updated;
      });
    }, 3500); // Every 3.5 seconds

    return () => clearInterval(interval);
  }, [poolBalance]);

  const [liveEarningsFeed, setLiveEarningsFeed] = useState<Array<{ id: string; name: string; coins: number; game: string }>>([
    { id: '1', name: 'Ramesh', coins: 250, game: 'Dino Neon Run' },
    { id: '2', name: 'Aman', coins: 18, game: 'APEX LEAP BOARD' },
    { id: '3', name: 'Suresh', coins: 40, game: 'CHRONO TACK MATCH' },
    { id: '4', name: 'Neha', coins: 15, game: 'VECTOR WING PRECISION' },
    { id: '5', name: 'Ramesh', coins: 75, game: 'Dino Neon Run' },
  ]);

  useEffect(() => {
    const IndianFirstNames = ["Ramesh", "Suresh", "Vikram", "Neha", "Arjun", "Pooja", "Aman", "Rohan", "Siddharth", "Anjali", "Ramesh Kumar", "Aman Sharma", "Ramesh", "Suresh", "Aman"];
    const GameNames = ["Dino Neon Run", "APEX LEAP BOARD", "VECTOR WING PRECISION", "STAR MINER CANNON", "CHRONO TACK MATCH", "NEON GRID BRICK", "Poki Jackpot"];
    
    const feedInterval = setInterval(() => {
      const randomName = IndianFirstNames[Math.floor(Math.random() * IndianFirstNames.length)];
      const randomGame = GameNames[Math.floor(Math.random() * GameNames.length)];
      const randomCoins = Math.floor(Math.random() * 280) + 10;
      
      const newEarning = {
        id: Math.random().toString(),
        name: randomName,
        coins: randomCoins,
        game: randomGame
      };
      
      setLiveEarningsFeed(prev => {
        const next = [newEarning, ...prev];
        if (next.length > 5) next.pop(); // Keep only last 5 items
        return next;
      });
    }, 4000);
    
    return () => clearInterval(feedInterval);
  }, []);

  useEffect(() => {
    const playersInterval = setInterval(() => {
      setOnlinePlayers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // fluctuation of -10 to +10
        const next = prev + change;
        return Math.max(40, Math.min(500, next));
      });
    }, 4500);
    return () => clearInterval(playersInterval);
  }, []);

  useEffect(() => {
    const IndianFirstNames = ["Rohan", "Sanjay", "Anjali", "Suresh", "Kirti", "Arjun", "Neha", "Divya", "Vijay", "Rohit", "Tanvi", "Pranav", "Ishita"];
    const IndianLastInitials = ["A.", "B.", "C.", "D.", "K.", "M.", "N.", "P.", "R.", "S.", "V.", "Y."];
    const GameNames = ["Crash Game", "Plinko Game", "Blackjack Game", "Roulette Game", "Space Miner", "Jackpot Wheel", "Dino Run", "Dragon Tiger", "Crash X", "Dice Duel", "Memory Match", "Brick Breaker"];
    
    const interval = setInterval(() => {
      const randomName = IndianFirstNames[Math.floor(Math.random() * IndianFirstNames.length)] + " " + IndianLastInitials[Math.floor(Math.random() * IndianLastInitials.length)];
      const randomGame = GameNames[Math.floor(Math.random() * GameNames.length)];
      const randomTokens = (Math.floor(Math.random() * 38) * 50 + 100);
      
      const newWinMessage = `🏆 ${randomName} won ${randomTokens.toLocaleString()} Tokens in ${randomGame}!`;
      
      setTickerItems(prev => {
        const updated = [...prev];
        updated.pop();
        updated.unshift(newWinMessage);
        return updated;
      });
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const gameRoomRef = React.useRef<HTMLDivElement | null>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const triggerFullpageInterstitial = () => {
    console.log("[MONETIZATION] Triggering ExoClick Fullpage Interstitial on natural break.");
    try {
      const scriptId = 'exoclick-interstitial-script';
      const ins = document.createElement('ins');
      ins.className = 'eas6a97888e33';
      ins.setAttribute('data-zoneid', '5965856');
      
      const providerScript = document.createElement('script');
      providerScript.id = scriptId;
      providerScript.async = true;
      providerScript.type = 'application/javascript';
      providerScript.src = 'https://a.pemsrv.com/ad-provider.js';
      
      const initScript = document.createElement('script');
      initScript.innerHTML = '(window.AdProvider = window.AdProvider || []).push({"serve": {}});';
      
      const container = document.createElement('div');
      container.style.display = 'none';
      container.appendChild(ins);
      container.appendChild(providerScript);
      container.appendChild(initScript);
      
      document.body.appendChild(container);
      
      setTimeout(() => {
        try {
          document.body.removeChild(container);
        } catch (e) {}
      }, 10000);
    } catch (e) {
      console.warn("[MONETIZATION] Error triggering ExoClick interstitial:", e);
    }
  };

  const handleCloseGame = () => {
    setSelectedGameId(null);
    triggerFullpageInterstitial();
  };
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const prevGameIdRef = React.useRef<string | null>(null);
  const gameLoadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (prevGameIdRef.current && !selectedGameId) {
      console.log("[MONETIZATION] Game closed, returning to lobby. Triggering ExoClick Interstitial!");
      triggerFullpageInterstitial();
    }
    prevGameIdRef.current = selectedGameId;
  }, [selectedGameId]);

  const [isGameLoading, setIsGameLoading] = useState<boolean>(false);

  React.useEffect(() => {
    if (!isGameLoading) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'EXOCLICK_AD_END') {
        console.log("[MONETIZATION] ExoClick VAST video ad finished/skipped. Transitioning to game!");
        if (gameLoadingTimeoutRef.current) {
          clearTimeout(gameLoadingTimeoutRef.current);
          gameLoadingTimeoutRef.current = null;
        }
        setIsGameLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isGameLoading]);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [isForfeited, setIsForfeited] = useState<boolean>(false);
  const [forfeitCoins, setForfeitCoins] = useState<number>(0);
  const [forfeitReason, setForfeitReason] = useState<string>('');
  const [rewardToast, setRewardToast] = useState<{ show: boolean; message: string } | null>(null);

  const showSuccessToast = (message: string) => {
    setRewardToast({ show: true, message });
    setTimeout(() => {
      setRewardToast(prev => prev && prev.message === message ? { ...prev, show: false } : prev);
    }, 2000);
  };
  const [loadingGameTitle, setLoadingGameTitle] = useState<string>('');
  const [historyModalActive, setHistoryModalActive] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [pendingWinningsBet, setPendingWinningsBet] = useState<{ amount: number; gameId: string } | null>(null);

  const getUserProfile = () => {
    if (!historyLogs || historyLogs.length === 0) {
      return { type: 'standard', spammer: false, roller: false };
    }

    const casinoInteractions = historyLogs.filter(log => 
      log.gameName === "Casino/LuckyZone" || 
      log.type === "casino_bet" ||
      (log.game && !['Dino Run', 'Vector Wing', 'Jetpack Rush'].includes(log.game))
    );

    const arcadeRuns = historyLogs.filter(log => 
      log.gameName === "Arcade" || 
      log.type === "arcade_session" ||
      log.type === "arcade_claim" ||
      (log.type === "game_play" && !log.gameName)
    ).length;

    const hasCasinoInteractions = casinoInteractions.length > 0;

    const isHighRoller = hasCasinoInteractions && casinoInteractions.some(log => {
      const wager = Math.abs(log.profitLoss || log.amount || 0);
      return wager >= 5 && wager <= 400;
    });

    const isSpammer = !hasCasinoInteractions && arcadeRuns > 5;

    return {
      type: isSpammer ? 'Profile A (Arcade Spammer)' : (isHighRoller ? 'Profile B (Casino High Roller)' : 'Profile Standard'),
      spammer: isSpammer,
      roller: isHighRoller
    };
  };
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('haptic_enabled');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => {
    if (!hapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(35);
          break;
        case 'heavy':
          navigator.vibrate(60);
          break;
        case 'success':
          navigator.vibrate([40, 30, 40]);
          break;
        case 'warning':
          navigator.vibrate([60, 50, 100]);
          break;
      }
    } catch (e) {
      console.debug('Haptics failed:', e);
    }
  };
  const [activeCategory, setActiveCategory] = useState<'arcade' | 'casino'>('arcade');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily Ad Limit tracking state (maximum 3 ads in 24 hours)
  const [adHistory, setAdHistory] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`poki_ad_history_${window.currentUserId || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track an ad view
  const trackAdView = () => {
    const now = Date.now();
    const updated = [...adHistory, now];
    setAdHistory(updated);
    try {
      localStorage.setItem(`poki_ad_history_${window.currentUserId || 'guest'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  };

  const getAdLimitStatus = () => {
    const now = currentTime;
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const activeAds = adHistory.filter(t => t > twentyFourHoursAgo).sort((a, b) => a - b);
    
    if (activeAds.length >= 3) {
      const oldestAd = activeAds[0];
      const timeLeftMs = (oldestAd + 24 * 60 * 60 * 1000) - now;
      return {
        isLocked: true,
        timeLeftMs: Math.max(0, timeLeftMs),
        activeCount: activeAds.length
      };
    }
    
    return {
      isLocked: false,
      timeLeftMs: 0,
      activeCount: activeAds.length
    };
  };

  const formatAdTimeLeft = (timeLeftMs: number) => {
    if (timeLeftMs <= 0) return '00:00:00';
    const totalSecs = Math.floor(timeLeftMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // SSO Login checking states
  const [user, setUser] = useState<{
    uid: string | null;
    displayName: string;
    email: string;
    isExternalSession: boolean;
  }>(() => {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const paramUid = urlParams.get('uid');
    const paramEmail = urlParams.get('email');
    const paramDisplayName = urlParams.get('displayName');

    if (paramUid) {
      return {
        uid: paramUid,
        displayName: paramDisplayName || 'Player',
        email: paramEmail || '',
        isExternalSession: true
      };
    }

    const savedUid = typeof localStorage !== 'undefined' ? localStorage.getItem('poki_current_user_id') : null;
    const savedEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('poki_user_email') || '' : '';
    const savedDisplayName = typeof localStorage !== 'undefined' ? localStorage.getItem('poki_user_display_name') || 'Player' : 'Player';

    if (savedUid) {
      return {
        uid: savedUid,
        displayName: savedDisplayName,
        email: savedEmail,
        isExternalSession: false
      };
    }

    return {
      uid: null,
      displayName: 'Player',
      email: '',
      isExternalSession: false
    };
  });

  const [loggedInUid, setLoggedInUid] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const paramUid = urlParams.get('uid');
    if (paramUid) {
      return paramUid;
    }
    return typeof localStorage !== 'undefined' ? localStorage.getItem('poki_current_user_id') : null;
  });

  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);
  const [adRewardConfig, setAdRewardConfig] = useState<{ min: number; max: number }>({ min: 15, max: 15 });

  const [authError, setAuthError] = useState<string | null>(null);
  const [authCountdown, setAuthCountdown] = useState<number>(5);

  // Manage countdown for auth redirect fallback
  useEffect(() => {
    if (!authError) return;
    
    const interval = setInterval(() => {
      setAuthCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Safety escape block redirect fallback
          window.location.href = MAIN_APP_URL;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [authError]);

  // Top-Up Automated Shop states
  const [topUpModalActive, setTopUpModalActive] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<{ tokens: number; price: number } | null>({ tokens: 500, price: 50 });
  const [customPriceInput, setCustomPriceInput] = useState<string>('50');
  const [utrInput, setUtrInput] = useState<string>('');
  const [topUpStatus, setTopUpStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Trade / Transfer state hooks
  const [transferModalActive, setTransferModalActive] = useState<boolean>(false);
  const [isBridging, setIsBridging] = useState<boolean>(false);
  const [transferAmountInput, setTransferAmountInput] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  const [isPreloadingAd, setIsPreloadingAd] = useState<boolean>(false);
  const [adPreloadTimer, setAdPreloadTimer] = useState<number>(2);
  const adWindowRef = React.useRef<Window | null>(null);

  // Ad-Blocker & VPN detection helper
  const detectAdBlocker = async (): Promise<boolean> => {
    // 1. Check if Monetag global script variables were successfully loaded
    const monetagFlags = (window as any).monetagLoaded;
    if (monetagFlags) {
      const loadedCount = Object.values(monetagFlags).filter(Boolean).length;
      if (loadedCount === 0) {
        console.warn("[ANTI-CHEAT] Ad-Blocker suspected. All Monetag tags blocked.");
        return true;
      }
    } else {
      console.warn("[ANTI-CHEAT] Ad-Blocker suspected. Monetag loaded tracking is missing.");
      return true;
    }

    // 2. Check standard EasyList blocked selectors by creating a dummy ad banner
    const dummy = document.createElement('div');
    dummy.className = 'adsbox ad-placement doubleclick-ad banner-ad text-ads';
    dummy.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; background-color: transparent;');
    document.body.appendChild(dummy);
    
    await new Promise(resolve => setTimeout(resolve, 80));
    
    const isBlocked = dummy.offsetHeight === 0 || window.getComputedStyle(dummy).display === 'none';
    document.body.removeChild(dummy);

    if (isBlocked) {
      console.warn("[ANTI-CHEAT] Ad-Blocker detected via hidden DOM dummy banner.");
      return true;
    }

    // 3. Try fetching a standard Google Ad script
    try {
      const testUrl = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      await fetch(testUrl, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
    } catch (err) {
      console.warn("[ANTI-CHEAT] Ad-Blocker detected via blocked network connection to ad domain.");
      return true;
    }

    return false;
  };

  // Dynamic Vignette ad trigger helper - disabled per monetization strategy (all Monetag ads removed)
  const triggerVignetteAd = () => {
    console.log("[MONETIZATION] Vignette ads disabled. Skipping ad trigger.");
  };

  // Trigger preloading when Transfer Modal opens
  useEffect(() => {
    if (transferModalActive) {
      setIsPreloadingAd(true);
      setAdPreloadTimer(2);

      const interval = setInterval(() => {
        setAdPreloadTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsPreloadingAd(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [transferModalActive]);

  // App back exit state hooks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exitOverlayActive, setExitOverlayActive] = useState<boolean>(false);
  const [fullscreenToastActive, setFullscreenToastActive] = useState<boolean>(false);

  // Elite custom professional alert modal state
  const [customAlert, setCustomAlert] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
    callback?: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showProfessionalAlert = (message: string, title?: string, type?: 'success' | 'warning' | 'error' | 'info', callback?: () => void) => {
    setCustomAlert({
      show: true,
      title: title || 'SYSTEM NOTIFICATION',
      message: message,
      type: type || 'info',
      callback: callback
    });
  };

  // Game UI Recent Winners state & logic auto-randomizer
  const [liveWinnersList, setLiveWinnersList] = useState<Array<{id: string, name: string, game: string, gold: number}>>([
    { id: '1', name: 'ARJUN S.', game: 'DINO NEON RUN', gold: 64 },
    { id: '2', name: 'NEHA K.', game: 'POKI 777 JACKPOT', gold: 120 },
    { id: '3', name: 'RAMESH P.', game: 'VECTOR WING PRECISION', gold: 38 },
    { id: '4', name: 'AMAN SHARMA', game: 'APEX LEAP BOARD', gold: 85 },
  ]);

  useEffect(() => {
    const listNames = ["ARJUN S.", "RAMESH P.", "NEHA K.", "AMAN SHARMA", "PRIYA M.", "VIKRAM G.", "SANJAY T.", "KARAN D.", "RAHUL V.", "SONIA J.", "DEEPAK B.", "SNEHA R.", "RAJESH H.", "JASPREET S.", "KIRAN W."];
    const listGames = [
      "DINO NEON RUN", "POKI 777 JACKPOT", "VECTOR WING PRECISION", "APEX LEAP BOARD", "STAR MINER CANNON", 
      "MULTIPLIER MOON CRASH", "PLINKO PHYSICS DROP", "VAULT FIELD DEFUSE", "CYBER SPIN ROULETTE", "DICE DUEL (BET 7)"
    ];

    const interval = setInterval(() => {
      const randomName = listNames[Math.floor(Math.random() * listNames.length)];
      const randomGame = listGames[Math.floor(Math.random() * listGames.length)];
      const randomGold = Math.floor(Math.random() * (250 - 15 + 1)) + 15;
      const newItem = {
        id: Date.now().toString(),
        name: randomName,
        game: randomGame,
        gold: randomGold
      };
      setLiveWinnersList(prev => [newItem, ...prev.slice(0, 3)]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // PLAY & EARN ADVANCED CONTROLLER SYSTEMS
  // ==========================================
  // Part 1: Session gold cap (randomized variable between 25-35 Poki Gold)
  const [currentSessionCap, setCurrentSessionCap] = useState<number>(() => Math.floor(Math.random() * (35 - 25 + 1)) + 25);
  const [arcadeSessionStartTime, setArcadeSessionStartTime] = useState<number | null>(null);

  // Part 2: Daily user earning ceiling (150 Poki Gold per 24 hours per account)
  const [dailyArcadeGoldClaimed, setDailyArcadeGoldClaimed] = useState<number>(0);

  // Part 2: Anti-bot cooldown (45-second timer)
  const [arcadeCooldownEndTime, setArcadeCooldownEndTime] = useState<number>(() => {
    return Number(localStorage.getItem('poki_arcade_cooldown_end_time') || '0');
  });
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState<number>(0);

  // Part 2: Global daily budget protection (5000 Poki Gold limit)
  const [globalDailyPayout, setGlobalDailyPayout] = useState<number>(0);
  const [isArcadeSystemLocked, setIsArcadeSystemLocked] = useState<boolean>(false);

  // Part 3: Device-level daily ceiling (300 Poki Gold across all accounts)
  const [deviceFingerprint] = useState<string>(() => {
    let fp = localStorage.getItem('poki_device_fingerprint');
    if (!fp) {
      fp = 'FP_' + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem('poki_device_fingerprint', fp);
    }
    return fp;
  });
  const [deviceDailyGoldClaimed, setDeviceDailyGoldClaimed] = useState<number>(0);

  // Part 3: Mandatory Ad-gate before claiming payout
  const [pendingArcadePayload, setPendingArcadePayload] = useState<any | null>(null);
  const [claimDatabaseError, setClaimDatabaseError] = useState<string | null>(null);
  const [isVerificationAdActive, setIsVerificationAdActive] = useState<boolean>(false);
  const [verificationAdCountdown, setVerificationAdCountdown] = useState<number>(0);

  // Deduplication cache for ad reward callbacks to prevent multiple triggers
  const adDeduplicationCache = React.useRef<Record<string, number>>({});

  // Cooldown timer ticker
  useEffect(() => {
    if (arcadeCooldownEndTime <= 0) {
      setCooldownTimeRemaining(0);
      setIsLockoutActive(false);
      return;
    }
    localStorage.setItem('poki_arcade_cooldown_end_time', String(arcadeCooldownEndTime));
    
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((arcadeCooldownEndTime - Date.now()) / 1000));
      setCooldownTimeRemaining(remaining);
      if (remaining <= 0) {
        setIsLockoutActive(false);
      }
    };
    
    tick(); // Run immediately
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [arcadeCooldownEndTime]);

  // Tactile Virtual keyboard controller dispatcher
  const dispatchKeyEvent = (type: 'keydown' | 'keyup', key: string, code: string) => {
    try {
      if (type === 'keydown' && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } catch (_) {}

    const keyCodeMap: Record<string, number> = {
      'Space': 32,
      'ArrowLeft': 37,
      'ArrowUp': 38,
      'ArrowRight': 39,
      'ArrowDown': 40
    };

    const cd = key === 'Space' ? 'Space' : key;
    const kc = keyCodeMap[key] || 32;

    const event = new KeyboardEvent(type, {
      key: key,
      code: cd,
      keyCode: kc,
      which: kc,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  };

  const selectedGameIdRef = React.useRef<string | null>(null);
  const lastBackClickRef = React.useRef<number>(0);
  const lastScrollPosition = React.useRef<number>(0);
  const transactionQueue = React.useRef<number[]>([]);
  const isSyncingQueue = React.useRef<boolean>(false);

  // Sync refs to avoid closures in event listeners
  useEffect(() => {
    selectedGameIdRef.current = selectedGameId;
  }, [selectedGameId]);

  useEffect(() => {
    if (selectedGameId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (lastScrollPosition.current > 0) {
        // Deferred setTimeout gives React/DOM time to restore layour containers scrollable dimensions
        setTimeout(() => {
          window.scrollTo({
            top: lastScrollPosition.current,
            behavior: 'auto'
          });
        }, 50);
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedGameId]);

  // Handle single and double back button intercepts- as well as global window.alert hook
  useEffect(() => {
    window.alert = (message: string) => {
      console.log("[LOGGER] Intercepted native alert:", message);
      let alertType: 'success' | 'warning' | 'error' | 'info' = 'info';
      let alertTitle = 'SYSTEM NOTIFICATION';
      
      const lower = message.toLowerCase();
      if (lower.includes('success') || lower.includes('received') || lower.includes('credited')) {
        alertType = 'success';
        alertTitle = 'SUCCESS';
      } else if (lower.includes('insufficient') || lower.includes('aborted') || lower.includes('limit') || lower.includes('warning') || lower.includes('bounds') || lower.includes('reach')) {
        alertType = 'warning';
        alertTitle = 'ATTENTION';
      } else if (lower.includes('fail') || lower.includes('error') || lower.includes('invalid') || lower.includes('rejected')) {
        alertType = 'error';
        alertTitle = 'ERROR';
      }
      
      showProfessionalAlert(message, alertTitle, alertType);
    };

    // Initial state push to allow pops
    window.history.pushState({ page: 'lobby' }, '');

    const handlePopState = () => {
      if (selectedGameIdRef.current) {
        // Go back to lobby state, do not exit app
        setSelectedGameId(null);
        synth.playCoin();
        window.history.pushState({ page: 'lobby' }, '');
      } else {
        // We are already on Lobby, trigger Double-Click exit protocol
        const now = Date.now();
        if (now - lastBackClickRef.current < 2000) {
          setExitOverlayActive(true);
        } else {
          lastBackRef();
          setToastMessage('Click back again to exit application.');
          window.history.pushState({ page: 'lobby' }, '');
        }
      }
    };

    const lastBackRef = () => {
      lastBackClickRef.current = Date.now();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // SSO login check on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const incomingIdToken = urlParams.get('token') || urlParams.get('auth');
    const paramUid = urlParams.get('uid');
    const paramEmail = urlParams.get('email');
    const paramDisplayName = urlParams.get('displayName');

    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname.includes('ais-dev-') || 
                             window.location.hostname.includes('ais-pre-') ||
                             window.location.hostname.includes('127.0.0.1') ||
                             window.location.hostname.includes('run.app') ||
                             window.location.hostname.includes('webcontainer');

    let resolved = false;

    // Trigger a 5-second safety connection handshake timeout before hard fallback redirection
    const authTimeout = setTimeout(() => {
      if (!resolved) {
        console.warn("[DIAGNOSTIC] Authentication 5-second timeout expired.");
        handleInvalidSession("Authentication Handshake Timeout (5s). Access restricted.");
      }
    }, 5000);

    const safeComplete = (userId: string, displayName: string, email: string, isExternal: boolean) => {
      resolved = true;
      clearTimeout(authTimeout);
      window.currentUserId = userId;
      localStorage.setItem('poki_current_user_id', userId);
      if (email) localStorage.setItem('poki_user_email', email);
      if (displayName) localStorage.setItem('poki_user_display_name', displayName);

      setUser({
        uid: userId,
        displayName: displayName || 'Player',
        email: email || '',
        isExternalSession: isExternal
      });
      setLoggedInUid(userId);
      setIsSessionChecking(false);
    };

    function handleInvalidSession(errorText?: string) {
      resolved = true;
      clearTimeout(authTimeout);
      console.warn("[DIAGNOSTIC] Authentication Session Error Handled: ", errorText);
      if (isDevEnvironment) {
        console.warn("[DIAGNOSTIC] Dev environment detected. Bypassing error redirection. Error context:", errorText);
        const devUid = localStorage.getItem('poki_current_user_id') || 'poki_guest_' + Math.random().toString(36).substring(2, 12);
        safeComplete(devUid, 'Player', '', false);
      } else {
        // Display beautiful error description box with 5s countdown instead of immediate hard redirect loop
        setAuthError(errorText || "Invalid or Expired Security Handshake token. Please login again.");
      }
    }

    if (TESTING_MODE_DISABLE_UID_VERIFICATION) {
      console.log("[TESTING MODE] Bypassing UID verification completely.");
      const activeUid = paramUid || localStorage.getItem('poki_current_user_id') || 'poki_test_user';
      const activeDisplayName = paramDisplayName || localStorage.getItem('poki_user_display_name') || 'Test Player';
      const activeEmail = paramEmail || localStorage.getItem('poki_user_email') || 'tester@gmail.com';
      safeComplete(activeUid, activeDisplayName, activeEmail, !!paramUid);

      const adRewardRef = database.ref('reward_settings/gaming_ad');
      const handleAdConfigVal = (snap: firebase.database.DataSnapshot) => {
        const val = snap.val();
        if (val) {
          setAdRewardConfig({
            min: val.min !== undefined ? Number(val.min) : 15,
            max: val.max !== undefined ? Number(val.max) : 15
          });
        } else {
          adRewardRef.set({ min: 15, max: 15 }).catch(() => {});
        }
      };
      adRewardRef.on('value', handleAdConfigVal);

      return () => {
        adRewardRef.off('value', handleAdConfigVal);
        clearTimeout(authTimeout);
      };
    }

    // Dynamic Live Ad Reward Settings setup
    const adRewardRef = database.ref('reward_settings/gaming_ad');
    const handleAdConfigVal = (snap: firebase.database.DataSnapshot) => {
      const val = snap.val();
      if (val) {
        setAdRewardConfig({
          min: val.min !== undefined ? Number(val.min) : 15,
          max: val.max !== undefined ? Number(val.max) : 15
        });
      } else {
        // Seed standard EXACTLY 15 Poki Gold multiplier configuration
        adRewardRef.set({ min: 15, max: 15 }).catch(() => {});
      }
    };
    adRewardRef.on('value', handleAdConfigVal);

    const validateAgainstMainDatabase = (targetUid: string, dName: string, emailStr: string, isExt: boolean) => {
      databaseMain.ref('users/' + targetUid).once('value')
        .then((snap) => {
          if (snap.exists()) {
            console.log("[CENTRAL VERIFICATION] User is registered and exists on Main Database:", targetUid);
            safeComplete(
              targetUid,
              dName || snap.child('displayName').val() || 'Player',
              emailStr || snap.child('email').val() || '',
              isExt
            );
          } else {
            console.error("[CENTRAL VERIFICATION] User does not exist on Main Database:", targetUid);
            handleInvalidSession("Unauthorized Access. Please login via the main website to play.");
          }
        })
        .catch((error) => {
          console.error("[CENTRAL VERIFICATION] Failed to contact Main Database:", error);
          if (isDevEnvironment) {
            console.warn("[CENTRAL VERIFICATION] Dev Bypass active. Allowing session without main DB check.");
            safeComplete(targetUid, dName || 'Player', emailStr || '', isExt);
          } else {
            handleInvalidSession("Unauthorized Access. Please login via the main website to play.");
          }
        });
    };

    // Subscribe to auth state changes to detect active persistent Firebase sessions
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // If we have an incoming external session, let the param loading route completely override/bypass
      if (paramUid) {
        return;
      }

      if (firebaseUser) {
        // Safe authenticated user found - strictly verify against Database A (databaseMain)
        validateAgainstMainDatabase(firebaseUser.uid, firebaseUser.displayName || 'Player', firebaseUser.email || '', false);
      } else {
        // No valid active session detected; check if we have a saved UID from a previous valid session
        const savedUid = localStorage.getItem('poki_current_user_id');
        if (savedUid) {
          const savedEmail = localStorage.getItem('poki_user_email') || '';
          const savedDisplayName = localStorage.getItem('poki_user_display_name') || 'Player';
          console.log("[DIAGNOSTIC] Stored user ID found in session. Double checking against Central Database.");
          validateAgainstMainDatabase(savedUid, savedDisplayName, savedEmail, false);
        } else {
          // No parameters, no persistent session, no saved session. Completely block!
          console.warn("[DIAGNOSTIC] No secure session parameter or valid token provided. Terminating access.");
          handleInvalidSession("Unauthorized Access. Please login via the main website to play.");
        }
      }
    });

    if (paramUid) {
      console.log("[DIAGNOSTIC] App parameters matched with UID. Performing strict Central Main Database verification.");
      validateAgainstMainDatabase(paramUid, paramDisplayName || 'Player', paramEmail || '', true);

      // Clean up the URL search bar after a successful handshake utilizing window.history.replaceState
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (incomingIdToken && !paramUid) {
      // Missing uid with incoming token
      handleInvalidSession("Security Verification Failed: Token specified without a corresponding user identifier. Access restricted.");
    }

    return () => {
      unsubscribe();
      adRewardRef.off('value', handleAdConfigVal);
      clearTimeout(authTimeout);
    };
  }, []);

  // Real-time synchronization of the dual-token ecosystem (gaming_portal) - STRICTLY ENFORCING ONLY TWO COIN FIELDS (Specification 2 & 3)
  useEffect(() => {
    if (!loggedInUid) return;

    const portalRef = database.ref('gaming_portal/' + loggedInUid);

    // AUTOMATIC ISOLATED FOLDER INITIALIZATION (GAMING PORTAL)
    portalRef.once('value').then((snap) => {
      if (!snap.exists()) {
        console.log("[DIAGNOSTIC] Initialized brand new gaming_portal at gaming_portal/" + loggedInUid);
        portalRef.set({
          pokiGamingGold: 100,
          pokiGoldWinning: 0
        }).catch(err => console.warn("Error bootstrapping isolated path:", err));
      } else {
        const val = snap.val();
        const updates: any = {};
        if (val.pokiGamingGold === undefined) updates.pokiGamingGold = 100;
        if (val.pokiGoldWinning === undefined) updates.pokiGoldWinning = 0;
        
        // Settle / deprecate and delete all alternative, legacy or redundant paths under gaming_portal
        const dirtyKeys = ['pokiBalance', 'pokiGameGold', 'unplayedTokens', 'winningTokens', 'tokens', 'pokiGold', 'gameTokens', 'balance'];
        dirtyKeys.forEach(k => {
          if (val[k] !== undefined) {
            updates[k] = null;
          }
        });

        if (Object.keys(updates).length > 0) {
          portalRef.update(updates).catch(() => {});
        }
      }
    });

    const unplayedPathRef = ref(gamingDB, `gaming_portal/${loggedInUid}/pokiGamingGold`);
    const winPathRef = ref(gamingDB, `gaming_portal/${loggedInUid}/pokiGoldWinning`);
    const mainGoldBalanceRef = ref(mainDB, `users/${loggedInUid}/pokiGoldBalance`);

    const unsubUnplayed = onValue(unplayedPathRef, (snapshot) => {
      const val = snapshot.val();
      const playCoins = val !== null && val !== undefined ? Number(val) : 100;
      console.log(`[REAL-TIME PORTAL SYNC] Play Coins Updated: ${playCoins}`);
      setPokiGamingGold(playCoins);
      localStorage.setItem('poki_gaming_gold', String(playCoins));
      
      const cachedWinning = parseFloat(localStorage.getItem('poki_gold_winning') || '0');
      localStorage.setItem('poki_dashboard_balance', String(parseFloat((playCoins + cachedWinning).toFixed(5))));
    });

    // Real-time synchronization: Propagate local gaming winning updates directly to Main Website's pokiGoldBalance
    const unsubWin = onValue(winPathRef, (snapshot) => {
      const val = snapshot.val();
      const winningCoins = val !== null && val !== undefined ? Number(val) : 0;
      console.log(`[REAL-TIME PORTAL SYNC] Winning Coins Updated: ${winningCoins}`);
      setPokiGoldWinning(winningCoins);
      localStorage.setItem('poki_gold_winning', String(winningCoins));

      const cachedGaming = parseFloat(localStorage.getItem('poki_gaming_gold') || '100');
      localStorage.setItem('poki_dashboard_balance', String(parseFloat((cachedGaming + winningCoins).toFixed(5))));

      get(ref(mainDB, `users/${loggedInUid}/pokiGoldBalance`)).then((mainSnap) => {
        const currentMainVal = mainSnap.exists() ? Number(mainSnap.val()) : null;
        if (currentMainVal === null || parseFloat(currentMainVal.toFixed(4)) !== parseFloat(winningCoins.toFixed(4))) {
          console.log(`[SYNC TO MAIN] Propagating Gaming Winnings (${winningCoins}) -> Main Website pokiGoldBalance`);
          set(ref(mainDB, `users/${loggedInUid}/pokiGoldBalance`), winningCoins)
            .catch(err => console.error("Error syncing to main website gold balance:", err));
        }
      }).catch(err => console.warn("Error reading main gold balance during sync:", err));
    });

    // Real-time synchronization: Propagate Main Website's pokiGoldBalance updates directly to Gaming Portal's pokiGoldWinning
    const unsubMainGold = onValue(mainGoldBalanceRef, (snapshot) => {
      const val = snapshot.val();
      const mainGold = val !== null && val !== undefined ? Number(val) : 0;
      console.log(`[REAL-TIME MAIN GOLD SYNC] Main Website pokiGoldBalance Updated: ${mainGold}`);

      get(ref(gamingDB, `gaming_portal/${loggedInUid}/pokiGoldWinning`)).then((gamingSnap) => {
        const currentGamingVal = gamingSnap.exists() ? Number(gamingSnap.val()) : 0;
        if (parseFloat(currentGamingVal.toFixed(4)) !== parseFloat(mainGold.toFixed(4))) {
          console.log(`[SYNC TO GAMING] Propagating Main pokiGoldBalance (${mainGold}) -> Gaming pokiGoldWinning`);
          update(ref(gamingDB, `gaming_portal/${loggedInUid}`), {
            pokiGoldWinning: mainGold
          }).catch(err => console.error("Error syncing to gaming winning balance:", err));
        }
      }).catch(err => console.warn("Error reading gaming winnings during sync:", err));
    });

    // Live state bindings for Play & Earn risk limits: Global cap, Per-user cap, Per-device cap
    const todayStr = new Date().toISOString().split('T')[0];
    const globalPayoutRef = database.ref(`system/daily_arcade_payout/${todayStr}`);
    const userDailyRef = database.ref(`gaming_portal/${loggedInUid}/daily_arcade_gold/${todayStr}`);
    const deviceDailyRef = database.ref(`devices/${deviceFingerprint}/daily_arcade_gold/${todayStr}`);

    const handleGlobalPayout = (snap: firebase.database.DataSnapshot) => {
      const pVal = snap.val();
      const currentPayout = pVal !== null && pVal !== undefined ? Number(pVal) : 0;
      setGlobalDailyPayout(currentPayout);
      setIsArcadeSystemLocked(currentPayout >= 5000);
    };
    globalPayoutRef.on('value', handleGlobalPayout, (err) => {
      console.warn("[SECURITY] Gracefully absorbed globalPayoutRef read permission issue (Expected due to database rules):", err.message);
    });

    const handleUserDaily = (snap: firebase.database.DataSnapshot) => {
      const uVal = snap.val();
      setDailyArcadeGoldClaimed(uVal !== null && uVal !== undefined ? Number(uVal) : 0);
    };
    userDailyRef.on('value', handleUserDaily, (err) => {
      console.warn("[SECURITY] Gracefully absorbed userDailyRef read permission issue:", err.message);
    });

    const handleDeviceDaily = (snap: firebase.database.DataSnapshot) => {
      const dVal = snap.val();
      setDeviceDailyGoldClaimed(dVal !== null && dVal !== undefined ? Number(dVal) : 0);
    };
    deviceDailyRef.on('value', handleDeviceDaily, (err) => {
      console.warn("[SECURITY] Gracefully absorbed deviceDailyRef read permission issue (Expected due to database rules):", err.message);
    });

    // Online/Offline listener for connection disconnect protection
    const connectedRef = database.ref('.info/connected');
    const handleConnection = (snap: firebase.database.DataSnapshot) => {
      const isOnline = snap.val() === true;
      console.log(`[CONNECTION STATUS] System connection sync status changed: ${isOnline ? "ONLINE" : "OFFLINE"}`);
      if (isOnline) {
        // Securely flush queued transactions to the Firebase server immediately on reconnect
        processTransactionQueue();
      }
    };
    connectedRef.on('value', handleConnection);

    // Real-time Pool Balance subscription & seeding (Fake Bot Desynchronization Fix)
    const poolRef = database.ref('system/pool_balance');
    const handlePoolBalance = (snap: firebase.database.DataSnapshot) => {
      const pVal = snap.val();
      if (pVal !== null && pVal !== undefined) {
        setPoolBalance(Number(pVal));
      } else {
        poolRef.set(50000).catch(() => {});
      }
    };
    poolRef.on('value', handlePoolBalance);

    // Single Active Session Lock (Multi-Tab Session Synchronization)
    const sessionToken = Math.random().toString(36).substring(2, 15);
    const activeSessionRef = database.ref(`gaming_portal/${loggedInUid}/active_session_token`);
    activeSessionRef.set(sessionToken).catch(() => {});

    const handleActiveSessionChange = (snap: firebase.database.DataSnapshot) => {
      const dbToken = snap.val();
      if (dbToken && dbToken !== sessionToken) {
        console.warn("[SECURITY] Multi-tab active session conflict detected! Locking session.");
        setIsMultiTabLocked(true);
      }
    };
    activeSessionRef.on('value', handleActiveSessionChange);

    return () => {
      connectedRef.off('value', handleConnection);
      globalPayoutRef.off('value', handleGlobalPayout);
      userDailyRef.off('value', handleUserDaily);
      deviceDailyRef.off('value', handleDeviceDaily);
      poolRef.off('value', handlePoolBalance);
      activeSessionRef.off('value', handleActiveSessionChange);
      unsubUnplayed();
      unsubWin();
      unsubMainGold();
    };
  }, [loggedInUid, deviceFingerprint]);

  // Sync balances to Local Storage on update
  useEffect(() => {
    if (pokiBalance > 0) {
      localStorage.setItem('poki_dashboard_balance', String(pokiBalance));
    }
  }, [pokiBalance]);

  // Synchronize gameplay history logs from Realtime Database in real-time
  useEffect(() => {
    if (!loggedInUid) return;

    const histRef = database.ref(`gaming_portal/${loggedInUid}/history`);
    const handleHist = (snapshot: firebase.database.DataSnapshot) => {
      const val = snapshot.val();
      if (snapshot.exists() && val !== null && val !== undefined) {
        try {
          const currentTime = Date.now();
          const list: any[] = [];
          
          Object.entries(val).forEach(([id, item]: [string, any]) => {
            const timestamp = item.timestamp || currentTime;
            // Purge logs older than 48 hours (172800000 milliseconds)
            if (currentTime - timestamp > 172800000) {
              console.log(`[PURGE] Stale gameplay history ledger entry detected: ${id}. Executing atomic delete.`);
              histRef.child(id).remove().catch(() => {});
            } else {
              list.push({
                id,
                ...item,
                timestamp
              });
            }
          });
          
          list.sort((a: any, b: any) => b.timestamp - a.timestamp);
          setHistoryLogs(list);
        } catch (err) {
          console.warn("Parsing logs warning:", err);
        }
      } else {
        setHistoryLogs([]);
      }
    };

    histRef.on('value', handleHist);
    return () => {
      histRef.off('value', handleHist);
    };
  }, [loggedInUid]);

  // Sync mute state on start
  useEffect(() => {
    setIsMuted(synth.getMuteState());
  }, []);

  // Dismiss toast of back button
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleMuteToggle = () => {
    const muted = synth.toggleMute();
    setIsMuted(muted);
  };

  // Master balance atomic transaction sync engine (Specification 3)
  const processTransactionQueue = async () => {
    const userId = window.currentUserId || loggedInUid;
    if (!userId || isSyncingQueue.current || transactionQueue.current.length === 0) return;
    
    isSyncingQueue.current = true;
    const amountToSync = transactionQueue.current[0]; // peek

    const portalRef = database.ref(`gaming_portal/${userId}`);
    
    try {
      // Execute Atomic transaction on the synchronized winnings path
      await portalRef.transaction((current) => {
        if (!current) {
          return {
            pokiGamingGold: 100,
            pokiGoldWinning: amountToSync
          };
        }
        const base = current.pokiGoldWinning !== null && current.pokiGoldWinning !== undefined ? Number(current.pokiGoldWinning) : 0;
        current.pokiGoldWinning = parseFloat((base + amountToSync).toFixed(5));
        
        // Clean up/delete redundant structures if found (Schema Sanitization)
        const dirtyKeys = ['pokiBalance', 'pokiGameGold', 'unplayedTokens', 'winningTokens', 'tokens', 'pokiGold', 'gameTokens', 'balance'];
        dirtyKeys.forEach(k => {
          if (current[k] !== undefined) delete current[k];
        });
        
        return current;
      });

      console.log(`[ATOMIC SYSTEM] Successfully committed balance runTransaction increment: +${amountToSync}`);
      
      // Shift out of queue after success
      transactionQueue.current.shift();
    } catch (err) {
      console.error("[ATOMIC SYSTEM] Transaction rejected, keeping in queue for offline retry:", err);
    } finally {
      isSyncingQueue.current = false;
      // Process next transaction after a tiny cooldown
      if (transactionQueue.current.length > 0) {
        setTimeout(processTransactionQueue, 150);
      }
    }
  };

  const syncBalanceWithTransaction = (amount: number) => {
    const formattedAmount = parseFloat(amount.toFixed(5));
    if (formattedAmount === 0) return;

    // Apply Maximum Profit Ceiling: Strictly cap maximum profit at 2500 Poki Gold per transaction/round
    let finalAmount = formattedAmount;
    if (finalAmount > 2500) {
      console.warn(`[SECURITY CEILING] Game win multiplier is capped. Restricting transaction payload to 2500 Poki Gold maximum limit.`);
      finalAmount = 2500;
    }

    // Update local React state instantly for absolute zero lag tactile feedback
    setPokiGoldWinning((prev) => {
      const next = parseFloat((prev + finalAmount).toFixed(5));
      localStorage.setItem('poki_gold_winning', String(next));
      return next;
    });

    // Queue the formatted amount
    transactionQueue.current.push(finalAmount);
    processTransactionQueue();
  };

  // Direct balance awarding mechanism synced server-side to winningTokens node (WinZO Model)
  const awardBalance = (amount: number) => {
    syncBalanceWithTransaction(amount);
  };

  // Deduct balance for casino/arcade play strictly from Play Currency: Poki Game Gold / PKGG
  const sendCredits = (amount: number, setBetAmountInChild?: (val: number) => void) => {
    if (!window.currentUserId) return false;

    const gameId = selectedGameId || 'casino';
    const isCasinoGame = menuGames.find(g => g.id === gameId)?.category === 'casino' || 
                         ['blackjack', 'hilo', 'roulette', 'coinflip', 'plinko', 'baccarat', 'dice_duel', 'mini_roulette', 'wheel_hype'].includes(gameId);

    // Enforce security checks for Lucky Zone/Casino games
    if (isCasinoGame) {
      const now = Date.now();
      
      // 1. High-Frequency Spam Attack Fix
      if (now - lastBetTimestamp < LUCKY_ZONE_SECURITY_RULES.COOLDOWN_BET_INTERVAL_MS) {
        const currentViolations = spamViolationCount + 1;
        setSpamViolationCount(currentViolations);
        
        if (currentViolations >= LUCKY_ZONE_SECURITY_RULES.MAX_CONSECUTIVE_SPAM_VIOLATIONS) {
          setIsLockoutActive(true);
          setLockoutMessage("Anti-Script Alert: Your session has been locked due to detected high-frequency script/bot automated inputs. Please reset or contact support.");
          return false;
        }

        synth.playCrash();
        setCustomAlert({
          show: true,
          title: "Rate Limit Active",
          message: `Please wait at least 1.5 seconds between casino actions. Violation count: ${currentViolations}/${LUCKY_ZONE_SECURITY_RULES.MAX_CONSECUTIVE_SPAM_VIOLATIONS}`,
          type: "warning"
        });
        return false;
      }
      
      if (now - lastBetTimestamp > 5000) {
        setSpamViolationCount(0); // Decay violations
      }
      setLastBetTimestamp(now);

      // 2. Martingale Scaling Wall Fix (consecutive double-ups capped at 4)
      const previousBet = lastBetDetails[gameId] || { betAmount: 0, doubleUpCount: 0 };
      let newDoubleUpCount = 0;

      if (previousBet.betAmount > 0 && Math.abs(amount - previousBet.betAmount * 2) < 0.1) {
        newDoubleUpCount = previousBet.doubleUpCount + 1;
      }

      if (newDoubleUpCount > LUCKY_ZONE_SECURITY_RULES.MARTINGALE_DOUBLE_LIMIT) {
        synth.playCrash();
        setCustomAlert({
          show: true,
          title: "Martingale Wall Active",
          message: "Aborted: Martingale scaling protection limit reached (Capped at 4 consecutive double-up bets). Please reset to your base bet.",
          type: "warning"
        });
        return false;
      }

      setLastBetDetails(prev => ({
        ...prev,
        [gameId]: { betAmount: amount, doubleUpCount: newDoubleUpCount }
      }));
    }

    // Minimum and Maximum Bet constraints: 70 - 3000 Poki Gold per bet across all Lucky Zone / casino modules.
    // Vault Field Defuse (minesweeper) and Plinko Physics Drop have a special minimum of 50 Poki Gold per request.
    if (isCasinoGame) {
      const minLimit = (gameId === 'minesweeper' || gameId === 'plinko_drop') ? 50 : 70;
      if (amount < minLimit) {
        console.warn(`[BET REJECTED] Bet of ${amount} Poki Gold is under strict minimum limit of ${minLimit} Poki Gold.`);
        
        // Auto reset/clamp the field value to minLimit (HARD INTERCEPTION LAYER)
        if (setBetAmountInChild) {
          try {
            setBetAmountInChild(minLimit);
          } catch (err) {
            console.warn("Failed to clamp bet amount in child:", err);
          }
        }

        synth.playCrash();

        setCustomAlert({
          show: true,
          title: "Minimum Bet Limit",
          message: `Minimum amount ${minLimit} Poki Gold hai / Minimum bet is ${minLimit} Poki Gold`,
          type: "warning"
        });
        return false;
      }
      if (amount > 3000) {
        console.warn(`[BET REJECTED] Bet of ${amount} Poki Gold is over strict maximum limit of 3000 Poki Gold.`);
        
        // Auto reset/clamp the field value to 70
        if (setBetAmountInChild) {
          try {
            setBetAmountInChild(70);
          } catch (err) {
            console.warn("Failed to clamp bet amount in child:", err);
          }
        }

        synth.playCrash();

        setCustomAlert({
          show: true,
          title: "Maximum Bet Limit",
          message: "Aborted: Maximum bet is 3000 Poki Gold (PKGG) across all casino game rooms. Your bet has been reset to 70 PKGG.",
          type: "warning"
        });
        return false;
      }
    } else {
      // Non-casino standard minimum
      if (amount < 10) {
        console.warn(`[BET REJECTED] Bet of ${amount} Poki Gold is under strict minimum limit of 10 Poki Gold.`);
        setCustomAlert({
          show: true,
          title: "Bet Under Limit",
          message: "Aborted: The minimum bet is 10 Poki Gold (₹0.20) across all game rooms.",
          type: "warning"
        });
        return false;
      }
    }

    // Smart Hybrid Wallet Engine: Double-check total combined balance (Specification Track 5)
    const totalCombinedBalance = parseFloat((pokiGamingGold + pokiGoldWinning).toFixed(5));
    if (totalCombinedBalance < amount) {
      synth.playCrash();
      setCustomAlert({
        show: true,
        title: "Insufficient Balance!",
        message: `Your total combined balance (${totalCombinedBalance.toFixed(1)} Poki Gold) is insufficient for this entry fee of ${amount.toFixed(1)} Poki Gold. Please watch an ad or top-up!`,
        type: "error"
      });
      return false;
    }

    // Inline Winnings Conversion Popup Loop: Removed/Bypassed to allow silent automatic conversion of bets
    // No popup or flow disruption is triggered. Remaining amount is deducted seamlessly below.

    let deductFromPlay = 0;
    let deductFromWinnings = 0;

    if (pokiGamingGold >= amount) {
      deductFromPlay = amount;
    } else {
      deductFromPlay = pokiGamingGold;
      deductFromWinnings = amount - pokiGamingGold;
    }

    let success = false;
    const newUnplayed = parseFloat((pokiGamingGold - deductFromPlay).toFixed(5));
    const newWinnings = parseFloat((pokiGoldWinning - deductFromWinnings).toFixed(5));
    
    setPokiGamingGold(newUnplayed);
    localStorage.setItem('poki_gaming_gold', String(newUnplayed));

    setPokiGoldWinning(newWinnings);
    localStorage.setItem('poki_gold_winning', String(newWinnings));

    localStorage.setItem('poki_dashboard_balance', String(parseFloat((newUnplayed + newWinnings).toFixed(5))));
    
    success = true;
    
    // Deduct entry fee seamlessly using atomic transactions
    if (deductFromPlay > 0) {
      const portalGoldRef = database.ref(`gaming_portal/${window.currentUserId}/pokiGamingGold`);
      portalGoldRef.transaction((current) => {
        const balance = current !== null && current !== undefined ? Number(current) : 0;
        return parseFloat((Math.max(0, balance - deductFromPlay)).toFixed(5));
      }).catch(err => {
        console.warn("[DIAGNOSTIC] Offline/Permission failure during transaction deduction:", err);
      });
    }

    if (deductFromWinnings > 0) {
      const winningsRef = database.ref(`gaming_portal/${window.currentUserId}/pokiGoldWinning`);
      winningsRef.transaction((current) => {
        const balance = current !== null && current !== undefined ? Number(current) : 0;
        return parseFloat((Math.max(0, balance - deductFromWinnings)).toFixed(5));
      }).catch(err => {
        console.warn("[DIAGNOSTIC] Offline/Permission failure during winnings deduction:", err);
      });
    }

    // Check for Bankruptcy Recovery Lifeline if balance is fully depleted to 0
    setTimeout(() => {
      const uId = window.currentUserId || 'anonymous';
      const finalBal = parseFloat((newUnplayed + newWinnings).toFixed(5));
      if (finalBal <= 2) {
        import('./utils/casinoRigging').then(({ evaluateBankruptcyReward }) => {
          const evalReward = evaluateBankruptcyReward(uId, finalBal);
          if (evalReward.trigger) {
            // Award 50 PKG (₹1 INR) instantly
            const bonus = evalReward.rewardAmount;
            const updatedPlay = parseFloat((pokiGamingGold + bonus).toFixed(5));
            setPokiGamingGold(updatedPlay);
            localStorage.setItem('poki_gaming_gold', String(updatedPlay));
            localStorage.setItem('poki_dashboard_balance', String(parseFloat((updatedPlay + pokiGoldWinning).toFixed(5))));
            
            database.ref(`gaming_portal/${uId}/pokiGamingGold`).transaction((current) => {
              const base = current !== null && current !== undefined ? Number(current) : 0;
              return parseFloat((base + bonus).toFixed(5));
            });

            // Log bonus history entry
            const historyRef = database.ref(`gaming_portal/${uId}/history`).push();
            historyRef.set({
              type: "Retention_Bonus",
              gameName: "Casino_Recovery",
              score: bonus,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              status: "VERIFIED"
            });

            setCustomAlert({
              show: true,
              title: "Bankruptcy Recovery Bonus! 🎉",
              message: `You ran out of coins! We have credited ₹1.00 INR (50 PKG) to your balance as a loyalty bonus. Keep playing and win!`,
              type: "success"
            });
          }
        });
      }
    }, 1500);

    return success;
  };

  // Safe game session data synchronizer writes ledger logs to Realtime Database
  const syncCasinoData = async (gameName: string, netProfitLoss: number, finalCoins: number) => {
    if (!window.currentUserId) return;

    // Increment casino games count for Ad Throttling (Show a non-intrusive Vignette ad only after playing 10 to 12 games)
    setCasinoGamesPlayedCount(prev => {
      const next = prev + 1;
      // Get or initialize a dynamic target between 10 and 12 games to throttle ad frequency
      let target = parseInt(localStorage.getItem('poki_lucky_zone_target') || '0', 10);
      if (target < 10 || target > 12) {
        target = Math.floor(Math.random() * (12 - 10 + 1)) + 10; // Random target between 10 and 12
        localStorage.setItem('poki_lucky_zone_target', String(target));
      }

      if (next >= target) {
        console.log(`[LUCKY ZONE ADS] Non-intrusive transition threshold reached (${target} games). Triggering Vignette ad.`);
        setTimeout(() => {
          triggerVignetteAd();
        }, 1200);
        // Reset dynamic target for next iteration
        const nextTarget = Math.floor(Math.random() * (12 - 10 + 1)) + 10;
        localStorage.setItem('poki_lucky_zone_target', String(nextTarget));
        return 0; // Reset
      }
      return next;
    });

    try {
      const historyRef = database.ref(`gaming_portal/${window.currentUserId}/history`).push();
      const winningAmount = netProfitLoss > 0 ? netProfitLoss : 0;
      
      // Complete transaction report matching schema perfectly (Specification BUG 3, Rule 3)
      await historyRef.set({
        gameName: "Casino/LuckyZone",
        score: winningAmount,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        serverTimestamp: firebase.database.ServerValue.TIMESTAMP,
        type: 'game_play',
        game: gameName,
        profitLoss: netProfitLoss,
        coins: finalCoins,
        status: 'VERIFIED'
      });
    } catch (e) {
      console.warn("Background history sync timed out:", e);
    }
  };

  const confirmWinningsFallback = () => {
    if (!pendingWinningsBet) return;
    const { amount } = pendingWinningsBet;
    const needed = amount - pokiGamingGold;
    if (pokiGoldWinning >= needed) {
      const newWinnings = parseFloat((pokiGoldWinning - needed).toFixed(5));
      const newPlay = parseFloat((pokiGamingGold + needed).toFixed(5));
      
      setPokiGoldWinning(newWinnings);
      localStorage.setItem('poki_gold_winning', String(newWinnings));
      
      setPokiGamingGold(newPlay);
      localStorage.setItem('poki_gaming_gold', String(newPlay));
      
      localStorage.setItem('poki_dashboard_balance', String(parseFloat((newPlay + newWinnings).toFixed(5))));
      
      if (window.currentUserId) {
        database.ref(`gaming_portal/${window.currentUserId}/pokiGoldWinning`).set(newWinnings);
        database.ref(`gaming_portal/${window.currentUserId}/pokiGamingGold`).set(newPlay);
        
        const historyRef = database.ref(`gaming_portal/${window.currentUserId}/history`).push();
        historyRef.set({
          type: "Winnings_Conversion",
          amount: needed,
          status: "Success",
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      }
      
      const hasAssociatedGame = !!pendingWinningsBet.gameId;

      setCustomAlert({
        show: true,
        title: "Balance Converted!",
        message: hasAssociatedGame
          ? `Successfully converted ${needed.toFixed(1)} PKG from your Winnings. Launching game...`
          : `Successfully converted ${needed.toFixed(1)} PKG from your Winnings to Play Money. Please click the Bet button again to place your bet!`,
        type: "success"
      });

      if (hasAssociatedGame) {
        setTimeout(() => {
          proceedToLoading(pendingWinningsBet.gameId);
        }, 1200);
      }
    } else {
      setCustomAlert({
        show: true,
        title: "Insufficient Winnings",
        message: "You do not have enough Convertible Winnings to cover the difference of this bet.",
        type: "error"
      });
    }
    setPendingWinningsBet(null);
  };

  // Dedicated Full-Screen High-CPM post-game Video Ad Player
  const triggerPostGameFullscreenAd = (onAdComplete?: () => void) => {
    setShowFullscreenPostGameAd(true);
    setFullscreenAdCountdown(6);
    
    const premiumAdTaglines = [
      "🔥 WinZO Superleague: Play and Earn ₹1000 INR Daily!",
      "💰 RummyCircle Elite Series: Get 200% Bonus Instant Credit!",
      "⚡ SportsBaazi Premier Cup: Join Mega Contest starting now!",
      "🏆 PokiCoin Retro Jackpot: Instant Withdrawals enabled!",
      "🚀 Dream11 Powerplay Zone: Build your ultimate team!"
    ];
    setCurrentAdSubtext(premiumAdTaglines[Math.floor(Math.random() * premiumAdTaglines.length)]);
    synth.playCoin();

    const interval = setInterval(() => {
      setFullscreenAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowFullscreenPostGameAd(false);
          synth.playLevelUp();
          if (onAdComplete) onAdComplete();
          return 0;
        }
        synth.playClick();
        return prev - 1;
      });
    }, 1000);
  };

  // Arcade game session completion standard with Ad Accumulation Integration
  const handleArcadeSessionComplete = (session: any) => {
    // Trigger ExoClick Fullpage Interstitial on game over natural break
    triggerFullpageInterstitial();
    synth.playLevelUp();
    const rawCoinsCollected = session.coinsCollected || 0;
    
    // Calculate precise session duration
    const endTimestamp = Date.now();
    const sessionDurationSec = arcadeSessionStartTime ? (endTimestamp - arcadeSessionStartTime) / 1000 : 0;
    const sessionDuration = sessionDurationSec;

    // Evaluate the exact raw score variable generated locally by the game canvas (finalCanvasScore)
    const finalCanvasScore = session.coinsCollected !== undefined ? session.coinsCollected : 0;

    // Enforce 1:1 genuine gameplay score dispatching without overrides
    const safeWinnings = Math.round(finalCanvasScore);

    // Evaluate profile-based dynamic adjustments (User Trajectory Auditor) strictly on ad delivery volumes only
    const userProfile = getUserProfile();
    let adAccumulationThreshold = 20;
    let coinsEarnedAccumulatorThreshold = 12;

    if (userProfile.spammer) {
      // High volume/spamming behavior gets high-frequency ads to maintain revenue parity without touching authentic scores
      adAccumulationThreshold = 8;
      coinsEarnedAccumulatorThreshold = 5;
      console.log(`[AUDITOR] Spammer Profile detected: Adjusted ad loops (Threshold: 8, Startup: 5) to protect economy while maintaining score 1:1.`);
    } else if (userProfile.roller) {
      // High rollers generate enough organic fee/revenue, relax ad trigger loops
      adAccumulationThreshold = 35;
      coinsEarnedAccumulatorThreshold = 24;
      console.log(`[AUDITOR] Casino High Roller Profile detected: Adjusted ad loops (Threshold: 35, Startup: 24) to reward premium activity.`);
    }

    // 1. CLIENT-SIDE CONSOLE INJECTION BLOCK & SPEED-HACK ENGINE (Part 2 Item 3, Part 3 Item 2)
    // Validate progression logic: Coins shouldn't grow faster than 1 coin per 1.1 seconds physically on canvas.
    const maxTheoreticalLimit = sessionDurationSec > 0 ? Math.ceil(sessionDurationSec / 1.1) + 2 : 1;
    const isUnderSpeedHackLimit = rawCoinsCollected >= 25 && sessionDurationSec < 40;
    const isPaceFraud = rawCoinsCollected > 6 && rawCoinsCollected > maxTheoreticalLimit;
    
    if (isUnderSpeedHackLimit || isPaceFraud) {
      console.warn(`[DIAGNOSTIC] [ANTI-FRAUD VIOLATION DETECTED] Duration: ${sessionDurationSec.toFixed(2)}s, Score: ${rawCoinsCollected}, Theoretical Max: ${maxTheoreticalLimit}`);
      
      // Symmetrically write a minor security warning flag to Firebase under gaming_portal/$uid
      const uId = window.currentUserId || loggedInUid;
      if (uId) {
        database.ref(`gaming_portal/${uId}/securityWarnings/speed_hazard`).update({
          count: firebase.database.ServerValue.increment(1),
          lastTriggeredAt: firebase.database.ServerValue.TIMESTAMP,
          hazardDetails: `Submission of ${rawCoinsCollected} Gold inside ${sessionDurationSec.toFixed(2)}s rejected.`
        }).catch(() => {});
      }
      
      setCustomAlert({
        show: true,
        title: "Anti-Speed Hack Active",
        message: `Security validation failed. Gameplay duration (${sessionDurationSec.toFixed(1)}s) does not align with progression metrics. Score rejected and logs updated.`,
        type: "error"
      });
      
      // Apply mandatory 2-second lock to slow down script bots
      const cooldownEnd = Date.now() + 2000;
      setArcadeCooldownEndTime(cooldownEnd);
      
      setSelectedGameId(null);
      return;
    }

    // 2. ENFORCE ABSOLUTE 1:1 WINNING COIN RATIO (Specification 2) & GAME OVER STATE RE-ENTRY
    // 1 collected coin = exactly 1 Poki Gold winning currency.
    // Enforce strict 1:1 coin execution: increment gaming_portal/${uid}/pokiGoldWinning by precisely the exact coins collected in-game (subject to strict Play & Earn economy limits)
    const payout = safeWinnings;
    
    // 3. SET SECURE DUAL-STAGE COOLDOWN (Specification 3)
    const nextConsecutive = consecutiveGamesPlayed + 1;
    setConsecutiveGamesPlayed(nextConsecutive);

    const gameId = selectedGameId || 'arcade';
    let nextSameGameCount = 1;
    if (gameId === lastPlayedGameId) {
      nextSameGameCount = sameGameConsecutiveCount + 1;
    } else {
      nextSameGameCount = 1;
    }
    setLastPlayedGameId(gameId);
    setSameGameConsecutiveCount(nextSameGameCount);

    let cooldownDuration = 2000; // Rule A: 2-second buffer cooldown for standard sessions (<10 games)
    let isLockout = false;
    let lockoutMsg = "";

    // Rule C: Targeted Spam Guard (continuous exact same game >= 5 times back-to-back)
    if (nextSameGameCount >= 5) {
      cooldownDuration = 2000; // Reduced to 2 seconds for antibot system time reduction
      isLockout = true;
      lockoutMsg = `Anti-Bot Spam Guard: You have played the exact same game model consecutive times continuously. A 2-second cooling lockout is active.`;
    } 
    // Rule B: Global Hard Cooldown (consecutive games >= 10)
    else if (nextConsecutive >= 10) {
      cooldownDuration = 2000; // Reduced to 2 seconds for antibot system time reduction
      isLockout = true;
      lockoutMsg = `Global Cooldown Protection: Consecutive sessions threshold reached (${nextConsecutive}/10 played). A 2-second systemic lockout is active.`;
    }

    const cooldownEnd = Date.now() + cooldownDuration;
    setArcadeCooldownEndTime(cooldownEnd);
    localStorage.setItem('poki_arcade_cooldown_end_time', String(cooldownEnd));

    if (isLockout) {
      setIsLockoutActive(true);
      setLockoutMessage(lockoutMsg);
    }

    // Construction of arcade secure payload
    const payload = {
      payout,
      coinsCollected: safeWinnings,
      gameId: selectedGameId || 'arcade',
      durationSeconds: Math.max(1, Math.round(sessionDurationSec)),
      sessionData: session
    };

    // IMMEDIATELY trigger the score conversion and payout mechanism right when a match ends without manual user prompts!
    authorizeArcadeGoldTransaction(payload).catch((err) => {
      console.error("[AUTO-PAYOUT ERROR]", err);
    });

    // Rule 2: Immutable Reward Dispatch & Ad-Trigger engine (Specification 2)
    let triggerAdNow = false;

    // Phase 3 Knockout or Enforce Interstitial checks
    if (isExtremeHardMode) {
      triggerAdNow = true;
      setIsExtremeHardMode(false);
      (window as any).isExtremeHardMode = false;
      setConsecutiveHighScoresCount(0);
      console.log("[ECONOMY] Extreme hard mode knockout resolved. Enforcing immediate post-game ad.");
    } else if (enforceInterstitialOnGameOver) {
      triggerAdNow = true;
      setEnforceInterstitialOnGameOver(false);
      console.log("[ECONOMY] Phase 2 Dual-Ad envelope interstitial enforced.");
    } else if (payout >= 40) {
      // Scenario B: High Score Burst - Multi-Ad Sequence Safeguard
      triggerAdNow = true;
      setMustShowStartupAd(true);
      console.log("[AD SYSTEM] Scenario B triggered: High Score Burst (>=40). Next game gated with unskippable startup ad.");
    } else {
      // Scenario A: Incremental Roll - Accumulate in dynamic blocks based on trajectory auditor
      const currentAccumulation = sessionAccumulatedCoins + payout;
      if (currentAccumulation >= adAccumulationThreshold) {
        triggerAdNow = true;
        const carryOver = currentAccumulation - adAccumulationThreshold;
        setSessionAccumulatedCoins(carryOver);
        console.log(`[AD SYSTEM] Scenario A triggered: Accumulation ${currentAccumulation} >= ${adAccumulationThreshold} block. Carry-over: ${carryOver}`);
      } else {
        setSessionAccumulatedCoins(currentAccumulation);
        console.log(`[AD SYSTEM] Accumulator state updated: ${currentAccumulation}/${adAccumulationThreshold}. No ad triggered.`);
      }
    }

    // Phase 2 triggers based on high score (>15 coins)
    if (payout > 15) {
      setPendingDualAdEnvelope(true);
      console.log("[ECONOMY] Phase 2 triggered: Score > 15 Coins. Initializing Dual-Ad Envelope for subsequent session.");
    }

    // Phase 3 consecutive score tracking
    if (payout >= 15) {
      setConsecutiveHighScoresCount(prev => {
        const next = prev + 1;
        if (next >= 3) {
          setIsExtremeHardMode(true);
          (window as any).isExtremeHardMode = true;
          console.log("[ECONOMY] Extreme farming detected! Global isExtremeHardMode enabled for next runs.");
        }
        return next;
      });
    } else if (payout < 8) {
      setConsecutiveHighScoresCount(0);
      setIsExtremeHardMode(false);
      (window as any).isExtremeHardMode = false;
    }

    // Track game coins ratio to sustain profitability based on trajectory auditor
    const nextCoinsAccumulator = arcadeCoinsEarnedAccumulator + payout;
    if (nextCoinsAccumulator >= coinsEarnedAccumulatorThreshold) {
      setMustShowStartupAd(true);
      setArcadeCoinsEarnedAccumulator(0);
      localStorage.setItem('poki_arcade_coins_earned_accumulator', '0');
      console.log(`[AD SYSTEM] Threshold ratio reached: accumulated ${nextCoinsAccumulator} game coins (>=${coinsEarnedAccumulatorThreshold}). Enforcing ad validation on subsequent game startup.`);
    } else {
      setArcadeCoinsEarnedAccumulator(nextCoinsAccumulator);
      localStorage.setItem('poki_arcade_coins_earned_accumulator', String(nextCoinsAccumulator));
      console.log(`[AD SYSTEM] Game coins ratio accumulator: ${nextCoinsAccumulator}/${coinsEarnedAccumulatorThreshold}.`);
    }

    if (triggerAdNow) {
      triggerPostGameFullscreenAd(() => {
        // Close game workspace only after ad completes
        setSelectedGameId(null);
      });
    } else {
      setSelectedGameId(null);
    }
  };

  // Authorizes and securely synchronizes Play & Earn payouts to live database nodes
  const authorizeArcadeGoldTransaction = async (forcedPayload?: any) => {
    const activePayload = forcedPayload || pendingArcadePayload;
    if (!activePayload) return;
    const { payout, coinsCollected, gameId, durationSeconds } = activePayload;
    
    // Clear any previous error
    setClaimDatabaseError(null);

    const uId = window.currentUserId || loggedInUid;

    if (!uId) {
      const errMsg = "Authentication UID is Missing during transaction";
      setClaimDatabaseError(errMsg);
      window.alert(errMsg);
      setCustomAlert({
        show: true,
        title: "Session Expired",
        message: errMsg,
        type: "error"
      });
      return;
    }

    // Anti-fraud: Secure deduplication checks
    const stamp = Date.now();
    const cacheKey = `${uId}_${payout}_${durationSeconds}`;
    if (adDeduplicationCache.current[cacheKey]) {
      console.warn("[ANTI-FRAUD] Identical payout transaction triggered within deduplication sequence.");
      return;
    }
    adDeduplicationCache.current[cacheKey] = stamp;

    try {
      console.log(`[DIAGNOSTIC] Verification starts for UID: ${uId}, payout: ${payout}`);

      // We focus entirely on 'gaming_portal' as the absolute path
      const portalRef = database.ref(`gaming_portal/${uId}`);

      // ROBUST FALLBACK FOR PATH INITIALIZATION:
      let snapshot;
      try {
        snapshot = await portalRef.get();
      } catch (readErr: any) {
        console.warn("[DIAGNOSTIC] portalRef.get() failed, trying once('value') as fallback:", readErr);
        snapshot = await portalRef.once('value');
      }

      if (!snapshot || !snapshot.exists()) {
        console.log(`[DIAGNOSTIC] Node gaming_portal/${uId} does NOT exist. Force setting starting play tokens structure...`);
        await portalRef.set({
          pokiGamingGold: 100,
          pokiGoldWinning: 0
        });
      }

      // Once built, immediately append the newly won "Live Coins Collected" balance into the cloud database state
      await portalRef.transaction((current) => {
        if (!current) {
          return {
            pokiGamingGold: 100,
            pokiGoldWinning: Math.round(payout)
          };
        }
        const base = current.pokiGoldWinning !== null && current.pokiGoldWinning !== undefined ? Math.round(Number(current.pokiGoldWinning)) : 0;
        current.pokiGoldWinning = base + Math.round(payout);
        
        // Clean up/delete redundant structures if found (Schema Sanitization)
        const dirtyKeys = ['pokiBalance', 'pokiGameGold', 'unplayedTokens', 'winningTokens', 'tokens', 'pokiGold', 'gameTokens', 'balance'];
        dirtyKeys.forEach(k => {
          if (current[k] !== undefined) delete current[k];
        });
        
        return current;
      });

      console.log("[DIAGNOSTIC] Successfully completed write to gaming_portal path.");

      // Log successful verified session to gaming portal history (optional, try-catch protected)
      try {
        const historyRef = database.ref(`gaming_portal/${uId}/history`).push();
        await historyRef.set({
          type: 'arcade_gameplay_win',
          game: gameId,
          durationSeconds: durationSeconds,
          coinsCollected: coinsCollected,
          payoutAwarded: payout,
          timestamp: firebase.database.ServerValue.TIMESTAMP,
          status: 'VERIFIED'
        });
      } catch (historyErr) {
        console.warn("[DIAGNOSTIC] Non-blocking history log update skipped:", historyErr);
      }

      // Clear pending payload
      setPendingArcadePayload(null);
      synth.playLevelUp();

    } catch (err: any) {
      console.error("[CRITICAL CLAIM ERROR]", err);
      const errMsg = "Firebase Error: " + (err?.message || String(err));
      setClaimDatabaseError(errMsg);
      window.alert(errMsg);
      setCustomAlert({
        show: true,
        title: "Claim Error",
        message: errMsg,
        type: "error"
      });
    }
  };

  // Register Visibility Change & Focus Loss Protection (Point 9)
  useEffect(() => {
    const handleForfeit = (reason: string) => {
      // Settle if user is currently playing any game
      if (selectedGameId && !isForfeited) {
        // Find current game score from DOM or use fallback
        let extractedCoins = 0;
        try {
          const textElements = Array.from(document.querySelectorAll('span, div, h1, h2, h3, p'));
          let foundScore = 0;
          for (const el of textElements) {
            const text = el.textContent || '';
            // Match things like "15 Pairs", "120 XP", "200m", "Coins: 12"
            if (/(\d+)\s*(Pairs|XP|m|Points|score|coins|Gold|PKGG)/i.test(text)) {
              const match = text.match(/(\d+)/);
              if (match) {
                const val = parseInt(match[1]);
                if (val > foundScore) {
                  foundScore = val;
                }
              }
            }
          }
          // Simple safe score conversion for different games
          if (foundScore > 0) {
            extractedCoins = Math.min(30, Math.floor(foundScore * 0.1) || 1);
          }
        } catch (err) {
          console.error("DOM scraping error", err);
        }

        // Apply automatic forfeit layout
        setSelectedGameId(null);
        setIsForfeited(true);
        setForfeitCoins(extractedCoins);
        setForfeitReason(reason);
        synth.playCrash();

        // Settle the database parameters immediately with their current score state
        if (extractedCoins > 0) {
          authorizeArcadeGoldTransaction({
            payout: extractedCoins,
            coinsCollected: extractedCoins,
            gameId: selectedGameId,
            durationSeconds: 5
          }).catch((err) => {
            console.error("Error settling forfeited coins:", err);
          });
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleForfeit("Tab Switch / Minimization Detected");
      }
    };

    const handleBlur = () => {
      handleForfeit("Focus Loss Detected");
    };

    // Tracks when mouse leaves the document window area (Canvas Exit)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 0 || e.clientX < 0 || e.clientX > window.innerWidth || e.clientY > window.innerHeight) {
        handleForfeit("Canvas Exit / Window Out-of-Bounds");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [selectedGameId, isForfeited]);

  // Secure Manual Bridge System to transfer accumulated Gaming Portal Winnings to the user's main wallet (pokiGoldBalance)
  const bridgeWinningsToMainWallet = async (requestedAmount: number) => {
    const uId = window.currentUserId || loggedInUid;
    if (!uId) {
      setCustomAlert({
        show: true,
        title: "Session Required",
        message: "Please ensure you are authenticated in order to trigger the coin transfer.",
        type: "error"
      });
      return;
    }

    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      setCustomAlert({
        show: true,
        title: "Invalid Amount",
        message: "Please enter a valid transfer amount greater than 0.",
        type: "warning"
      });
      return;
    }

    try {
      setIsBridging(true);
      const portalRef = database.ref(`gaming_portal/${uId}`);
      const mainWalletRef = databaseMain.ref(`users/${uId}/pokiGoldBalance`);

      const snap = await portalRef.child('pokiGoldWinning').get();
      const currentWinning = snap.exists() ? Number(snap.val()) : 0;

      if (currentWinning < requestedAmount) {
        throw new Error(`Insufficient winning balance. You have ${currentWinning.toFixed(2)} PKG but requested to transfer ${requestedAmount.toFixed(2)} PKG.`);
      }

      // Explicitly set the main website's balance to match the current gaming portal winnings
      await mainWalletRef.set(currentWinning);

      // Log a detailed audit index entry directly into history
      const historyRef = database.ref(`gaming_portal/${uId}/history`).push();
      await historyRef.set({
        type: "Platform_Transfer",
        rawAmount: requestedAmount,
        netCredited: requestedAmount,
        status: "Success",
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });

      console.log(`[TRANSFER] Successfully synced: ${currentWinning} PKG to main wallet users/${uId}/pokiGoldBalance.`);

      synth.playLevelUp();
      setCustomAlert({
        show: true,
        title: "Transfer & Sync Successful",
        message: `Successfully verified and synchronized ${requestedAmount.toFixed(2)} PKG to your main website account! Your balance is 100% in sync in real-time.`,
        type: "success"
      });
      setTransferAmountInput("0");
    } catch (err: any) {
      console.error("[TRANSFER ERROR] Failed to complete manual sync:", err);
      setCustomAlert({
        show: true,
        title: "Transfer Failed",
        message: err instanceof Error ? err.message : "An error occurred during database atomic synchronization. Please try again.",
        type: "error"
      });
    } finally {
      setIsBridging(false);
    }
  };

  const handlePremiumBypass = async () => {
    const uId = window.currentUserId || loggedInUid;
    if (!uId) return;

    try {
      const portalRef = database.ref(`gaming_portal/${uId}`);
      const snapshot = await portalRef.get();
      const currentGold = snapshot.exists() ? (snapshot.val().pokiGamingGold || 0) : 0;

      if (currentGold < 15) {
        setCustomAlert({
          show: true,
          title: "Bypass Denied",
          message: "Insufficient Premium Gaming Gold (PKGG) to bypass timer!",
          type: "error"
        });
        return;
      }

      await portalRef.transaction((current) => {
        if (!current) return current;
        const currentGoldVal = current.pokiGamingGold !== undefined ? Number(current.pokiGamingGold) : 0;
        if (currentGoldVal < 15) return current; // safety check
        current.pokiGamingGold = parseFloat((currentGoldVal - 15).toFixed(4));
        return current;
      });

      // Reset client side variables
      setPokiGamingGold(prev => parseFloat(Math.max(0, prev - 15).toFixed(4)));
      setArcadeCooldownEndTime(0);
      localStorage.removeItem('poki_arcade_cooldown_end_time');
      setConsecutiveGamesPlayed(0);
      setSameGameConsecutiveCount(0);
      setIsLockoutActive(false);

      synth.playLevelUp();
      setCustomAlert({
        show: true,
        title: "Bypass Successful",
        message: "Successfully spent 15 PKGG. Cooldown timers are cleared! Standard access has been restored.",
        type: "success"
      });
    } catch (err) {
      console.error("Premium bypass error:", err);
    }
  };

  const handleLaunchGame = (id: string) => {
    const gameObj = menuGames.find(g => g.id === id);
    const isArcade = gameObj?.type === 'arcade';
    const isCasino = gameObj?.type === 'casino';

    // Check if casino game play balance is insufficient, trigger conversion immediately and silently before launch!
    if (isCasino && pokiGamingGold < 70) {
      const difference = 70 - pokiGamingGold;
      if (pokiGoldWinning >= difference) {
        // Silent automatic conversion:
        const newUnplayed = parseFloat((pokiGamingGold + difference).toFixed(5));
        const newWinnings = parseFloat((pokiGoldWinning - difference).toFixed(5));
        setPokiGamingGold(newUnplayed);
        localStorage.setItem('poki_gaming_gold', String(newUnplayed));
        setPokiGoldWinning(newWinnings);
        localStorage.setItem('poki_gold_winning', String(newWinnings));
        localStorage.setItem('poki_dashboard_balance', String(parseFloat((newUnplayed + newWinnings).toFixed(5))));
        
        // Proceed to load game immediately without showing any pop-ups
        proceedToLoading(id);
        return;
      } else {
        synth.playCrash();
        setCustomAlert({
          show: true,
          title: "Insufficient Balance",
          message: `Insufficient Play Balance! Casino games require a minimum standard bet of 70 PKG. Your play balance is ${pokiGamingGold.toFixed(1)} PKG and your convertible winnings is ${pokiGoldWinning.toFixed(1)} PKG.`,
          type: "error"
        });
        return;
      }
    }

    // 0. Hard Balance Validation Gate (Point 8)
    const requiredEntryFee = 0; // Arcade games have free entry but active balance must be non-negative
    if (pokiGamingGold < requiredEntryFee) {
      synth.playCrash();
      setCustomAlert({
        show: true,
        title: "Insufficient Play Coins!",
        message: "Insufficient Play Coins!",
        type: "error"
      });
      return;
    }

    if (isLaunching) return;
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
    }, 1200);

    lastScrollPosition.current = window.scrollY;
    synth.playCoin();
    triggerHaptic('light');

    if (isArcade) {
      // 1. Check Global Daily Arcade Budget Pool (5000 Gold)
      if (isArcadeSystemLocked) {
        setCustomAlert({
          show: true,
          title: "Resource Refresh Active",
          message: "Our systems are undergoing regular resource refresh optimization. Arcade games will be unlocked following the midnight UTC schedule.",
          type: "warning"
        });
        return;
      }

      // 2. Check Daily Account accumulation limit (150 Gold)
      if (dailyArcadeGoldClaimed >= 150) {
        setCustomAlert({
          show: true,
          title: "Daily Ceiling Reached",
          message: "Daily Arcade Limit Reached! Returns tomorrow. (Maximum 150 Poki Gold per 24h per account from Play & Earn catalog reached).",
          type: "info"
        });
        return;
      }

      // 3. Check Device daily payout ceiling (300 Gold across multiple accounts on same device fingerprint)
      if (deviceDailyGoldClaimed >= 300) {
        setCustomAlert({
          show: true,
          title: "Device Limit Met",
          message: "Daily Multi-Account Device limit reached! Max 300 Poki Gold allowed per single physical signature profile.",
          type: "warning"
        });
        return;
      }

      // 4. Check Anti-bot Cooldown
      if (Date.now() < arcadeCooldownEndTime) {
        const remaining = Math.max(1, Math.ceil((arcadeCooldownEndTime - Date.now()) / 1000));
        if (isLockoutActive) {
          setIsLockoutActive(true);
          return;
        }
        setCustomAlert({
          show: true,
          title: "Cooldown Buffer",
          message: `Please wait ${remaining}s before starting your next session. Rapid farming is restricted to protect house reserves.`,
          type: "warning"
        });
        return;
      }

      // 5. Initialize secure session state parameters
      const randCap = Math.floor(Math.random() * (35 - 25 + 1)) + 25;
      setCurrentSessionCap(randCap);
      // Synchronize window endpoints so in-game canvases can retrieve them live
      (window as any).currentArcadeSessionCap = randCap;
      (window as any).currentArcadeSessionActive = true;
      setArcadeSessionStartTime(Date.now());
    }

    // Play any backlogged ads or apply 30% start frequency ads
    const userProfile = getUserProfile();
    if (isArcade && pendingDualAdEnvelope) {
      setPendingDualAdEnvelope(false);
      triggerPostGameFullscreenAd(() => {
        // Enforce another full Interstitial Ad on the following Game Over
        setEnforceInterstitialOnGameOver(true);
        proceedToLoading(id);
      });
    } else if (isArcade && userProfile.spammer && Math.random() < 0.65) {
      console.log("[AUDITOR] Active Spammer Profile - Injecting silent pre-roll ad.");
      triggerPostGameFullscreenAd(() => {
        proceedToLoading(id);
      });
    } else if (isArcade && mustShowStartupAd) {
      setMustShowStartupAd(false); // Reset the flag immediately to ungate future sessions
      triggerPostGameFullscreenAd(() => {
        proceedToLoading(id);
      });
    } else if (isArcade && pendingAdsCount > 0) {
      setPendingAdsCount(prev => Math.max(0, prev - 1));
      triggerPostGameFullscreenAd(() => {
        proceedToLoading(id);
      });
    } else if (isArcade && (gamePlaysCount + 1) % 3 === 0) {
      const currentPlays = gamePlaysCount + 1;
      setGamePlaysCount(currentPlays);
      triggerPostGameFullscreenAd(() => {
        proceedToLoading(id);
      });
    } else {
      if (isArcade) {
        setGamePlaysCount(prev => prev + 1);
      }
      proceedToLoading(id);
    }
  };

  const proceedToLoading = (id: string) => {
    setSelectedGameId(id);
    const gameObj = menuGames.find(g => g.id === id);
    if (gameObj && gameObj.type === 'arcade') {
      triggerVignetteAd(); // Safe, non-intrusive High-CPM Vignette trigger strictly on game load for Play & Earn section!
    }
    // Set premium Loading Indicator
    setLoadingGameTitle(gameObj ? gameObj.title : 'POKI GAME');
    setIsGameLoading(true);
    if (gameLoadingTimeoutRef.current) {
      clearTimeout(gameLoadingTimeoutRef.current);
    }
    gameLoadingTimeoutRef.current = setTimeout(() => {
      setIsGameLoading(false);
      gameLoadingTimeoutRef.current = null;
    }, 5000); // 5-second countdown/loading screen with Pre-roll VAST video ad

    // Force automatic fullscreen on game selection (Pure CSS-based App View Switch)
    // Poki 777 Jackpot slots is forced to windowed mode to ensure bottom controls are fully visible.
    setTimeout(() => {
      if (id === 'slots') {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    }, 150);
  };

  // Interactive JS Click Ripple Helper
  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const diameter = Math.max(rect.width, rect.height);
    const circle = document.createElement('span');

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x - diameter / 2}px`;
    circle.style.top = `${y - diameter / 2}px`;
    circle.className = 'ripple';

    const existing = button.getElementsByClassName('ripple');
    if (existing.length > 0) {
      existing[0].remove();
    }

    button.appendChild(circle);
  };

  // Standalone simulated advertisement player to earn Unplayed Tokens - 100% Monetag-free
  const watchAdAndEarnTokens = async () => {
    if (isWatchingAd) return;

    // Check ad limit status (maximum 3 per 24 hours)
    const limitStatus = getAdLimitStatus();
    if (limitStatus.isLocked) {
      const hours = Math.floor(limitStatus.timeLeftMs / (1000 * 60 * 60));
      const minutes = Math.floor((limitStatus.timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((limitStatus.timeLeftMs % (1000 * 60)) / 1000);
      
      setCustomAlert({
        show: true,
        title: "Daily Limit Reached! ⏳",
        message: `You have watched the maximum of 3 ads today. Please wait ${hours}h ${minutes}m ${seconds}s.`,
        type: "warning"
      });
      return;
    }

    // Since Monetag has been completely removed, we bypass all external windows and blockers.
    // Instead, we run a secure 5-second claim validation process!
    const claimDuration = 5;
    setIsWatchingAd(true);
    setAdCountdown(claimDuration);
    synth.playCoin();
  };

  // Dedicated success callback to credit ad rewards perfectly (Specification BUG 2)
  const handleAdCompleted = () => {
    const coinsToAward = adRewardConfig && adRewardConfig.min !== undefined ? adRewardConfig.min : 15;
    const uid = window.currentUserId || loggedInUid;

    // Instantly credit locally for zero lag and perfect offline-first tracking!
    setPokiGamingGold((prevTokens) => {
      const next = parseFloat((prevTokens + coinsToAward).toFixed(5));
      localStorage.setItem('poki_gaming_gold', String(next));
      return next;
    });

    if (uid) {
      // Credit coinsToAward unplayed tokens atomically using ServerValue.increment directly to gaming_portal/${uid}/pokiGamingGold
      const adGamingRef = database.ref(`gaming_portal/${uid}`);
      adGamingRef.update({
        pokiGamingGold: firebase.database.ServerValue.increment(coinsToAward)
      }).then(() => {
        console.log(`[DIAGNOSTIC] Awarded ${coinsToAward} Play Coins atomically via increment().`);
      }).catch((err) => {
        console.error("[DIAGNOSTIC] Failed to award ad gold atomically:", err);
      });

      // Log inside history ledger
      const historyRef = database.ref(`gaming_portal/${uid}/history`).push();
      historyRef.set({
        type: 'ad_earning',
        amount: coinsToAward,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'SUCCESS'
      });
    }

    setIsWatchingAd(false);
    // Credit view tracking
    trackAdView();
    synth.playLevelUp();

    setCustomAlert({
      show: true,
      title: "Rewards Credited! 🎉",
      message: `Success! You have completed the validation process and received ${coinsToAward.toFixed(2)} Poki Game Gold play currency.`,
      type: "success"
    });
  };

  useEffect(() => {
    if (!isWatchingAd) return;

    const interval = setTimeout(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          handleAdCompleted();
          return 0;
        }
        synth.playCoin();
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(interval);
  }, [isWatchingAd, adCountdown]);

  // Deprecated: No longer used. All token transfers go through bridgeWinningsToMainWallet.

  const menuGames: GameItem[] = [
    // Arcade Section (Skill-Based Arcade Games)
    { id: 'jump_overdrive', title: 'APEX LEAP BOARD', type: 'arcade', badge: 'PLAY NOW', category: 'Arcade Classics', gradient: 'from-[#5f2c82] to-[#49a09d]', multiplierScale: '1.0x - 65x', icon: TrendingUp, thumbnail: jumpOverdriveThumb },
    { id: 'flappy_vector', title: 'VECTOR WING PRECISION', type: 'arcade', badge: 'PLAY NOW', category: 'Arcade Classics', gradient: 'from-[#8e2de2] to-[#4a00e0]', multiplierScale: '1.0x - 80x', icon: Zap, thumbnail: flappyVectorThumb },
    { id: 'space_miner', title: 'STAR MINER CANNON', type: 'arcade', badge: 'PLAY NOW', category: 'Arcade Classics', gradient: 'from-[#00c6ff] to-[#0072ff]', multiplierScale: '1.0x - 250x', icon: Target, thumbnail: spaceMinerThumb },
    { id: 'tower_stacker', title: 'CHRONO TACK MATCH', type: 'arcade', badge: 'READY TO PLAY', category: 'Arcade Classics', gradient: 'from-[#e52d27] to-[#b31217]', multiplierScale: '1.0x - 50x', icon: Database, thumbnail: towerStackerThumb },
    { id: 'brick_breaker', title: 'NEON GRID BRICK', type: 'arcade', badge: 'READY TO PLAY', category: 'Arcade Classics', gradient: 'from-[#0575e6] to-[#00f260]', multiplierScale: '1.0x - 40x', icon: Play, thumbnail: brickBreakerThumb },
    { id: 'ballistic_knife', title: 'BALLISTIC DAGGER WHEEL', type: 'arcade', badge: 'PLAY NOW', category: 'Arcade Classics', gradient: 'from-[#514a9d] to-[#24c6dc]', multiplierScale: '1.0x - 50x', icon: Target, thumbnail: ballisticKnifeThumb },
    { id: 'dino_run', title: 'DINO NEON RUN', type: 'arcade', badge: 'NEW GAME', category: 'Arcade Classics', gradient: 'from-[#ffb703] to-[#121317]', multiplierScale: '1.0x - 100x', icon: Zap, thumbnail: dinoThumb },
    { id: 'puzzle_2048', title: '2048 GOLD PUZZLE', type: 'arcade', badge: 'NEW GAME', category: 'Arcade Classics', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '1.0x - 150x', icon: Square, thumbnail: puzzle2048Thumb },
    { id: 'math_master', title: 'NEON MATH MASTER', type: 'arcade', badge: 'NEW GAME', category: 'Arcade Classics', gradient: 'from-[#f39c12] to-[#111]', multiplierScale: '1.0x - 120x', icon: Hash, thumbnail: mathThumb },
    { id: 'memory_match', title: 'GOLD MEMORY MATCH', type: 'arcade', badge: 'NEW GAME', category: 'Arcade Classics', gradient: 'from-[#ffb703] to-[#242730]', multiplierScale: '1.0x - 80x', icon: Shuffle, thumbnail: memoryThumb },
    
    // Casino Section (Lucky Zone betting games)
    { id: 'crash', title: 'MULTIPLIER MOON CRASH', type: 'casino', badge: 'READY TO PLAY', category: 'Casino Table', gradient: 'from-[#d31027] to-[#ea7317]', multiplierScale: '1.01x - 120x', icon: Rocket, thumbnail: crashThumb },
    { id: 'plinko_drop', title: 'PLINKO PHYSICS DROP', type: 'casino', badge: 'BET SPEED', category: 'Casino Table', gradient: 'from-[#f857a6] to-[#ff5858]', multiplierScale: '1.0x - 150x', icon: Layers, thumbnail: plinkoThumb },
    { id: 'minesweeper', title: 'VAULT FIELD DEFUSE', type: 'casino', badge: 'BET MINES', category: 'Casino Table', gradient: 'from-[#7303c0] to-[#ec38bc]', multiplierScale: '1.0x - 75x', icon: ShieldAlert, thumbnail: minesweeperThumb },
    { id: 'roulette', title: 'CYBER SPIN ROULETTE', type: 'casino', badge: 'PLAY NOW', category: 'Casino Table', gradient: 'from-[#11998e] to-[#38ef7d]', multiplierScale: '2.0x / 14x', icon: Dribbble, thumbnail: rouletteThumb },
    { id: 'dice', title: 'QUANTUM NEON DICE', type: 'casino', badge: 'READY TO PLAY', category: 'Casino Table', gradient: 'from-[#4776e6] to-[#8e54e9]', multiplierScale: '1.01x - 49x', icon: Square, thumbnail: cyberDiceThumb },
    { id: 'slots', title: 'POKI 777 JACKPOT', type: 'casino', badge: 'READY TO PLAY', category: 'Casino Table', gradient: 'from-[#f12711] to-[#f5af19]', multiplierScale: '1.5x - 50x', icon: Coins, thumbnail: slotsThumb },
    { id: 'fortune', title: 'FORTUNE VECTOR WHEEL', type: 'casino', badge: 'READY TO PLAY', category: 'Casino Table', gradient: 'from-[#ff416c] to-[#ff4b2b]', multiplierScale: '0.0x - 100x', icon: HelpCircle, thumbnail: fortuneThumb },
    { id: 'blackjack', title: 'BLACKJACK DECK 21', type: 'casino', badge: 'PLAY NOW', category: 'Casino Table', gradient: 'from-[#ff512f] to-[#dd2476]', multiplierScale: '2.0x / 2.5x', icon: Heart, thumbnail: blackjackThumb },
    { id: 'keno', title: 'KENO LOTTERY MATRIX', type: 'casino', badge: 'READY TO PLAY', category: 'Casino Table', gradient: 'from-[#08aeea] to-[#2af598]', multiplierScale: '1.5x - 50x', icon: Hash, thumbnail: kenoLotteryThumb },
    { id: 'hilo', title: 'HILO LEDGER PREMIUM', type: 'casino', badge: 'PLAY NOW', category: 'Casino Table', gradient: 'from-[#d4af37] to-[#1a1a1a]', multiplierScale: '1.2x - 50x', icon: Coins, thumbnail: hiloLedgerThumb },
    { id: 'coinflip', title: 'COINFLIP BLITZ', type: 'casino', badge: 'BET COINS', category: 'Casino Table', gradient: 'from-[#ffb703] to-[#242730]', multiplierScale: '1.95x / 2.0x', icon: Coins, thumbnail: coinFlipThumb },
    { id: 'shell', title: 'POKI SHELL LUCKY', type: 'casino', badge: 'GUESS CUP', category: 'Casino Table', gradient: 'from-[#514a9d] to-[#24c6dc]', multiplierScale: '2.85x', icon: HelpCircle, thumbnail: shellGameThumb },
    
    // 8 NEW PREMIUM CASINO GAMES (Dice Duel, Lucky Mines, Baccarat Lite, Sic Bo, Jackpot Wheel)
    { id: 'dice_duel', title: 'DICE DUEL (BET 7)', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#111111]', multiplierScale: '2.1x - 5.0x', icon: Dices, thumbnail: diceDuelThumb },
    { id: 'lucky_mines', title: 'LUCKY MINES SECTOR', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '1.01x - 100x', icon: ShieldAlert, thumbnail: luckyMinesThumb },
    { id: 'baccarat_lite', title: 'BACCARAT COUPE LITE', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#111111]', multiplierScale: '1.95x - 9.0x', icon: Heart, thumbnail: baccaratLiteThumb },
    { id: 'sic_bo', title: 'SIC BO TRIPLE TUMBLE', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '2.0x - 31.0x', icon: HelpCircle, thumbnail: sicBoThumb },
    { id: 'wheel_hype', title: 'GRAND JACKPOT WHEEL', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '0.5x - 100x', icon: Sparkles, thumbnail: wheelHypeThumb }
  ];

  // Filters the list of games
  const filteredGames = menuGames.filter((game) => {
    const matchesCategory = game.type === activeCategory;
    const matchesSearch = 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Render loading state while checking the SSO token
  if (isSessionChecking) {
    return (
      <div className="min-h-screen bg-radial from-[#1a1c23] via-[#0d0e12] to-[#050507] text-[#eaeaea] font-sans flex flex-col items-center justify-center select-none relative overflow-hidden">
        {/* Soft elegant neon ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#d4af37]/10 to-[#ffb703]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6 text-center">
          {authError ? (
            /* Elegant Security Warning card preventing direct redirect spin */
            <div className="bg-black/80 backdrop-blur-md border border-red-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-fade-in w-full text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/40 rounded-2xl flex items-center justify-center mb-6 mx-auto animate-pulse">
                <Flame className="w-8 h-8 text-red-500" />
              </div>
              
              <h2 className="text-lg font-bold tracking-wider text-red-400 uppercase">
                SECURITY BRIDGE REJECTED
              </h2>
              
              <p className="text-xs text-zinc-400 font-mono mt-4 leading-relaxed bg-zinc-900/80 px-4 py-3 rounded-lg border border-zinc-800/60 max-h-32 overflow-y-auto break-all">
                {authError}
              </p>

              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="text-xs text-zinc-500">
                  Redirecting back to Main App in <span className="text-[#ffd166] font-mono text-sm font-bold">{authCountdown}s</span>...
                </div>
                
                <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="bg-red-500 h-full transition-all duration-1000 ease-linear" 
                    style={{ width: `${(authCountdown / 5) * 100}%` }}
                  />
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button 
                    onClick={() => {
                      window.location.href = MAIN_APP_URL;
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg hover:shadow-red-600/20 uppercase tracking-widest border border-red-500/40"
                  >
                    Return Now
                  </button>
                  <button 
                    onClick={() => {
                      console.log("[DIAGNOSTIC] Manual bypass initiated by user click");
                      const devUid = 'hunterhackingtv_dev_uid';
                      window.currentUserId = devUid;
                      setLoggedInUid(devUid);
                      setIsSessionChecking(false);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-[#ffb703] hover:text-black hover:border-[#ffb703] text-zinc-300 transition-all uppercase tracking-widest border border-zinc-700"
                  >
                    Skip (Dev Bypass)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Main loader design: Golden pulsing ring structure with gamepad symbol */
            <>
              <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                <div className="absolute inset-0 border-4 border-[#d4af37]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-2 border-dashed border-[#ffd166]/30 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
                
                {/* Pulsing inner coin/game icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-[#d4af37] to-[#8d6e1a] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)] animate-pulse">
                  <Gamepad2 className="w-7 h-7 text-black stroke-[2.5]" />
                </div>
              </div>

              <h2 className="text-base font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#ffd166] via-[#fff] to-[#ffd166] animate-pulse">
                MiniPoki Authentication
              </h2>
              
              <div className="flex items-center gap-2 mt-3">
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full animate-bounce" />
              </div>

              <p className="text-[11px] text-[#ffd166]/80 font-mono tracking-wider mt-6 px-4 py-1.5 bg-black/60 border border-zinc-800/80 rounded-full shadow-inner inline-block">
                Verifying Cross-Site Security Handshake...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Dedicated verifyPayment function in Firebase used_utrs check
  const verifyPayment = async (utrString: string): Promise<boolean> => {
    console.log("=== STARTING UPI VERIFICATION CLIENT ===");
    
    // Set loading state by disabling buttons/inputs (with status 'submitting')
    setTopUpStatus('submitting');
    
    // Logging initialized state of Firebase
    console.log("[DIAGNOSTIC] Firebase initialized applications count:", firebase.apps.length);

    // Connection Check: check if we successfully read from authorized user path using database.ref().once('value')
    const testPath = window.currentUserId ? 'gaming_portal/' + window.currentUserId : '.info/connected';
    console.log(`[DIAGNOSTIC] Connection Check: Verifying database reachability via authorized path database.ref('${testPath}').once('value')...`);
    try {
      // Set a strict 4.5 second timeout to detect network issues early
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 4500)
      );
      await Promise.race([
        database.ref(testPath).once('value'),
        timeoutPromise
      ]);
      console.log("[DIAGNOSTIC] Connection Check Succeeded! Database is live and authenticated.");
    } catch (connError: any) {
      const failureReason = connError.message === 'NETWORK_TIMEOUT' ? 'NETWORK_TIMEOUT' : 'DATABASE_PERMISSION_DENIED';
      console.error(`[DIAGNOSTIC] Connection Check Failed. Reason: ${failureReason}`, connError);
      const alertMsg = "Database Connection Failed: Please check Firebase Rules.";
      alert(alertMsg);
      throw new Error(failureReason);
    }

    console.log("[DIAGNOSTIC] Raw user input received for verification:", utrString);
    const trimmedUtr = utrString ? utrString.trim() : "";
    console.log("[DIAGNOSTIC] Cleaned/Trimmed UTR code to verify:", trimmedUtr);

    if (!trimmedUtr) {
      console.warn("[DIAGNOSTIC] Fraud Attempt: Empty UTR submitted. Reason: INVALID_LENGTH");
      throw new Error("INVALID_LENGTH");
    }

    // MANDATORY SECURITY PROTOCOL 1: Client-Side Validation (Zero-Trust Regex Check)
    if (!/^\d{12}$/.test(trimmedUtr)) {
      console.warn("[DIAGNOSTIC] Fraud Attempt: UTR pattern format mismatch. Input must be exactly 12 digits. Reason: INVALID_LENGTH");
      throw new Error("INVALID_LENGTH");
    }

    if (!selectedPackage) {
      console.error("[DIAGNOSTIC] Payment processing aborted. Reason: INVALID_PACKAGE");
      throw new Error("INVALID_PACKAGE");
    }

    console.log("[DIAGNOSTIC] Database Query: Checking if UTR '" + trimmedUtr + "' already exists in 'used_utrs' node...");
    try {
      const snapshot = await database.ref('used_utrs/' + trimmedUtr).once('value');
      const exists = snapshot.exists() || (snapshot.val() !== null);
      
      if (exists) {
        console.error("[DIAGNOSTIC] Aborted: UTR has already been claimed or logged in the database. Reason: UTR_DUPLICATE");
        alert("UTR already used! This transaction reference has already been claimed.");
        throw new Error("UTR_DUPLICATE");
      }

      console.log("[DIAGNOSTIC] UTR '" + trimmedUtr + "' is currently vacant. Proceeding to lockdown UTR atomically via server transaction...");

      /*
       * MANDATORY SECURITY PROTOCOL 2: Atomic Double-Spend Protection (Mutex Lock)
       *
       * CONCURRENCY & RACE CONDITIONS DEFENSE LOGIC:
       * When two users submit the exact same UTR at the exact same instant, a raw client-side read/write check is vulnerable to race conditions.
       * 
       * To eliminate this, we use Firebase Realtime Database's atomic transaction() update block:
       * 1. The Realtime Database server marshals and sequentially executes transaction update loops on the path 'used_utrs/{UTR}'.
       * 2. When the callback fires, it receives the latest, guaranteed state of that path directly from the server memory.
       * 3. Inside the block, if `currentValueInDatabase` is not null (already exists), the transaction function returns `undefined` to instantly abort the write.
       * 4. This acts as a robust server-backed Mutex Lock. The second requests are aborted and rejected on the server side instantly without any double claim possibility.
       */
      const utrRef = database.ref('used_utrs/' + trimmedUtr);

      // Wrapper promise to allow AWAITing the transaction completion
      // 1. Use await before calling the transaction.
      const transactionPromise = new Promise<boolean>((resolve, reject) => {
        utrRef.transaction((currentValueInDatabase) => {
          console.log(`[CONCURRENCY] Mutex check callback triggered. Key: used_utrs/${trimmedUtr}. Value in database:`, currentValueInDatabase);
          
          if (currentValueInDatabase !== null) {
            // UTR is already occupied. Aborting transaction write immediately.
            console.warn(`[CONCURRENCY] Dual claim detected during transaction callback. Key '${trimmedUtr}' is already owned.`);
            return undefined; // Cancels and aborts write
          } else {
            // Slot is vacant. Claim it in a single atomic database operation.
            console.log(`[CONCURRENCY] UTR path vacant. Writing lock record to claim UTR: ${trimmedUtr}`);
            return {
              userId: window.currentUserId,
              tokens: selectedPackage.tokens,
              amount: selectedPackage.price,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              status: "CLAIMED"
            };
          }
        }, async (error, committed, snapshot) => {
          if (error) {
            console.error("[DIAGNOSTIC] Mutex atomic transaction error:", error);
            reject(error);
          } else if (committed) {
            console.log("[DIAGNOSTIC] Mutex lock successfully acquired and written on the database.");
            try {
              // 2. Ensure that the updateBalance() gesture is ONLY called inside the onComplete callback of the transaction, and ONLY if committed is true.
              console.log("[DIAGNOSTIC] Mutex locked. Crediting unplayed game tokens... Adding " + selectedPackage.tokens + " tokens to: " + window.currentUserId);
              const gamingRef = database.ref('gaming_portal/' + window.currentUserId);
              const packageTokens = parseFloat(selectedPackage.tokens.toFixed(5));
              
              await gamingRef.update({
                pokiGamingGold: firebase.database.ServerValue.increment(packageTokens)
              });

              console.log("[DIAGNOSTIC] Wallet balance synced. Writing payment receipt log inside history...");
              const historyRef = database.ref(`gaming_portal/${window.currentUserId}/history`).push();
              await historyRef.set({
                type: 'upi_topup',
                utr: trimmedUtr,
                amount: selectedPackage.price,
                tokens: selectedPackage.tokens,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                status: 'SUCCESS'
              });
              console.log("[DIAGNOSTIC] Payment entry stored successfully in local ledger.");
              console.log("=== UPI VERIFICATION SUCCESSFUL ===");
              resolve(true);
            } catch (grantError: any) {
              console.error("[DIAGNOSTIC] Token credit error inside onComplete lock:", grantError);
              reject(grantError);
            }
          } else {
            // DO NOT GRANT TOKENS
            console.log("[DIAGNOSTIC] Mutex check: write operation was aborted. Duplicate detected on database level.");
            reject(new Error("UTR_DUPLICATE"));
          }
        });
      });

      const transactionResult = await transactionPromise;
      if (transactionResult) {
        alert("Success!");
      }
      return transactionResult;

    } catch (error: any) {
      // 3. Add a try-catch block to log any database errors.
      const errorMsg = error.message || "DATABASE_ERROR";
      console.error(`[DIAGNOSTIC] UPI Top-Up Transaction failed. Reason Code: ${errorMsg}`);
      if (errorMsg === "UTR_DUPLICATE") {
        alert("Invalid or Used UTR!");
      }
      throw error;
    }
  };

  // Top-Up UTR claim handler wrapper
  const handleTopUpClaim = async () => {
    if (!window.currentUserId) {
      alert("Verification Aborted: No active valid user session recorded.");
      return;
    }
    if (!selectedPackage) {
      alert("Validation failed: Please input a valid recharge amount between ₹10 and ₹1000 INR.");
      return;
    }
    
    setTopUpStatus('submitting');
    setTopUpError(null);
    synth.playCoin();

    try {
      await verifyPayment(utrInput);
      setTopUpStatus('success');
      synth.playLevelUp();
    } catch (err: any) {
      setTopUpStatus('error');
      setCustomPriceInput(String(selectedPackage?.price || 50));
      setTopUpError(err?.message || "Consensus timing failure. Try submitting again.");
      synth.playCrash();
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#eaeaea] font-sans overflow-x-hidden flex flex-col relative select-none">
      
      {/* 1. SEAMLESS HARDWARE-ACCELERATED TOP MARQUEE ACCENT BAR */}
      <div className="bg-[#07080a] border-b border-[#ffd166]/10 text-[#ffd166] text-[10px] xs:text-[11px] uppercase tracking-wider font-sans font-bold py-2 w-full overflow-hidden relative select-none shrink-0 z-50">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="px-6 flex items-center gap-10">
            {tickerItems.map((winner, idx) => (
              <span key={`ticker-1-${idx}`} className="inline-flex items-center gap-2">
                <span className="text-white font-extrabold font-sans leading-none">{winner}</span>
                <span className="text-zinc-700 font-normal px-2 shrink-0">•</span>
              </span>
            ))}
          </span>
          <span className="px-6 flex items-center gap-10">
            {tickerItems.map((winner, idx) => (
              <span key={`ticker-2-${idx}`} className="inline-flex items-center gap-2">
                <span className="text-white font-extrabold font-sans leading-none">{winner}</span>
                <span className="text-zinc-700 font-normal px-2 shrink-0">•</span>
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* 2. MAIN HORIZONTALLY ALIGNED POLISHED GEMS HEADER - PREMIUM GLASSMORPHISM */}
      <header className="backdrop-blur-md bg-[#0f111a]/80 border-b border-white/[0.06] sticky top-0 z-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 pt-safe pt-5 sm:pt-3 shadow-[0_4px_30px_rgba(0,0,0,0.6)] animate-in fade-in duration-300">
        {/* Brand row and Online Players Indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#ffd166] to-[#ffb703] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-[#ffb703]/20 border border-[#ffd166]/20 shrink-0">
              <Gamepad2 className="w-5 h-5 text-black" />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-[12px] sm:text-base font-black tracking-widest text-white leading-none uppercase font-sans">
                Poki <span className="text-[#ffd166]">game Hub</span>
              </h1>
              <span className="text-[7.5px] sm:text-[9.5px] font-mono tracking-widest text-[#ffb703] uppercase block mt-0.5 leading-none font-bold">
                GOLD MODE ACTIVE
              </span>
            </div>
          </div>

          {/* ONLINE PLAYERS AND HISTORY IN THE BRAND ROW FOR SCREEN OPTIMIZATION ON MOBILE */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* ONLINE PLAYERS LIVE COUNTER */}
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-left select-none animate-pulse shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-white font-mono leading-none">
                {onlinePlayers}
              </span>
            </div>

            {/* History Button */}
            <button
              onClick={() => {
                synth.playClick();
                triggerHaptic('light');
                setHistoryModalActive(true);
              }}
              className="p-1.5 bg-white/[0.04] border border-white/[0.08] hover:border-[#ffd166]/20 rounded-lg text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none shrink-0"
              title="Gameplay History Ledger"
            >
              <History className="w-3.5 h-3.5 text-[#ffd166]" />
            </button>
          </div>
        </div>

        {/* Sleek unified financial crypto-styled badges */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
          {/* PKGG Token Widget (Play Currency) */}
          <div
            onClick={watchAdAndEarnTokens}
            className="bg-gradient-to-br from-[#161926] to-[#121420] border border-white/[0.05] rounded-xl p-2.5 flex-1 sm:w-40 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-200 select-none shadow-md"
            title="Earn Free Poki Game Gold (PKGG)"
          >
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono leading-none">Play Money</span>
              <span className="text-sm font-black text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.3)] mt-1.5 leading-none truncate">
                {pokiGamingGold.toFixed(1)} <span className="text-[10px] text-amber-500 font-bold ml-0.5">PKGG</span>
              </span>
            </div>
            {/* Minimalist action button */}
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-amber-400 transition-all border border-white/[0.05] shrink-0">
              <Tv className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* PKG Token Widget (Convertible Winnings / Poki Gold) */}
          <div
            onClick={() => {
              synth.playCoin();
              setTransferModalActive(true);
              setTransferStatus('idle');
              setTransferAmountInput('');
              setErrorNotification(null);
            }}
            className="bg-gradient-to-br from-[#161926] to-[#121420] border border-white/[0.05] rounded-xl p-2.5 flex-1 sm:w-40 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-200 select-none shadow-md"
            title="Transfer Poki Gold (PKG) to Main Account"
          >
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono leading-none">Winnings</span>
              <span className="text-sm font-black text-[#ffb703] drop-shadow-[0_0_6px_rgba(251,191,36,0.3)] mt-1.5 leading-none truncate">
                {pokiGoldWinning.toFixed(1)} <span className="text-[#ffd166] font-bold ml-0.5">PKG</span>
              </span>
              <span className="text-[9px] font-mono font-medium text-emerald-400 mt-1 leading-none">
                ≈ ₹{(pokiGoldWinning * POKI_GOLD_INR_RATE).toFixed(2)}
              </span>
            </div>
            {/* Minimalist action button */}
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#ffb703] transition-all border border-white/[0.05] shrink-0">
              <ArrowRightLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </header>

      {/* 3. LOBBY CONTAINER (ALWAYS KEPT MOUNTED TO PRESERVE ENTIRE VIEW STATE AND SCROLL POSITION) */}
      <div className={selectedGameId ? "pointer-events-none select-none opacity-0" : "flex flex-col flex-1"}>
        <motion.div
          key="lobby-room"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full z-10"
        >
          {/* PLAY & EARN ECONOMIST LIVE HUD - Visually hidden to fix theme aesthetics, background trackers preserved */}
          {activeCategory === 'arcade' && null}

          {/* SEARCH AND FILTERS CONTROLLER HEADER - PREMIUM OVERHAUL */}
          <div className="flex flex-col gap-4 mb-8 w-full max-w-xl mx-auto">
            
            {/* PREMIUM APEX NAVIGATION STRIP ("PLAY & EARN" VS "LUCKY ZONE") */}
            <div className="bg-[#131522] p-1 rounded-xl flex items-center gap-1 border border-white/[0.03]">
              {/* PLAY & EARN button */}
              <button
                onClick={(e) => {
                  createRipple(e);
                  if (activeCategory !== 'arcade') {
                    setActiveCategory('arcade');
                    triggerVignetteAd();
                  }
                  synth.playCoin();
                }}
                className={`py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 w-full transition-all duration-300 transform active:scale-95 cursor-pointer uppercase select-none ${
                  activeCategory === 'arcade'
                    ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 font-bold'
                    : 'text-gray-400 font-medium hover:text-white border border-transparent'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Play & Earn</span>
              </button>

              {/* LUCKY ZONE button */}
              <button
                onClick={(e) => {
                  createRipple(e);
                  if (activeCategory !== 'casino') {
                    setActiveCategory('casino');
                    triggerVignetteAd();
                  }
                  synth.playCoin();
                }}
                className={`py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 w-full transition-all duration-300 transform active:scale-95 cursor-pointer uppercase select-none ${
                  activeCategory === 'casino'
                    ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 font-bold'
                    : 'text-gray-400 font-medium hover:text-white border border-transparent'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Lucky Zone</span>
              </button>
            </div>

            {/* CLEAN INTEGRATED SEARCH EXPERIENCE */}
            {!(activeCategory === 'arcade' && isArcadeSystemLocked) && (
              <div className="relative w-full bg-[#121422] border border-white/[0.05] focus-within:border-amber-500/40 rounded-xl px-3 py-2.5 transition-all flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-300 placeholder-gray-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* SEAMLESS MULTI-ROW GAME GRID DISPLAY */}
          {activeCategory === 'arcade' && isArcadeSystemLocked ? (
            <div className="w-full bg-[#0a0c10] border border-red-500/10 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center my-8 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-6 animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h4 className="text-white font-extrabold text-lg uppercase tracking-wider mb-2">Server Optimization Active</h4>
              <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
                The global daily arcade budget has been reached (₹100 INR / 5,000 Poki Gold total payout limit). The arcade section has switched into "Resource Refresh" mode to secure house reserves. All arcade modules will return active following server reset at midnight UTC.
              </p>
              <div className="inline-block bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-2.5 font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                Status: Capped (5,000 / 5,000 Gold Sync Complete)
              </div>
            </div>
          ) : filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredGames.map((game, index) => {
                const GameIcon = game.icon;

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                      delay: index * 0.04
                    }}
                    onClick={() => {
                      if (isLaunching) return;
                      handleLaunchGame(game.id);
                    }}
                    className={`group cursor-pointer flex flex-col bg-[#0d0e12] border border-[#ffb703]/5 rounded-3xl p-3.5 overflow-hidden game-card-active-interaction ${isLaunching ? "pointer-events-none opacity-50" : ""}`}
                  >
                    {/* Interactive Graphic Preview Wrapper */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-900 shadow-inner">
                      {game.thumbnail ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img
                            src={game.thumbnail}
                            alt={game.title}
                            className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 group-hover:brightness-110 group-hover:contrast-105 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                            referrerPolicy="no-referrer"
                          />
                          {/* Premium dark overlay to blend with glossy dark theme */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/5 opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-r from-[#ffb703]/10 via-transparent to-black/40 mix-blend-color-dodge opacity-40 group-hover:opacity-75 transition-opacity duration-500" />
                        </div>
                      ) : (
                        <>
                          <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20 group-hover:opacity-35 transition-opacity duration-500`} />
                          <div className="absolute w-32 h-32 rounded-full border border-white/5 animate-pulse" />
                        </>
                      )}

                      {/* Centered Premium Character Icon */}
                      <div className="relative z-10 p-3 bg-black/75 border border-[#ffb703]/15 rounded-2xl group-hover:scale-110 group-hover:rotate-3 group-hover:border-[#ffb703]/40 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-2xl">
                        <GameIcon className="w-8 h-8 text-[#ffd166] group-hover:text-white transition duration-305" />
                      </div>

                      {/* Top Corner Badge: Play Ready subtle gold badge */}
                      <span className="absolute top-2.5 left-2.5 text-[8px] font-mono tracking-widest text-black bg-[#ffb703] font-black px-2 py-0.5 rounded-md shadow-lg uppercase leading-none">
                        {game.badge}
                      </span>

                      {/* Right Corner: Game type tag */}
                      <span className="absolute top-2.5 right-2.5 text-[8.5px] font-mono tracking-widest text-[#ffd166] bg-black/85 px-2 py-0.5 rounded-md border border-[#ffb703]/25 uppercase leading-none">
                        {game.type}
                      </span>

                      {/* Hover Overlay: Instant "Click to Play" glowing button */}
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {isLaunching ? (
                          <span className="bg-[#ffb703] text-black text-[10px] font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xl scale-100 animate-pulse uppercase tracking-widest">
                            <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full shrink-0" />
                            Launching...
                          </span>
                        ) : game.type === 'arcade' && isArcadeSystemLocked ? (
                          <span className="bg-red-600 text-white text-[10px] font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xl uppercase tracking-widest border border-red-500/30">
                            Locked (Resource Refresh)
                          </span>
                        ) : game.type === 'arcade' && (dailyArcadeGoldClaimed >= 150 || deviceDailyGoldClaimed >= 300) ? (
                          <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xl uppercase tracking-widest border border-zinc-700/50">
                            🔒 Daily Limit Met
                          </span>
                        ) : (
                          <span className="bg-[#ffb703] text-black text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xl scale-95 group-hover:scale-100 transition-all duration-300 uppercase tracking-widest">
                            <Play className="w-3.5 h-3.5 fill-black text-black" />
                            Launch App
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title, Details, and Right Play Button with perfect overflow protection */}
                    <div className="mt-4 px-1 flex items-center justify-between gap-3 w-full overflow-hidden select-none">
                      {/* Left column details */}
                      <div className="flex-1 min-w-0 flex flex-col text-left">
                        <h3 className="font-sans font-extrabold text-xs text-white group-hover:text-[#ffd166] transition tracking-wide uppercase truncate leading-snug">
                          {game.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-zinc-500 leading-none overflow-hidden">
                          <span className="uppercase text-zinc-400 font-bold truncate shrink max-w-[85px]">{game.category}</span>
                          <span className="text-zinc-650">•</span>
                          <span className="text-[#ffd166] font-bold shrink-0">{game.multiplierScale}</span>
                        </div>
                      </div>

                      {/* Right sideized Play action button */}
                      <div className="shrink-0">
                        {isLaunching ? (
                          <span
                            className="h-7 px-2.5 bg-zinc-805 text-zinc-400 font-extrabold text-[8.5px] border border-zinc-800 tracking-wider rounded-lg uppercase flex items-center justify-center gap-1 animate-pulse"
                          >
                            Wait...
                          </span>
                        ) : game.type === 'arcade' && isArcadeSystemLocked ? (
                          <span
                            className="h-7 px-2.5 bg-red-950 text-red-400 font-extrabold text-[8.5px] border border-red-500/25 tracking-wider rounded-lg uppercase flex items-center justify-center gap-1"
                          >
                            Refresh
                          </span>
                        ) : game.type === 'arcade' && (dailyArcadeGoldClaimed >= 150 || deviceDailyGoldClaimed >= 300) ? (
                          <span
                            className="h-7 px-2.5 bg-zinc-900 text-zinc-500 font-extrabold text-[8.5px] border border-zinc-800 tracking-wider rounded-lg uppercase flex items-center justify-center gap-1"
                          >
                            Capped 🔒
                          </span>
                        ) : (
                          <span
                            className="h-7 px-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-black text-[8.5px] tracking-wider rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#ffb703]/10 uppercase flex items-center justify-center gap-1 cursor-pointer font-sans"
                          >
                            <Play className="w-2 h-2 fill-black text-black shrink-0" />
                            Play
                          </span>
                        )}
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h3 className="text-white text-base font-bold uppercase tracking-wider">No matching games found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">Try tweaking your search query or flipping through categories to locate your arcade module.</p>
            </div>
          )}

          {/* STATIC SUB-HUB TRADING STATS */}
          <div className="mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-650 text-xs font-mono">
            <div className="flex flex-col text-center md:text-left gap-1">
              <p className="text-zinc-500 font-bold tracking-wide uppercase">Game Center</p>
              <p>Play games easily on your mobile or desktop.</p>
            </div>
            <div className="text-center md:text-right text-[#ffd166]">
              <p>All high scores are saved automatically.</p>
              <p className="font-semibold mt-0.5">Poki game hub</p>
            </div>
          </div>

          {/* Persistent high-revenue ExoClick banner ad zone */}
          <div className="mt-8">
            <ExoClickBottomBanner />
          </div>
        </motion.div>
      </div>

      {/* 4. IMMERSIVE OVERLAY GAME CONTROLLER MOUNT ROOM */}
      <AnimatePresence>
        {selectedGameId && (
          <motion.div
            key="game-room"
            ref={gameRoomRef}
            id="game-container-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-0 z-[100] w-screen h-screen bg-[#070709] flex flex-col overflow-hidden ${isFullscreen ? "is-app-fullscreen" : ""}`}
          >
            {/* Full-Screen Immersive Header for dynamic gameplays */}
            <div className="bg-[#0b0c10] px-4 md:px-6 py-3 flex items-center justify-between border-b border-[#ffb703]/10 h-14 shrink-0 shadow-lg z-10 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    synth.playCoin();
                    handleCloseGame();
                  }}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#ffb703] font-mono tracking-wider cursor-pointer font-bold uppercase transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#ffb703]" />
                  ‹ Exit
                </button>
                <button
                  onClick={() => {
                    synth.playCoin();
                    toggleFullscreen();
                  }}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-white font-mono tracking-wider cursor-pointer font-bold uppercase transition bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg active:scale-95 shadow-md shadow-black/10"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="w-3.5 h-3.5 text-[#ffd166]" />
                      Windowed
                    </>
                  ) : (
                    <>
                      <Maximize className="w-3.5 h-3.5 text-[#ffb703] animate-pulse" />
                      Fullscreen
                    </>
                  )}
                </button>
              </div>
              
              <div className="font-extrabold text-xs sm:text-xs text-[#ffd166] tracking-widest uppercase font-mono hidden xs:block">
                {menuGames.find(g => g.id === selectedGameId)?.title || 'PRO GAMEPLAY MODE'}
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-widest hidden md:inline">Play Coins:</span>
                  <div className="bg-[#ffb703]/10 text-[#ffb703] border border-[#ffb703]/30 px-2.5 py-1 rounded-xl font-mono text-xs font-black shadow-sm shadow-[#ffb703]/5 flex items-center gap-1" title="Poki Play Gold">
                    <span className="text-[10px]">🪙</span>
                    <span>{pokiGamingGold.toFixed(2)} PKGG</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-widest hidden md:inline">Winnings:</span>
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-mono text-xs font-black shadow-sm shadow-emerald-500/5 flex items-center gap-1" title="Poki Convertible Winnings">
                    <span className="text-[10px]">🏆</span>
                    <span>{pokiGoldWinning.toFixed(2)} PKG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sleek Visual Toast Overlay for Optimal Fullscreen Gaming Layout - HIDDEN/COMMENTED OUT PER SPECIFICATION 2 */}
            {/* <AnimatePresence>
              {fullscreenToastActive && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="fixed top-16 left-1/2 -translate-x-1/2 z-[120] bg-zinc-950/95 backdrop-blur-md border border-zinc-800 text-zinc-200 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 max-w-xs sm:max-w-md pointer-events-none font-sans"
                >
                  <div className="p-1.5 bg-[#ffb703]/10 border border-[#ffb703]/20 rounded-lg text-[#ffb703] shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black tracking-widest text-[#ffb703] uppercase font-mono">System Optimization</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed font-semibold">
                      Optimal Gaming Layout Loaded. Play in full-screen mode to prevent navigation gesture conflicts.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence> */}

            <div 
              style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
              className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#0d0d0f] !flex !flex-col items-center justify-start w-full ${isFullscreen ? "p-0" : "p-1 xs:p-2 sm:p-4 md:p-6"}`}
            >
              <div 
                className={`w-full h-full flex flex-col justify-start gap-4 ${isFullscreen ? "max-w-none" : "max-w-5xl"}`}
                style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
              >
                <div 
                  style={{ 
                    height: isFullscreen ? '100%' : 'unset', 
                    flexGrow: 1, 
                    minHeight: isFullscreen ? '100%' : '70vh', 
                    maxHeight: isFullscreen ? '100%' : '80vh', 
                    paddingBottom: isFullscreen ? '0px' : '30px' 
                  }}
                  className={`flex-1 w-full bg-[#0b0c10] !flex !flex-col shadow-2xl ${isFullscreen ? "rounded-none border-0 !min-h-full !max-h-none !pb-0" : "border border-zinc-900/80 rounded-3xl overflow-hidden !min-h-[70vh] !max-h-[80vh] !pb-[30px]"}`}
                >
                  {isGameLoading ? (
                    <GameLoadingLoader
                      gameId={selectedGameId || ''}
                      gameTitle={loadingGameTitle}
                      onCancel={() => {
                        synth.playClick();
                        triggerHaptic('light');
                        setIsGameLoading(false);
                        setSelectedGameId(null);
                      }}
                    />
                  ) : (
                    <>
              {/* RENDERS CORRESPONDING ARCADE AND CASINO CORES */}
              {selectedGameId === 'jump_overdrive' && (
                <PokiJumpOverdrive
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'flappy_vector' && (
                <FlappyPokiVector
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'plinko_drop' && (
                <PlinkoCryptoDrop
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'space_miner' && (
                <PokiSpaceMiner
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'tower_stacker' && (
                <PokiTowerStacker
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'minesweeper' && (
                <CryptoMinesweeper
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'brick_breaker' && (
                <NeonGridBrickBreaker
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'ballistic_knife' && (
                <PokiBallisticKnife
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'dino_run' && (
                <DinoRun
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'puzzle_2048' && (
                <Puzzle2048
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'math_master' && (
                <NeonMathMaster
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'memory_match' && (
                <MemoryMatch
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}

              {/* Casino engines */}
              {selectedGameId === 'crash' && (
                <PokiCrash
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'roulette' && (
                <CryptoRoulette
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'dice' && (
                <CyberDice
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'slots' && (
                <PokiSlots
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'fortune' && (
                <WheelOfFortune
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'hilo' && (
                <HiloLedger
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'coinflip' && (
                <CoinFlipBlitz
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'blackjack' && (
                <BlackjackMini
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'keno' && (
                <KenoMatrix
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'shell' && (
                <PokiShellGame
                  pokiBalance={pokiGamingGold + pokiGoldWinning}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}

              {/* 8 BRAND NEW GOLD CASINO GAME WRAPPING PORTALS */}
              {selectedGameId === 'dice_duel' && (
                <div id="dice_duel_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <DiceDuel
                    pokiBalance={pokiGamingGold + pokiGoldWinning}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'lucky_mines' && (
                <div id="lucky_mines_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <LuckyMines
                    pokiBalance={pokiGamingGold + pokiGoldWinning}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'baccarat_lite' && (
                <div id="baccarat_lite_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <BaccaratLite
                    pokiBalance={pokiGamingGold + pokiGoldWinning}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'sic_bo' && (
                <div id="sic_bo_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <SicBo
                    pokiBalance={pokiGamingGold + pokiGoldWinning}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'wheel_hype' && (
                <div id="wheel_hype_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <WheelOfFortuneHype
                    pokiBalance={pokiGamingGold + pokiGoldWinning}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}
                    </>
                  )}
                </div>

                {/* LIVE WINNER TICKER WIDGET (SOCIAL PROOF) */}
                <div id="live-winner-ticker-widget" className="bg-[#0f1115] border border-zinc-800/80 rounded-2xl p-4 mt-2 shadow-xl select-none relative shrink-0 flex flex-col" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5 mb-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#ffd166]/80 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                      </span>
                      Live Winner Ledger
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-widest">Real-time Verified</span>
                  </div>
                  <div className="space-y-1.5 text-left !max-h-[60px] !overflow-y-auto flex-1 pr-1" style={{ maxHeight: '60px', overflowY: 'auto' }}>
                    <AnimatePresence initial={false}>
                      {liveWins.map((win) => (
                        <motion.div
                          key={win.id}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs text-zinc-300 font-mono flex items-center justify-between py-1 border-b border-zinc-900/50"
                        >
                          <span>{win.text}</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold font-sans">Verified ✅</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Winnings Conversion Popup Loop */}
      <AnimatePresence>
        {pendingWinningsBet && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111318] border border-[#ffb703]/30 rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Coins className="w-6 h-6 text-[#ffd166] animate-pulse" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wide font-sans mb-2">Insufficient Play Balance</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Your standard play balance is insufficient. Do you want to convert <span className="text-[#ffd166] font-bold">{(pendingWinningsBet.amount - pokiGamingGold).toFixed(1)} PKG</span> from your convertible winnings to complete this bet?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    synth.playCoin();
                    confirmWinningsFallback();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-yellow-500/10 text-center"
                >
                  Yes, Convert
                </button>
                <button
                  onClick={() => {
                    synth.playClick();
                    setPendingWinningsBet(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-wider hover:text-white hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: AUTOMATED UPI TOP-UP SHOP INDEPENDENT MODAL */}
      <AnimatePresence>
        {topUpModalActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4 poki-module"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-[#111318]/90 border border-[#ffb703]/20 shadow-[0_0_50px_rgba(255,183,3,0.15)] rounded-3xl p-6 relative text-left backdrop-blur-xl"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  if (topUpStatus === 'submitting') return;
                  synth.playCoin();
                  setTopUpModalActive(false);
                }}
                disabled={topUpStatus === 'submitting'}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white disabled:opacity-50 transition w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-zinc-800 cursor-pointer text-xs"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-5">
                <div className="w-10 h-10 bg-[#ffb703]/10 border border-[#ffb703]/30 rounded-xl flex items-center justify-center text-[#ffb703]">
                  <Zap className="w-5 h-5 fill-current animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-widest text-[#ffd166] uppercase">Instant UPI Token Shop</h3>
                  <p className="text-[10px] text-zinc-500 font-mono">Automated Ledger Settlement</p>
                </div>
              </div>

              {/* Package Selection Grid */}
              <div className="space-y-1.5 mb-4">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Select Token Package</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    disabled={topUpStatus === 'submitting'}
                    onClick={() => {
                      synth.playCoin();
                      setSelectedPackage({ tokens: 500, price: 50 });
                      setCustomPriceInput('50');
                    }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedPackage?.price === 50 && customPriceInput === '50'
                        ? 'bg-[#ffb703]/10 border-[#ffb703] shadow-[0_0_15px_rgba(255,183,3,0.1)]'
                        : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base font-black text-white font-mono">500 <span className="text-xs text-[#ffb703]">Tokens</span></span>
                    <span className="text-[10px] text-zinc-500 font-bold mt-1">Pay ₹50 INR</span>
                  </button>

                  <button
                    disabled={topUpStatus === 'submitting'}
                    onClick={() => {
                      synth.playCoin();
                      setSelectedPackage({ tokens: 1100, price: 100 });
                      setCustomPriceInput('100');
                    }}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      selectedPackage?.price === 100 && customPriceInput === '100'
                        ? 'bg-[#ffb703]/10 border-[#ffb703] shadow-[0_0_15px_rgba(255,183,3,0.1)]'
                        : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-base font-black text-white font-mono">1100 <span className="text-xs text-[#ffb703]">Tokens</span></span>
                    <span className="text-[10px] text-zinc-500 font-bold mt-1">Pay ₹100 INR</span>
                  </button>
                </div>

                {/* Custom Recharge Amount Input */}
                <div className="space-y-1.5 mb-4">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Or Enter Custom Recharge Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      placeholder="₹ Enter ₹10 to ₹1000"
                      value={customPriceInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setCustomPriceInput(val);
                        const numericVal = Number(val);
                        if (numericVal >= 10 && numericVal <= 1000) {
                          // Standard conversion: ₹1 INR = 10 Tokens
                          setSelectedPackage({
                            price: numericVal,
                            tokens: numericVal * 10
                          });
                        } else {
                          setSelectedPackage(null);
                        }
                      }}
                      disabled={topUpStatus === 'submitting' || topUpStatus === 'success'}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#ffb703] text-zinc-200 pl-4 pr-12 py-3 rounded-xl outline-none transition text-xs font-mono"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold text-[10px] uppercase font-mono">INR</span>
                  </div>
                  <p className="text-[9px] text-[#ffb703] font-mono mt-1 leading-normal">
                    {selectedPackage 
                      ? `Reward: ${selectedPackage.tokens} tokens loaded instantly`
                      : "Please specify a numeric value between ₹10 and ₹1000 INR."
                    }
                  </p>
                </div>
              </div>

              {selectedPackage && (
                <>
                  {/* Dynamic UPI Address Context */}
                  <div className="bg-black/60 p-4 border border-zinc-800/80 rounded-2xl mb-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">Scan QR or Tap to Pay</p>
                    
                    {/* Generates standard UPI QR using qrserver API */}
                    <div className="p-3 bg-white rounded-xl border border-zinc-700/30 flex items-center justify-center shadow-lg mb-3">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0b0c10&data=${encodeURIComponent(
                          `upi://pay?pa=seller86990@okicici&pn=POKI_GAME&am=${selectedPackage.price}&cu=INR&tn=POKI_VOUCHER`
                        )}`}
                        alt="UPI Payment QR"
                        className="w-36 h-36 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <a
                      href={`upi://pay?pa=seller86990@okicici&pn=POKI_GAME&am=${selectedPackage.price}&cu=INR&tn=POKI_VOUCHER`}
                      onClick={() => synth.playCoin()}
                      className="px-4 py-2 bg-[#ffb703]/10 border border-[#ffb703]/30 hover:bg-[#ffb703] hover:text-black text-[#ffd166] text-[10px] font-black tracking-wider uppercase rounded-lg transition-all animate-none text-center inline-block cursor-pointer"
                    >
                      📱 Pay via UPI Client App
                    </a>
                  </div>

                  {/* UTR reference submission */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Enter 12-Digit PhonePe/GPay UTR</label>
                      <span className="text-[8px] text-zinc-500 font-mono">12 Digits Only</span>
                    </div>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 412345678901"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      disabled={topUpStatus === 'submitting' || topUpStatus === 'success'}
                      className="w-full bg-black/60 border border-zinc-800 focus:border-[#ffb703] text-zinc-200 px-4 py-3 rounded-xl outline-none transition text-center text-xs font-mono tracking-widest"
                    />
                  </div>

                  {/* Error Notification inside validation portal */}
                  {topUpError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-rose-400 rounded-xl p-3 text-[10px] flex items-center gap-2 mb-4 leading-relaxed">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
                      <span>{topUpError}</span>
                    </div>
                  )}

                  {/* Top-up submit and claim buttons */}
                  {topUpStatus === 'idle' && (
                    <button
                      onClick={handleTopUpClaim}
                      className="w-full py-3.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer font-sans shadow-lg shadow-[#ffb703]/10"
                    >
                      ⚡ Validate UTR & Add Tokens
                    </button>
                  )}

                  {topUpStatus === 'submitting' && (
                    <div className="w-full py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs text-center rounded-xl font-mono flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#ffb703]" />
                      <span>Querying Blockchain Node used_utrs...</span>
                    </div>
                  )}

                  {topUpStatus === 'success' && (
                    <div className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs text-center leading-relaxed">
                        🎉 <strong className="text-white block mb-0.5 uppercase tracking-wider">Settlement Approved!</strong>
                        Verified unique transaction. {selectedPackage.tokens} tokens credited instantly to your account. Play on!
                      </div>
                      <button
                        onClick={() => {
                          synth.playCoin();
                          setTopUpModalActive(false);
                          setTopUpStatus('idle');
                        }}
                        className="w-full py-2.5 bg-zinc-800 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-zinc-700 transition"
                      >
                        Great, Thank You!
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP: TRANSFER TO MAIN WALLET MODAL */}
      <AnimatePresence>
        {transferModalActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[80] flex items-center justify-center p-3 sm:p-4 poki-module overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="max-w-xl w-full bg-[#0a0c10] border border-cyan-500/20 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(6,182,212,0.15)] relative text-left my-8"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  if (transferStatus === 'processing' || isWatchingAd) return;
                  synth.playCoin();
                  setTransferModalActive(false);
                }}
                disabled={transferStatus === 'processing' || isWatchingAd}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white disabled:opacity-50 transition w-8 h-8 rounded-full bg-black/40 flex items-center justify-center border border-zinc-800 cursor-pointer text-xs z-20"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4 mb-5">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#ffb703] to-[#ffd166] rounded-xl flex items-center justify-center shadow-md">
                  <Database className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-widest text-[#ffd166] uppercase">Manage Tokens</h3>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wider">Withdraw your tokens or earn free ones below</p>
                </div>
              </div>

              {/* IS WATCHING AD INTERSTITIAL */}
              {isWatchingAd ? (
                <div className="bg-[#12141c] border border-[#ffb703]/25 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-16 h-16 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/30 flex items-center justify-center text-[#ffb703] mb-5 animate-spin">
                    <RefreshCw className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-white uppercase tracking-wider mb-2">Showing brief advertisement...</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">Please wait a few seconds while we credit your tokens.</p>
                  
                  <div className="inline-flex items-center justify-center bg-black/80 border border-zinc-800 px-6 py-3 rounded-full gap-2.5">
                    <span className="text-2xl font-black text-[#ffb703] font-mono">{adCountdown}s</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono">Remaining</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* UNIFIED TOKEN BALANCE DISPLAY */}
                  <div className="mb-5 select-none text-left">
                    <div className="bg-[#12141c]/90 p-5 border border-[#ffb703]/15 hover:border-[#ffb703]/30 rounded-2xl relative transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[8.5px] uppercase tracking-widest text-zinc-400 font-black">Your Balance</span>
                          <span className="text-[7.5px] tracking-wide font-mono text-[#ffb703] font-bold uppercase bg-[#ffb703]/10 border border-[#ffb703]/20 px-1.5 py-0.5 rounded">Active Tokens</span>
                        </div>
                        <p className="text-3xl font-black text-white font-mono tracking-tight leading-none">
                          {pokiBalance.toFixed(0)}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-medium mt-2 leading-relaxed">
                          Use these tokens to play games or request a direct withdrawal.
                        </p>
                      </div>

                      <div className="sm:self-center shrink-0 w-full sm:w-auto">
                        {getAdLimitStatus().isLocked ? (
                          <div className="flex flex-col items-center sm:items-end gap-1.5 select-none text-right">
                            <button
                              disabled
                              className="w-full sm:w-auto text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 py-2.5 bg-zinc-900 border border-zinc-900 rounded-xl cursor-not-allowed font-sans"
                            >
                              ⏳ 3 Ad Daily Limit
                            </button>
                            <span className="text-[10px] text-[#ffb703] font-mono tracking-wider font-bold">
                              Next Ad in: {formatAdTimeLeft(getAdLimitStatus().timeLeftMs)}
                            </span>
                          </div>
                        ) : isPreloadingAd ? (
                          <button
                            disabled
                            className="w-full sm:w-auto text-center text-[10px] font-black text-zinc-500 uppercase tracking-widest px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-not-allowed font-sans animate-pulse"
                          >
                            🔌 Pre-loading Ad ({adPreloadTimer}s)...
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              watchAdAndEarnTokens();
                            }}
                            className="w-full sm:w-auto text-center text-[10px] font-black text-white hover:text-black uppercase tracking-widest px-4 py-2.5 bg-zinc-900 border border-[#ffb703]/20 hover:bg-[#ffb703] hover:border-[#ffb703] rounded-xl transition cursor-pointer font-sans active:scale-95 shadow-md"
                          >
                            🎥 Watch & Earn +15 Free Tokens
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COIN TRANSFER TERMINAL DIRECT LINK */}
                  <div className="bg-[#12141c]/95 border border-[#ffb703]/25 rounded-2xl p-6 mb-5 select-none text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <ArrowRightLeft className="w-5 h-5 text-[#ffd166]" />
                      <span className="text-sm font-black uppercase tracking-wider text-[#ffd166] font-sans">Transfer Coin</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mb-5 max-w-sm mx-auto">
                      Securely manage, convert, or transfer your gaming coins and winnings back to your main wallet using our secure centralized portal.
                    </p>
                    <a
                      href={MAIN_APP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => synth.playClick()}
                      className="w-full inline-flex py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-widest rounded-xl transition duration-200 shadow-[0_4px_15px_rgba(212,175,55,0.15)] font-mono items-center justify-center gap-2 cursor-pointer text-center"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-black animate-pulse" />
                      Transfer Coin
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACK-EXIT DOUBLE-TAP OVERLAY MODAL */}
      <AnimatePresence>
        {exitOverlayActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0b0c10] z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/25 rounded-3xl p-8 shadow-2xl relative">
              <div className="w-16 h-16 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703] mx-auto mb-5 animate-pulse">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest leading-tight">
                Exited App
              </h2>
              <p className="text-zinc-400 text-xs mt-3 mb-8 leading-relaxed font-sans">
                You have backed out of the gameplay. Your tokens have been safely saved to your account. Click below to continue playing!
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setExitOverlayActive(false);
                    synth.playCoin();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer tracking-widest"
                >
                  🚀 Back to Game
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SLEEK AMBER/GOLD RECTANGULAR TOAST ACCENT ON HOME */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-y-1/2 -translate-x-1/2 z-[90] bg-[#171a21] border border-[#ffb703] px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-2xl tracking-wide select-none outline-none max-w-sm w-full font-mono text-[10px]"
          >
            <span className="w-2 h-2 rounded-full bg-[#ffb703] animate-ping" />
            <span className="text-zinc-200 mt-0.5">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL AUTOMATED GAME OVER / MATCH FORFEITED OVERLAY (Point 9) */}
      <AnimatePresence>
        {isForfeited && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[120] flex items-center justify-center p-4 text-left select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="max-w-md w-full bg-[#0d0707] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] relative max-h-[90vh] overflow-y-auto pb-6"
            >
              <div className="flex items-center gap-3 border-b border-red-950/40 pb-4 mb-4 text-left">
                <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-widest leading-none">Match Forfeited</h3>
                  <p className="text-[9px] text-red-500 font-mono tracking-wider uppercase font-bold mt-1">Integrity Violation Triggered</p>
                </div>
              </div>

              <p className="text-zinc-400 text-xs leading-relaxed mb-4 text-left">
                To prevent memory hacking, automatic score exploitation, or timing manipulation, your ongoing match was automatically terminated and locked due to:
              </p>

              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-5 font-mono text-center">
                <span className="text-red-400 font-extrabold text-[10px] uppercase tracking-wider">
                  ⚠️ {forfeitReason || "Tab Focus Loss / Minimization"}
                </span>
              </div>

              {/* Settle Details */}
              <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-3 mb-6 font-mono text-xs text-left">
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Match Ending State:</span>
                  <span className="text-red-400 font-bold uppercase">ABORTED & SETTLED</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500">
                  <span>Extracted Progress Score:</span>
                  <span className="text-zinc-300 font-bold">{forfeitCoins} Points</span>
                </div>
                <div className="border-t border-zinc-900 pt-3 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold">Winnings Sync Ledger:</span>
                  <span className="text-emerald-500 font-bold">+{forfeitCoins} PKG Safe</span>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 mb-6">
                <p className="text-[10px] text-zinc-500 leading-relaxed font-mono uppercase tracking-wider text-center">
                  Live database parameters synchronized with current progress state to preserve game parity.
                </p>
              </div>

              <button
                onClick={() => {
                  synth.playClick();
                  setIsForfeited(false);
                  setForfeitCoins(0);
                  setForfeitReason('');
                }}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black uppercase rounded-2xl transition cursor-pointer hover:shadow-lg hover:shadow-red-600/15 text-center tracking-wider"
              >
                Acknowledge & Exit Lobby
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING SUCCESS TOAST COMPONENT (Point 10) */}
      <AnimatePresence>
        {rewardToast && rewardToast.show && (
          <div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-400 font-medium tracking-wide text-sm whitespace-nowrap animate-bounce"
          >
            <span>{rewardToast.message}</span>
          </div>
        )}
      </AnimatePresence>

      {/* GAME PLAY LEDGER HISTORY OVERLAY MODAL */}
      <AnimatePresence>
        {historyModalActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#07080a]/90 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0e0f14] border border-[#ffb703]/20 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh] overflow-y-auto pb-6 select-none text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ffb703]/10 border border-[#ffb703]/20 rounded-xl">
                    <Trophy className="w-5 h-5 text-[#ffd166]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-wider text-white uppercase font-sans">Gameplay Ledger</h3>
                    <p className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase">Live ledger records of your games</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    synth.playClick();
                    triggerHaptic('light');
                    setHistoryModalActive(false);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition text-sm font-sans"
                >
                  ✕
                </button>
              </div>

              {/* List of past sessions */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2 scrollbar-thin">
                {historyLogs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs font-sans">
                    <Sparkles className="w-8 h-8 mx-auto text-zinc-700 mb-3 animate-pulse" />
                    <p className="font-bold uppercase tracking-wider text-zinc-400">Ledger empty</p>
                    <p className="text-[10px] text-zinc-600 mt-1 max-w-xs mx-auto font-mono">No gaming sessions completed yet. Play games above to sync real-time records.</p>
                  </div>
                ) : (
                  historyLogs
                    .filter(item => {
                      const validTypes = ['game_play', 'arcade_gameplay_win', 'Platform_Transfer', 'upi_topup', 'Winnings_Conversion', 'winning_tokens_conversion'];
                      return item && validTypes.includes(item.type);
                    })
                    .map((item, idx) => {
                      const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending';

                      if (item.type === 'game_play') {
                        const isWin = item.profitLoss > 0;
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-[#12141c]/50 border border-zinc-900/60 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition duration-200"
                          >
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white uppercase tracking-wide truncate">
                                  {item.game || 'Casino Game'}
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span className="uppercase text-[#ffb703] font-bold">Verified</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className={`text-xs font-black font-mono uppercase tracking-tight ${isWin ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-bold'}`}>
                                {isWin ? 'Win' : 'Loss'}
                              </div>
                              <div className={`text-[10px] font-bold font-mono mt-0.5 ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.profitLoss > 0 ? '+' : ''}{item.profitLoss.toFixed(2)} PKGG
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === 'arcade_gameplay_win') {
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-[#12141c]/50 border border-zinc-900/60 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition duration-200"
                          >
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white uppercase tracking-wide truncate">
                                  🎮 {item.game || 'Arcade Game'}
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span className="uppercase text-[#ffb703] font-bold">Verified</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black font-mono text-emerald-400">
                                WIN
                              </div>
                              <div className="text-[10px] font-bold font-mono mt-0.5 text-emerald-500">
                                +{(item.payoutAwarded || 0).toFixed(2)} PKG
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === 'Platform_Transfer') {
                        const amount = item.rawAmount || 0;
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-[#12141c]/50 border border-zinc-900/60 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition duration-200"
                          >
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white uppercase tracking-wide truncate">
                                  💸 Main Wallet Transfer
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span className="uppercase text-[#ffb703] font-bold">{item.status || 'Success'}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black font-mono text-rose-400">
                                DEBIT
                              </div>
                              <div className="text-[10px] font-bold font-mono mt-0.5 text-rose-500">
                                -{amount.toFixed(2)} PKG
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === 'upi_topup') {
                        const tokens = item.tokens || 0;
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-[#12141c]/50 border border-zinc-900/60 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition duration-200"
                          >
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white uppercase tracking-wide truncate">
                                  💰 UPI Top-Up
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span className="uppercase text-[#ffb703] font-bold">UTR: {item.utr || 'UPI'}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black font-mono text-emerald-400">
                                CREDIT
                              </div>
                              <div className="text-[10px] font-bold font-mono mt-0.5 text-emerald-500">
                                +{tokens.toFixed(2)} PKGG
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (item.type === 'Winnings_Conversion' || item.type === 'winning_tokens_conversion') {
                        const amount = item.amount || 0;
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-[#12141c]/50 border border-zinc-900/60 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition duration-200"
                          >
                            <div className="text-left flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white uppercase tracking-wide truncate">
                                  🔄 Winnings Conversion
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                                <span>{dateStr}</span>
                                <span>•</span>
                                <span className="uppercase text-[#ffb703] font-bold">Verified</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black font-mono text-amber-400">
                                ROUTED
                              </div>
                              <div className="text-[10px] font-bold font-mono mt-0.5 text-amber-500">
                                -{amount.toFixed(2)} PKG
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })
                )}
              </div>

              {/* Footer info banner */}
              <div className="border-t border-zinc-900 pt-4 text-center mt-2 flex items-center justify-center gap-2">
                <Database className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">Database Ledger Server Sync: Active</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </ AnimatePresence>

      {/* FLOATING VIBRATION/HAPTIC CONTROLLER */}
      <button
        onClick={() => {
          const next = !hapticEnabled;
          setHapticEnabled(next);
          localStorage.setItem('haptic_enabled', String(next));
          synth.playClick();
          if (next && navigator.vibrate) {
            navigator.vibrate(30);
          }
        }}
        className="fixed bottom-4 right-14 z-40 w-8 h-8 bg-zinc-950/90 border border-zinc-800/80 hover:border-[#ffb703]/50 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/80 cursor-pointer"
        title={hapticEnabled ? "Disable Haptic Feedback" : "Enable Haptic Feedback"}
      >
        <Smartphone className={`w-3.5 h-3.5 ${hapticEnabled ? 'text-[#ffb703]' : 'text-zinc-650'}`} />
      </button>

      {/* FLOATING VOICE/SOUND MUTE CONTROLLER */}
      <button
        onClick={handleMuteToggle}
        className="fixed bottom-4 right-4 z-40 w-8 h-8 bg-zinc-950/90 border border-zinc-800/80 hover:border-[#ffb703]/50 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/80 cursor-pointer"
        title="Toggle Sound"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-[#ffb703]" />}
      </button>

      {/* FULL-SCREEN ADVERTISEMENT INTERCEPTOR OVERLAY */}
      <AnimatePresence>
        {showFullscreenPostGameAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Fine Scanlines or Grid overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div 
              className="max-w-md w-full border border-[#d4af37]/40 p-8 rounded-3xl relative overflow-hidden flex flex-col items-center max-h-[90vh] overflow-y-auto pb-8 transition-all duration-300"
              style={{ background: '#0B0E14', boxShadow: '0 0 20px rgba(212, 175, 55, 0.25)' }}
            >
              {/* Premium Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4af37]/40 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4af37]/40 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4af37]/40 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4af37]/40 rounded-br-xl" />

              {/* SPONSORED MEDIATION ACCENT BADGE */}
              <div className="px-3 py-1 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-[9px] font-mono font-black text-[#d4af37] uppercase tracking-widest mb-6">
                ⚡ SPONSORED PROMOTIONAL BROADCAST ⚡
              </div>

              {/* Interactive Spinning Video Symbol */}
              <div className="w-16 h-16 rounded-2xl bg-black/50 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] text-xl font-bold font-mono shadow-xl shadow-black/80 mb-6 animate-pulse">
                AD
              </div>

              {/* Advertisement text details */}
              <h3 className="text-sm font-black text-white tracking-widest uppercase mb-2 font-mono leading-tight">
                LOADING PREMIUM VIDEO SPONSOR
              </h3>
              
              <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase max-w-xs mx-auto mb-6">
                {currentAdSubtext?.toUpperCase()}
              </p>

              {/* Animated Circular Progress ring / Countdown */}
              <div className="relative w-24 h-24 flex items-center justify-center mt-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(212, 175, 55, 0.1)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#d4af37"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (6 - fullscreenAdCountdown)) / 6}
                    className="transition-all duration-300 ease-linear"
                  />
                </svg>
                <span className="absolute text-2xl font-black text-white font-mono tracking-widest">
                  {fullscreenAdCountdown}s
                </span>
              </div>

              <div className="text-[9px] text-[#d4af37] font-mono tracking-widest uppercase font-bold mt-8">
                Your game progress is secured. Resume after ad concludes.
              </div>
            </div>
          </motion.div>
        )}

        {isWatchingAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="max-w-md w-full border border-amber-500/30 bg-[#0c0d10] p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col items-center pb-8">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-500/40 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-500/40 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-500/40 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-500/40 rounded-br-xl" />

              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest mb-6">
                ⚡ SECURE COIN PROCESSOR ⚡
              </span>

              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-bold font-mono shadow-xl mb-6 animate-pulse">
                🪙
              </div>

              <h3 className="text-base font-black text-amber-400 tracking-widest uppercase mb-2 font-mono leading-tight">
                SECURE REWARD PROCESS ACTIVE
              </h3>
              
              <p className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase max-w-xs mx-auto mb-6">
                Connecting to central node network. Please complete the full countdown to claim <span className="text-amber-400 font-bold">15 free tokens</span>!
              </p>

              {/* Progress Ring / Countdown */}
              <div className="relative w-24 h-24 flex items-center justify-center mt-2">
                <div className="absolute inset-0 border-2 border-amber-500/10 rounded-full" />
                <div className="absolute inset-1 border-2 border-dotted border-amber-400/40 rounded-full animate-spin" />
                <span className="text-3xl font-black text-white font-mono">{adCountdown}s</span>
              </div>

              <div className="text-[9px] text-[#ffb703] font-mono tracking-widest uppercase font-bold mt-8 px-4 leading-relaxed">
                ⚠️ WARNING: Closing or refreshing the portal early will instantly void the rewards.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANTI-BOT SAFETY LOCKOUT MODAL OVERLAY */}
      <AnimatePresence>
        {isLockoutActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="max-w-md w-full border border-[#D4AF37]/30 bg-[#0B0E14] p-8 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.15)] flex flex-col items-center pb-8"
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/30 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]/30 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]/30 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/30 rounded-br-xl" />

              <span className="px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[9px] font-mono font-black text-[#D4AF37] uppercase tracking-widest mb-6">
                ⚠️ System Protection Active ⚠️
              </span>

              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-2xl font-bold font-mono shadow-xl mb-6">
                🔒
              </div>

              <h3 className="text-sm font-black text-white tracking-widest uppercase mb-3 font-mono leading-tight text-center">
                ANTI-BOT SAFETY LOCKOUT
              </h3>
              
              <p className="text-xs text-zinc-300 font-sans tracking-wide uppercase max-w-sm mx-auto mb-6 text-center leading-relaxed">
                {lockoutMessage}
              </p>

              {/* Countdown Ticker */}
              <div className="flex flex-col items-center justify-center bg-black/40 border border-zinc-800/60 px-6 py-4 rounded-2xl mb-8 w-full">
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">ACCESS RESTORES IN</span>
                <span className="text-3xl font-black text-white font-mono tracking-widest mt-1">
                  {cooldownTimeRemaining}s
                </span>
              </div>

              {/* Bypass button */}
              <button
                onClick={() => {
                  synth.playClick();
                  handlePremiumBypass();
                }}
                className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:brightness-110 active:scale-95 text-black font-black text-xs uppercase tracking-widest rounded-xl transition duration-200 shadow-[0_4px_15px_rgba(212,175,55,0.2)] font-mono flex items-center justify-center gap-2 cursor-pointer animate-none"
              >
                ⚡ Bypass Timer (Pay 15 PKGG)
              </button>
              
              <span className="text-[9px] font-mono text-zinc-500 mt-3 select-none text-center">
                You have {pokiGamingGold.toFixed(2)} PKGG available.
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. ELITE CUSTOM PROFESSIONAL ALERT MODAL */}
      <AnimatePresence>
        {customAlert.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#0b0c10] border border-[#ffb703]/20 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,183,3,0.15)] relative overflow-hidden"
            >
              {/* Top border glowing line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                customAlert.type === 'success' ? 'from-emerald-500 to-teal-400' :
                customAlert.type === 'error' ? 'from-rose-600 to-red-500' :
                customAlert.type === 'warning' ? 'from-[#ffb703] to-amber-500' : 'from-blue-500 to-indigo-500'
              }`} />

              <div className="flex flex-col items-center">
                {/* Visual Icon depending on alert type */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                  customAlert.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' :
                  customAlert.type === 'error' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' :
                  customAlert.type === 'warning' ? 'bg-[#ffb703]/10 border border-[#ffb703]/30 text-[#ffb703]' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                }`}>
                  {customAlert.type === 'success' && <Trophy className="w-7 h-7" />}
                  {customAlert.type === 'error' && <ShieldAlert className="w-7 h-7" />}
                  {customAlert.type === 'warning' && <Flame className="w-7 h-7 animate-pulse" />}
                  {customAlert.type === 'info' && <Award className="w-7 h-7" />}
                </div>

                <h3 className="text-sm font-black tracking-widest text-[#ffd166] uppercase font-sans mb-3">
                  {customAlert.title}
                </h3>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-6">
                  {customAlert.message}
                </p>

                <button
                  onClick={() => {
                    synth.playClick();
                    setCustomAlert(prev => ({ ...prev, show: false }));
                    if (customAlert.callback) customAlert.callback();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-black text-xs uppercase tracking-widest rounded-xl transition duration-200 shadow-md font-mono active:scale-95 cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SINGLE ACTIVE SESSION LOCK (MULTI-TAB SESSION SYNCHRONIZATION) OVERLAY */}
      {isMultiTabLocked && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center text-red-500 mb-6 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">MULTI-TAB SESSION CONFLICT</h2>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-mono">
            Security Violation: Multiple active gaming sessions detected for this account. To prevent balance synchronization conflicts and race hazards, this window has been locked.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-mono text-xs font-black uppercase rounded-xl border border-red-500/30 cursor-pointer shadow-lg hover:shadow-red-500/20"
          >
            Reconnect Session
          </button>
        </div>
      )}

    </div>
  );
}

function GameLoadingLoader({ gameId, gameTitle, onCancel }: { gameId: string, gameTitle: string, onCancel: () => void }) {
  const [metricIndex, setMetricIndex] = useState(0);
  const metrics = [
    "VERIFYING SHIELD V9 INTEGRITY...",
    "ESTABLISHING RTC CHANNELS...",
    "MINING CASINO SEEDS...",
    "LOADING GAME CORE ENGINE...",
    "SYNCHRONIZING SECURE LEDGER..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricIndex((prev) => (prev + 1) % metrics.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const vastAdUrl = "https://s.magsrv.com/v1/vast.php?idz=5965862";

  // HTML content for inside the secure sandbox iframe to display the VAST video ad perfectly
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: black;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #video-ad-player {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover;
        }
        .fluid_video_wrapper {
          width: 100% !important;
          height: 100% !important;
        }
      </style>
      <link rel="stylesheet" href="https://cdn.fluidplayer.com/v3/current/fluidplayer.min.css" type="text/css"/>
      <script src="https://cdn.fluidplayer.com/v3/current/fluidplayer.min.js"></script>
    </head>
    <body>
      <video id="video-ad-player" autoplay muted playsinline>
        <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" type="video/mp4">
      </video>
      <script>
        var player = fluidPlayer('video-ad-player', {
          layoutControls: {
            autoPlay: true,
            mute: true,
            keyboardControl: false,
            allowTheatre: false,
            doubleclickFullscreen: false,
            playbackRateControl: false,
            logo: {
              showOverAllAnims: false
            }
          },
          vastOptions: {
            adList: [
              {
                roll: 'preRoll',
                vastTag: '${vastAdUrl}'
              }
            ],
            adErrorCallback: function() {
              window.parent.postMessage({ type: 'EXOCLICK_AD_END' }, '*');
            },
            adFinishedCallback: function() {
              window.parent.postMessage({ type: 'EXOCLICK_AD_END' }, '*');
            },
            adSkippedCallback: function() {
              window.parent.postMessage({ type: 'EXOCLICK_AD_END' }, '*');
            }
          }
        });
        
        // Safety timeout to guarantee the user transitions after 4 seconds if no ad fills
        setTimeout(function() {
          if (!player.isAdPlaying) {
            window.parent.postMessage({ type: 'EXOCLICK_AD_END' }, '*');
          }
        }, 4000);
      </script>
    </body>
    </html>
  `;

  return (
    <div className="flex-1 w-full bg-black flex flex-col items-center justify-center p-8 relative min-h-[440px] border border-zinc-800 select-none">
      {/* Top edge-to-edge cinematic warning scanline bar flashing softly */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4af37] via-amber-500 to-[#d4af37] opacity-60 animate-pulse" />
      
      {/* Absolute black backing grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <div className="max-w-lg w-full text-center flex flex-col items-center relative z-10 space-y-6">
        
        {/* Game Title */}
        <div>
          <h4 className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold leading-none font-mono">Hollywood Security Gate</h4>
          <h3 className="text-xl font-black text-[#d4af37] tracking-widest uppercase mt-3 font-sans drop-shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            {gameTitle || 'PRO GAMEPLAY'}
          </h3>
        </div>

        {/* Embedded Ad Player Box */}
        <div className="w-full max-w-md aspect-video bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <iframe
            srcDoc={iframeSrcDoc}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            title="Sponsor Pre-Roll Video Ad"
          />
        </div>

        {/* Staggered loading metrics text */}
        <div className="space-y-4 w-full">
          <div className="pt-2 h-6 flex items-center justify-center">
            <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-widest uppercase animate-pulse">
              {metrics[metricIndex]}
            </span>
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="px-5 py-2 bg-zinc-950/95 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[9px] font-mono uppercase tracking-[0.2em] font-black rounded-xl transition duration-200 active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-black"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#d4af37]" /> Abort Launch
        </button>
      </div>
    </div>
  );
}

function ExoClickBottomBanner() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    try {
      containerRef.current.innerHTML = '';
      
      const ins = document.createElement('ins');
      ins.className = 'eas6a97888e10';
      ins.setAttribute('data-zoneid', '5965858');
      
      const script = document.createElement('script');
      script.async = true;
      script.type = 'application/javascript';
      script.src = 'https://a.magsrv.com/ad-provider.js';
      
      const pushScript = document.createElement('script');
      pushScript.innerHTML = '(window.AdProvider = window.AdProvider || []).push({"serve": {}});';
      
      containerRef.current.appendChild(ins);
      containerRef.current.appendChild(script);
      containerRef.current.appendChild(pushScript);
    } catch (e) {
      console.error("[MONETIZATION] Error rendering Bottom Banner:", e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center py-4 bg-zinc-950/40 border-t border-zinc-900 overflow-hidden select-none">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase">SPONSORED ADVERTISEMENT</span>
        <div ref={containerRef} className="min-w-[300px] min-h-[100px] flex items-center justify-center bg-zinc-900/50 rounded-lg border border-zinc-800" />
      </div>
    </div>
  );
}
