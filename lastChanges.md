# lastChanges — Xabarlar sahifasini Telegram bilan ulash

**Oxirgi yangilanish:** 2026-09-17
**Holat:** server tayyor va sinovdan o'tgan. Panelning logika qatlami tayyor, UI qismi yarim yo'lda. Ikkala loyiha `tsc --noEmit` dan xatosiz o'tadi. Hali commit qilinmagan.

---

## 1. Kelishilgan qarorlar

| Savol | Qaror |
|---|---|
| Qaysi yo'l bilan yuboriladi | **O'qituvchining shaxsiy Telegram akkaunti** (MTProto, GramJS). Bot emas |
| Backend | Yangi **`eduqosun-server/`**: Node.js + TypeScript + GramJS + SQLite (`node:sqlite`) |
| Yo'nalish | **Ikki tomonlama**: Telegramdagi javoblar ham panelga tushadi |
| "Yangi chat" modali | 3 ta tab: **Guruh / O'quvchi / Ota-ona** |
| Guruh tabi | O'z guruhini tanlash yoki yangi nom yozish → Private/Public → havolani qo'yish yoki **Telegramda yangi guruh yaratish** → "Guruh qo'shish" |

**Imkoniyatlar:**
- Fayl 2 GB gacha (Premium bilan 4 GB).
- Albomda ko'pi bilan 10 ta fayl.
- Private havola (`t.me/+...`) bilan ulash ishlaydi.
- Guruhni paneldan yaratish mumkin.

**Xavflar:** akkaunt spam uchun cheklanishi mumkin. Sessiya akkauntga to'liq kirish beradi, shuning uchun shifrlab saqlanadi.

---

## 2. Qilingan ishlar

### 2.1. Server — `eduqosun-server/` (TO'LIQ TAYYOR)

