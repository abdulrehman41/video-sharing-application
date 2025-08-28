import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../state/AuthContext';
import { UploadVideoModal } from '../components/UploadVideoModal';
import Loader from '../components/Loader';

export default function Feed() {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);          // for page/limit fallback
  const [cursor, setCursor] = useState(null);   // for cursor-based paging
  const [hasMore, setHasMore] = useState(true);
  const [loadingFirst, setLoadingFirst] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const sentinelRef = useRef(null);
  const didInit = useRef(false);
  const { user } = useAuth();
  const [open, setOpen] = useState(false); // modal

  // merges and de-dupes by id
  const mergeVideos = (prev, newItems) => {
    const seen = new Set();
    return [...prev, ...newItems].filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  };

  // Loader (works with cursor or page/limit)
  const load = async (opts) => {
    try {
      const first = videos.length === 0;
      first ? setLoadingFirst(true) : setLoadingMore(true);

      const { items, hasMore: hm, nextCursor } = await api.loadVideos(opts);

      setVideos(prev => mergeVideos(prev, items));
      setHasMore(Boolean(hm));
      setCursor(nextCursor ?? null);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoadingFirst(false);
      setLoadingMore(false);
    }
  };

  // Initial load (guard StrictMode double-run)
  useEffect(() => {
    console.log(user, 'user in feed');
    
    if (didInit.current) return;
    didInit.current = true;
    load({ page: 1, limit: 8, currentUserId: user?.id });
  }, []);

  // IntersectionObserver to fetch more
  useEffect(() => {
    if (!sentinelRef.current || loadingFirst) return;

    const onIntersect = (entries) => {
      const [entry] = entries;
      if (!entry.isIntersecting) return;
      if (!hasMore || loadingMore) return;

      if (cursor) {
        // cursor flow
        load({ cursor, limit: 8 });
      } else {
        // page/limit flow
        const next = page + 1;
        setPage(next);
        load({ page: next, limit: 8 });
      }
    };

    const io = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '300px', // prefetch earlier
      threshold: 0
    });

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [cursor, hasMore, loadingFirst, loadingMore, page]);

  if (loadingFirst) return <Loader />;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    // Center the feed container
    <div className="flex flex-col">
      <div className="flex justify-center">
        <div className="w-full max-w-3xl grid gap-6">
          {videos.map(v => (
            <VideoCard key={v.id} video={v} setVideos={setVideos} videos={videos} />
          ))}

          {videos.length === 0 && (
            <p className="text-center">No videos uploaded yet.</p>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} />

          {/* Tail loader / end state */}
          {loadingMore && (
            <p className="text-center text-sm text-gray-500">Loading more…</p>
          )}
          {!hasMore && videos.length > 0 && (
            <p className="text-center text-sm text-gray-400">You’re all caught up.</p>
          )}
        </div>
      </div>
      <UploadVideoModal open={open} setOpen={setOpen} setVideos={setVideos} videos={videos} />
    </div>
  );
}
