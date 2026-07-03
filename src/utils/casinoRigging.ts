/**
 * Secure Casino Rigging Engine & Behavioral Controller
 * Implements strict Indian Casino standard risk controls, Time-based Capping,
 * Honeymoon Phase, Brake Mode, suspension systems, and anti-cheat validations.
 */

// 1 PKG = ~0.02 INR, so 50 PKG = ₹1.00 INR
export const POKI_GOLD_INR_RATE = 0.02;

export interface RiggingStats {
  firstPlayTime: number;
  startSessionBalance: number;
  halfHourWinStart: number;
  halfHourWinAmount: number; // in PKG
  dailyWinStart: number;
  dailyWinAmount: number; // in PKG
  consecutiveWins: number;
  isSuspended: boolean;
  cooldownUntil: number;
  hasReceivedBankruptcyRewardToday: boolean;
  consecutiveLossesNeeded: number; // NEW counter to force losses after any win
  totalBetsPlaced: number; // Track session bet count
}

const DEFAULT_STATS = (currentBalance: number): RiggingStats => ({
  firstPlayTime: Date.now(),
  startSessionBalance: currentBalance || 100,
  halfHourWinStart: Date.now(),
  halfHourWinAmount: 0,
  dailyWinStart: Date.now(),
  dailyWinAmount: 0,
  consecutiveWins: 0,
  isSuspended: false,
  cooldownUntil: 0,
  hasReceivedBankruptcyRewardToday: false,
  consecutiveLossesNeeded: 0,
  totalBetsPlaced: 0,
});

