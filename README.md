# MyPT. — Personal Trainer

> AI destekli kişisel antrenör ve beslenme takibi. Doğal dille yediğini anlat, AI parse etsin; antrenmanını başlat, koçla sohbet et, arkadaşlarınla yarış.
>
> AI-powered personal trainer and nutrition tracking. Tell what you ate in plain words, run guided workouts, chat with your coach, share progress with friends.

**MIT · PWA · Mobile-first · TR + EN**

---

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components, Turbopack)
- **Tailwind CSS v4** + custom UI primitives (iOS-style grouped list, dark/light/system)
- **Auth.js v5** (Google OAuth)
- **Turso** (libSQL) + **Drizzle ORM**
- **Z.AI GLM-5.1** (OpenAI-compatible SDK) — meal parsing, coach chat, workout planning
- **next-intl** (Türkçe + İngilizce)
- **next-themes** (dark / light / system)
- **PWA** (manifest, service worker, offline shell, apple-touch-icon)

---

## Özellikler / Features

### Beslenme / Nutrition
- **Doğal dil yemek log** — "2 yumurta, 1 dilim ekmek, 17:41'de" yaz, AI kalori + makro (P/K/Y) çıkartsın.
- **Düzenleme** — eklenen öğünleri saat/tarih/kalori/makro hepsi manuel düzeltilebilir.
- **Su takibi** — dashboard widget, +200/+500/+750 ml hızlı butonlar, geri al.

### Antrenman / Workouts
- **37 ev egzersizi** — bodyweight only, kategori bazlı (göğüs/sırt/bacak/karın/kol/omuz/kardiyo/tüm vücut).
- **Interval timer** — work/rest faz, beep, wake lock (ekran uyumaz).
- **AI plan üretici** — profilini ve son 7 gün antrenmanını okuyup özel plan önerir.
- **Manuel picker** — istersen kategori seçip kendi setini de oluşturabilirsin.

### Ölçüm / Tracking
- **Profil**: boy, kilo, yaş, cinsiyet → **VKİ otomatik** → hedef (kilo verme/koruma/alma) otomatik seçilir.
- **Aktivite seviyesi** — son 7 gündeki tamamlanmış antrenman sayısından çıkarılır.
- **BMR (Mifflin-St Jeor)** + **TDEE** + günlük kalori hedefi otomatik hesaplanır.
- **Haftalık tartı** — kilo kaydı, trend grafiği, başlangıçtan delta.

### AI Koç
- **Chat** — kişisel antrenörle sohbet ekranı, ana ekrandan kalkık ulaşılır.
- **Context-aware** — bugünkü kalori, son antrenmanlar, profil, hedef her mesajda AI'ya geçer.
- **Hedef-duyarlı** — kilo veriyorsan "açığı kapat" demez; alıyorsan ek öğün önerir.
- **Hızlı sorular** — "Bugün ne yiyeyim?", "Hangi antrenmanı yapayım?", "Su yeterli mi?", "Motivasyon".

### Sosyal / Social
- **Kullanıcı adı + arama** — `@kullaniciadi` ile arkadaş bul, istek gönder/kabul.
- **Haftalık özet paylaşımı** — antrenman sayısı + ortalama kalori (default açık).
- **Gizlilik toggles** — Settings'te kilo / yemek / su paylaşımı opsiyonel açılır.

### Genel / Misc
- **Açık + Koyu tema** (next-themes, system support).
- **TR + EN** locale URL prefix'li (`/tr/`, `/en/`).
- **PWA** — Ana ekrana ekle, offline shell, iOS safe-area.

---

## Kurulum / Setup

### 1. Klonla

```bash
git clone https://github.com/system-conf/MyPT.git mypt
cd mypt
npm install
```

### 2. Environment

`.env.example` → `.env.local` kopyala ve doldur:

```bash
cp .env.example .env.local
```

| Değişken | Nereden alınır |
|---|---|
| `AUTH_SECRET` | `npx auth secret` ile üret |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | https://console.cloud.google.com/apis/credentials |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | https://turso.tech |
| `ZAI_API_KEY` | https://z.ai |

