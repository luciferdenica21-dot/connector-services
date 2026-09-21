import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams, Link } from 'react-router-dom';

const LOCKED_KEYS = ['S2', 'S7'];

const SERVICES_IMGS = {
  S1: '/gallery/Гибочные работы по металлам.jpg',
  S2: '/gallery/Жидкостная окраска.jpg',
  S3: '/gallery/Лазерная гравировка.jpg',
  S4: '/gallery/Лазерная резка металлов.jpg',
  S5: '/gallery/Лазерная резка неметаллических материалов.jpg',
  S6: '/gallery/Порошковая окраска.jpg',
  S7: '/gallery/Продажа материалов.jpg',
  S8: '/gallery/Сварка.jpg',
  S9: '/gallery/Токарные работы.jpg',
  S10: '/gallery/ЧПУ фрезеровка и раскрой листовых материалов.jpg',
};

const SERVICES_VIDEOS = {
  S1: ['/gallery/bending.mp4', '/gallery/bending2.mp4'],
  S2: ['/gallery/paint.mp4', '/gallery/paint2.mp4'],
  S3: ['/gallery/graving.mp4', '/gallery/graving2.mp4'],
  S4: ['/gallery/lasermetal.mp4', '/gallery/lasermetal2.mp4'],
  S5: ['/gallery/cutting.mp4'],
  S6: ['/gallery/paint.mp4', '/gallery/paint2.mp4'],
  S7: ['/gallery/mech.mp4'],
  S8: ['/gallery/welding.mp4', '/gallery/welding2.mp4'],
  S9: ['/gallery/mech.mp4'],
  S10: ['/gallery/cnc.mp4', '/gallery/cnc2.mp4'],
};

