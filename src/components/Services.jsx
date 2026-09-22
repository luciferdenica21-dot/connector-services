import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';

const LOCKED_KEYS = ['S2', 'S7'];

const SERVICES_VIDEOS = {
  S1: ['/gallery/bending.mp4'],
  S2: ['/gallery/paint.mp4'],
  S3: ['/gallery/graving.mp4'],
  S4: ['/gallery/lasermetal.mp4'],
  S5: ['/gallery/cutting.mp4'],
  S6: ['/gallery/paint.mp4'],
  S7: ['/gallery/mech.mp4'],
  S8: ['/gallery/welding.mp4'],
  S9: ['/gallery/mech.mp4'],
  S10: ['/gallery/cnc.mp4'],
};

const KEYS = ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10'];
const SEO_SERVICE_KEYS = ['S1','S2','S3','S4','S5','S6','S8','S9','S10'];

const SERVICE_SLUG_BY_KEY = {
  S1: 'metal-bending', S2: 'liquid-coating', S3: 'laser-engraving',
  S4: 'laser-cutting-metals', S5: 'laser-cutting-nonmetals', S6: 'powder-coating',
  S8: 'welding', S9: 'turning', S10: 'cnc-milling',
};
const SERVICE_KEY_BY_SLUG = Object.entries(SERVICE_SLUG_BY_KEY).reduce((acc, [k, v]) => { acc[v] = k; return acc; }, {});

const pickLang = (langRaw) => {
  const lang = String(langRaw || '').toLowerCase();
  if (lang.startsWith('ka')) return 'ka';
  if (lang.startsWith('ru')) return 'ru';
  return 'en';
};

const upsertMeta = (selector, attrs) => {
  try {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      const mName = selector.match(/name="([^"]+)"/);
      const mProp = selector.match(/property="([^"]+)"/);
      if (mName?.[1]) el.setAttribute('name', mName[1]);
      if (mProp?.[1]) el.setAttribute('property', mProp[1]);
      document.head.appendChild(el);
    }
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
  } catch { void 0; }
};

const upsertLink = (rel, hreflang, href) => {
  try {
    const q = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
    let el = document.head.querySelector(q);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      if (hreflang) el.setAttribute('hreflang', hreflang);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  } catch { void 0; }
};

const SLIDE_ITEMS = [...KEYS, ...KEYS, ...KEYS];
const CARD_WIDTH = 280;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;
const LOOP_LEN = KEYS.length * STEP;

