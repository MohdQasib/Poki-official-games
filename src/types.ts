/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserStats {
  pokiBalance: number;
  inrExchangeRate: number; // ₹0.50 / POKI standard
  miningSpeedRate: number; // +0.0380 POKI/hr standard
  nodeHashRate: number;     // e.g., 412.8 MH/s
  cpuTemp: number;          // e.g., 42 °C
  peers: number;            // e.g., 23
  unverifiedBonus: number;  // KYC bonus
  transferableCore: number; // approved coins
  uid: string;
  email: string;
}

export interface GameSession {
  distance: number;
  coinsCollected: number;
  multiplier: number;
  timestamp: number;
  hashSignature?: string;
  securePayload?: string;
  status: 'idle' | 'playing' | 'paused' | 'gameover' | 'syncing' | 'synced';
}

export interface ObstacleType {
  id: number;
  lane: number; // 0 (left), 1 (mid), 2 (right)
  z: number;    // distance from player along the depth
  width: number;
  height: number;
  type: 'barricade' | 'cyberGridUnder' | 'hoverDrone';
  hit: boolean;
}

export interface CoinType {
  id: number;
  lane: number;
  z: number;
  collected: boolean;
  pulseOffset: number;
}

export interface ScreenParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}