const SERVICES_POSTERS = {
  S1: '/gallery/Гибочные работы по металлам.jpg',
  S2: '/gallery/Жидкостная окраска.jpg',
  S3: '/gallery/Лазерная гравировка.jpg',
  S4: '/gallery/Лазерная резка металлов.jpg',
  S5: '/gallery/Лазерная резка неметаллических материалов.jpg',
  S6: '/gallery/Порошковая окраска.jpg',
  S7: '/gallery/Продажа материалов.jpg',
  S8: '/gallery/Сварка.jpg',
  S9: '/gallery/Токарные работы.jpg',
  S10: '/gallery/ЧПУ фрезеровка и раскрой листовых материалов.jpg',
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

// Бесконечный слайдер — дублируем массив 3 раза
const SLIDE_ITEMS = [...KEYS, ...KEYS, ...KEYS];
const CARD_WIDTH = 280;
const CARD_GAP = 16;
const STEP = CARD_WIDTH + CARD_GAP;
const LOOP_LEN = KEYS.length * STEP;

const Services = ({ setIsOrderOpen }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = pickLang(i18n?.language);

  const [selectedKey, setSelectedKey] = useState(null);
  const pushedRef = useRef(false);
  const trackRef = useRef(null);
  const offsetRef = useRef(LOOP_LEN); // стартуем со второй копии
  const animRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const lastVelocity = useRef(0);
  const lastDragX = useRef(0);
  const autoRef = useRef(null);

  const isLocked = selectedKey ? LOCKED_KEYS.includes(selectedKey) : false;

  // Применяем смещение без анимации
  const applyOffset = useCallback((offset, animate = false) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    el.style.transform = `translateX(${-offset}px)`;
  }, []);

  // Нормализуем offset чтобы всегда быть в средней копии
  const normalizeOffset = useCallback((offset) => {
    let o = offset;
    if (o < LOOP_LEN * 0.5) o += LOOP_LEN;
    if (o >= LOOP_LEN * 1.5) o -= LOOP_LEN;
    return o;
  }, []);

  // Автопрокрутка
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

  // Drag / touch
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
    // Инерция
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

  // Mouse events
  const onMouseDown = (e) => { e.preventDefault(); onDragStart(e.clientX); };
  const onMouseMove = (e) => { if (isDragging.current) onDragMove(e.clientX); };
  const onMouseUp = () => onDragEnd();

  // Touch events
  const onTouchStart = (e) => { onDragStart(e.touches[0].clientX); };
  const onTouchMove = (e) => { onDragMove(e.touches[0].clientX); };
  const onTouchEnd = () => onDragEnd();

  // Клик по карточке — только если не было drag
  const onCardClick = (key) => {
    if (Math.abs(dragStartX.current - lastDragX.current) > 5) return;
    if (!LOCKED_KEYS.includes(key)) setSelectedKey(key);
  };

  // Открытие сервиса из других мест
  useEffect(() => {
    const fromState = location?.state?.serviceKey;
    if (fromState && KEYS.includes(fromState)) setSelectedKey(fromState);
  }, [location?.state?.serviceKey]);

  useEffect(() => {
    const handleServiceOpen = (e) => {
      const key = e.detail?.key;
      if (key && KEYS.includes(key)) setSelectedKey(key);
    };
    window.addEventListener('service:open', handleServiceOpen);
    return () => window.removeEventListener('service:open', handleServiceOpen);
  }, []);

  // History для свайпа назад
  useEffect(() => {
    if (!selectedKey) { pushedRef.current = false; return; }
    try {
      const st = window.history.state || {};
      if (st.__overlay !== 'service') {
        window.history.pushState({ ...st, __overlay: 'service', serviceKey: selectedKey }, '', window.location.href);
        pushedRef.current = true;
      }
    } catch { void 0; }
  }, [selectedKey]);

  useEffect(() => {
    const onPop = () => { if (selectedKey) setSelectedKey(null); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [selectedKey]);

  const requestCloseService = () => {
    try {
      if (pushedRef.current && window.history.state?.__overlay === 'service') {
        pushedRef.current = false;
        window.history.back();
        return;
      }
    } catch { void 0; }
    setSelectedKey(null);
  };

  useEffect(() => {
    const onServicesClose = () => { setSelectedKey(null); };
    window.addEventListener('services:close', onServicesClose);
    return () => window.removeEventListener('services:close', onServicesClose);
  }, []);

  // SEO
  useEffect(() => {
    const origin = 'https://www.connector.ge';
    const url = `${origin}/services?lang=${encodeURIComponent(lang)}`;
    upsertMeta('meta[property="og:url"]', { content: url });
    upsertLink('canonical', null, url);
  }, [lang]);

  // Analytics
  useEffect(() => {
    try { window.__analyticsTracker?.sectionOpen('services'); } catch { void 0; }
    return () => { try { window.__analyticsTracker?.sectionClose('services'); } catch { void 0; } };
  }, []);

  useEffect(() => {
    try { if (selectedKey) window.__analyticsTracker?.serviceOpen(selectedKey); }
    catch { void 0; }
    return () => { try { if (selectedKey) window.__analyticsTracker?.serviceClose(selectedKey); } catch { void 0; } };
  }, [selectedKey]);

  return (
    <section id="services" className="relative py-16 bg-[#050505] overflow-hidden" data-section="services">
      {/* Слайдер */}
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
            return (
              <div
                key={`${key}-${idx}`}
                onClick={() => onCardClick(key)}
                className="shrink-0 rounded-2xl overflow-hidden relative group"
                style={{ width: `${CARD_WIDTH}px`, height: '380px' }}
              >
                <img
                  src={SERVICES_IMGS[key]}
                  alt={t(`${key}_T`)}
                  draggable={false}
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none${locked ? ' blur-sm' : ''}`}
                />
                {/* Градиент снизу */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                {/* Заголовок снизу */}
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

      {/* Страница сервиса — оверлей */}
      {selectedKey && (() => {
        const videos = SERVICES_VIDEOS[selectedKey] || [];
        const videoSrc = videos.length ? videos[0] : '';
        const poster = SERVICES_POSTERS[selectedKey];
        return (
          <div className="fixed inset-0 z-[90] bg-black overflow-hidden">
            {videoSrc && (
              <video
                src={videoSrc}
                poster={poster}
                className="absolute inset-0 w-full h-full object-cover blur-[3px] md:blur-[4px] scale-[1.02]"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
            <div className="absolute inset-0 bg-black/70" />
            <button
              onClick={requestCloseService}
              className="absolute top-5 right-5 md:top-8 md:right-8 z-[15] w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur transition-colors"
              aria-label={t('ЗАКРЫТЬ')}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div className="relative z-10 h-full overflow-y-auto">
              <div className="min-h-full w-full px-4 md:px-10 lg:px-16 pt-24 pb-24">
                {isLocked && (
                  <div className="mb-4 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white/70 text-xs backdrop-blur w-fit">
                    {t('service_soon')}
                  </div>
                )}
                <h2 className="text-white text-lg md:text-2xl lg:text-3xl font-light tracking-[0.12em] uppercase leading-tight">
                  {t(`${selectedKey}_T`)}
                </h2>
                <div className="w-8 md:w-14 h-[1px] md:h-[2px] bg-cyan-500 mt-3 md:mt-4 opacity-80" />
                <div className="mt-4 md:mt-6 text-white/85 text-xs md:text-sm lg:text-base font-light leading-relaxed whitespace-pre-line w-full">
                  {t(`${selectedKey}_D`)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};

export const ServiceSeoPage = ({ setIsOrderOpen }) => {
  const { slug = '' } = useParams();
  const { t, i18n } = useTranslation();
  const lang = pickLang(i18n?.language);
  const serviceKey = SERVICE_KEY_BY_SLUG[String(slug || '').toLowerCase()] || '';
  const serviceName = serviceKey ? String(t(`${serviceKey}_T`)) : '';
  const isLocked = serviceKey ? LOCKED_KEYS.includes(serviceKey) : false;
  const videos = serviceKey ? (SERVICES_VIDEOS[serviceKey] || []) : [];
  const videoSrc = videos.length ? videos[0] : '';
  const poster = serviceKey ? SERVICES_POSTERS[serviceKey] : '';

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
    <section className="relative min-h-[calc(100svh-5rem-2rem)] overflow-hidden">
      {videoSrc && (
        <video
          src={videoSrc}
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover blur-[3px] md:blur-[4px] scale-[1.02]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
      <div className="absolute inset-0 bg-black/70" />
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

        <div className="mt-10 md:mt-16">
          <div className="flex flex-wrap gap-2">
            {SEO_SERVICE_KEYS.map((k) => (
              <Link
                key={k}
                to={`/services/${SERVICE_SLUG_BY_KEY[k]}?lang=${encodeURIComponent(lang)}`}
                className={`px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-xl border backdrop-blur text-[11px] md:text-xs transition-colors ${
                  k === serviceKey
                    ? 'bg-white/15 border-cyan-400/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                {t(`${k}_T`)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
