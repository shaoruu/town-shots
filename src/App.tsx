import { useEffect, useState } from 'react';
import Gallery from './Gallery';
import { Manifest } from './types';

function App() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load manifest');
        return res.json();
      })
      .then((data: Manifest) => {
        setManifest(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading manifest:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="app-status" />;
  }

  if (error) {
    return <div className="app-status">Unable to load the wall. {error}</div>;
  }

  return <Gallery items={manifest?.items || []} />;
}

export default App;
