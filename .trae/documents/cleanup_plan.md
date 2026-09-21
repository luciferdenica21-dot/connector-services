# Облегчение проекта — План очистки

## Репозиторий-исследование: что реально используется на сайте

**Используемый фронтенд (то, что пользователь видит сейчас):**
- `/` — главная: Navbar + Hero(видео-карусель)
- `/services` — общая страница услуг (слайдер карточек)
- `/services/:slug` — отдельная SEO-страница услуги (видео-фон + текст)
- Footer, TermsInfo (условия) — статические оверлеи в MainLayout
- OrderSidebar — боковая форма заказа
- i18n (ru/en/ka) — переводы

**НЕ ИСПОЛЬЗУЕТСЯ / лишнее:**
1. **Аккаунт/авторизация**: AuthModal, `Login/Register` формы, Route `/auth/callback`, user/userRole state, `setToken/getToken/removeToken`, `handleAuthSuccess`, `handleRequireAuthForOrder`, `handleLogout`, pendingOrderRef — удалить всё, вместе с Supabase OAuth в App.jsx
2. **ЛК пользователя**: Route `/dashboard`, компонент `ClientDashboard`
3. **Админ-панель менеджера**: Route `/manager`, компонент `ManagerPanelPro.jsx` (самый жирный файл ~155kB)
4. **AI-чат виджет**: ChatWidget.jsx
5. **Подписание документов**: Route `/sign/:id`, SignDocumentView, SignatureRequestComposer
6. **SmartOrderSystem** — вложенный flow (SmartOrderSystem/*) — нигде не импортируется
7. **Аналитика** — `initAnalyticsTracker`, `window.__analyticsTracker`, `sectionOpen/Close` вызовы в Hero/Services/ChatWidget/AuthModal, файл `config/analyticsTracker.js`
8. **WebSocket** — `config/socket.js`, socket.io-client на фронте (используется в ChatWidget и ManagerPanel — оба удаляются)
9. **Supabase** на фронте — `config/supabaseClient.js`, exchange-код в AuthCallback route и App.jsx
10. **Хуки/утилиты**: hooks/useAvatarUrl.js и utils/avatar.js, utils/sound.js, utils/orderPdf.js, SmartOrderSystem/flowConfig.js

**Что ОСТАВЛЯЕМ в OrderSidebar (форма заказа):**
- Сохраняем `ordersAPI + filesAPI` из `api.js` (отправка заказа и загрузка чертежей)
- Удаляем из OrderSidebar вызовы `authAPI.me()` (заполнение из залогиненного пользователя) — форма станет полностью «гостевой»

**На бэкенде что убираем:**
- routes/analytics.js, routes/auth.js, routes/backups.js, routes/chats.js, routes/messages.js, routes/signatures.js, routes/ai.js
- Оставляем: routes/orders.js, routes/files.js, middleware/upload.js, server.js socket.io (без чатов/аналитики, или и он убирается — socket использовался только для чатов/менеджера)

**Зависимости (package.json фронт), которые можно удалить после очистки:**
- `@pdf-lib/fontkit`, `pdf-lib`, `jszip` (для подписей и бэкапов — всё удаляется)
- `socket.io-client` (Socket)
- `@supabase/supabase-js` (Supabase)
- `framer-motion` (проверим, нигде ли не используется в Hero/Services/Navbar)
- На бэкенде: `bcryptjs`, `jsonwebtoken` (auth), `socket.io`, `@pdf-lib/fontkit`, `pdf-lib`, `jszip`

---

## Файлы и модули к изменению/удалению

### УДАЛИТЬ файлы целиком:
```
src/components/AuthModal.jsx
src/components/ChatWidget.jsx
src/components/ClientDashboard.jsx
src/components/ManagerPanelPro.jsx
src/components/SignDocumentView.jsx
src/components/SignatureRequestComposer.jsx
src/components/SmartOrderSystem/SmartOrderSystem.jsx
src/components/SmartOrderSystem/flowConfig.js
src/config/analyticsTracker.js
src/config/socket.js
src/config/supabaseClient.js
src/hooks/useAvatarUrl.js
src/utils/avatar.js
src/utils/sound.js
src/utils/orderPdf.js

server/routes/ai.js
server/routes/analytics.js
server/routes/auth.js
server/routes/backups.js
server/routes/chats.js
server/routes/messages.js
server/routes/signatures.js
server/config/telegram.js  ← проверим, нужен ли для orders? если да — оставить
```

### ИЗМЕНИТЬ:
- `src/App.jsx` — удалить auth-стейты, auth-роуты, ChatWidget, ManagerPanel (lazy), ClientDashboard, AuthModal, SignDocumentView, Supabase, user/userRole, getAuth-коллбэки, pendingOrderRef, handleRequireAuthForOrder; MainLayout — упростить проспы (Navbar и OrderSidebar больше не принимают user/setIsAuthOpen/onRequireAuthForOrder)
- `src/components/Navbar.jsx` — убрать user/onLogout, useAvatarUrl, кнопки «Войти/Выйти/Кабинет», toggleDashboard; оставить logo, lang-switcher, контакты, «Оформить заказ», бургер
- `src/components/OrderButton.jsx` — убрать всю ветку `!user → setIsAuthOpen/onRequireAuth` и проп user/setIsAuthOpen/onRequireAuth; всегда просто `setIsOrderOpen(true)`
- `src/components/Hero.jsx` — убрать пропы `user/setIsAuthOpen/onRequireAuthForOrder`, убрать `if(!user) onRequireAuthForOrder`, всегда просто `setIsOrderOpen`
- `src/components/Services.jsx` — убрать пропы `user/setIsAuthOpen/onRequireAuthForOrder`; убрать `if(!user) setIsAuthOpen` в оверлее и в ServiceSeoPage, кнопку заказать там сейчас и так убрали
- `src/components/OrderSidebar.jsx` — убрать проп `user` и useEffect `authAPI.me()` с автозаполнением; оставить только отправку формы гостем (контакт/имя/фамилия/коммент/файлы)
- `src/config/api.js` — убрать `authAPI`, `analyticsAPI`, `backupsAPI`, `signaturesAPI`, `chatsAPI`, `messagesAPI`; оставить `ordersAPI`, `filesAPI`, и (возможно) `ai.js` если orders его не требует (иначе убрать)
- `src/main.jsx` — не трогаем, там только StrictMode
- `src/i18n.js` — оставить как есть (переводы «Вход» и т.д. мёртвые, но удалять переводы опасно — можно оставить, они в 1 файле)
- `server/server.js` — убрать импорт/использование удалённых routes
- `package.json` (фронт) и `server/package.json` — удалить лишние deps (затем npm install)

---

## Шаги реализации (в порядке зависимостей)

1. **Фронт: Убрать зависимости неиспользуемых компонентов из App.jsx**
   - Удалить импорты всех лишних компонентов и Supabase/Analytics/Auth
   - Удалить все auth-состояния (user, userRole, loading, pendingOrderRef) и эффекты checkAuth/supabase exchange
   - Удалить роуты `/manager`, `/dashboard`, `/sign/:id`, `/auth/callback`
   - Упростить MainLayout: не прокидывать user/setIsAuthOpen/onRequireAuthForOrder/onLogout

2. **Фронт: Упростить компоненты Navbar, OrderButton, Hero, Services**
   - Убрать из них auth-ветки и user-пропсы
   - Navbar: убрать useAvatarUrl, Logout, Dashboard

3. **Фронт: Упростить OrderSidebar** — убрать user/avatar-загрузку authAPI.me(), оставить гостевую форму

4. **Фронт: Упростить api.js** — удалить auth/analytics/signatures/chats/messages/backups API

5. **Фронт: Удалить лишние файлы** (список сверху)

6. **Бэкенд: server.js** — убрать импорты удалённых routes, socket.io если только для чатов

7. **Бэкенд: Удалить лишние routes/*.js файлы**

8. **Зависимости: Удалить лишние пакеты** из обоих package.json и переустановить node_modules (или просто удалить записи)

9. **Валидация**:
   - `npm run build` — must be zero errors
   - открыть `/`, `/services`, `/services/laser-cutting-metals` вручную — UI без ошибок
   - форма заказа (OrderSidebar) открывается по кнопке «Оформить заказ»
   - на страницах нет console.error об отсутствующих файлах/компонентах

---

## Риски и обработка

- **Риск сломать форму заказа**: OrderSidebar содержит много вызовов authAPI → аккуратно вырезать только auth-функциональность, сохранив `ordersAPI.createOrder` и `filesAPI`.
- **i18n ключи**: мёртвые переводы в i18n.js не удалять (не сломают ничего).
- **Socket.io на бэкенде**: если `ordersAPI` реально использует socket для уведомлений менеджера — оставить server-side socket.io import, но удалить только роуты чатов/сигнатур. **Сначала проверить server.js как используется socket.io перед удалением.**
- **Файлы server/config/telegram.js** — если orders шлют уведомления в Telegram — оставить. Проверить перед удалением.
- **Откат**: Если после очистки что-то сломалось — git restore. Шаги атомарны и логичны, после каждого шага можно запускать build.

---

## Что НЕ ТРОГАЕМ (критически важное):
- `src/components/Hero.jsx` — только убрать пропсы/ветки авторизации
- `src/components/Services.jsx` — только убрать auth-пропсы/ветки
- `src/components/Navbar.jsx` — только убрать auth UI
- `src/components/TermsInfo.jsx` — не трогаем
- CSS-файлы (App.css пустой, index.css не трогаем)
- i18n.js
- index.html, vite.config.js
