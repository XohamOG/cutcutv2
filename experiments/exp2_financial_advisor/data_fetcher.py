from typing import Dict, Any, Optional

# Predefined market data feed with realistic historical & intraday values
SAMPLE_MARKET_FEED: Dict[str, Dict[str, Any]] = {
    "TCS.NS": {
        "symbol": "TCS.NS",
        "current_price": 4150.00,
        "previous_close": 4050.00,
        "volume": 1850000,
        "avg_volume": 1200000,
        "sma_20": 4020.00
    },
    "RELIANCE.NS": {
        "symbol": "RELIANCE.NS",
        "current_price": 2890.00,
        "previous_close": 2980.00,
        "volume": 3200000,
        "avg_volume": 2500000,
        "sma_20": 2950.00
    },
    "INFY.NS": {
        "symbol": "INFY.NS",
        "current_price": 1820.00,
        "previous_close": 1810.00,
        "volume": 980000,
        "avg_volume": 1100000,
        "sma_20": 1815.00
    },
    "BOUNDARY_BUY.NS": {
        "symbol": "BOUNDARY_BUY.NS",
        "current_price": 102.10,
        "previous_close": 100.00,
        "volume": 500000,
        "avg_volume": 500000,
        "sma_20": 100.00
    },
    "BOUNDARY_HOLD.NS": {
        "symbol": "BOUNDARY_HOLD.NS",
        "current_price": 101.50,
        "previous_close": 100.00,
        "volume": 500000,
        "avg_volume": 500000,
        "sma_20": 100.00
    },
    "BOUNDARY_SELL.NS": {
        "symbol": "BOUNDARY_SELL.NS",
        "current_price": 97.50,
        "previous_close": 100.00,
        "volume": 500000,
        "avg_volume": 500000,
        "sma_20": 100.00
    }
}

def fetch_stock_data(symbol: str) -> Optional[Dict[str, Any]]:
    if not symbol or not symbol.strip():
        return None
    sym = symbol.strip().upper()
    return SAMPLE_MARKET_FEED.get(sym)
