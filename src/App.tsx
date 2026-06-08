/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, Coins, Flame, Award, Sparkles, Trophy, Users, Search, Play, ArrowLeft, 
  Layers, Rocket, TrendingUp, RefreshCw, Zap, Target, Circle, Dribbble, Square, 
  HelpCircle, Copy, Shuffle, Heart, Hash, Database, Volume2, VolumeX, ShieldAlert,
  ChevronRight, AlignJustify, Dices, Maximize, Minimize, Radio, Plus, Smartphone, History
} from 'lucide-react';
import { synth } from './utils/audioSynth';
import { syncGamingCreditsToFirebase } from './utils/firebaseSync';
import { GameSession } from './types';

import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

declare global {
  interface Window {
    currentUserId?: string;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyCXZkKCbqZNB-gWIoKiZE4E6W977_H4PcU",
  authDomain: "pokicoin-3a02c.firebaseapp.com",
  databaseURL: "https://pokicoin-3a02c-default-rtdb.firebaseio.com",
  projectId: "pokicoin-3a02c",
  storageBucket: "pokicoin-3a02c.firebasestorage.app",
  messagingSenderId: "660501737397",
  appId: "1:660501737397:web:7fe47fb288b6b65208f3fc"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const database = firebase.database();

// Import All Arcade Games
import PokiJetpackRush from './components/games/PokiJetpackRush';
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
import DragonTiger from './components/casino/DragonTiger';
import CrashX from './components/casino/CrashX';
import SicBo from './components/casino/SicBo';
import MiniRoulette from './components/casino/MiniRoulette';
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
  "🏆 Rahul K. secured 540 Poki Tokens in Cyber Runner !",
  "🏆 Aman S. secured 1,200 Poki Tokens in Hi-Lo Ledger !",
  "🏆 Priya M. secured 450 Poki Tokens in Blackjack Elite !",
  "🏆 Vikram S. secured 1,800 Poki Tokens in Mini Roulette !",
  "🏆 Jaspreet D. secured 320 Poki Tokens in Space Miner !",
  "🏆 Karan G. secured 750 Poki Tokens in Wheel of Fortune !",
  "🏆 Nikhil J. secured 210 Poki Tokens in dino run classic !",
  "🏆 Sonia T. secured 980 Poki Tokens in Dragon Tiger !",
  "🏆 Ritesh K. secured 1,500 Poki Tokens in Crash Force !",
  "🏆 Deepak M. secured 640 Poki Tokens in Dice Duel Pro !",
  "🏆 Aayush N. secured 900 Poki Tokens in Memory Grid !",
  "🏆 Sneha P. secured 350 Poki Tokens in Brick Breaker !",
  "🏆 Rajesh R. secured 1,250 Poki Tokens in Baccarat Premium !",
  "🏆 Harish V. secured 420 Poki Tokens in Math Blitz !"
];

export default function App() {
  const testerAccountEmail = 'hunterhackingtv@gmail.com';

  // State hooks
  const [pokiBalance, setPokiBalance] = useState<number>(0);
  const [unplayedTokens, setUnplayedTokens] = useState<number>(0);
  const [winningTokens, setWinningTokens] = useState<number>(0);
  const [mainPokiCoins, setMainPokiCoins] = useState<number>(0);
  const [isWatchingAd, setIsWatchingAd] = useState<boolean>(false);
  const [adCountdown, setAdCountdown] = useState<number>(6);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tickerItems, setTickerItems] = useState<string[]>(liveWinnersMock);
  const [onlinePlayers, setOnlinePlayers] = useState<number>(() => Math.floor(Math.random() * (500 - 40 + 1)) + 40);

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
    if (!gameRoomRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (gameRoomRef.current.requestFullscreen) {
          gameRoomRef.current.requestFullscreen();
        } else if ((gameRoomRef.current as any).webkitRequestFullscreen) {
          (gameRoomRef.current as any).webkitRequestFullscreen();
        } else if ((gameRoomRef.current as any).msRequestFullscreen) {
          (gameRoomRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isGameLoading, setIsGameLoading] = useState<boolean>(false);
  const [loadingGameTitle, setLoadingGameTitle] = useState<string>('');
  const [historyModalActive, setHistoryModalActive] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
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
  const [loggedInUid, setLoggedInUid] = useState<string | null>(null);
  const [isSessionChecking, setIsSessionChecking] = useState<boolean>(true);

  // Top-Up Automated Shop states
  const [topUpModalActive, setTopUpModalActive] = useState<boolean>(false);
  const [selectedPackage, setSelectedPackage] = useState<{ tokens: number; price: number } | null>({ tokens: 500, price: 50 });
  const [customPriceInput, setCustomPriceInput] = useState<string>('50');
  const [utrInput, setUtrInput] = useState<string>('');
  const [topUpStatus, setTopUpStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Trade / Transfer state hooks
  const [transferModalActive, setTransferModalActive] = useState<boolean>(false);
  const [transferAmountInput, setTransferAmountInput] = useState<string>('');
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // App back exit state hooks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exitOverlayActive, setExitOverlayActive] = useState<boolean>(false);

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

  // Handle single and double back button intercepts for real web app navigation router
  useEffect(() => {
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
    const queryToken = urlParams.get('token');

    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname.includes('ais-dev-') || 
                             window.location.hostname.includes('ais-pre-') ||
                             window.location.hostname.includes('127.0.0.1');

    if (queryToken) {
      // Direct session validation via Firebase Realtime Database
      database.ref('active_sessions/' + queryToken).once('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const uid = typeof val === 'string' ? val : (val.uid || val.userId);
          if (uid) {
            window.currentUserId = uid;
            localStorage.setItem('poki_current_user_id', uid);
            
            // Delete token instantly to prevent re-use
            database.ref('active_sessions/' + queryToken).remove();

            // Clean query URL
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({}, '', url.toString());

            setLoggedInUid(uid);
            setIsSessionChecking(false);
          } else {
            handleInvalidSession();
          }
        } else {
          handleInvalidSession();
        }
      }, () => {
        handleInvalidSession();
      });
    } else {
      const savedUid = localStorage.getItem('poki_current_user_id');
      if (savedUid) {
        window.currentUserId = savedUid;
        setLoggedInUid(savedUid);
        setIsSessionChecking(false);
      } else {
        if (isDevEnvironment) {
          // Auto login a default testing UID in development so preview works smoothly
          const devUid = 'hunterhackingtv_dev_uid';
          window.currentUserId = devUid;
          localStorage.setItem('poki_current_user_id', devUid);
          setLoggedInUid(devUid);
          setIsSessionChecking(false);
        } else {
          // Production block: Redirect immediately
          window.location.href = 'https://minipokicoin.in';
        }
      }
    }

    function handleInvalidSession() {
      if (isDevEnvironment) {
        const devUid = 'hunterhackingtv_dev_uid';
        window.currentUserId = devUid;
        setLoggedInUid(devUid);
        setIsSessionChecking(false);
      } else {
        window.location.href = 'https://minipokicoin.in';
      }
    }
  }, []);

  // Real-time synchronization of the dual-token ecosystem (Unplayed, Winning, Main Coins)
  useEffect(() => {
    if (!loggedInUid) return;

    const userRef = database.ref('users/' + loggedInUid);
    const handleVal = (snapshot: firebase.database.DataSnapshot) => {
      const val = snapshot.val();
      if (val !== null && val !== undefined) {
        const unplayed = val.unplayedTokens !== undefined ? Number(val.unplayedTokens) : 250;
        const winning = val.winningTokens !== undefined ? Number(val.winningTokens) : 250;
        const mainCoins = val.pokiBalance !== undefined ? Number(val.pokiBalance) : 100;

        setUnplayedTokens(unplayed);
        setWinningTokens(winning);
        setMainPokiCoins(mainCoins);
        setPokiBalance(parseFloat((unplayed + winning).toFixed(4)));
      } else {
        // Initialize with default values if user account doesn't exist
        userRef.update({
          unplayedTokens: 250,
          winningTokens: 250,
          gameTokens: 500,
          pokiBalance: 100
        });
        setUnplayedTokens(250);
        setWinningTokens(250);
        setMainPokiCoins(100);
        setPokiBalance(500);
      }
    };

    userRef.on('value', handleVal);
    return () => {
      userRef.off('value', handleVal);
    };
  }, [loggedInUid]);

  // Sync balances to Local Storage on update
  useEffect(() => {
    if (pokiBalance > 0) {
      localStorage.setItem('poki_dashboard_balance', String(pokiBalance));
    }
  }, [pokiBalance]);

  // Synchronize gameplay history logs from Realtime Database in real-time
  useEffect(() => {
    if (!loggedInUid) return;

    const histRef = database.ref(`users/${loggedInUid}/history`);
    const handleHist = (snapshot: firebase.database.DataSnapshot) => {
      const val = snapshot.val();
      if (snapshot.exists() && val !== null && val !== undefined) {
        try {
          const list = Object.entries(val).map(([id, item]: [string, any]) => ({
            id,
            ...item,
            timestamp: item.timestamp || Date.now()
          })).sort((a: any, b: any) => b.timestamp - a.timestamp);
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

  // Direct balance awarding mechanism synced server-side to winningTokens node (WinZO Model)
  const awardBalance = (amount: number) => {
    if (!window.currentUserId) return;
    const ref = database.ref('users/' + window.currentUserId);
    ref.transaction((current) => {
      if (!current) current = {};
      const currentWinning = current.winningTokens !== undefined ? Number(current.winningTokens) : 250;
      const currentUnplayed = current.unplayedTokens !== undefined ? Number(current.unplayedTokens) : 250;
      const newWinning = parseFloat((currentWinning + amount).toFixed(4));
      
      current.winningTokens = newWinning;
      current.unplayedTokens = parseFloat(currentUnplayed.toFixed(4));
      current.gameTokens = parseFloat((currentUnplayed + newWinning).toFixed(4));
      return current;
    });
  };

  // Deduct balance for casino/arcade play from Unplayed Tokens first, then Winning Tokens (WinZO Model)
  const sendCredits = (amount: number) => {
    if (!window.currentUserId) return false;
    let success = false;
    
    const userRef = database.ref('users/' + window.currentUserId);
    userRef.transaction((current) => {
      if (!current) return current;
      const unplayed = current.unplayedTokens !== undefined ? Number(current.unplayedTokens) : 250;
      const winning = current.winningTokens !== undefined ? Number(current.winningTokens) : 250;
      const total = unplayed + winning;
      
      if (total >= amount) {
        let dedUnplayed = 0;
        let dedWinning = 0;
        if (unplayed >= amount) {
          dedUnplayed = amount;
        } else {
          dedUnplayed = unplayed;
          dedWinning = amount - unplayed;
        }
        current.unplayedTokens = parseFloat((unplayed - dedUnplayed).toFixed(4));
        current.winningTokens = parseFloat((winning - dedWinning).toFixed(4));
        current.gameTokens = parseFloat((current.unplayedTokens + current.winningTokens).toFixed(4));
        success = true;
        return current;
      }
      return current;
    });

    return success || pokiBalance >= amount;
  };

  // Safe game session data synchronizer writes ledger logs to Realtime Database
  const syncCasinoData = async (gameName: string, netProfitLoss: number, finalCoins: number) => {
    if (!window.currentUserId) return;
    try {
      const historyRef = database.ref(`users/${window.currentUserId}/history`).push();
      await historyRef.set({
        type: 'game_play',
        game: gameName,
        profitLoss: netProfitLoss,
        coins: finalCoins,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'VERIFIED'
      });
    } catch (e) {
      console.warn("Background history sync timed out:", e);
    }
  };

  // Arcade game session completion standard
  const handleArcadeSessionComplete = (session: any) => {
    synth.playLevelUp();
    const payout = parseFloat((session.coinsCollected * 1.5 + session.distance * 0.01).toFixed(4));
    awardBalance(payout);
    syncCasinoData('ARCADE RUN', payout, session.coinsCollected);
  };

  const handleLaunchGame = (id: string) => {
    lastScrollPosition.current = window.scrollY;
    synth.playCoin();
    triggerHaptic('light');
    setSelectedGameId(id);
    
    // Set premium Loading Indicator
    const gameObj = menuGames.find(g => g.id === id);
    setLoadingGameTitle(gameObj ? gameObj.title : 'POKI GAME');
    setIsGameLoading(true);
    setTimeout(() => {
      setIsGameLoading(false);
    }, 1300); // 1.3s premium loading effect
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

  // Standalone simulated advertisement player to earn Unplayed Tokens
  const watchAdAndEarnTokens = () => {
    if (isWatchingAd) return;

    // Check ad limit status (maximum 3 per 24 hours)
    const limitStatus = getAdLimitStatus();
    if (limitStatus.isLocked) {
      const hours = Math.floor(limitStatus.timeLeftMs / (1000 * 60 * 60));
      const minutes = Math.floor((limitStatus.timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((limitStatus.timeLeftMs % (1000 * 60)) / 1000);
      
      alert(`Daily Ad Limit Reached! You have watched 3 Video Ads. Please wait ${hours}h ${minutes}m ${seconds}s before watching again.`);
      return;
    }

    setIsWatchingAd(true);
    setAdCountdown(6);
    synth.playCoin();
    
    const interval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          
          // Credit 50 unplayed tokens atomically
          database.ref('users/' + window.currentUserId).transaction((current) => {
            if (!current) current = {};
            const currentUnplayed = current.unplayedTokens !== undefined ? Number(current.unplayedTokens) : 250;
            const currentWinning = current.winningTokens !== undefined ? Number(current.winningTokens) : 250;
            
            const newUnplayed = currentUnplayed + 50; 
            current.unplayedTokens = parseFloat(newUnplayed.toFixed(4));
            current.winningTokens = parseFloat(currentWinning.toFixed(4));
            current.gameTokens = parseFloat((newUnplayed + currentWinning).toFixed(4));
            return current;
          });
          
          setIsWatchingAd(false);
          // Credit view tracking
          trackAdView();
          synth.playLevelUp();
          
          // Log inside history
          const historyRef = database.ref(`users/${window.currentUserId}/history`).push();
          historyRef.set({
            type: 'ad_earning',
            amount: 50,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: 'SUCCESS'
          });
          
          alert("Success! You've received 50.00 Unplayed Tokens for watching the advertisement.");
          return 0;
        }
        synth.playCoin();
        return prev - 1;
      });
    }, 1000);
  };

  // Standalone TRADE / TRANSFER logic - Convert Winning Poki Tokens to Main Poki Coins (WinZO Model)
  const transferPokiToMainAccount = async () => {
    const amount = Number(transferAmountInput);
    setErrorNotification(null);

    if (winningTokens <= 0) {
      setErrorNotification("Aborted: Your Winning Poki Tokens wallet is currently empty.");
      synth.playCrash();
      return;
    }

    if (isNaN(amount) || amount <= 0 || amount > winningTokens) {
      setErrorNotification(`Aborted: Specify a valid volume of Winning Tokens (Max: ${winningTokens.toFixed(2)}).`);
      synth.playCrash();
      return;
    }

    setTransferStatus('processing');
    synth.playCoin();

    // 3.5% Platform tax, discounted to 3% for conversions of 100+ tokens
    const finalTaxRate = amount >= 100 ? 0.03 : 0.035;
    const taxFee = parseFloat((amount * finalTaxRate).toFixed(4));
    const finalCoinsToReceive = parseFloat((amount - taxFee).toFixed(4));

    try {
      const userRef = database.ref('users/' + window.currentUserId);
      let success = false;

      await userRef.transaction((data) => {
        if (!data) return data;
        
        const currentUnplayed = data.unplayedTokens !== undefined ? Number(data.unplayedTokens) : 250;
        const currentWinning = data.winningTokens !== undefined ? Number(data.winningTokens) : 250;
        const currentCoins = data.pokiBalance !== undefined ? Number(data.pokiBalance) : 100;

        if (currentWinning < amount) {
          return undefined; // aborts transaction
        }

        const newWinning = parseFloat((currentWinning - amount).toFixed(4));
        const newCoins = parseFloat((currentCoins + finalCoinsToReceive).toFixed(4));

        data.winningTokens = newWinning;
        data.unplayedTokens = parseFloat(currentUnplayed.toFixed(4));
        data.pokiBalance = newCoins;
        data.gameTokens = parseFloat((currentUnplayed + newWinning).toFixed(4));
        
        success = true;
        return data;
      });

      if (!success) {
        throw new Error("Mismatch of expected database balance.");
      }

      // Add audit history record
      const historyRef = database.ref(`users/${window.currentUserId}/history`).push();
      await historyRef.set({
        type: 'winning_tokens_conversion',
        amountConverted: amount,
        taxFeeDeducted: taxFee,
        netPokiCoinsAwarded: finalCoinsToReceive,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'SUCCESS'
      });

      setTransferStatus('success');
      synth.playLevelUp();
    } catch (e: any) {
      setErrorNotification("Aborted: Transaction consensus failed. " + (e.message || ""));
      setTransferStatus('error');
      synth.playCrash();
    }
  };

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
    { id: 'jetpack_rush', title: 'JETPACK RUSH CHRONO', type: 'arcade', badge: 'READY TO PLAY', category: 'Arcade Classics', gradient: 'from-[#ff007f] to-[#ffafbd]', multiplierScale: '1.0x - 85x', icon: Rocket, thumbnail: jetpackRushThumb },
    
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
    
    // 8 NEW PREMIUM CASINO GAMES (Dice Duel, Lucky Mines, Baccarat Lite, Dragon Tiger, Crash X, Sic Bo, Mini Roulette, Jackpot Wheel)
    { id: 'dice_duel', title: 'DICE DUEL (BET 7)', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#111111]', multiplierScale: '2.1x - 5.0x', icon: Dices, thumbnail: diceDuelThumb },
    { id: 'lucky_mines', title: 'LUCKY MINES SECTOR', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '1.01x - 100x', icon: ShieldAlert, thumbnail: luckyMinesThumb },
    { id: 'baccarat_lite', title: 'BACCARAT COUPE LITE', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#111111]', multiplierScale: '1.95x - 9.0x', icon: Heart, thumbnail: baccaratLiteThumb },
    { id: 'dragon_tiger', title: 'DRAGON TIGER GUESS', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '2.0x / 11x', icon: Zap, thumbnail: dragonTigerThumb },
    { id: 'crash_x', title: 'CRASH X FLIGHT COCKPIT', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#111111]', multiplierScale: '1.01x - 100x', icon: Rocket, thumbnail: crashXThumb },
    { id: 'sic_bo', title: 'SIC BO TRIPLE TUMBLE', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#151820]', multiplierScale: '2.0x - 31.0x', icon: HelpCircle, thumbnail: sicBoThumb },
    { id: 'mini_roulette', title: 'MINI ROULETTE RADIAL', type: 'casino', badge: 'NEW ACTION', category: 'Gold Casino', gradient: 'from-[#d4af37] to-[#111111]', multiplierScale: '2.0x / 12x', icon: Sparkles, thumbnail: miniRouletteThumb },
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
      <div className="min-h-screen bg-black text-[#eaeaea] font-sans flex flex-col items-center justify-center select-none poki-module">
        <div className="w-16 h-16 bg-[#ffb703]/10 border border-[#ffb703] rounded-2xl flex items-center justify-center mb-6 animate-spin">
          <Gamepad2 className="w-8 h-8 text-[#ffb703]" />
        </div>
        <h2 className="text-sm font-bold tracking-widest uppercase text-[#ffd166] animate-pulse">
          Validating Security Session...
        </h2>
        <p className="text-[10px] text-zinc-500 font-mono mt-2">Checking with active_sessions gateway</p>
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

    // Connection Check: check if we successfully read from database root using database.ref().once('value')
    console.log("[DIAGNOSTIC] Connection Check: Verifying database reachability via database.ref().once('value')...");
    try {
      // Set a strict 4.5 second timeout to detect network issues early
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 4500)
      );
      await Promise.race([
        database.ref().once('value'),
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
              const userRef = database.ref('users/' + window.currentUserId);
              
              await userRef.transaction((current) => {
                if (!current) current = {};
                const currentUnplayed = current.unplayedTokens !== undefined ? Number(current.unplayedTokens) : 250;
                const currentWinning = current.winningTokens !== undefined ? Number(current.winningTokens) : 250;
                
                const newUnplayed = currentUnplayed + selectedPackage.tokens;
                current.unplayedTokens = parseFloat(newUnplayed.toFixed(4));
                current.winningTokens = parseFloat(currentWinning.toFixed(4));
                current.gameTokens = parseFloat((newUnplayed + currentWinning).toFixed(4));
                return current;
              });

              console.log("[DIAGNOSTIC] Wallet balance synced. Writing payment receipt log inside history...");
              const historyRef = database.ref(`users/${window.currentUserId}/history`).push();
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

      {/* 2. MAIN HORIZONTALLY ALIGNED POLISHED GEMS HEADER */}
      <header className="sticky top-0 z-40 bg-[#07080a]/95 backdrop-blur-md border-b border-[#ffd166]/10 shadow-[0_4px_30px_rgba(0,0,0,0.8)] px-3 sm:px-8 py-2.5 flex items-center justify-between gap-2">
        {/* Brand row and Online Players Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 bg-gradient-to-br from-[#ffd166] to-[#ffb703] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-[#ffb703]/20 border border-[#ffd166] shrink-0">
            <Gamepad2 className="w-4.5 sm:w-5.5 h-4.5 sm:h-5.5 text-black" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-[11px] sm:text-base font-black tracking-widest text-white leading-none uppercase font-sans">
              Poki <span className="text-[#ffd166]">game Hub</span>
            </h1>
            <span className="text-[7.5px] sm:text-[9px] font-mono tracking-widest text-[#ffb703] uppercase block mt-0.5 leading-none font-bold">
              TOKEN MODE ACTIVE
            </span>
          </div>
        </div>

        {/* Aligned balance collection - ALWAYS ON THE RIGHT */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* ONLINE PLAYERS LIVE COUNTER */}
          <div className="flex items-center gap-1 sm:gap-2 bg-emerald-950/20 border border-emerald-500/25 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-left select-none animate-pulse shrink-0">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[6.5px] sm:text-[7px] uppercase font-mono tracking-wider text-emerald-400 font-bold leading-none">Online</span>
              <span className="text-[9px] sm:text-xs font-black text-white font-mono mt-0.5 leading-none">
                {onlinePlayers}
              </span>
            </div>
          </div>

          {/* History Button */}
          <button
            onClick={() => {
              synth.playClick();
              triggerHaptic('light');
              setHistoryModalActive(true);
            }}
            className="p-1.5 sm:p-2 bg-zinc-950/95 border border-zinc-800/80 hover:border-[#ffd166]/20 rounded-lg sm:rounded-xl text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all outline-none"
            title="Gameplay History Ledger"
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ffd166]" />
          </button>

          {/* Token Balance Widget with Plus button */}
          <div
            onClick={() => {
              synth.playCoin();
              setTransferModalActive(true);
              setTransferStatus('idle');
              setTransferAmountInput('');
              setErrorNotification(null);
            }}
            className="bg-zinc-950/95 border border-[#ffb703]/25 hover:border-[#ffb703]/60 pl-2.5 pr-1.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 cursor-pointer active:scale-95 transition-all duration-200 select-none shadow-md"
            title="Manage your tokens"
          >
            <div className="flex items-center gap-1.5 text-left">
              <span className="text-[10px] sm:text-xs font-black text-white font-mono leading-none">
                {pokiBalance.toFixed(0)}
              </span>
              <span className="text-[7.5px] uppercase font-bold tracking-widest text-[#ffd166]/90 font-sans leading-none">
                Token
              </span>
            </div>
            
            {/* Rounded Plus icon button */}
            <div className="w-5.5 h-5.5 rounded-md sm:rounded-lg bg-[#ffb703]/10 border border-[#ffb703]/30 hover:bg-[#ffb703] hover:text-black flex items-center justify-center text-[#ffb703] transition-all duration-200 shrink-0">
              <Plus className="w-3 h-3 stroke-[3]" />
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
          {/* SEARCH AND FILTERS CONTROLLER HEADER */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 w-full">
            
            {/* TWO-SECTION PREMIUM NAVIGATION */}
            <div className="grid grid-cols-2 gap-3 max-w-xl w-full p-2 bg-[#171a21]/80 border border-[#2a2f3b] rounded-2xl relative">
              {/* PLAY & EARN button */}
              <button
                onClick={(e) => {
                  createRipple(e);
                  setActiveCategory('arcade');
                  synth.playCoin();
                }}
                className={`relative overflow-hidden py-3 px-4 text-xs sm:text-xs font-black tracking-widest rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer uppercase select-none flex flex-col items-center justify-center gap-1 ${
                  activeCategory === 'arcade'
                    ? 'bg-[#0b0c10] text-[#ffb703] border border-[#ffb703] neon-amber-glow font-black shadow-lg shadow-[#ffb703]/5'
                    : 'bg-transparent text-zinc-500 hover:text-white'
                }`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)' }}
              >
                <span className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-[#ffb703]" />
                  PLAY & EARN
                </span>
                <span className="text-[8px] font-mono tracking-wider opacity-60">Skill-Based Arcade</span>
                {/* Active Underline indicator */}
                {activeCategory === 'arcade' && (
                  <span className="absolute bottom-1 w-10 h-0.5 rounded-full bg-[#ffb703] shadow-[0_1px_6px_#ffb703]" />
                )}
              </button>

              {/* LUCKY ZONE button */}
              <button
                onClick={(e) => {
                  createRipple(e);
                  setActiveCategory('casino');
                  synth.playCoin();
                }}
                className={`relative overflow-hidden py-3 px-4 text-xs sm:text-xs font-black tracking-widest rounded-xl transition-all duration-300 transform active:scale-95 cursor-pointer uppercase select-none flex flex-col items-center justify-center gap-1 ${
                  activeCategory === 'casino'
                    ? 'bg-[#0b0c10] text-[#ffb703] border border-[#ffb703] neon-amber-glow font-black shadow-lg shadow-[#ffb703]/5'
                    : 'bg-transparent text-zinc-500 hover:text-white'
                }`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.8, 0.25, 1)' }}
              >
                <span className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#ffb703]" />
                  LUCKY ZONE
                </span>
                <span className="text-[8px] font-mono tracking-wider opacity-60">Risk & Betting Games</span>
                {/* Active Underline indicator */}
                {activeCategory === 'casino' && (
                  <span className="absolute bottom-1 w-10 h-0.5 rounded-full bg-[#ffb703] shadow-[0_1px_6px_#ffb703]" />
                )}
              </button>
            </div>

            {/* Dynamic Search Controller */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#171a21]/50 border border-[#2a2f3b] hover:border-zinc-700 focus:border-[#ffb703] text-sm text-zinc-200 pl-10 pr-4 py-3 rounded-xl outline-none transition"
              />
            </div>
          </div>

          {/* SEAMLESS MULTI-ROW GAME GRID DISPLAY */}
          {filteredGames.length > 0 ? (
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
                    onClick={() => handleLaunchGame(game.id)}
                    className="group cursor-pointer flex flex-col bg-[#0d0e12] border border-[#ffb703]/5 rounded-3xl p-3.5 overflow-hidden game-card-active-interaction"
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
                        <span className="bg-[#ffb703] text-black text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xl scale-95 group-hover:scale-100 transition-all duration-300 uppercase tracking-widest">
                          <Play className="w-3.5 h-3.5 fill-black text-black" />
                          Launch App
                        </span>
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
                        <span
                          className="h-7 px-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-black text-[8.5px] tracking-wider rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#ffb703]/10 uppercase flex items-center justify-center gap-1 cursor-pointer font-sans"
                        >
                          <Play className="w-2 h-2 fill-black text-black shrink-0" />
                          Play
                        </span>
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
        </motion.div>
      </div>

      {/* 4. IMMERSIVE OVERLAY GAME CONTROLLER MOUNT ROOM */}
      <AnimatePresence>
        {selectedGameId && (
          <motion.div
            key="game-room"
            ref={gameRoomRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] w-screen h-screen bg-[#070709] flex flex-col overflow-hidden"
          >
            {/* Full-Screen Immersive Header for dynamic gameplays */}
            <div className="bg-[#0b0c10] px-4 md:px-6 py-3 flex items-center justify-between border-b border-[#ffb703]/10 h-14 shrink-0 shadow-lg z-10 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    synth.playCoin();
                    setSelectedGameId(null);
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

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-widest hidden md:inline">Dynamic Balance:</span>
                <div className="bg-[#ffb703]/5 text-[#ffb703] border border-[#ffb703]/20 px-3 py-1 rounded-xl font-mono text-xs font-bold shadow-sm shadow-[#ffb703]/5">
                  {pokiBalance.toFixed(2)} TOKENS
                </div>
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#0d0d0f] flex flex-col items-center justify-start w-full ${isFullscreen ? "p-0" : "p-1 xs:p-2 sm:p-4 md:p-6"}`}>
              <div className={`w-full h-full flex flex-col justify-start gap-4 ${isFullscreen ? "max-w-none" : "max-w-5xl"}`}>
                <div className={`flex-1 w-full bg-[#0b0c10] flex flex-col shadow-2xl ${isFullscreen ? "rounded-none border-0 min-h-[calc(100vh-56px)]" : "border border-zinc-900/80 rounded-3xl overflow-hidden min-h-[440px]"}`}>
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
              {selectedGameId === 'jetpack_rush' && (
                <PokiJetpackRush
                  onSessionComplete={handleArcadeSessionComplete}
                  uid={testerAccountEmail}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
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
                  pokiBalance={pokiBalance}
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
                  pokiBalance={pokiBalance}
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
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'roulette' && (
                <CryptoRoulette
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'dice' && (
                <CyberDice
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'slots' && (
                <PokiSlots
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'fortune' && (
                <WheelOfFortune
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'hilo' && (
                <HiloLedger
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'coinflip' && (
                <CoinFlipBlitz
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'blackjack' && (
                <BlackjackMini
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'keno' && (
                <KenoMatrix
                  pokiBalance={pokiBalance}
                  onAwardBalance={awardBalance}
                  onDeductBalance={sendCredits}
                  syncCasinoData={syncCasinoData}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
              {selectedGameId === 'shell' && (
                <PokiShellGame
                  pokiBalance={pokiBalance}
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
                    pokiBalance={pokiBalance}
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
                    pokiBalance={pokiBalance}
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
                    pokiBalance={pokiBalance}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'dragon_tiger' && (
                <div id="dragon_tiger_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <DragonTiger
                    pokiBalance={pokiBalance}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'crash_x' && (
                <div id="crash_x_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <CrashX
                    pokiBalance={pokiBalance}
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
                    pokiBalance={pokiBalance}
                    onAwardBalance={awardBalance}
                    onDeductBalance={sendCredits}
                    syncCasinoData={syncCasinoData}
                    onClose={() => setSelectedGameId(null)}
                  />
                </div>
              )}

              {selectedGameId === 'mini_roulette' && (
                <div id="mini_roulette_wrapper" className="lucky-zone-game-card flex-1 flex flex-col bg-black border border-[#d4af37]/30 rounded-2xl overflow-hidden p-2">
                  <MiniRoulette
                    pokiBalance={pokiBalance}
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
                    pokiBalance={pokiBalance}
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

            {/* Tactical Pro-Gamepad Touch Controls for Arcade games */}
            {menuGames.find(g => g.id === selectedGameId)?.type === 'arcade' && (
              <div className="bg-[#0b0c10]/95 backdrop-blur-sm p-4 border border-[#ffb703]/10 h-36 shrink-0 flex items-center justify-between gap-4 w-full rounded-2xl select-none shadow-md z-10">
                
                {/* Precise Arrow Keys D-Pad */}
                <div className="flex items-center justify-center relative w-28 h-28 shrink-0">
                  {/* UP */}
                  <button
                    onTouchStart={() => dispatchKeyEvent('keydown', 'ArrowUp', 'ArrowUp')}
                    onTouchEnd={() => dispatchKeyEvent('keyup', 'ArrowUp', 'ArrowUp')}
                    onMouseDown={() => dispatchKeyEvent('keydown', 'ArrowUp', 'ArrowUp')}
                    onMouseUp={() => dispatchKeyEvent('keyup', 'ArrowUp', 'ArrowUp')}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-9 bg-zinc-900 active:bg-[#ffb703] border border-[#ffb703]/20 active:text-black text-[#ffb703] rounded-lg flex items-center justify-center active:scale-95 shadow-md transition-all active:shadow-[#ffb703]/30 cursor-pointer text-xs"
                  >
                    ▲
                  </button>
                  {/* LEFT */}
                  <button
                    onTouchStart={() => dispatchKeyEvent('keydown', 'ArrowLeft', 'ArrowLeft')}
                    onTouchEnd={() => dispatchKeyEvent('keyup', 'ArrowLeft', 'ArrowLeft')}
                    onMouseDown={() => dispatchKeyEvent('keydown', 'ArrowLeft', 'ArrowLeft')}
                    onMouseUp={() => dispatchKeyEvent('keyup', 'ArrowLeft', 'ArrowLeft')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-zinc-900 active:bg-[#ffb703] border border-[#ffb703]/20 active:text-black text-[#ffb703] rounded-lg flex items-center justify-center active:scale-95 shadow-md transition-all active:shadow-[#ffb703]/30 cursor-pointer text-xs"
                  >
                    ◀
                  </button>
                  {/* CENTER DECORATION */}
                  <div className="w-8 h-8 rounded-full bg-black/60 border border-zinc-800/80 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-zinc-800"></div>
                  </div>
                  {/* RIGHT */}
                  <button
                    onTouchStart={() => dispatchKeyEvent('keydown', 'ArrowRight', 'ArrowRight')}
                    onTouchEnd={() => dispatchKeyEvent('keyup', 'ArrowRight', 'ArrowRight')}
                    onMouseDown={() => dispatchKeyEvent('keydown', 'ArrowRight', 'ArrowRight')}
                    onMouseUp={() => dispatchKeyEvent('keyup', 'ArrowRight', 'ArrowRight')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-zinc-900 active:bg-[#ffb703] border border-[#ffb703]/20 active:text-black text-[#ffb703] rounded-lg flex items-center justify-center active:scale-95 shadow-md transition-all active:shadow-[#ffb703]/30 cursor-pointer text-xs"
                  >
                    ▶
                  </button>
                  {/* DOWN */}
                  <button
                    onTouchStart={() => dispatchKeyEvent('keydown', 'ArrowDown', 'ArrowDown')}
                    onTouchEnd={() => dispatchKeyEvent('keyup', 'ArrowDown', 'ArrowDown')}
                    onMouseDown={() => dispatchKeyEvent('keydown', 'ArrowDown', 'ArrowDown')}
                    onMouseUp={() => dispatchKeyEvent('keyup', 'ArrowDown', 'ArrowDown')}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-9 h-9 bg-zinc-900 active:bg-[#ffb703] border border-[#ffb703]/20 active:text-black text-[#ffb703] rounded-lg flex items-center justify-center active:scale-95 shadow-md transition-all active:shadow-[#ffb703]/30 cursor-pointer text-xs"
                  >
                    ▼
                  </button>
                </div>

                {/* Info Text in the middle */}
                <div className="hidden xs:flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold leading-none">TACTILE DECK</span>
                  <span className="text-[8px] text-[#ffb703] font-mono leading-none tracking-widest uppercase mt-1.5 animate-pulse">Smooth Touch Controls</span>
                </div>

                {/* Right Action buttons group */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* ACTION TRIGGER 1 (JUMP/Action A) */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onTouchStart={() => dispatchKeyEvent('keydown', 'Space', 'Space')}
                      onTouchEnd={() => dispatchKeyEvent('keyup', 'Space', 'Space')}
                      onMouseDown={() => dispatchKeyEvent('keydown', 'Space', 'Space')}
                      onMouseUp={() => dispatchKeyEvent('keyup', 'Space', 'Space')}
                      className="w-14 h-14 bg-gradient-to-br from-amber-500 to-[#ffb703] active:from-yellow-400 active:to-[#ffb703] text-black font-black text-sm rounded-full flex items-center justify-center uppercase active:scale-95 cursor-pointer border-2 border-[#ffd166] shadow-[0_4px_12px_rgba(255,183,3,0.3)] active:shadow-none"
                    >
                      A
                    </button>
                    <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase font-bold">JUMP/TAP</span>
                  </div>

                  {/* ACTION TRIGGER 2 (Alternative Space/Action B) */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onTouchStart={() => {
                        dispatchKeyEvent('keydown', 'Space', 'Space');
                        dispatchKeyEvent('keydown', 'ArrowUp', 'ArrowUp');
                      }}
                      onTouchEnd={() => {
                        dispatchKeyEvent('keyup', 'Space', 'Space');
                        dispatchKeyEvent('keyup', 'ArrowUp', 'ArrowUp');
                      }}
                      onMouseDown={() => {
                        dispatchKeyEvent('keydown', 'Space', 'Space');
                        dispatchKeyEvent('keydown', 'ArrowUp', 'ArrowUp');
                      }}
                      onMouseUp={() => {
                        dispatchKeyEvent('keyup', 'Space', 'Space');
                        dispatchKeyEvent('keyup', 'ArrowUp', 'ArrowUp');
                      }}
                      className="w-11 h-11 bg-zinc-800 active:bg-zinc-700 text-zinc-300 active:text-white rounded-full flex items-center justify-center font-bold text-xs uppercase active:scale-95 cursor-pointer border border-zinc-700 shadow-md"
                    >
                      B
                    </button>
                    <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase font-bold">ACTION</span>
                  </div>
                </div>

              </div>
            )}

              </div>
            </div>
          </motion.div>
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
                        ) : (
                          <button
                            onClick={() => {
                              triggerHaptic('light');
                              watchAdAndEarnTokens();
                            }}
                            className="w-full sm:w-auto text-center text-[10px] font-black text-white hover:text-black uppercase tracking-widest px-4 py-2.5 bg-zinc-900 border border-[#ffb703]/20 hover:bg-[#ffb703] hover:border-[#ffb703] rounded-xl transition cursor-pointer font-sans active:scale-95 shadow-md"
                          >
                            🎥 Watch & Earn +50 Free Tokens
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CONVERSION FIELD & INTERFACE */}
                  {transferStatus === 'idle' && (
                    <div className="bg-[#12141c]/60 border border-zinc-800 rounded-2xl p-4 mb-4">
                      {/* Amount Selection Input Header with dynamic descriptors */}
                      <div className="space-y-1.5 mb-4 relative flex flex-col text-left">
                        <div className="flex justify-between items-center text-[9px] tracking-wider font-bold mb-1 uppercase">
                          <span className="text-zinc-400">Amount to Withdraw</span>
                          <span className="text-emerald-400 font-mono font-bold">Max: {pokiBalance.toFixed(0)}</span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="any"
                            placeholder="0"
                            value={transferAmountInput}
                            onChange={(e) => setTransferAmountInput(e.target.value)}
                            disabled={transferStatus === 'processing' || transferStatus === 'success'}
                            className="w-full bg-black/60 border border-zinc-800 focus:border-[#ffb703] text-zinc-200 pl-4 pr-24 py-3 rounded-xl outline-none transition text-xs font-mono"
                          />
                          
                          {/* Shortcuts */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                              disabled={transferStatus === 'processing' || transferStatus === 'success'}
                              onClick={() => {
                                synth.playCoin();
                                setTransferAmountInput(String(Math.min(pokiBalance, 10.0)));
                              }}
                              className="text-[9px] font-bold text-zinc-400 hover:text-white px-1.5 py-1 bg-zinc-800/90 disabled:opacity-50 rounded uppercase font-mono cursor-pointer"
                            >
                              Min
                            </button>
                            <button
                              disabled={transferStatus === 'processing' || transferStatus === 'success'}
                              onClick={() => {
                                synth.playCoin();
                                setTransferAmountInput(String(Math.floor(pokiBalance / 2)));
                              }}
                              className="text-[9px] font-bold text-zinc-400 hover:text-white px-1.5 py-1 bg-zinc-800/90 disabled:opacity-50 rounded uppercase font-mono cursor-pointer"
                            >
                              Half
                            </button>
                            <button
                              disabled={transferStatus === 'processing' || transferStatus === 'success'}
                              onClick={() => {
                                synth.playCoin();
                                setTransferAmountInput(String(pokiBalance));
                              }}
                              className="text-[9px] font-bold text-[#ffb703] hover:text-white px-1.5 py-1 bg-zinc-800/90 disabled:opacity-50 rounded uppercase font-mono cursor-pointer"
                            >
                              Max
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* LIVE PREVIEW CARD */}
                      <div className="bg-black/90 p-4 border border-[#ffb703]/10 rounded-xl mb-1 text-xs">
                        <div className="flex justify-between items-center text-zinc-500 text-[9px] uppercase tracking-wider mb-2.5 border-b border-zinc-800/60 pb-2">
                          <span>Details</span>
                          <span>Status: Active</span>
                        </div>
                        <div className="space-y-1.5 font-mono text-zinc-400 text-[10.5px]">
                          <div className="flex justify-between">
                            <span>Tokens to Withdraw:</span>
                            <span className="text-white">{Number(transferAmountInput) || 0} Tokens</span>
                          </div>
                          <div className="flex justify-between text-rose-400">
                            <span>Fee ({(Number(transferAmountInput) >= 100 ? 3.0 : 3.5).toFixed(1)}%):</span>
                            <span>- {((Number(transferAmountInput) || 0) * (Number(transferAmountInput) >= 100 ? 0.03 : 0.035)).toFixed(2)} tokens</span>
                          </div>
                          <div className="flex justify-between text-[#ffb703] border-t border-zinc-800/60 pt-2 font-bold text-xs">
                            <span>You will receive:</span>
                            <span>= {Math.max(0, (Number(transferAmountInput) || 0) * (1 - (Number(transferAmountInput) >= 100 ? 0.03 : 0.035))).toFixed(2)} tokens</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {errorNotification && (
                    <div className="bg-red-500/10 border border-red-500/30 text-rose-400 rounded-xl p-3 text-[10px] flex items-center gap-2 mb-4 leading-relaxed">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorNotification}</span>
                    </div>
                  )}

                  {/* Submit Conversion Actions */}
                  {transferStatus === 'idle' && (
                    <button
                      onClick={transferPokiToMainAccount}
                      disabled={pokiBalance <= 0 || Number(transferAmountInput) <= 0 || Number(transferAmountInput) > pokiBalance || isNaN(Number(transferAmountInput))}
                      className="w-full py-4 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-center cursor-pointer shadow-lg"
                      id="convert-cta-btn"
                    >
                      Withdraw Now
                    </button>
                  )}

                  {transferStatus === 'processing' && (
                    <div className="w-full py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs text-center rounded-xl font-mono flex items-center justify-center gap-2 text-center">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#ffb703]" />
                      <span>Processing request...</span>
                    </div>
                  )}

                  {transferStatus === 'success' && (
                    <div className="space-y-4 pt-2">
                      <div className="bg-[#0e1610]/95 border border-emerald-500/30 text-emerald-400 p-5 rounded-2xl text-xs text-center leading-relaxed font-sans">
                        🎉 <strong className="text-white block mb-2 text-sm uppercase tracking-wider">Tokens successfully processed!</strong>
                        Your withdrawal request has been submitted.
                      </div>
                      <button
                        onClick={() => {
                          synth.playCoin();
                          setTransferModalActive(false);
                          setTransferStatus('idle');
                          setTransferAmountInput('');
                        }}
                        className="w-full py-2.5 bg-zinc-800 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-zinc-700 transition font-sans uppercase animate-none"
                      >
                        Done
                      </button>
                    </div>
                  )}
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
              className="bg-[#0e0f14] border border-[#ffb703]/20 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[85vh] select-none text-left"
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
                  historyLogs.map((item, idx) => {
                    const isWin = item.type === 'game_play' ? (item.profitLoss > 0) : (item.amount > 0 || item.type === 'ad_earning' || item.type === 'top_up_payout');
                    const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending';

                    return (
                      <div
                        key={item.id || idx}
                        className="bg-[#12141c]/50 border border-zinc-900/60 hover:border-zinc-800 p-4 rounded-2xl flex items-center justify-between gap-4 transition duration-200"
                      >
                        <div className="text-left flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white uppercase tracking-wide truncate">
                              {item.type === 'game_play' ? (item.game || 'Arcade Game') : item.type === 'ad_earning' ? '📺 Sponsored Video Ad' : item.type === 'winning_tokens_conversion' ? '💸 Token Withdrawal' : '💰 Fund Top-Up'}
                            </span>
                          </div>
                          <div className="text-[9px] text-zinc-500 font-mono mt-1 flex items-center gap-2">
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span className="uppercase text-[#ffb703] font-bold">Verified</span>
                          </div>
                        </div>

                        {/* Outcome balance indicators */}
                        <div className="text-right shrink-0">
                          {item.type === 'game_play' ? (
                            <>
                              <div className={`text-xs font-black font-mono uppercase tracking-tight ${isWin ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-bold'}`}>
                                {isWin ? 'Win' : 'Loss'}
                              </div>
                              <div className={`text-[10px] font-bold font-mono mt-0.5 ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.profitLoss > 0 ? '+' : ''}{item.profitLoss.toFixed(2)}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs font-black font-mono text-emerald-400">
                              {item.type === 'winning_tokens_conversion' ? '-' : '+'}{item.amount ? item.amount.toFixed(2) : '50.00'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
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

    </div>
  );
}

function GameLoadingLoader({ gameId, gameTitle, onCancel }: { gameId: string, gameTitle: string, onCancel: () => void }) {
  return (
    <div className="flex-1 w-full bg-[#07080a] flex flex-col items-center justify-center p-8 relative min-h-[440px]">
      {/* Premium Shimmer Grid background to prevent sudden layout shifts */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffb703_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="max-w-sm w-full text-center flex flex-col items-center relative z-10 space-y-8 select-none">
        
        {/* Rotating 3D Poki Coin Loading Animation */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#ffb703]/10 rounded-full blur-xl animate-pulse" />
          
          {/* Main 3D Spinning Coin representation */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#ffd166] via-[#ffb703] to-[#f39c12] border-2 border-[#fff] shadow-[0_0_20px_rgba(255,183,3,0.6),inset_0_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center animate-coin-spin-y">
            <span className="text-xl font-black text-black font-sans select-none tracking-tighter">P</span>
          </div>
          
          {/* Surrounding spinning orbits */}
          <div className="absolute inset-0 border border-dashed border-[#ffb703]/20 rounded-full animate-[spin_6s_linear_infinite]" />
          <div className="absolute -inset-2 border border-dotted border-zinc-700/30 rounded-full animate-[spin_12s_linear_infinite_reverse]" />
        </div>

        {/* Shimmer layout representing game elements */}
        <div className="space-y-4 w-full">
          {/* Game Title with shimmer text effect */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-bold leading-none">LAUNCHING GAME CORE</h4>
            <h3 className="text-lg font-black text-white tracking-widest uppercase mt-2 font-sans animate-pulse">
              {gameTitle || 'PLAY NOW'}
            </h3>
          </div>
          
          {/* Shimmer skeleton indicators of a dashboard layout */}
          <div className="space-y-2 max-w-[200px] mx-auto pt-2">
            <div className="h-2 rounded-full shimmer-bg w-full" />
            <div className="h-1.5 rounded-full shimmer-bg w-5/6 mx-auto" />
            <div className="h-1.5 rounded-full shimmer-bg w-2/3 mx-auto" />
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="px-4 py-1.5 bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-rose-400 text-[10px] uppercase tracking-widest font-bold rounded-lg transition duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3 h-3 text-rose-500" /> Cancel
        </button>
      </div>
    </div>
  );
}