| Fayl | Vazifasi |
|---|---|
| `package.json`, `tsconfig.json`, `.gitignore`, `.env.example` | Loyiha sozlamalari. Skriptlar: `dev` (tsx watch), `build`, `start`, `typecheck` |
| `src/config.ts` | `.env` ni o'qiydi (`process.loadEnvFile`), `data/`, `data/uploads/`, `data/media/` papkalarini yaratadi |
| `src/types.ts` | Server ↔ panel DTO turlari va SSE hodisalari (`ServerEvents`). **Panelda nusxasi bor: `src/api/types.ts`** |
| `src/db.ts` | SQLite jadvallari: `kv` (sessiya, akkaunt ID), `chats` (suhbat ↔ Telegram peer), `media` (fayl keshi) |
| `src/crypto.ts` | Sessiyani AES-256-GCM bilan shifrlaydi. Kalit `SESSION_SECRET` dan yoki `data/secret.key` dan olinadi (fayl avtomatik yaratiladi) |
| `src/events.ts` | SSE (`GET /api/events`), `broadcast()` |
| `src/errors.ts` | `AppError`, Telegram xato kodlarining o'zbekcha tarjimasi, FLOOD_WAIT |
| `src/telegram/client.ts` | Kirish: telefon → kod → 2FA parol → ulangan. Sessiyani tiklaydi, internet bo'lmasa 30 soniyada qayta urinadi. Logout; akkaunt avatari. Boshqa akkaunt bilan kirilsa, eski bog'lanishlar o'chiriladi |
| `src/telegram/peers.ts` | Havolani tahlil qiladi: `t.me/+hash`, `joinchat`, `@user`, `x.t.me`, `tg://`. Guruhni tekshiradi (a'zo bo'lmasdan), qo'shiladi (`ImportChatInvite`/`JoinChannel`). **Yangi supergroup yaratadi** (public bo'lsa username qo'yiladi, private bo'lsa invite link olinadi). Foydalanuvchini username yoki raqam bo'yicha topadi (`ResolvePhone`, kerak bo'lsa `ImportContacts`) |
| `src/telegram/messages.ts` | Telegram xabarini DTO ga o'giradi (photo/video/voice/audio/file, waveform), albomlarni birlashtiradi, tarixni oladi. **Yuborish:** matn (4096 dan uzuni bo'linadi); fayllar albomlarga guruhlanadi (media/audio/fayl, har albomda ≤10); caption 1024 dan uzun bo'lsa alohida yuboriladi; 10 MB dan katta rasm fayl sifatida ketadi; video uchun o'lcham, davomiylik va kichik nusxa (thumb); ovoz ffmpeg orqali OGG/Opus ga o'giriladi. O'chirish (revoke), o'qildi belgisi |
| `src/telegram/media.ts` | ffmpeg konvertatsiyasi, waveform kodlash/dekodlash (5 bit), media keshi (yuborilgan fayl keshga ko'chiriladi, kelgani talab qilinganda yuklab olinadi) |
| `src/telegram/queue.ts` | Har bir chat uchun ketma-ket navbat (xabarlar orasida 800 ms) |
| `src/telegram/updates.ts` | Jonli hodisalar: yangi, tahrirlangan va o'chirilgan xabar; o'qildi (outbox/inbox) → SSE |
| `src/telegram/chats.ts` | Ulash, yaratish, uzish, meta. `queueSend` (natija SSE orqali keladi) + **outbox** (so'nggi 1 soatdagi yuborish natijalari) |
| `src/http/app.ts` | Himoya: Host faqat localhost, Origin ro'yxatda bo'lishi, POST so'rovlarda `X-EduQosun: 1` sarlavhasi. Xatolarni qayta ishlash (multer limitlari ham) |
| `src/http/routes.ts` | Barcha API marshrutlari (pastdagi ro'yxat) |
| `src/index.ts` | Ishga tushirish: eski yuklamalarni tozalaydi, hodisa tinglovchilarini ulaydi, `SIGINT` da to'xtaydi |

**API marshrutlari (`/api`):**
- **Umumiy:** `GET health`, `GET events` (SSE)
- **Akkaunt:** `GET telegram/status`, `POST telegram/auth/code | sign-in | password | cancel`, `POST telegram/logout`, `GET telegram/me/photo`
- **Tekshirish (ulamasdan):** `POST telegram/lookup/group {link}`, `POST telegram/lookup/user {username|phone, addContact}`
- **Chatlar:** `GET telegram/chats`, `POST telegram/chats/link-group`, `POST telegram/chats/create-group`, `POST telegram/chats/link-user`
- **Bitta chat (`telegram/chats/:id`):** `PATCH` (meta), `POST .../refresh`, `DELETE` (uzish)
- **Xabarlar (`telegram/chats/:id/...`):** `GET messages?minId&limit`, `POST messages` (multipart: `text`, `clientId`, `meta` JSON, `files`, `thumb:<i>`, `voice`, `voiceMeta`), `POST read`, `POST delete-messages {ids}`
- **Boshqa:** `GET telegram/outbox?ids=`, `GET telegram/media/:id/:msgId?variant=thumb&download=1`

**SSE hodisalari:**
- **Holat:** `status`
- **Xabarlar:** `message:new`, `message:edit`, `message:sent`, `message:progress`, `message:failed`, `message:delete`, `message:read`
- **Chat:** `chat:read`, `chat:removed`

**Tekshirilgan (haqiqatan ishga tushirib ko'rildi):**
- Build va typecheck xatosiz.
- Server ishga tushdi. `health` va `status` javob berdi.
- Himoya ishladi: `X-EduQosun` sarlavhasi va Host tekshiruvi.
- Havola parser 10 ta namunada to'g'ri natija berdi.
- Waveform kodlash → dekodlash natijasi asli bilan bir xil.
- ffmpeg webm → ogg konvertatsiyasi ishladi.
- Soxta API kalit bilan Telegram serverlariga ulanish bor, `API_ID_INVALID` o'zbekcha xabar bilan qaytdi.

**Hali sinalmagan:** haqiqiy `api_id` bilan kirish, guruhni ulash, fayl yuborish, kiruvchi xabarlar. Buning uchun foydalanuvchining kalitlari kerak.

### 2.2. Panel — `eduqosun-teacher-panel/` (LOGIKA TAYYOR, UI YARIM)

**Yangi fayllar (tayyor):**
- `vite.config.ts` — `/api` → `http://127.0.0.1:4000` proxy (`server` va `preview` uchun).
- `src/api/types.ts` — serverdagi `types.ts` nusxasi.
- `src/api/http.ts` — `api()` (fetch + `X-EduQosun`), `uploadForm()` (XHR, yuklanish foizi bilan), `ApiError` (`offline` holatini aniqlaydi).
- `src/api/telegram.ts` — `telegramApi.*` barcha endpointlar, `mediaDownloadUrl()`.
- `src/lib/telegramLink.ts` — havola parseri (serverdagining nusxasi), `telegramOpenUrl()`.
- `src/lib/media.ts` — `attachmentKindOf`, `readMediaInfo` (rasm/video o'lchami, davomiylik, video thumb JPEG ≤320px), `formatDuration`.
- `src/store/telegramStore.ts` — vaqtinchalik holat: server, configured, auth, account, `progress[clientId]`. `useTelegram`, `selectTelegramReady`.
- `src/store/actions/telegram.ts` — asosiy logika:
  - `startTelegram()` — SSE, qayta ulanish (backoff), fokusda va har 3 daqiqada sinxronlash. **Yetakchi oyna** `navigator.locks` orqali tanlanadi: saqlanadigan holatni faqat u o'zgartiradi.
  - `refreshTelegramStatus`, `telegramAuth.{sendCode, signIn, checkPassword, cancel, logout}`.
  - `syncTelegram()`:
    - serverdagi chatlar ro'yxatini oladi, panelda yo'q suhbatni meta orqali tiklaydi;
    - serverda uzilgan suhbatdan Telegram belgisini olib tashlaydi;
    - `minId` dan boshlab yangi xabarlarni oladi, `unread` va o'qildi belgilarini yangilaydi;
    - javobsiz qolgan outbox xabarlarini hal qiladi;
    - kutib turgan uzishlarni (`eduqosun-telegram-unlink`) yuboradi.
  - `linkGroupChat(source, mode)` — `source`: `existing | custom | conversation`; `mode`: `link | create`.
  - `linkPersonChat(source, lookup)`, `unlinkConversation`, `forgetConversationLink`.
  - `sendConversationMessage(conversationId, {text, files, voice, asDocuments})`. Xabar darhol "yuborilmoqda" holatida ko'rinadi (optimistic). Suhbat Telegramga ulanmagan bo'lsa, faqat panelda saqlanadi.
  - `retryMessage`, `discardMessage`, `isUploading`, `canRetry`, `deleteTelegramMessage`, `markTelegramRead` (debounce).
  - `displayUrl(url)` — shu seansda yuborilgan faylning blob nusxasini ko'rsatadi.
  - Kiruvchi xabar bo'lsa: bildirishnoma, ovoz va (Xabarlar sahifasidan tashqarida) toast.
- `src/hooks/useVoiceRecorder.ts` — MediaRecorder (ogg/webm), jonli daraja, 100 nuqtali waveform, `start/stop/cancel`, 30 daqiqa limit.
- `src/components/brand/TelegramIcon.tsx` — Telegram belgisi (SVG).
- `src/components/messages/Attachments.tsx` — `MessageAttachments`: rasm/video to'ri, `VoicePlayer` (waveform, seek), fayl/audio kartasi, `MediaViewer` (to'liq ekran, ← →, yuklab olish).
- `src/components/messages/TelegramConnect.tsx`:
  - `TelegramConnectFlow` — raqam → kod → parol bosqichlari va xavfsizlik eslatmalari.
  - `TelegramConnectModal`, `TelegramAccountCard`, `LogoutTelegramButton`.
  - `TelegramNotice`, `ServerOfflineNotice`, `SetupInstructions`.
  - `TelegramStatusChip` — sahifa sarlavhasi uchun.

**O'zgartirilgan fayllar:**
- `src/types/domain.ts` — qo'shildi:
  - `ChatAttachment`, `AttachmentKind`, `MessageStatus`, `TelegramLink`, `TelegramChatType`, `TelegramVisibility`;
  - `ChatMessage` ga `attachments`, `status`, `error`, `editedAt`, `tgIds`, `albumId`;
  - `Conversation` ga `telegram?`.
- `src/types/ui.ts` — `ModalState` ga `{type:'new-chat', kind?, conversationId?}` va `{type:'telegram-connect'}`.
- `src/domain/conversations.ts` — `messagePreview`, `maxTelegramId`, `upsertMessage` (albomni birlashtiradi), `removeTelegramIds`.
- `src/store/actions/messages.ts` — `findConversation` export qilindi; `buildConversation` ajratildi (suhbatni store'ga qo'shmasdan yaratadi).
- `src/lib/format.ts` — `formatBytes` endi GB ni ham ko'rsatadi.

---

## 3. Qolgan ishlar (shu tartibda davom ettirish)

- [ ] **1. `src/components/messages/Composer.tsx`** (yangi):
  - Textarea: limit Telegramda 4096, mahalliy suhbatda 1000; Enter — yuborish; tayyor javoblar (templates) saqlanib qoladi.
  - 📎 tugmasi → `input[type=file][multiple]`; paste (clipboard fayllari); drag & drop (`forwardRef` + `useImperativeHandle({ addFiles })`, drop zonasi ChatView'da).
  - `addFiles`:
    - bitta xabarda ko'pi bilan 20 ta fayl;
    - hajm `telegramStore.maxUploadBytes` dan oshmasin;
    - har faylga `URL.createObjectURL` va `readMediaInfo` (video thumb → `thumbUrl`);
    - suhbat ulanmagan bo'lsa ogohlantirish chiqadi.
  - Fayllar qatori (tray):
    - 64 px kichik rasm, nomi, ✕ tugmasi (bosilganda blob manzili revoke qilinadi);
    - "N ta fayl · X MB";
    - rasm bo'lsa "Rasmlarni siqmasdan (fayl sifatida) yuborish" checkbox'i.
  - 🎤 (matn va fayl bo'lmaganda):
    - `useVoiceRecorder` ishga tushadi;
    - yozish paneli: qizil nuqta, vaqt, jonli bar'lar, 🗑 bekor qilish, ➤ yuborish;
    - 1 soniyadan qisqa bo'lsa "juda qisqa" deb rad etiladi.
  - Yuborish: `sendConversationMessage(...)`. Keyin matn va fayllar tozalanadi, lekin **blob manzillari revoke qilinmaydi** (xabarda ishlatiladi). Unmount'da faqat yuborilmagan fayllar revoke qilinadi.
  - Suhbat ulangan, lekin `selectTelegramReady` false bo'lsa: composer o'chiriladi va `TelegramNotice compact` ko'rsatiladi.
- [ ] **2. `ChatView.tsx` ni yangilash:**
  - `Bubble`:
    - `MessageAttachments`, fayllar bo'lsa padding kichikroq;
    - `status==='sending'` → `useTelegram(s=>s.progress[id])` foiz bilan spinner; `isUploading` bo'lsa bekor qilish tugmasi;
    - `failed` → qizil belgi, `error` matni, "Qayta yuborish" (`canRetry`) va "O'chirish" (`discardMessage`);
    - `editedAt` bo'lsa "tahrirlangan".
  - O'chirish: Telegram xabari (`tgIds`) bo'lsa `confirmAction` → `deleteTelegramMessage`; mahalliy xabar bo'lsa avvalgidek `runWithUndo`.
  - Sarlavha: `TelegramIcon` + "Private guruh · 24 a'zo"; "Telegramda ochish" tugmasi (`telegramOpenUrl`).
  - Menyu:
    - havolani nusxalash;
    - ma'lumotni yangilash (`telegramApi.refresh` → `refreshConversationLink` action'ini **qo'shish kerak**);
    - Telegramdan uzish (`unlinkConversation` + confirm);
    - ulanmagan suhbatda "Telegramga ulash" → `openModal({type:'new-chat', conversationId})`.
  - Suhbatni o'chirish: Telegram suhbati bo'lsa `forgetConversationLink` + `deleteConversation` (undo'siz).
  - Ochilganda `markConversationRead` va Telegram suhbati bo'lsa `markTelegramRead`.
  - Ulanmagan suhbatda composer ustida "Bu suhbat faqat panelda saqlanadi — Telegramga ulang" banneri.
  - Composer `Composer.tsx` ga ko'chiriladi.
- [ ] **3. `src/components/messages/NewChatModal.tsx`** (yangi). Sarlavha "Yangi chat", `size="lg"`, tepada `TelegramNotice`, tablar: Guruh / O'quvchi / Ota-ona.
  - **Guruh tabi:**
    - "Mening guruhlarim" (faol guruhlar Select; allaqachon ulangan bo'lsa hint) yoki "Yangi nom" (TextInput).
    - Pastida "Havola orqali ulash" | "Telegramda yaratish".
    - Private/Public tanlovi (radio kartalar), har biri uchun havolani qayerdan topish haqida hint.
    - **Havola rejimi:**
      - input + "Tekshirish" (`telegramApi.lookupGroup`);
      - `parseTelegramLink` bilan tanlangan tur tekshiriladi, mos kelmasa "turini almashtirish" taklifi;
      - natija kartasi: nom, tur, a'zolar soni, "A'zosiz" / "Qo'shilasiz" / "Yozish taqiqlangan" / "Admin tasdig'i kerak".
    - **Yaratish rejimi:** public bo'lsa `t.me/` + username, tavsif (ixtiyoriy) va izoh.
    - Tugma "Guruh qo'shish" / "Guruh yaratish" → `linkGroupChat` → toast (bo'lsa `warning` ham) → `navigate('messages/<id>')` → modal yopiladi.
  - **O'quvchi / Ota-ona tablari:**
    - O'quvchi Select (guruhlarga ajratilgan).
    - "Telefon raqam" | "Username": raqam `student.phone` / `parentPhone` dan olinadi, ism `parentName` dan.
    - "Tekshirish" (`lookupUser`); "Topilmasa kontaktlarimga qo'shib qidirish" checkbox'i.
    - "Chat qo'shish" → `linkPersonChat`.
  - `conversationId` berilgan bo'lsa: tab va qabul qiluvchi qotiriladi, `source={type:'conversation'}`.
- [ ] **4. `OverlayHost.tsx`** — `case 'new-chat'` → `NewChatModal`, `case 'telegram-connect'` → `TelegramConnectModal`.
- [ ] **5. `App.tsx`** — `Shell` ichida `<TelegramSync />` (`useEffect(() => startTelegram(), [])`), faqat tizimga kirilganda.
- [ ] **6. `MessagesPage.tsx`:**
  - tugma matni "Yangi chat" (`MessageSquarePlus`) → `openModal({type:'new-chat'})` (ikkala joyda);
  - sarlavhada `TelegramStatusChip`;
  - bo'sh holat matnini yangilash.
- [ ] **7. `ConversationList.tsx`** — Telegram suhbati nomi yonida `TelegramIcon`; oxirgi xabar `messagePreview(last)` orqali; yuborilmoqda/xato belgisi.
  **Dashboard `components/dashboard/Messages.tsx`** — `last.text` o'rniga `messagePreview(last)`.
- [ ] **8. `ComposeModal.tsx`** — `ensureConversation` dan keyin `sendConversationMessage(id, {text, files: [], voice: null, asDocuments: false})`, shunda ulangan suhbat Telegram orqali ketadi. `sendToTarget` boshqa joyda ishlatilmasa olib tashlanadi.
- [ ] **9. Sozlamalar → "Telegram" tabi:** `SettingsPage.tsx` ga `{ value: 'telegram', icon: Send }` qo'shiladi, yangi `components/settings/TelegramSettings.tsx` yoziladi:
  - "Telegram akkaunti": `TelegramConnectFlow`, pastida `LogoutTelegramButton`;
  - "Ulangan chatlar" ro'yxati: nomi, turi, havolasi, "Ochish", "Uzish";
  - "Xavfsizlik va cheklovlar": sessiya shifrlangan, "Qurilmalar"da ko'rinadi, spam qoidalari, 2 GB / 10 ta albom.
- [ ] **10. O'chirishlar bilan bog'lash:** `store/actions/groups.ts` (guruh o'chsa) va `students.ts` (o'quvchi o'chsa) — o'chayotgan suhbatlar Telegram suhbati bo'lsa, `forgetConversationLink(id)` chaqirilsin (import aylanib qolmasin: kerak bo'lsa alohida faylga chiqariladi).
- [ ] **11. Ildizdagi `package.json`:**
  - `"server": "npm --prefix eduqosun-server run dev"`;
  - `"dev:all"` — ikkalasini birga ishga tushirish (`scripts/dev.mjs`, `child_process.spawn`);
  - `"postinstall"` yoki README'da `npm --prefix eduqosun-server install`.
- [ ] **12. README.md** — Telegram sozlash bo'limi (my.telegram.org, `.env`, ishga tushirish, xavfsizlik).
- [ ] **13. Tekshirish:**
  - `npm run typecheck` (panel) va `npm --prefix eduqosun-server run typecheck`; `npm run build`.
  - Brauzerda 1536 px, telefon kengligi va dark mode'da ko'rib chiqish (dizaynlar: `page images/Dark mode.png`, `Group.png`, `Phone.png`).
  - Haqiqiy kalit bilan quyidagilarni sinash:
    - [ ] kirish (kod + 2FA);
    - [ ] private havola bilan ulash;
    - [ ] public havola bilan ulash;
    - [ ] guruh yaratish;
    - [ ] matn yuborish;
    - [ ] rasmlar albomi;
    - [ ] katta video;
    - [ ] ovozli xabar;
    - [ ] PDF;
    - [ ] telefondan yozilgan javob panelga tushishi;
    - [ ] o'qildi belgisi;
    - [ ] o'chirish;
    - [ ] 2 ta oyna ochiq holati;
    - [ ] server o'chirib yoqilganda qayta ulanish;
    - [ ] yuborish paytida sahifani yangilash (outbox).
- [ ] **14. Commit** — foydalanuvchidan so'raladi.

---

## 4. Hozir qanday ishga tushiriladi

```bash
# 1) Server (bir marta)
cd eduqosun-server
npm install
copy .env.example .env      # TG_API_ID va TG_API_HASH ni yozing (my.telegram.org)
npm run dev                 # http://127.0.0.1:4000

# 2) Panel (boshqa terminalda, loyiha ildizidan)
npm run dev                 # http://localhost:5173 — /api so'rovlari serverga ketadi
```

> Hozircha panelda "Yangi chat" modali va composer yangilanmagan (3-bo'limning 1–6 bandlari), shuning uchun Telegram oqimini brauzerda hali to'liq sinab bo'lmaydi.

## 5. Eslatmalar

- `data/` (sessiya, `secret.key`, db, media) va `.env` gitga tushmaydi (`eduqosun-server/.gitignore`).
- `src/api/types.ts` va `eduqosun-server/src/types.ts` bir xil bo'lishi kerak: biri o'zgarsa, ikkinchisi ham yangilanadi.
- Panel xabar ID'lari: Telegram xabari `tg-<id>`, yuborilayotgani `out_...` (bu `clientId` ham).
- Ovozli xabarni o'girish uchun `ffmpeg-static` npm paketi ishlatiladi (Windows'ga alohida o'rnatish shart emas).
