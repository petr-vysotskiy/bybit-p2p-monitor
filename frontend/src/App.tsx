import { useState, useEffect } from 'react';
import { VolumeProfileChart } from './VolumeProfile.tsx';
import './App.css';

// Trade side constants following Bybit API convention
const TRADE_SIDE = {
  SELL: 0,  // Bybit API: side=0 for SELL orders
  BUY: 1    // Bybit API: side=1 for BUY orders
};

// Define types inline to avoid import issues
interface VolumeBin {
  price: number;
  buyVol: number;
  sellVol: number;
}

interface VolumeData {
  time: number;
  bins: VolumeBin[];
}

interface P2POffer {
  offer_id: string;
  price: number;
  total_quantity: number;
  token_id: string;
  currency_id: string;
  side: number;
  fetch_time: string;
  nick_name?: string;
  user_blocked?: boolean;
  exchange_id?: string;
  buy_fee_rate?: string;
  sell_fee_rate?: string;
}

interface ApiResponse {
  success: boolean;
  data: P2POffer[];
}

// Add utility function to transform P2P offers to volume profile data
const transformToVolumeProfile = (offers: P2POffer[]): VolumeData[] => {
  if (!offers.length) return [];
  
  // Group offers by time intervals (e.g., 10-minute intervals for better data density)
  const timeInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
  const groupedByTime = new Map<number, P2POffer[]>();

  offers.forEach(offer => {
    const timestamp = new Date(offer.fetch_time).getTime();
    const intervalStart = Math.floor(timestamp / timeInterval) * timeInterval;
    
    if (!groupedByTime.has(intervalStart)) {
      groupedByTime.set(intervalStart, []);
    }
    groupedByTime.get(intervalStart)!.push(offer);
  });

  // Create price bins for each time interval
  return Array.from(groupedByTime.entries()).map(([time, timeOffers]) => {
    // Get price range from all offers
    const prices = timeOffers.map(o => o.price).sort((a, b) => a - b);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Create more granular bins if we have enough price spread
    let binCount = Math.min(25, Math.max(8, Math.ceil(priceRange / (maxPrice * 0.0005)))); // More granular bins
    
    // If price range is very small, use fewer bins
    if (priceRange < maxPrice * 0.01) {
      binCount = Math.max(3, Math.ceil(binCount / 2));
    }
    
    const binSize = priceRange / binCount;

    const bins: VolumeBin[] = [];
    
    for (let i = 0; i < binCount; i++) {
      const binStart = minPrice + (i * binSize);
      const binEnd = binStart + binSize;
      const binPrice = binStart + (binSize / 2); // Use middle of bin as price

      const offersInBin = timeOffers.filter(offer => 
        offer.price >= binStart && (i === binCount - 1 ? offer.price <= binEnd : offer.price < binEnd)
      );

      const buyVol = offersInBin
        .filter(offer => offer.side === TRADE_SIDE.BUY)
        .reduce((sum, offer) => sum + offer.total_quantity, 0);

      const sellVol = offersInBin
        .filter(offer => offer.side === TRADE_SIDE.SELL)
        .reduce((sum, offer) => sum + offer.total_quantity, 0);

      // Always include bins that have any volume, even if it's just one side
      if (buyVol > 0 || sellVol > 0) {
        bins.push({
          price: binPrice,
          buyVol,
          sellVol
        });
      }
    }

    return {
      time,
      bins: bins.sort((a, b) => b.price - a.price) // Sort by price descending
    };
  }).sort((a, b) => a.time - b.time); // Sort by time ascending
};

function App() {
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch offers from the single endpoint (backend now fetches both sides)
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/p2p/offers?limit=200&t=${timestamp}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setOffers(data.data);
      } else {
        setError('Failed to fetch offers');
      }
    } catch (err) {
      setError('Error fetching data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchFromBybit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch new data from Bybit API
      const response = await fetch('/api/p2p/fetch');
      const data = await response.json();
      
      if (data.success) {
        // After fetching new data, refresh the display
        await fetchOffers();
      } else {
        setError('Failed to fetch new data from Bybit: ' + data.message);
      }
    } catch (err) {
      setError('Error fetching from Bybit: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading P2P offers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchOffers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Bybit P2P Monitor</h1>
        <div className="header-buttons">
          <button onClick={fetchFromBybit} className="fetch-btn">
            Fetch New Data
          </button>
          <button onClick={fetchOffers} className="refresh-btn">
            Refresh Display
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <div className="chart-container">
          <h3>Volume Profile</h3>
          <VolumeProfileChart 
            data={transformToVolumeProfile(offers)}
            width={800}
            height={600}
          />
        </div>
        
        <div className="offers-summary">
          <h2>Offers Summary</h2>
          <p>Total offers: {offers.length}</p>
          {offers.length > 0 && (
            <>
              <div className="side-breakdown">
                <p><span style={{color: 'green'}}>●</span> Buy offers: {offers.filter(o => o.side === TRADE_SIDE.BUY).length}</p>
                <p><span style={{color: '#dc267f'}}>●</span> Sell offers: {offers.filter(o => o.side === TRADE_SIDE.SELL).length}</p>
              </div>
              <div className="token-pairs">
                <h3>Token Pairs:</h3>
                {Array.from(new Set(offers.map(offer => `${offer.token_id}/${offer.currency_id}`))).map(pair => (
                  <span key={pair} className="token-pair-tag">{pair}</span>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="offers-table">
          <h3>Recent Offers</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Token Pair</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Side</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {offers.slice(0, 10).map((offer, index) => (
                  <tr key={`${offer.offer_id}-${index}`}>
                    <td>{offer.token_id}/{offer.currency_id}</td>
                    <td>{offer.price}</td>
                    <td>{offer.total_quantity}</td>
                    <td>{offer.side === TRADE_SIDE.BUY ? 'Buy' : offer.side === TRADE_SIDE.SELL ? 'Sell' : 'Unknown'}</td>
                    <td>{new Date(offer.fetch_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
