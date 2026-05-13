import { Download } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Download size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">VidDown</span>
          <span className="hidden sm:inline text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            Free
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#how-to-use" className="hover:text-white transition-colors">How to Use</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Facebook</span>
            <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">Instagram</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">YouTube</span>
          </div>
        </nav>

        <a
          href="#downloader"
          className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          Download Now
        </a>
      </div>
    </header>
  );
}
