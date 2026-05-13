import { Copy, Search, Download } from 'lucide-react';

const steps = [
  {
    icon: Copy,
    color: 'from-blue-600 to-blue-500',
    step: '01',
    title: 'Copy the Video URL',
    desc: 'Open Facebook, find the video you want to download, and copy its URL from the browser address bar or share menu.',
  },
  {
    icon: Search,
    color: 'from-purple-600 to-purple-500',
    step: '02',
    title: 'Paste & Fetch',
    desc: 'Paste the copied URL into the input field above and click the "Download" button. We\'ll fetch all available qualities.',
  },
  {
    icon: Download,
    color: 'from-green-600 to-emerald-500',
    step: '03',
    title: 'Choose & Download',
    desc: 'Select your preferred quality (HD, SD, or Audio Only) and click download. Your video will save directly to your device.',
  },
];

export default function HowToUse() {
  return (
    <section id="how-to-use" className="px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            How to <span className="gradient-text">Download</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Download any Facebook video in 3 simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-green-500/50" />

          {steps.map((s, i) => (
            <div key={i} className="relative flex flex-col items-center text-center p-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-xl mb-5 relative z-10`}>
                <s.icon size={26} className="text-white" />
              </div>

              <div className="absolute top-0 right-4 text-6xl font-black text-white/5 select-none">
                {s.step}
              </div>

              <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-3xl glass border border-blue-500/20 text-center">
          <p className="text-slate-300 text-sm">
            <span className="text-blue-400 font-semibold">Tip:</span> Make sure the video is public.
            Private videos and videos requiring login cannot be downloaded.
          </p>
        </div>
      </div>
    </section>
  );
}
