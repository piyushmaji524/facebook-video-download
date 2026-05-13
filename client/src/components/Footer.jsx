import { Download, Heart } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 px-4 py-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Download size={14} className="text-white" />
          </div>
          <span className="font-bold gradient-text">VidDown</span>
        </div>

        <p className="text-slate-500 text-sm flex items-center gap-1">
          Made with <Heart size={13} className="text-red-500 fill-red-500" /> for everyone · {year}
        </p>

        <p className="text-slate-600 text-xs text-center sm:text-right max-w-xs">
          This tool is for personal use only. Respect copyright and Facebook's Terms of Service.
        </p>
      </div>
    </footer>
  );
}
