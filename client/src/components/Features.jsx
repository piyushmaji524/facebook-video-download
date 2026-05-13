import { Zap, Shield, Monitor, Music, Globe, Infinity } from 'lucide-react';

const features = [
  {
    icon: Zap,
    color: 'from-yellow-500/20 to-orange-500/20',
    iconColor: 'text-yellow-400',
    border: 'border-yellow-500/20',
    title: 'Lightning Fast',
    desc: 'Our servers fetch video info instantly. Download starts in seconds.',
  },
  {
    icon: Shield,
    color: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
    border: 'border-green-500/20',
    title: 'Safe & Secure',
    desc: 'No malware, no ads, no data collection. Your privacy is guaranteed.',
  },
  {
    icon: Monitor,
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/20',
    title: 'Multiple Qualities',
    desc: 'Choose from 1080p, 720p, 480p, 360p, or audio-only formats.',
  },
  {
    icon: Music,
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
    border: 'border-purple-500/20',
    title: 'Audio Extraction',
    desc: 'Download just the audio track from any Facebook video.',
  },
  {
    icon: Globe,
    color: 'from-teal-500/20 to-blue-500/20',
    iconColor: 'text-teal-400',
    border: 'border-teal-500/20',
    title: 'All Devices',
    desc: 'Works on desktop, tablet, and mobile. Any browser supported.',
  },
  {
    icon: Infinity,
    color: 'from-red-500/20 to-orange-500/20',
    iconColor: 'text-red-400',
    border: 'border-red-500/20',
    title: 'No Limits',
    desc: 'Download as many videos as you want. No daily limits, no paywalls.',
  },
];

export default function Features() {
  return (
    <section id="features" className="px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Why Choose <span className="gradient-text">VidDown?</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            The fastest and easiest way to save <span className="text-blue-400">Facebook</span>, <span className="text-pink-400">Instagram</span> &amp; <span className="text-red-400">YouTube</span> videos directly to your device.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl bg-gradient-to-br ${f.color} border ${f.border} glass hover:scale-105 transition-transform duration-200`}
            >
              <div className={`w-11 h-11 rounded-xl bg-slate-900/50 flex items-center justify-center mb-4`}>
                <f.icon size={22} className={f.iconColor} />
              </div>
              <h3 className="font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
