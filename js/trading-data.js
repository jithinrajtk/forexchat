/**
 * SpiderForex Trading Data
 * Premium Apple Design System Implementation
 * @version 4.0.0
 */

const TRADING_PAIRS = {
    "EUR/USD": {
        name: "EUR/USD",
        description: "Euro / US Dollar",
        spread: 0.0002,
        pipValue: 0.0001,
        decimals: 5,
        averageDailyRange: 80, // pips
        trend: "+0.12%",
        trendDirection: "positive", // positive or negative
        majorLevels: [1.0800, 1.0900, 1.1000, 1.1100],
        liquidityZones: [1.0850, 1.0950, 1.1050],
        volatility: "medium"
    },
    "GBP/USD": {
        name: "GBP/USD",
        description: "British Pound / US Dollar",
        spread: 0.0003,
        pipValue: 0.0001,
        decimals: 5,
        averageDailyRange: 100, // pips
        trend: "-0.08%",
        trendDirection: "negative", // positive or negative
        majorLevels: [1.2500, 1.2600, 1.2700, 1.2800],
        liquidityZones: [1.2550, 1.2650, 1.2750],
        volatility: "high"
    },
    "XAU/USD": {
        name: "XAU/USD",
        description: "Gold / US Dollar",
        spread: 0.35,
        pipValue: 1.0,  // 1 pip = $1 for 0.01 lots (updated for correct calculation)
        decimals: 2,
        averageDailyRange: 200, // pips
        trend: "+0.36%",
        trendDirection: "positive", // positive or negative
        majorLevels: [2300, 2350, 2400, 2450],
        liquidityZones: [2325, 2375, 2425],
        volatility: "high"
    }
};

const TRADING_STRATEGIES = {
    swing: {
        name: "Swing Trading",
        timeframes: ["4H", "Daily", "Weekly"],
        stopLoss: {
            "EUR/USD": 50,
            "GBP/USD": 70,
            "XAU/USD": 200
        },
        targets: {
            "EUR/USD": 150,
            "GBP/USD": 210,
            "XAU/USD": 600
        },
        riskReward: 1/3,
        holdingPeriod: "3-10 days"
    },
    intraday: {
        name: "Intraday Trading",
        timeframes: ["15m", "1H", "4H"],
        stopLoss: {
            "EUR/USD": 15,
            "GBP/USD": 20,
            "XAU/USD": 50
        },
        targets: {
            "EUR/USD": 30,
            "GBP/USD": 40,
            "XAU/USD": 100
        },
        riskReward: 1/2,
        holdingPeriod: "Hours"
    },
    scalping: {
        name: "Scalping",
        timeframes: ["1m", "5m", "15m"],
        stopLoss: {
            "EUR/USD": 5,
            "GBP/USD": 7,
            "XAU/USD": 20
        },
        targets: {
            "EUR/USD": 10,
            "GBP/USD": 14,
            "XAU/USD": 40
        },
        riskReward: 1/2,
        holdingPeriod: "Minutes"
    }
};

const FAQ_DATA = [
  {
      title: "What is a PIP?",
      content: "A pip (percentage in point) is the smallest price move in a currency pair. For EUR/USD and GBP/USD, it's the 4th decimal place (0.0001). For Gold (XAU/USD), 1 pip = $0.10."
  },
  {
      title: "How to Calculate Stop Loss?",
      content: "Stop Loss = Entry Price ± (Stop Loss PIPs + Spread) × Pip Value. For BUY orders: subtract from entry price. For SELL orders: add to entry price. Always include spread in calculations."
  },
  {
      title: "Target Price Calculation",
      content: "First Target = Entry Price ± (Target PIPs × Pip Value). Final Target = Entry Price ± (Final PIPs × Pip Value). For BUY orders: add to entry price. For SELL orders: subtract from entry price."
  },
  {
      title: "Position Sizing Rules",
      content: "Never risk more than 1-2% of your account balance per trade. Position Size = (Account Risk ÷ Stop Loss PIPs) ÷ Pip Value. Example: $10k account, 2% risk ($200), 20 pip SL = 10 mini lots maximum."
  },
  {
      title: "Risk Management",
      content: "Always use stop losses. Maintain minimum 1:2 risk-reward ratio. Never move stop loss against your position. Close partial positions at first target, let rest run to final target."
  },
  {
      title: "Trading Sessions (GMT)",
      content: "London: 08:00-17:00 (High volatility). New York: 13:00-22:00 (Major moves). Asian: 23:00-08:00 (Lower volatility). Best opportunities during London-New York overlap."
  },
  {
      title: "Spread Information",
      content: "EUR/USD: 1.5 pips average. GBP/USD: 2.0 pips average. XAU/USD: 3.0 pips average. Spreads vary by broker and market conditions. Always factor spread into calculations."
  },
  {
      title: "Liquidity Levels",
      content: "Watch for previous highs/lows, psychological levels (round numbers), and institutional order blocks. Price often reacts at these levels - consider taking profits or adjusting stops."
  }
];

// Market data
const MARKET_SESSIONS = {
  asian: {
      name: "Asian Session",
      time: "23:00 - 08:00 GMT",
      pairs: ["USD/JPY", "AUD/USD", "NZD/USD"],
      characteristics: "Lower volatility, range-bound"
  },
  london: {
      name: "London Session", 
      time: "08:00 - 17:00 GMT",
      pairs: ["EUR/USD", "GBP/USD", "EUR/GBP"],
      characteristics: "High volatility, strong trends"
  },
  newyork: {
      name: "New York Session",
      time: "13:00 - 22:00 GMT", 
      pairs: ["EUR/USD", "GBP/USD", "USD/CAD"],
      characteristics: "Major news releases, high volume"
  }
};

// Risk management recommendations
const RISK_MANAGEMENT = {
  beginner: {
    maxRiskPerTrade: 1,
    maxDailyDrawdown: 2,
    positionSizing: "Fixed lot (0.01-0.05)",
    stopLossRequired: true
  },
  intermediate: {
    maxRiskPerTrade: 2,
    maxDailyDrawdown: 4,
    positionSizing: "Percentage-based (1-2%)",
    stopLossRequired: true
  },
  advanced: {
    maxRiskPerTrade: 3,
    maxDailyDrawdown: 6,
    positionSizing: "Volatility-adjusted",
    stopLossRequired: true
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
      TRADING_PAIRS,
      TRADING_STRATEGIES,
      FAQ_DATA,
      MARKET_SESSIONS,
      RISK_MANAGEMENT
  };
}