// src/pages/CreatorFeed.jsx
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../state/AuthContext';
import Loader from '../components/Loader';

function Card({ video }) {
  const url = video.raw?.url || video.url;
  return (
    <article className="card overflow-hidden">
      <div className="aspect-video bg-black">
        {url ? <video controls className="w-full h-full" src={url} /> : <div className="w-full h-full flex items-center justify-center text-white/80">Video</div>}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{video.title}</h3>
        <p className="text-sm text-gray-600">{video.description}</p>
        <div className="mt-2 text-xs text-gray-500">Uploaded {new Date(video.createdAt).toLocaleString()}</div>
      </div>
    </article>
  );
}

export default function CreatorFeed() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef(null);

  const load = async (opts) => {
    try {
      const first = videos.length === 0;
      first ? setLoadingFirst(true) : setLoadingMore(true);
      const { items, hasMore: hm, nextCursor } = await api.loadCreatorVideos({
        creatorId: user?.id,
        limit: 8,
        cursor: opts?.cursor,
        // currentUserId: user?.id // not needed if no like UI
      });
      setVideos(prev => {
        const seen = new Set(prev.map(x => x.id));
        return [...prev, ...items.filter(x => !seen.has(x.id))];
      });
      setHasMore(hm);
      setCursor(nextCursor);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoadingFirst(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  useEffect(() => {
    if (!sentinelRef.current || loadingFirst) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        load({ cursor });
      }
    }, { rootMargin: '300px' });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [cursor, hasMore, loadingFirst, loadingMore]);

  if (loadingFirst) return <Loader />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl grid gap-6">
        {videos.map(v => <Card key={v.id} video={v} />)}
        {videos.length === 0 && <p className="text-center">You haven’t uploaded any videos yet.</p>}
        <div ref={sentinelRef} />
        {loadingMore && <p className="text-center text-sm text-gray-500">Loading more…</p>}
        {!hasMore && videos.length > 0 && <p className="text-center text-sm text-gray-400">End of your uploads.</p>}
      </div>
    </div>
  );
}