**Google OAuth redirect URI**:
- Dev: `http://localhost:4000/api/auth/callback/google`
- Prod: `https://<your-domain>/api/auth/callback/google`

### 3. Veritabanı şeması + egzersiz catalog'u

```bash
npm run db:push
npm run db:seed-exercises
```

### 4. Çalıştır

```bash
npm run dev
```

http://localhost:4000 → otomatik `/tr` veya `/en` yönlendirme.

---

## Vercel Deploy

1. Vercel'de projeyi import et: https://vercel.com/new
2. Environment Variables'a yukarıdaki anahtarları gir.
3. Google OAuth redirect URI'sine Vercel domain'ini ekle.
4. Deploy.

---

## Klasör Yapısı

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (app)/                 # auth'lu sayfalar
│   │   │   ├── page.tsx           # dashboard (bugün)
│   │   │   ├── log/               # yemek ekle
│   │   │   ├── meals/[id]/edit/   # yemek düzenle
│   │   │   ├── history/           # geçmiş öğünler
│   │   │   ├── workouts/          # antrenmanlar (liste + new + active)
│   │   │   ├── weight/            # tartı geçmişi
│   │   │   ├── friends/           # arkadaşlar (liste + arama + detay)
│   │   │   ├── insights/          # AI koç (chat, full-screen)
│   │   │   ├── profile/           # kullanıcı profili
│   │   │   └── settings/          # tema, dil, gizlilik
│   │   └── signin/                # giriş ekranı
│   ├── api/                       # REST endpoints
│   └── layout.tsx                 # root (locale layout'a delege)
├── auth.ts                        # Auth.js v5 config
├── components/                    # UI components
├── db/                            # schema, client, queries, seed
├── i18n/                          # routing, request, messages
├── lib/
│   ├── ai/                        # Z.AI client + parse + coach + suggest
│   ├── calories.ts                # BMR/TDEE/BMI/goal/activity math
│   ├── stats.ts                   # daily aggregation helpers
│   └── utils.ts
└── proxy.ts                       # i18n middleware (Next.js 16 convention)
```

---

## API Endpoints

| Path | Method | Açıklama |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/meals` | GET, POST | Yemek listele / AI parse + kaydet |
| `/api/meals/[id]` | GET, PATCH, DELETE | Tek yemek CRUD |
| `/api/water` / `/api/water/[id]` | GET, POST, DELETE | Su takibi |
| `/api/weight` / `/api/weight/[id]` | GET, POST, DELETE | Tartı kayıtları |
| `/api/profile` | GET, PATCH | Profil + derived targets |
| `/api/insights` | GET, POST | (legacy) tek-shot suggestion |
| `/api/coach` | GET, POST, DELETE | Chat mesajları |
| `/api/exercises` | GET | Egzersiz catalog |
| `/api/workouts` / `/api/workouts/[id]` | GET, POST, PATCH, DELETE | Workout session CRUD |
| `/api/workouts/suggest` | POST | AI workout planı üret |
| `/api/users/search` | GET | Username arama |
| `/api/users/[username]/summary` | GET | Arkadaş haftalık özeti |
| `/api/friends` / `/api/friends/[id]` | GET, POST, PATCH, DELETE | Arkadaşlık |
| `/api/privacy` | GET, PATCH | Paylaşım izinleri |

---

## NPM Scripts

```bash
npm run dev                # next dev -p 4000
npm run build              # production build
npm run start              # next start -p 4000
npm run lint               # eslint
npm run db:push            # drizzle-kit push (sync schema → Turso)
npm run db:generate        # drizzle-kit generate migrations
npm run db:studio          # drizzle-kit studio (DB browser)
npm run db:seed-exercises  # seed/update exercise catalog
npm run auth:secret        # generate AUTH_SECRET
```

---

## Güvenlik

- `.env.local` asla commit edilmez (`.gitignore`'da).
- Geçmişte chat/screenshot vb. yollarla sızdırılan token'lar **revoke** edilmeli (Turso panel, Z.AI panel, Google Cloud Console).
- DB enforce'lar: PK + FK cascade, unique constraints (email, username), zod input validation tüm POST/PATCH'larda.

---

## Lisans / License

MIT — bkz. [LICENSE](./LICENSE).