const Services = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const lang = pickLang(i18n?.language);

  const [loadedCards, setLoadedCards] = useState({});
  const openRef = useRef(0);
  const trackRef = useRef(null);
  const offsetRef = useRef(LOOP_LEN);
  const animRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const lastVelocity = useRef(0);
  const lastDragX = useRef(0);
  const autoRef = useRef(null);

  const applyOffset = useCallback((offset, animate = false) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    el.style.transform = `translateX(${-offset}px)`;
  }, []);

  const normalizeOffset = useCallback((offset) => {
    let o = offset;
    if (o < LOOP_LEN * 0.5) o += LOOP_LEN;
    if (o >= LOOP_LEN * 1.5) o -= LOOP_LEN;
    return o;
  }, []);

  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (isDragging.current) return;
      offsetRef.current = normalizeOffset(offsetRef.current + STEP);
      applyOffset(offsetRef.current, true);
    }, 3000);
  }, [applyOffset, normalizeOffset]);

  useEffect(() => {
    applyOffset(offsetRef.current);
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [applyOffset, startAuto]);

  const setCardLoaded = (key) => {
    setLoadedCards(prev => ({ ...prev, [key]: true }));
  };

  const onDragStart = (clientX) => {
    isDragging.current = true;
    dragStartX.current = clientX;
    dragStartOffset.current = offsetRef.current;
    lastDragX.current = clientX;
    lastVelocity.current = 0;
    if (autoRef.current) clearInterval(autoRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    applyOffset(offsetRef.current);
  };

  const onDragMove = (clientX) => {
    if (!isDragging.current) return;
    lastVelocity.current = lastDragX.current - clientX;
    lastDragX.current = clientX;
    const delta = dragStartX.current - clientX;
    const raw = dragStartOffset.current + delta;
    offsetRef.current = normalizeOffset(raw);
    applyOffset(offsetRef.current);
  };

  const onDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    let vel = lastVelocity.current;
    const decelerate = () => {
      if (Math.abs(vel) < 0.5) { startAuto(); return; }
      vel *= 0.92;
      offsetRef.current = normalizeOffset(offsetRef.current + vel);
      applyOffset(offsetRef.current);
      animRef.current = requestAnimationFrame(decelerate);
    };
    animRef.current = requestAnimationFrame(decelerate);
  };

  const onMouseDown = (e) => { e.preventDefault(); onDragStart(e.clientX); };
  const onMouseMove = (e) => { if (isDragging.current) onDragMove(e.clientX); };
  const onMouseUp = () => onDragEnd();

  const onTouchStart = (e) => { onDragStart(e.touches[0].clientX); };
  const onTouchMove = (e) => { onDragMove(e.touches[0].clientX); };
  const onTouchEnd = () => onDragEnd();

  const onCardClick = (key) => {
    if (Math.abs(dragStartX.current - lastDragX.current) > 5) return;
    if (LOCKED_KEYS.includes(key)) return;
    const slug = SERVICE_SLUG_BY_KEY[key];
    if (!slug) return;
    openRef.current = Date.now();
    navigate(`/services/${slug}?lang=${encodeURIComponent(lang)}`, { replace: false });
  };

  return (
    <section id="services" className="relative py-16 bg-[#050505] overflow-hidden" data-section="services">
      <div
        className="relative select-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex"
          style={{ gap: `${CARD_GAP}px`, willChange: 'transform', paddingLeft: `${CARD_GAP}px` }}
        >
          {SLIDE_ITEMS.map((key, idx) => {
            const locked = LOCKED_KEYS.includes(key);
            const videoSrc = SERVICES_VIDEOS[key]?.[0] || '';
            const isLoaded = !!loadedCards[key];
            return (
              <div
                key={`${key}-${idx}`}
                onClick={() => onCardClick(key)}
                className="shrink-0 rounded-2xl overflow-hidden relative group bg-black"
                style={{ width: `${CARD_WIDTH}px`, height: '380px' }}
              >
                {videoSrc && (
                  <video
                    src={videoSrc}
                    onLoadedData={() => setCardLoaded(key)}
                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 pointer-events-none transition-opacity duration-[1200ms] ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}${locked ? ' blur-sm' : ''}`}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                  {locked && (
                    <div className="mb-2 px-2 py-1 rounded-lg bg-black/60 text-white/60 text-[10px] text-center uppercase tracking-widest w-fit mx-auto">
                      {t('service_soon')}
                    </div>
                  )}
                  <h3 className="text-white text-sm font-light tracking-[0.15em] uppercase leading-tight text-center">
                    {t(`${key}_T`)}
                  </h3>
                  <div className="w-8 mx-auto h-[1px] bg-cyan-500 mt-2 group-hover:w-16 transition-all duration-500 opacity-70" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const ServiceSeoPage = () => {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = pickLang(i18n?.language);
  const serviceKey = SERVICE_KEY_BY_SLUG[String(slug || '').toLowerCase()] || '';
  const serviceName = serviceKey ? String(t(`${serviceKey}_T`)) : '';
  const isLocked = serviceKey ? LOCKED_KEYS.includes(serviceKey) : false;
  const videos = serviceKey ? (SERVICES_VIDEOS[serviceKey] || []) : [];
  const videoSrc = videos.length ? videos[0] : '';

  const [seoVideoLoaded, setSeoVideoLoaded] = useState(false);
  useEffect(() => { setSeoVideoLoaded(false); }, [serviceKey]);

  const closeService = () => {
    navigate('/', { replace: true });
  };

  if (!serviceKey || !SEO_SERVICE_KEYS.includes(serviceKey)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-white/70 text-center">
          <div className="text-xl font-semibold text-white">{t('not_found')}</div>
          <div className="mt-3">
            <Link to="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
              {t('back_to_home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative min-h-[calc(100svh-5rem-2rem)] overflow-hidden bg-black">
      {videoSrc && (
        <video
          src={videoSrc}
          onLoadedData={() => setSeoVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover blur-[3px] md:blur-[4px] scale-[1.02] transition-opacity duration-[1200ms] ease-out ${seoVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
      <div className="absolute inset-0 bg-black/70" />
      <button
        onClick={closeService}
        className="absolute top-5 right-5 md:top-8 md:right-8 z-[15] w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur transition-colors"
        aria-label={t('ЗАКРЫТЬ')}
      >
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div className="relative z-10 px-4 md:px-10 lg:px-16 pt-24 pb-28 w-full">
        <div className="text-white/60 text-xs md:text-sm backdrop-blur">
          <Link to="/" className="hover:text-white">{t('ГЛАВНАЯ')}</Link>
          <span className="mx-2">/</span>
          <span className="text-white/40">{t('УСЛУГИ')}</span>
        </div>
        <div className="mt-6 md:mt-10">
          {isLocked && (
            <div className="mb-4 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white/70 text-xs backdrop-blur w-fit">
              {t('service_soon')}
            </div>
          )}
          <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-light tracking-[0.12em] uppercase leading-tight">
            {serviceName}
          </h1>
          <div className="w-8 md:w-14 lg:w-16 h-[1px] md:h-[2px] bg-cyan-500 mt-3 md:mt-5 opacity-80" />
          <div className="mt-4 md:mt-6 text-white/85 text-xs md:text-sm lg:text-base font-light leading-relaxed whitespace-pre-line w-full">
            {t(`${serviceKey}_D`)}
          </div>
          {isLocked && <div className="mt-3 text-white/60 text-xs md:text-sm">{t('service_soon')}</div>}
        </div>
      </div>
    </section>
  );
};

export default Services;
