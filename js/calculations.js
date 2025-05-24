/**
 * SpiderForex Trading Calculations
 * Professional trading calculator with validation
 */

class TradingCalculator {
  /**
   * Calculate trading levels for a given pair and entry price
   * @param {string} pair - Trading pair key (EURUSD, GBPUSD, XAUUSD)
   * @param {number} entryPrice - Entry price
   * @param {string} orderType - Order type (BUY or SELL)
   * @returns {Object} Calculated levels
   */
  calculateLevels(pair, entryPrice, orderType = "BUY") {
    const data = TRADING_DATA[pair];
    if (!data) {
      throw new Error(`Invalid trading pair: ${pair}`);
    }

    const entry = parseFloat(entryPrice);
    if (isNaN(entry) || entry <= 0) {
      throw new Error("Invalid entry price");
    }

    const stopLossPips = data.stopLoss + data.spread;
    const pipValue = data.pipValue;

    let stopLoss, firstTarget, finalTarget;

    if (orderType.toUpperCase() === "BUY") {
      stopLoss = entry - stopLossPips * pipValue;
      firstTarget = entry + data.targets.first * pipValue;
      finalTarget = entry + data.targets.final * pipValue;
    } else {
      stopLoss = entry + stopLossPips * pipValue;
      firstTarget = entry - data.targets.first * pipValue;
      finalTarget = entry - data.targets.final * pipValue;
    }

    return {
      entry: this.formatPrice(entry, pair),
      stopLoss: this.formatPrice(stopLoss, pair),
      firstTarget: this.formatPrice(firstTarget, pair),
      finalTarget: this.formatPrice(finalTarget, pair),
      riskReward: {
        first: (data.targets.first / stopLossPips).toFixed(2),
        final: (data.targets.final / stopLossPips).toFixed(2),
      },
      pips: {
        stopLoss: stopLossPips,
        firstTarget: data.targets.first,
        finalTarget: data.targets.final,
      },
    };
  }

  /**
   * Format price based on pair type
   * @param {number} price - Price to format
   * @param {string} pair - Trading pair
   * @returns {string} Formatted price
   */
  formatPrice(price, pair) {
    if (pair === "XAUUSD") {
      return price.toFixed(2);
    }
    return price.toFixed(5);
  }

  /**
   * Validate entry price input
   * @param {string} price - Price string to validate
   * @param {string} pair - Trading pair
   * @returns {Object} Validation result
   */
  validateEntryPrice(price, pair) {
    const numPrice = parseFloat(price);

    if (isNaN(numPrice) || numPrice <= 0) {
      return { valid: false, error: "Please enter a valid positive number" };
    }

    // Basic range validation
    const ranges = {
      EURUSD: { min: 0.8, max: 1.8 },
      GBPUSD: { min: 1.0, max: 2.5 },
      XAUUSD: { min: 1500, max: 3000 },
    };

    const range = ranges[pair];
    if (range && (numPrice < range.min || numPrice > range.max)) {
      return {
        valid: false,
        error: `Price seems unusual for ${TRADING_DATA[pair].name}. Expected range: ${range.min} - ${range.max}`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculate position size based on risk parameters
   * @param {number} accountBalance - Account balance
   * @param {number} riskPercent - Risk percentage (1-2%)
   * @param {number} stopLossPips - Stop loss in pips
   * @param {string} pair - Trading pair
   * @returns {Object} Position size calculation
   */
  calculatePositionSize(accountBalance, riskPercent, stopLossPips, pair) {
    const data = TRADING_DATA[pair];
    const riskAmount = (accountBalance * riskPercent) / 100;
    const pipValue = data.pipValue;

    // Standard lot calculation (for educational purposes)
    const positionSize = riskAmount / (stopLossPips * pipValue * 10000); // 10000 = $1 per pip for standard lot

    return {
      lots: positionSize.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      maxLoss: (stopLossPips * pipValue * positionSize * 10000).toFixed(2),
    };
  }

  /**
   * Get pair information
   * @param {string} pair - Trading pair key
   * @returns {Object|null} Pair data or null
   */
  getPairInfo(pair) {
    return TRADING_DATA[pair] || null;
  }

  /**
   * Get all available trading pairs
   * @returns {Array} Array of pair keys
   */
  getAllPairs() {
    return Object.keys(TRADING_DATA);
  }

  static calculatePips(entryPrice, exitPrice, pair) {
    const pipValue = TRADING_PAIRS[pair].pipValue;
    return Math.abs(exitPrice - entryPrice) / pipValue;
  }

  static calculateProfit(pips, lotSize, pair) {
    const pipValue = TRADING_PAIRS[pair].pipValue;
    return pips * lotSize * pipValue;
  }

  static calculateRisk(accountBalance, riskPercentage) {
    return accountBalance * (riskPercentage / 100);
  }

  static calculatePositionSize(riskAmount, stopLossPips, pair) {
    const pipValue = TRADING_PAIRS[pair].pipValue;
    return riskAmount / (stopLossPips * pipValue);
  }
}
