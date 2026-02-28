'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testFetch = async () => {
      try {
        console.log('Testing fetch to:', process.env.NEXT_PUBLIC_SUBGRAPH_URL);
        
        const endpoint = process.env.NEXT_PUBLIC_SUBGRAPH_URL || '';
        if (!endpoint) {
          throw new Error('NEXT_PUBLIC_SUBGRAPH_URL is not configured');
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetMarkets {
                markets(first: 10) {
                  id
                  marketId
                  description
                }
              }
            `
          })
        });

        console.log('Response status:', response.status);
        const json = await response.json();
        console.log('Response data:', json);
        
        setData(json);
        setLoading(false);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    testFetch();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">GraphQL Connection Test</h1>
      
      <div className="mb-4">
        <p><strong>Subgraph URL:</strong> {process.env.NEXT_PUBLIC_SUBGRAPH_URL || '(not configured)'}</p>
      </div>

      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {data && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Success!</strong>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
