// src/pages/Upload.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../state/AuthContext';

export default function Upload() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoMeta, setVideoMeta] = useState({ duration: 0, width: 0, height: 0 });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    visibility: 'public',
    type: 'mp4',          // backend content type (mp4/mov/mkv)
    videoType: 'short'    // UX flag: 'short' | 'standard'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dropRef = useRef(null);
  const vidRef = useRef(null);

  // build preview URL when file changes
  useEffect(() => {
    if (!file) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // drag & drop handlers
  useEffect(() => {
    if (!dropRef.current) return;
    const el = dropRef.current;

    const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e) => {
      prevent(e);
      const f = e.dataTransfer?.files?.[0];
      if (f) setFile(f);
    };

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
      el.addEventListener(ev, prevent);
    });
    el.addEventListener('drop', onDrop);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
        el.removeEventListener(ev, prevent);
      });
      el.removeEventListener('drop', onDrop);
    };
  }, []);

  // read metadata from the video element
  const handleLoadedMetadata = () => {
    if (!vidRef.current) return;
    setVideoMeta({
      duration: vidRef.current.duration || 0,
      width: vidRef.current.videoWidth || 0,
      height: vidRef.current.videoHeight || 0
    });
  };

  const validate = () => {
    if (!file) return 'Please choose a video file.';
    if (!form.title.trim()) return 'Please enter a title.';
    if (form.videoType === 'short' && videoMeta.duration > 60.5) {
      return 'Short videos must be 60 seconds or less.';
    }
    // Optional portrait check for Shorts:
    // if (form.videoType === 'short' && videoMeta.height <= videoMeta.width) return 'Shorts should be vertical (portrait).';
    return '';
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const submit = async () => {
    console.log(user, user?.id, 'user in upload');
    
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    try {
      setSubmitting(true);

      // Map MIME to backend "type"
      const backendType =
        file.type?.includes('quicktime') ? 'mov' :
        file.type?.includes('matroska') ? 'mkv' : 'mp4';

      const payload = {
        file,
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        visibility: form.visibility,
        mime_type: file.type || 'video/mp4',
        video_type: form.videoType,
        type: 'video',
        creatorId: user?.id,
      };

      const res = await api.uploadVideo(payload);

      alert(res?.message || 'Video uploaded');
      // Navigate back to feed; it will load fresh
      navigate('/');
    } catch (e) {
      setError(typeof e === 'string' ? e : e.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Upload Video</h1>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="card p-5 space-y-4">
        {/* Video type like TikTok vs Standard */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Video type</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded-xl border ${form.videoType === 'short' ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={() => setForm(f => ({ ...f, videoType: 'short' }))}
                disabled={submitting}
              >
                Short (≤ 60s, vertical)
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-xl border ${form.videoType === 'standard' ? 'bg-blue-600 text-white' : 'bg-white'}`}
                onClick={() => setForm(f => ({ ...f, videoType: 'standard' }))}
                disabled={submitting}
              >
                Standard
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Visibility</label>
            <select
              className="input mt-2"
              value={form.visibility}
              onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
              disabled={submitting}
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Drag & drop */}
        <div
          ref={dropRef}
          className="border-2 border-dashed rounded-2xl p-6 text-center hover:bg-gray-50"
        >
          <p className="text-sm text-gray-600">Drag and drop your video here</p>
          <p className="text-xs text-gray-400 mt-1">MP4 / MOV / MKV • Max ~200MB (example)</p>
          <div className="mt-3">
            <input type="file" accept="video/*" onChange={onFileChange} disabled={submitting} />
          </div>
        </div>

        {/* Preview & meta */}
        {previewUrl && (
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <video
              ref={vidRef}
              className="w-full rounded-xl border"
              src={previewUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
            />
            <div className="text-sm text-gray-600 space-y-1">
              <div>Duration: {videoMeta.duration ? `${videoMeta.duration.toFixed(1)}s` : '—'}</div>
              <div>Resolution: {videoMeta.width && videoMeta.height ? `${videoMeta.width}×${videoMeta.height}` : '—'}</div>
              <div>Orientation: {videoMeta.width && videoMeta.height ? (videoMeta.height > videoMeta.width ? 'Portrait' : 'Landscape') : '—'}</div>
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input
              className="input mt-2"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="My awesome video"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              className="input mt-2"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              disabled={submitting}
            >
              <option value="general">General</option>
              <option value="education">Education</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="input mt-2"
            rows={3}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this video about?"
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn" onClick={submit} disabled={submitting}>
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
