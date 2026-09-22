import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const LANGS = ['ru', 'en', 'ka'];

  const applyLang = (next) => {
    i18n.changeLanguage(next);
    try {
      const params = new URLSearchParams(location.search || '');
      params.set('lang', next);
      navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
    } catch { void 0; }
  };

  const cycleLang = () => {
    const cur = String(i18n.language || 'ru').toLowerCase().slice(0, 2);
    const idx = LANGS.indexOf(cur);
    const next = LANGS[(idx + 1) % LANGS.length];
    applyLang(next);
  };

  const langLabel = { ru: 'RU', en: 'EN', ka: 'GE' }[String(i18n.language || 'ru').toLowerCase().slice(0, 2)] || 'RU';

  const CONTACT_LINKS = [
    { name: 'Telegram', url: 'https://t.me/ConnectorGe' },
    { name: 'WhatsApp', url: 'https://wa.me/+995591160685' },
    { name: 'Gmail', url: 'mailto:useconnector@gmail.com' },
    { name: 'Facebook', url: 'https://facebook.com/connectorge' },
  ];

  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const q = (params.get('lang') || '').toLowerCase();
      const current = String(i18n.language || '').toLowerCase();
      if (!q && current) {
        params.set('lang', current);
        navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
      }
    } catch { void 0; }
  }, [location.pathname, location.search, i18n.language, navigate]);

  return (
    <nav
      className="bg-[#0a0a0a]/90 backdrop-blur-md fixed top-0 left-0 right-0 w-full md:sticky z-[120] text-white text-sm border-b border-blue-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)] tablet-nav"
      data-section="navbar"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center z-10">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group"
            >
              <img src="/img/logo.png" alt="logo" className="w-[50px] h-[50px] object-contain" />
              <span className="text-s font-black tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">CONNECTOR</span>
            </a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">

            <div className="relative">
              <button
                onClick={() => setContactOpen(v => !v)}
                className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-green-500/10 transition-all"
                title={t('КОНТАКТЫ')}
              >
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.72a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z" />
                </svg>
                <span className="hidden md:inline text-[11px] font-bold text-green-400 uppercase tracking-wide">{t('CONTACT_US')}</span>
              </button>

              {contactOpen && (
                <div className="absolute right-0 top-full mt-2 bg-[#0d0d0d] border border-white/10 rounded-2xl p-3 z-[60] shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                  <div className="flex gap-2">
                    {CONTACT_LINKS.map((c) => (
                      <a
                        key={c.name}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 hover:bg-green-500/10 text-white/70 hover:text-green-400 transition-all"
                        onClick={() => setContactOpen(false)}
                      >
                        <span className="text-[9px] uppercase tracking-wide whitespace-nowrap">{c.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {contactOpen && <div className="fixed inset-0 z-[59]" onClick={() => setContactOpen(false)} />}
            </div>

            <button onClick={cycleLang} className="flex items-center p-2 rounded-lg hover:bg-blue-500/10 transition-all" title={langLabel}>
              <span className="text-[11px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-400">{langLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
