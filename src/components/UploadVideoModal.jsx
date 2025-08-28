import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../state/AuthContext';

export function UploadVideoModal({ open, onClose, onUploaded }) {
    const { user } = useAuth();

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [videoMeta, setVideoMeta] = useState({ duration: 0, width: 0, height: 0 });
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'general',
        visibility: 'public',
        // app-level type (file kind + content type)
        type: 'mp4',
        // UX video type (like TikTok Shorts vs Standard)
        videoType: 'short' // 'short' | 'standard'
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const dropRef = useRef(null);
    const vidRef = useRef(null);

    useEffect(() => {
        if (!open) {
            // reset when closing
            setFile(null);
            setPreviewUrl('');
            setVideoMeta({ duration: 0, width: 0, height: 0 });
            setForm(prev => ({ ...prev, title: '', description: '' }));
            setError('');
            setSubmitting(false);
        }
    }, [open]);

    // build preview URL
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

    // when metadata loads from video tag
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
        // TikTok/Short format rule: <= 60s
        if (form.videoType === 'short' && videoMeta.duration > 60.5) {
            return 'Short videos must be 60 seconds or less.';
        }
        return '';
    };

    const onFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) setFile(f);
    };

    const submit = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError('');

        try {
            setSubmitting(true);

            // Map MIME to a simple type
            const backendType =
                file.type?.includes('quicktime') ? 'mov' :
                    file.type?.includes('matroska') ? 'mkv' : 'mp4';

            const payload = {
                file,
                title: form.title.trim(),
                description: form.description,
                category: form.category,
                visibility: form.visibility,
                type: backendType,       // keep as "type" to match your API
                creatorId: user?.id
            };

            const res = await api.uploadVideo(payload);

            // Success message from your API response
            alert(res?.message || 'Video uploaded');

            // Close the modal
            onClose?.();

            // Reload the feed page (hard refresh so it re-fetches)
            window.location.reload();

        } catch (e) {
            setError(typeof e === 'string' ? e : e.message || 'Upload failed');
        } finally {
            setSubmitting(false);
        }
    };


    if (!open) return null;

    return (
        <div className="overflow-scroll fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl card p-0 overflow-hidden">
                <header className="px-5 py-3 border-b flex items-center justify-between">
                    <h2 className="font-semibold">Upload Video</h2>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={onClose} disabled={submitting}>
                        Close
                    </button>
                </header>

                <section className="px-5 py-4 space-y-4">
                    {error && <p className="text-sm text-red-600">{error}</p>}

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
                </section>

                <footer className="px-5 py-3 border-t flex items-center justify-end gap-2">
                    <button className="rounded-xl border px-3 py-1 text-sm" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="btn" onClick={submit} disabled={submitting}>
                        {submitting ? 'Uploading…' : 'Upload'}
                    </button>
                </footer>
            </div>
        </div>
    );
}
