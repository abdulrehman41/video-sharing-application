import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../state/AuthContext';

export default function VideoCard({ video, setVideos, videos }) {


  const [likes, setLikes] = useState(video.likes || 0);

  // small preview in the card
  const [comments, setComments] = useState(Array.isArray(video.comments) ? video.comments : []);


  // modal state (no pagination)
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);     // full list in modal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didLoadOnce = useRef(false);


  const { user } = useAuth();
  const [submittingLike, setSubmittingLike] = useState(false);
  const [text, setText] = useState('');

  const liked = !!video.raw?.likedByCurrentUser;
  const currentUserId = user?.id || '0aaa4305-4b53-4ee3-a429-e19ce7180467';

  function SentimentBadge({ s, scores }) {
    const map = {
      positive: { label: 'Positive 😊', cls: 'bg-green-100 text-green-800' },
      neutral: { label: 'Neutral 😐', cls: 'bg-gray-100 text-gray-800' },
      negative: { label: 'Negative 😞', cls: 'bg-red-100 text-red-800' },
      mixed: { label: 'Mixed 🤔', cls: 'bg-yellow-100 text-yellow-800' },
    };
    const m = map[s] || map.neutral;
    const conf = scores ? ` (${Math.max(scores.positive, scores.neutral, scores.negative).toFixed(2)})` : '';
    return <span className={`ml-2 inline-block px-2 py-0.5 text-xs rounded ${m.cls}`}>{m.label}{conf}</span>;
  }

  const like = async () => {
    if (liked || submittingLike) return;

    const prev = videos;
    const optimistic = videos.map(v => {
      if (v.id !== video.id) return v;
      const next = (v.raw?.likeCount ?? 0) + 1;
      return {
        ...v,
        likes: typeof v.likes === 'number' ? v.likes + 1 : next,
        raw: { ...v.raw, likeCount: next, likedByCurrentUser: true }
      };
    });
    setVideos(optimistic);

    try {
      setSubmittingLike(true);
      await api.likeVideo({
        videoId: video.id,
        currentUserId,
        creatorId: video.creatorId
      });
    } catch (e) {
      setVideos(prev); // rollback
      alert(e.message);
    } finally {
      setSubmittingLike(false);
    }
  };

  const toggleLike = async () => {
    if (!liked || submittingLike) return;

    const prev = videos;
    const optimistic = videos.map(v => {
      if (v.id !== video.id) return v;
      const next = Math.max((v.raw?.likeCount ?? 1) - 1, 0);
      return {
        ...v,
        likes: typeof v.likes === 'number' ? Math.max(v.likes - 1, 0) : next,
        raw: { ...v.raw, likeCount: next, likedByCurrentUser: false }
      };
    });
    setVideos(optimistic);

    try {
      setSubmittingLike(true);
      await api.toggleLikeVideo({
        videoId: video.id,
        currentUserId,            // use same user id
        creatorId: video.creatorId
      });
    } catch (e) {
      setVideos(prev); // rollback
      alert(e.message);
    } finally {
      setSubmittingLike(false);
    }
  };

  // Post a new comment; also push into modal list & card preview
  const submitComment = async () => {
    if (!text.trim()) return;
    try {
      const currentUserId = user?.id || '0aaa4305-4b53-4ee3-a429-e19ce7180467';
      const payload = {
        videoId: video.id,
        currentUserId,
        creatorId: video.creatorId,
        comment: text.trim()
      };
      const created = await api.comment(payload);

      const normalized = {
        id: created.id || crypto.randomUUID(),
        videoId: video.id,
        authorId: created.currentUserId || created.authorId || currentUserId,
        text: created.comment || created.text || text.trim(),
        createdAt: created.createdAt || new Date().toISOString(),
        raw: created
      };

      // update preview (card)
      setComments(prev => [...(Array.isArray(prev) ? prev : []), normalized]);
      loadAllComments();

      // update modal list if it’s open
      if (open) setList(prev => [normalized, ...prev]);

      setText('');
    } catch (e) {
      alert(e.message);
    }
  };

  // Load ALL comments once when opening the modal
  const loadAllComments = async () => {
    try {
      setLoading(true); setError('');
      const res = await api.listComments({ videoId: video.id }); // expects one call returns all
      const rows = Array.isArray(res) ? res : (res.items || []);

      const normalized = rows.map(c => ({
        id: c.id,
        videoId: c.videoId,
        authorName: c.authorName,
        authorId: c.authorId,
        text: c.text ?? c.comment ?? '',
        createdAt: c.createdAt,
        raw: c
      }));

      // ensure newest first (your API already orders DESC, but we enforce)
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setList(normalized);
    } catch (e) {
      setError(e.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !didLoadOnce.current) {
      didLoadOnce.current = true;
      loadAllComments();
    }
  }, [open]);

  return (
    <article className="card overflow-hidden">
      <div className="aspect-video bg-black">
        {video?.raw?.url ? (
          <video controls className="w-full h-full" src={video?.raw?.url} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/80">Video Placeholder</div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold">{video.title}</h3>
        <p className="text-sm text-gray-600">{video.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {/* Like: enabled only when NOT liked */}
          <button
            className={`px-3 py-1 rounded-xl border font-medium transition
    ${liked
                ? 'bg-white text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={like}
            disabled={liked || submittingLike}
          >
            Like ({video.raw?.likeCount ?? 0})
          </button>

          {/* Toggle Like (unlike): enabled only when liked */}
          <button
            className={`px-3 py-1 rounded-xl border font-medium transition
    ${liked
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-gray-400 cursor-not-allowed'}`}
            onClick={toggleLike}
            disabled={!liked || submittingLike}
          >
            Toggle Like
          </button>


          <button className="rounded-xl border px-3 py-1" onClick={() => setOpen(true)}>
            View comments
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Add a comment"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button className="btn" onClick={submitComment}>Comment</button>
          </div>

          {/* small preview: last 3 comments
          <ul className="space-y-1">
            {(Array.isArray(comments) ? comments : []).slice(-3).map((c, idx) => (
              <li key={c.id || idx} className="text-sm text-gray-700">
                <span className="font-medium">{c.authorName }:</span>{' '}
                {c.text || c.comment || c}
              </li>
            ))}
          </ul> */}
        </div>
      </div>

      {/* Modal (no paging) */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl card p-0 overflow-hidden">
            <header className="px-5 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">Comments</h2>
              <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setOpen(false)}>Close</button>
            </header>

            <section className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              {!error && !loading && list.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}

              <ul className="space-y-3">
                {list.map(item => (
                  <li key={item.id} className="border-b pb-3">
                    <div className="text-sm">
                      <span className="font-medium">{item.authorName || 'User'}</span>
                      <span className="text-gray-400"> · {formatWhen(item.createdAt)}</span>
                      {item.raw?.sentiment && (
                        <SentimentBadge s={item.raw.sentiment} scores={item.raw.sentimentScores} />
                      )}
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap">{item.text}</div>
                  </li>
                ))}
              </ul>

              {loading && <p className="text-center text-sm text-gray-500 mt-3">Loading…</p>}
            </section>

            <footer className="px-5 py-3 border-t flex items-center justify-end gap-2">
              <input
                className="input w-2/3"
                placeholder="Write a comment"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button className="btn" onClick={submitComment}>Send</button>
            </footer>
          </div>
        </div>
      )}
    </article>
  );
}

function formatWhen(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(); }
  catch { return iso; }
}
