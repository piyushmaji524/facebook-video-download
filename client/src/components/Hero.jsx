import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link2, ArrowRight, Loader2, Clipboard, Lock, ChevronDown, ChevronUp } from 'lucide-react';

export default function Hero({ setVideoData, loading, setLoading }) {
  const [url, setUrl] = useState('');
  const [showCookie, setShowCookie] = useState(false);
  const [cookie, setCookie] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error('Please enter a Facebook video URL');
      return;
    }

    setLoading(true);
    setVideoData(null);

    try {
      const res = await axios.post('/api/info', { url: trimmed, cookie: cookie.trim() || undefined });
      setVideoData(res.data);
      toast.success('Video found! Select your quality below.');
      setTimeout(() => {
        document.getElementById('result-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to fetch video. Please check the URL.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="downloader" className="relative px-4 pt-20 pb-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-blue-500/30 text-sm text-blue-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></span>
          Facebook · Instagram · YouTube · Free · HD
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-5 leading-tight">
          Download{' '}
          <span className="gradient-text">Social Videos</span>
          <br />
          In Seconds
        </h1>

        <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
          Paste any <span className="text-blue-400 font-medium">Facebook</span>, <span className="text-pink-400 font-medium">Instagram</span> or <span className="text-red-400 font-medium">YouTube</span> video link and download instantly in HD or audio-only. No registration needed.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Link2
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Facebook, Instagram or YouTube URL..."
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-800/80 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white text-sm"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700"
                title="Paste from clipboard"
              >
                <Clipboard size={16} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-xl shadow-blue-500/25 whitespace-nowrap glow-blue"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  Download
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-3 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-blue-400">● Facebook</span> Videos, Reels
            <span className="text-pink-400">● Instagram</span> Posts, Reels, Stories
            <span className="text-red-400">● YouTube</span> Videos, Shorts
          </p>

          <button
            type="button"
            onClick={() => setShowCookie(v => !v)}
            className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors mx-auto"
          >
            <Lock size={12} />
            Private video? Add cookie
            {showCookie ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showCookie && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-800/60 border border-yellow-500/30 text-left">
              <p className="text-xs text-yellow-400 mb-2 font-medium">⚠️ Cookie sirf aapke browser session ke liye use hoga — server pe store nahi hota</p>
              <p className="text-xs text-slate-500 mb-2">
                Chrome mein: F12 → Network → Koi bhi facebook.com/instagram.com request → Headers → "cookie" value copy karo
              </p>
              <textarea
                value={cookie}
                onChange={e => setCookie(e.target.value)}
                placeholder="Paste cookie string here..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 focus:border-yellow-500/50 outline-none text-xs text-slate-300 resize-none"
              />
            </div>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold text-base">✓</span> 100% Free
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold text-base">✓</span> No Registration
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold text-base">✓</span> HD Quality
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-bold text-base">✓</span> Fast & Secure
          </div>
        </div>
      </div>
    </section>
  );
}
