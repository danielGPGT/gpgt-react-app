import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const spreadFieldMappings = {
  spread_id: 'Spread ID',
  spread: 'Spread',
};

const FxTable = () => {
  const [matrixMid, setMatrixMid] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [spread, setSpread] = useState(null);
  const [spreadId, setSpreadId] = useState(null);
  const [spreadInput, setSpreadInput] = useState('');
  const [spreadLoading, setSpreadLoading] = useState(false);
  const [spreadError, setSpreadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('mid');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/new-fx'),
      api.get('/fx-spread'),
    ])
      .then(([ratesRes, spreadRes]) => {
        const fxData = Array.isArray(ratesRes.data) ? ratesRes.data : [];
        // Get all unique currencies
        const fromCurrencies = fxData.map(item => item.from);
        const toCurrencies = fxData.map(item => item.to);
        const allCurrencies = Array.from(new Set([...fromCurrencies, ...toCurrencies]));
        allCurrencies.sort();
        setCurrencies(allCurrencies);
        // Build matrix: { [from]: { [to]: rate } }
        const matrixObj = {};
        fxData.forEach(({ from, to, rate }) => {
          if (!matrixObj[from]) matrixObj[from] = {};
          matrixObj[from][to] = rate;
        });
        // Build rows for rendering
        const matrixRows = allCurrencies.map(fromCur => {
          const row = { 'from/to': fromCur };
          allCurrencies.forEach(toCur => {
            row[toCur] = matrixObj[fromCur]?.[toCur] ?? '';
          });
          return row;
        });
        setMatrixMid(matrixRows);
        // Set spread and spread_id from /fx-spread
        let spreadValue = null;
        let spreadIdValue = null;
        if (Array.isArray(spreadRes.data) && spreadRes.data.length > 0) {
          spreadValue = spreadRes.data[0].spread;
          spreadIdValue = spreadRes.data[0].spread_id;
          setSpread(spreadValue);
          setSpreadId(spreadIdValue);
          setSpreadInput(String(spreadValue));
        } else {
          setSpread(null);
          setSpreadId(null);
          setSpreadInput('');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch FX data');
        setLoading(false);
      });
  }, []);

  // Only allow update
  const handleSpreadUpdate = async () => {
    setSpreadLoading(true);
    setSpreadError(null);
    try {
      const value = parseFloat(spreadInput);
      if (isNaN(value)) throw new Error('Invalid spread value');
      if (!spreadId) throw new Error('No spread_id found');
      const updateData = {
        column: spreadFieldMappings.spread,
        value: value,
      };
      await api.put(`/fx-spread/${spreadFieldMappings.spread_id}/${spreadId}`, updateData);
      setSpread(value);
      toast.success('Spread updated successfully');
    } catch (err) {
      setSpreadError('Failed to update spread');
      toast.error('Failed to update spread');
    }
    setSpreadLoading(false);
  };

  // Calculate bid/ask matrices from mid and spread
  const getMatrix = (tab) => {
    if (tab === 'mid') {
      // Format mid rates to 3 decimal places except for 1
      return matrixMid.map(row => {
        const newRow = { 'from/to': row['from/to'] };
        currencies.forEach(cur => {
          const val = row[cur];
          if (val === 1 || val === '1') {
            newRow[cur] = 1;
          } else if (val !== '' && !isNaN(val)) {
            newRow[cur] = Number(val).toFixed(3);
          } else {
            newRow[cur] = '';
          }
        });
        return newRow;
      });
    }
    // Use the current spread value from input
    const spreadNum = parseFloat(spreadInput) || 0;
    return matrixMid.map(row => {
      const newRow = { 'from/to': row['from/to'] };
      currencies.forEach(cur => {
        const mid = Number(row[cur]);
        if (mid === 1) {
          newRow[cur] = 1;
        } else if (!mid && mid !== 0) {
          newRow[cur] = '';
        } else if (tab === 'bid') {
          newRow[cur] = (mid - spreadNum).toFixed(3);
        } else if (tab === 'ask') {
          newRow[cur] = (mid + spreadNum).toFixed(3);
        }
      });
      return newRow;
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!matrixMid.length) return <div>No data available</div>;

  return (
    <div className="overflow-x-auto w-full">
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium">Spread:</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={spreadInput}
          onChange={e => setSpreadInput(e.target.value)}
          className="border rounded px-2 py-1 w-24"
          disabled={spreadLoading}
        />
        <Button
          size="sm"
          onClick={handleSpreadUpdate}
          disabled={spreadLoading || spreadInput === '' || String(spread) === spreadInput || !spreadId}
          className="h-8"
        >
          {spreadLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Update'}
        </Button>
        {spreadError && <span className="text-destructive text-sm ml-2">{spreadError}</span>}
      </div>
      <Tabs value={tab} onValueChange={setTab} defaultValue="mid" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="bid">Bid</TabsTrigger>
          <TabsTrigger value="mid">Mid</TabsTrigger>
          <TabsTrigger value="ask">Ask</TabsTrigger>
        </TabsList>
        {['bid', 'mid', 'ask'].map((t) => (
          <TabsContent key={t} value={t} className="w-full">
            <table className="min-w-[800px] w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 border border-muted text-primary-foreground text-center uppercase sticky left-0 bg-primary z-10">From/To</th>
                  {currencies.map((cur) => (
                    <th key={cur} className="p-2 border border-muted text-center text-primary-foreground uppercase bg-primary">{cur}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getMatrix(t).map((row) => (
                  <tr key={row['from/to']}>
                    <td className="p-2 border border-muted text-primary-foreground font-bold text-center bg-primary sticky left-0 z-10">{row['from/to']}</td>
                    {currencies.map((cur) => {
                      const value = row[cur];
                      const isOne = value === 1 || value === '1';
                      return (
                        <td
                          key={cur}
                          className={`p-2 border border-muted text-center ${isOne ? 'bg-muted text-foreground' : 'text-foreground'}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FxTable;
