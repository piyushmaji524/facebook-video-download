import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import DownloadCard from './components/DownloadCard';
import Features from './components/Features';
import HowToUse from './components/HowToUse';
import Footer from './components/Footer';

export default function App() {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main>
        <Hero
          videoData={videoData}
          setVideoData={setVideoData}
          loading={loading}
          setLoading={setLoading}
        />
        {videoData && (
          <DownloadCard data={videoData} onReset={() => setVideoData(null)} />
        )}
        <Features />
        <HowToUse />
      </main>
      <Footer />
    </div>
  );
}
