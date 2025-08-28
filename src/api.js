
const BASE = import.meta.env.VITE_API_BASE || 'https://video-sharing-application.azurewebsites.net/api';

async function jsonFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const res = await fetch(`${BASE}${url}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.headers.get('content-type')?.includes('application/json') ? res.json() : res.text();
}

export const api = {
  signIn: (body) => jsonFetch('/signIn', { method: 'POST', body: JSON.stringify(body) }),
  signUp: (body) => jsonFetch('/signUp', { method: 'POST', body: JSON.stringify(body) }),
  loadVideos: async ({ page = 1, limit = 8, currentUserId, cursor } = {}) => {
    const token = localStorage.getItem('token');
    const url = new URL(`${BASE}/LoadVideos`);
    if (cursor) url.searchParams.set('cursor', cursor);
    else {
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('currentUserId', currentUserId);
    }

    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    const raw = Array.isArray(data) ? data : (data.items || []);
    const items = raw.map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      url: v.blobUrl,
      creatorId: v.creatorId,
      type: v.type,
      createdAt: v.createdAt,
      likes: v.likes ?? v.likeCount ?? 0,
      comments: v.comments ?? [],
      raw: v
    }));

    // If your Function doesn’t (yet) return hasMore/nextCursor,
    // we infer hasMore by page size.
    return {
      items,
      hasMore: (data.hasMore ?? items.length === limit) || Boolean(data.nextCursor),
      nextCursor: data.nextCursor ?? null
    };
  },
  likeVideo: ({ videoId, currentUserId, creatorId }) =>
    jsonFetch('/LikeVideo', {
      method: 'POST',
      body: JSON.stringify({
        videoId,
        currentUserId,
        creatorId
      })
    }),
  toggleLikeVideo: ({ videoId, currentUserId, creatorId }) =>
    jsonFetch('/ToggleLikeVideo', {
      method: 'POST',
      body: JSON.stringify({
        videoId,
        currentUserId,
        creatorId
      })
    }),
  comment: ({ videoId, currentUserId, creatorId, comment }) =>
    jsonFetch('/CommentVideo', {
      method: 'POST',
      body: JSON.stringify({
        videoId,
        currentUserId,
        creatorId,
        comment
      })
    }),
  listComments: async ({ videoId }) => {
    const res = await jsonFetch(`/ListVideoComments?videoId=${encodeURIComponent(videoId)}`);
    return res; // can be array or {items: []}; component handles both
  },
  // in api.js
  loadCreatorVideos: async ({ creatorId, limit = 8, cursor, currentUserId } = {}) => {
    if (!creatorId) throw new Error('creatorId is required');
    const url = new URL(`${BASE}/LoadCreatorVideos`);
    url.searchParams.set('creatorId', creatorId);
    url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('cursor', cursor);
    if (currentUserId) url.searchParams.set('currentUserId', currentUserId);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const items = (data.items || []).map(v => ({
      id: v.id,
      title: v.title,
      description: v.description,
      url: v.url || v.blobUrl,
      creatorId: v.creatorId,
      type: v.type,
      createdAt: v.createdAt,
      likes: v.likeCount ?? 0,
      comments: [],
      raw: v
    }));
    return { items, hasMore: !!data.hasMore, nextCursor: data.nextCursor ?? null };
  },

  uploadVideo: async (formValues) => {
    const {
      file,
      title = "",
      description = "",
      category = "general",
      visibility = "public",
      mime_type = "mp4",
      type = "video",
      creatorId = null,
    } = formValues;

    if (!file) throw new Error("No video file selected");

    const token = localStorage.getItem("token");
    const form = new FormData();
    form.append("file", file);
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("category", category);
    form.append("visibility", visibility);
    form.append("mime_type", mime_type);
    form.append("video_type", formValues.video_type || "short");
    form.append("type", type);
    if (creatorId) form.append("creatorId", creatorId);

    const res = await fetch(`${BASE}/uploadVideo`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Upload failed");
    }

    return res.json();
  }

};