export function getRiggingStats(userId: string, currentBalance: number): RiggingStats {
  const key = `casino_rigging_${userId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const stats = DEFAULT_STATS(currentBalance);
    localStorage.setItem(key, JSON.stringify(stats));
    return stats;
  }
  try {
    const parsed = JSON.parse(stored) as any;
    
    // Ensure new properties exist
    if (parsed.consecutiveLossesNeeded === undefined) parsed.consecutiveLossesNeeded = 0;
    if (parsed.totalBetsPlaced === undefined) parsed.totalBetsPlaced = 0;
    if (!parsed.startSessionBalance || parsed.startSessionBalance < 10) {
      parsed.startSessionBalance = currentBalance || 100;
    }

    // Reset half hour limit if expired
    if (Date.now() - parsed.halfHourWinStart > 30 * 60 * 1000) {
      parsed.halfHourWinStart = Date.now();
      parsed.halfHourWinAmount = 0;
    }
    // Reset daily limit if expired
    if (Date.now() - parsed.dailyWinStart > 24 * 60 * 60 * 1000) {
      parsed.dailyWinStart = Date.now();
      parsed.dailyWinAmount = 0;
      parsed.hasReceivedBankruptcyRewardToday = false;
    }
    return parsed as RiggingStats;
  } catch (e) {
    return DEFAULT_STATS(currentBalance);
  }
}

export function saveRiggingStats(userId: string, stats: RiggingStats) {
  const key = `casino_rigging_${userId}`;
  localStorage.setItem(key, JSON.stringify(stats));
}

/**
 * Validates a bet and determines the state of the system
 */
export function evaluateBet(
  userId: string,
  betAmount: number,
  currentBalance: number
): {
  allowed: boolean;
  shouldForceLoss: boolean;
  applyBrakeMode: boolean;
  reason?: string;
} {
  const stats = getRiggingStats(userId, currentBalance);

  // Increment bet counter
  stats.totalBetsPlaced += 1;
  if (!stats.startSessionBalance || currentBalance > stats.startSessionBalance) {
    stats.startSessionBalance = currentBalance;
  }
  saveRiggingStats(userId, stats);

  // 1. Suspension check
  if (stats.isSuspended) {
    return { allowed: false, shouldForceLoss: true, applyBrakeMode: false, reason: "Your account is temporarily locked due to extreme volatility checks. Please contact support." };
  }

  // 2. Cooldown check
  if (Date.now() < stats.cooldownUntil) {
    const remainingHrs = Math.ceil((stats.cooldownUntil - Date.now()) / (60 * 60 * 1000));
    return { allowed: false, shouldForceLoss: true, applyBrakeMode: false, reason: `Your account is in high-limit win cooldown. Please retry in ${remainingHrs} hours.` };
  }

  let shouldForceLoss = false;

  // 3. Absolute Coin Cap of 1000 PKG
  // Under NO circumstances can a user cross 1000 Poki Gold.
  // We force losses starting at 900 PKG to absolutely guarantee they never touch 1000.
  if (currentBalance >= 900) {
    shouldForceLoss = true;
  }

  // 4. Force 2 Losses After Any Win (Anti-Hopping and Anti-Consecutive Win defense)
  if (stats.consecutiveLossesNeeded > 0) {
    shouldForceLoss = true;
  }

  // 5. Must lose at least 50% of the coins they brought
  // If their balance is greater than 50% of what they brought, we force losses
  // to ensure they lose more than half.
  if (currentBalance > stats.startSessionBalance * 0.5) {
    shouldForceLoss = true;
  }

  // 6. Daily Suspension (₹20 Rule)
  // If their daily win amount converted to INR is >= 20, suspend them immediately.
  const dailyWinInr = stats.dailyWinAmount * POKI_GOLD_INR_RATE;
  if (dailyWinInr >= 20) {
    stats.isSuspended = true;
    saveRiggingStats(userId, stats);
    // Send admin notification
    triggerAdminPanelNotification(userId, "Account frozen: Daily profit exceeded ₹20 INR limit.");
    return { allowed: false, shouldForceLoss: true, applyBrakeMode: false, reason: "Account suspended: Violation of daily profit threshold rules (₹20 max)." };
  }

  // 7. Time-Based limit (₹5 - ₹10 profit per 30 minutes)
  // Let's cap profit in 30 mins at ₹7.50 INR (375 PKG)
  const halfHourWinInr = stats.halfHourWinAmount * POKI_GOLD_INR_RATE;
  if (halfHourWinInr >= 7.5) {
    shouldForceLoss = true;
  }

  // 8. Strict Daily limit (₹10 - ₹15 max profit per 24 hours)
  // Let's cap profit in 24 hours at ₹12.50 INR (625 PKG)
  if (dailyWinInr >= 12.5) {
    shouldForceLoss = true;
  }

  // 9. Bet Size execution logic
  // If user places a BIG bet (e.g., >= 300 PKG or ₹6), force 100% loss to protect the house
  if (betAmount >= 300) {
    shouldForceLoss = true;
  }

  // 10. Dynamic Brake Logic
  // If current balance reaches <= 50% of starting balance, enable Brake Mode
  const applyBrakeMode = currentBalance <= stats.startSessionBalance * 0.5;

  return {
    allowed: true,
    shouldForceLoss,
    applyBrakeMode,
  };
}

/**
 * Tracks and logs a win event, updating limits and triggering security measures
 */
export function logWin(userId: string, betAmount: number, winAmount: number, gameId: string, currentBalance: number) {
  const stats = getRiggingStats(userId, currentBalance);
  const profit = winAmount - betAmount;
  if (profit > 0) {
    stats.halfHourWinAmount += profit;
    stats.dailyWinAmount += profit;
    stats.consecutiveWins += 1;

    // Set counter to force the next 2 bets to be losses
    stats.consecutiveLossesNeeded = 2;

    // Trigger cooldown mode if single win is huge (e.g. >= 500 PKG or ₹10)
    const singleWinInr = profit * POKI_GOLD_INR_RATE;
    if (singleWinInr >= 10) {
      stats.cooldownUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      triggerAdminPanelNotification(userId, `Large single win cooldown triggered: ₹${singleWinInr.toFixed(2)} INR.`);
    }

    // Check if total daily win exceeds ₹20 for instant account freeze
    const dailyWinInr = stats.dailyWinAmount * POKI_GOLD_INR_RATE;
    if (dailyWinInr >= 20) {
      stats.isSuspended = true;
      triggerAdminPanelNotification(userId, `Account Suspended: Daily winnings exceeded ₹20 INR limit. Total: ₹${dailyWinInr.toFixed(2)} INR.`);
    }
  }
  saveRiggingStats(userId, stats);
}

/**
 * Tracks a loss event
 */
export function logLoss(userId: string, betAmount: number, gameId: string, currentBalance: number) {
  const stats = getRiggingStats(userId, currentBalance);
  stats.consecutiveWins = 0;

  // Decrement the forced losses counter
  if (stats.consecutiveLossesNeeded > 0) {
    stats.consecutiveLossesNeeded = Math.max(0, stats.consecutiveLossesNeeded - 1);
  }

  // Reduce winning tally if they lose (so profit is tracked accurately)
  stats.halfHourWinAmount = Math.max(0, stats.halfHourWinAmount - betAmount);
  stats.dailyWinAmount = Math.max(0, stats.dailyWinAmount - betAmount);
  saveRiggingStats(userId, stats);
}

/**
 * Trigger an alert in the admin panel telemetry
 */
export function triggerAdminPanelNotification(userId: string, alertMessage: string) {
  try {
    const alertsKey = "admin_telemetry_alerts";
    const existing = localStorage.getItem(alertsKey);
    const list = existing ? JSON.parse(existing) : [];
    list.unshift({
      id: Date.now().toString() + Math.random().toString().slice(2, 6),
      userId,
      message: alertMessage,
      timestamp: Date.now(),
      status: "NEW"
    });
    localStorage.setItem(alertsKey, JSON.stringify(list));
    console.log(`[ADMIN NOTIFICATION] User ${userId}: ${alertMessage}`);
  } catch (e) {
    console.warn("Failed to write admin notification:", e);
  }
}

/**
 * Evaluates whether bankruptcy reward should be offered (when balance drops to 0)
 */
export function evaluateBankruptcyReward(userId: string, currentBalance: number): { trigger: boolean; rewardAmount: number } {
  if (currentBalance > 2) {
    return { trigger: false, rewardAmount: 0 };
  }
  const stats = getRiggingStats(userId, currentBalance);
  if (stats.hasReceivedBankruptcyRewardToday) {
    return { trigger: false, rewardAmount: 0 };
  }

  // Grant 50 PKG (₹1 INR) as recovery lifebelt
  stats.hasReceivedBankruptcyRewardToday = true;
  saveRiggingStats(userId, stats);
  return { trigger: true, rewardAmount: 50 };
}
