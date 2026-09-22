import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const HERO_IMGS = [
  { key: 'S1', videos: ['/gallery/bending.mp4'] },
  { key: 'S3', videos: ['/gallery/graving.mp4'] },
  { key: 'S4', videos: ['/gallery/lasermetal.mp4'] },
  { key: 'S5', videos: ['/gallery/cutting.mp4'] },
  { key: 'S6', videos: ['/gallery/paint.mp4'] },
  { key: 'S8', videos: ['/gallery/welding.mp4'] },
  { key: 'S9', videos: ['/gallery/mech.mp4'] },
  { key: 'S10', videos: ['/gallery/cnc.mp4'] },
];

const SERVICE_SLUG_BY_KEY = {
  S1: 'sheet-bending',
  S2: 'wet-painting',
  S3: 'laser-engraving',
  S4: 'laser-metal-cut',
  S5: 'laser-nonmetal-cut',
  S6: 'powder-painting',
  S7: 'material-sales',
  S8: 'welding',
  S9: 'traditional-machining',
  S10: 'cnc-routing',
};

const Hero = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [slideIdx, setSlideIdx] = useState(0);
  const [slideAnim, setSlideAnim] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const animRef = useRef(false);
  const videoRef = useRef(null);

  const goTo = (dir) => {
    if (animRef.current) return;
    animRef.current = true;
    setSlideAnim(dir > 0 ? 'slide-out-left' : 'slide-out-right');
    setVideoLoaded(false);
    setTimeout(() => {
      setSlideIdx(i => (i + dir + HERO_IMGS.length) % HERO_IMGS.length);
      setSlideAnim(dir > 0 ? 'slide-in-right' : 'slide-in-left');
      setTimeout(() => { setSlideAnim(''); animRef.current = false; }, 350);
    }, 200);
  };

  const [heroLayout, setHeroLayout] = useState('default');
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (location?.pathname !== '/') return;
    if (heroLayout !== 'mobilePortrait') return;
    const prevHtml = document.documentElement.style.overflowY;
    const prevBody = document.body.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';
    return () => {
      document.documentElement.style.overflowY = prevHtml;
      document.body.style.overflowY = prevBody;
    };
  }, [heroLayout, location?.pathname]);

  useEffect(() => {
    const updateLayout = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth, h = window.innerHeight;
      const isLandscape = w > h;
      const isShortLandscape = isLandscape && w <= 900 && h <= 520;
      const isMobilePortrait = !isLandscape && w < 768;
      setHeroLayout(isShortLandscape ? 'shortLandscape' : isMobilePortrait ? 'mobilePortrait' : 'default');
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    window.addEventListener('orientationchange', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('orientationchange', updateLayout);
    };
  }, []);

  const handleServiceClick = (key) => {
    const slug = SERVICE_SLUG_BY_KEY[key];
    if (!slug) return;
    const lang = (i18n?.language || 'ru').slice(0, 2).toLowerCase();
    navigate(`/services/${slug}?lang=${encodeURIComponent(lang)}`);
  };

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileUa = /Mobi|Android|iPhone|iPad/i.test(ua);
  const isTelegram = /Telegram/i.test(ua);
  const heroOffsetStyle = isMobileUa && isTelegram ? { marginTop: 'calc(5rem + 16px)' } : undefined;

  const heroHeaderStyle =
    heroLayout === 'shortLandscape'
      ? { ...heroOffsetStyle, alignItems: 'center', paddingTop: 'calc(5.5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }
      : heroLayout === 'mobilePortrait'
        ? { ...heroOffsetStyle, alignItems: 'flex-start', paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }
        : heroOffsetStyle;

  const heroContentStyle =
    heroLayout === 'shortLandscape'
      ? { position: 'relative', top: '4vh', width: '100%', transform: 'none' }
      : heroLayout === 'mobilePortrait'
        ? { position: 'relative', width: '100%', transform: 'none' }
        : undefined;

  const current = HERO_IMGS[slideIdx];
  const currentVideoSrc = current.videos[0];
  const prevIdx = (slideIdx - 1 + HERO_IMGS.length) % HERO_IMGS.length;
  const nextIdx = (slideIdx + 1) % HERO_IMGS.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const preloadNeighbors = () => {
      [prevIdx, nextIdx].forEach(idx => {
        const s = HERO_IMGS[idx];
        s.videos.forEach(src => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          v.src = src;
        });
      });
    };
    setVideoLoaded(false);
    const t = setTimeout(preloadNeighbors, 300);
    return () => clearTimeout(t);
  }, [slideIdx, prevIdx, nextIdx]);

  return (
    <header
      ref={sectionRef}
      className="relative text-white bg-black overflow-hidden flex items-stretch justify-center"
      data-section="hero"
      data-hero-layout={heroLayout}
      style={heroHeaderStyle}
    >

      <div
        className="hero-content relative z-10 w-full flex flex-col"
        style={heroContentStyle}
      >

        <div className="relative w-full overflow-hidden bg-black" style={{ height: 'calc(100svh - var(--navbar-h, 80px) - 2rem - env(safe-area-inset-bottom, 0px))', maxHeight: 'calc(100svh - var(--navbar-h, 80px) - 2rem - env(safe-area-inset-bottom, 0px))' }}>
          <div key={slideIdx} className="absolute inset-0">
            <video
              ref={videoRef}
              src={currentVideoSrc}
              onLoadedData={() => setVideoLoaded(true)}
              aria-label={t(`${current.key}_T`)}
              className={`w-full h-full object-cover hero-slide ${slideAnim} transition-opacity duration-[1200ms] ease-out ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 md:top-[33%] z-10 pointer-events-none">
            <div className="px-5 py-3 md:px-10 md:py-5 rounded-2xl md:rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl">
              <div className="text-white/90 text-sm md:text-xl lg:text-2xl xl:text-3xl font-medium tracking-[0.2em] uppercase leading-tight text-center whitespace-nowrap">
                {t('HERE_YOU_CAN_ORDER')}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleServiceClick(current.key)}
            className="absolute inset-0 z-[5]"
            aria-label={t(`${current.key}_T`)}
          />

          <button
            onClick={() => goTo(-1)}
            className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white transition-all active:scale-90 z-10"
          >
            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <button
            onClick={() => goTo(1)}
            className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white transition-all active:scale-90 z-10"
          >
            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          <button
            onClick={() => handleServiceClick(current.key)}
            className="absolute bottom-0 left-0 right-0 px-5 py-6 md:px-10 md:py-10 text-left group z-10"
          >
            <p className="text-white text-xl md:text-3xl font-light tracking-[0.12em] uppercase leading-tight group-hover:text-cyan-300 transition-colors">
              {t(`${current.key}_T`)}
            </p>
            <div className="w-14 h-[2px] md:w-24 md:h-[3px] bg-cyan-500 mt-3 md:mt-4 group-hover:w-28 md:group-hover:w-48 transition-all duration-500 opacity-70" />
          </button>

          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {HERO_IMGS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlideAnim(''); setSlideIdx(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIdx ? 'bg-white w-4' : 'bg-white/40 w-1.5'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .hero-slide { transition: opacity 0.4s ease; }
        .slide-out-left { opacity: 0; }
        .slide-out-right { opacity: 0; }
        .slide-in-right { animation: heroFadeIn 0.4s ease forwards; }
        .slide-in-left { animation: heroFadeIn 0.4s ease forwards; }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (min-width: 768px) and (max-width: 1366px) and (min-height: 700px) and (pointer: coarse) {
          header[data-section="hero"] {
            min-height: calc(100svh - 2rem);
            align-items: center;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          .hero-content { margin-top: 0 !important; }
        }
        @media (max-height: 430px) and (max-width: 900px) and (orientation: landscape) {
          header[data-section="hero"] {
            align-items: flex-start;
            padding-top: calc(3.75rem + env(safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
        @media (max-width: 430px) and (max-height: 740px) {
          header[data-section="hero"] {
            align-items: flex-start;
            padding-top: calc(5.5rem + env(safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Hero;
