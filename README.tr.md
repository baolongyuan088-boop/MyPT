<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/mypt.svg">
    <img src="./public/icon-512.png" alt="MyPT." width="160" />
  </picture>
</p>

<h1 align="center">MyPT. — Kişisel Antrenör</h1>

<p align="center"><strong><a href="./README.md">English</a> · <a href="./README.tr.md">Türkçe</a></strong></p>

> AI destekli kişisel antrenör ve beslenme takibi. Yediğini doğal dille anlat, AI parse etsin; antrenmanını başlat, koçla sohbet et, arkadaşlarınla paylaş.

**MIT · PWA · Mobile-first · TR + EN**

---

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components, Turbopack)
- **Tailwind CSS v4** + custom UI primitives (iOS-tarzı grouped list, koyu / açık / sistem)
- **Auth.js v5** (Google OAuth)
- **Turso** (libSQL) + **Drizzle ORM**
- **Z.AI GLM-5.1** (OpenAI-uyumlu SDK) — yemek parse, koç chat, antrenman planı
- **next-intl** (Türkçe + İngilizce)
- **next-themes** (koyu / açık / sistem)
- **PWA** (manifest, service worker, offline shell, apple-touch-icon)

---

## Özellikler

### Beslenme
- **Doğal dil yemek log** — "2 yumurta, 1 dilim ekmek, 17:41'de" yaz, AI kalori + makro (P/K/Y) çıkartsın.
- **Düzenleme** — eklenen öğünleri saat / tarih / kalori / makro hepsi manuel düzeltilebilir.
- **Su takibi** — dashboard widget, +200 / +500 / +750 ml hızlı butonlar, geri al.

### Antrenman
- **37 ev egzersizi** — sadece bodyweight, kategori bazlı (göğüs / sırt / bacak / karın / kol / omuz / kardiyo / tüm vücut).
- **Interval timer** — work / rest faz, beep sesi, ekran uyumaz (Wake Lock).
- **AI plan üretici** — profilini ve son 7 gün antrenmanını okuyup özel plan önerir (rotasyon gözetir).
- **Manuel picker** — istersen kategori seçip kendin de oluşturabilirsin.

### Ölçüm
- **Profil**: boy, kilo, yaş, cinsiyet → **VKİ otomatik** → hedef (kilo verme / koruma / alma) otomatik seçilir.
- **Aktivite seviyesi** — son 7 gündeki tamamlanmış antrenman sayısından çıkarılır.
- **BMR (Mifflin-St Jeor)** + **TDEE** + günlük kalori hedefi otomatik hesaplanır.
- **Haftalık tartı** — kilo kaydı, trend grafiği, başlangıçtan delta.

### AI Koç
- **Chat** — kişisel antrenörle full-screen sohbet ekranı.
- **Context-aware** — bugünkü kalori, son antrenmanlar, profil, hedef her mesajda AI'ya geçer.
- **Hedef-duyarlı** — kilo veriyorsan "açığı kapat" demez; alıyorsan ek öğün önerir.
- **Hızlı sorular** — "Bugün ne yiyeyim?", "Hangi antrenmanı yapayım?", "Su yeterli mi?", "Motivasyon".

### Sosyal
- **Kullanıcı adı + arama** — `@kullaniciadi` ile arkadaş bul, istek gönder / kabul.
- **Haftalık özet paylaşımı** — antrenman sayısı + ortalama kalori (default açık).
- **Gizlilik toggle'ları** — Settings'te kilo / yemek / su paylaşımı opsiyonel açılır.

### Genel
- **Açık + koyu tema** (sistem desteği).
- **TR + EN** locale URL prefix'li (`/tr/`, `/en/`).
- **PWA** — Ana ekrana ekle, offline shell, iOS safe-area.

---

## Kurulum

### 1. Klonla

```bash
git clone https://github.com/system-conf/MyPT.git mypt
cd mypt
npm install
```

### 2. Environment değişkenleri

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

1. Projeyi import et: https://vercel.com/new
2. Yukarıdaki environment değişkenlerini gir.
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
│   │   │   ├── workouts/          # antrenmanlar
│   │   │   ├── weight/            # tartı geçmişi
│   │   │   ├── friends/           # arkadaşlar
│   │   │   ├── insights/          # AI koç (full-screen chat)
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
│   ├── calories.ts                # BMR/TDEE/VKİ/hedef/aktivite math
│   ├── stats.ts                   # daily aggregation helpers
│   └── utils.ts
└── proxy.ts                       # i18n middleware (Next.js 16)
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
npm run db:studio          # drizzle-kit studio
npm run db:seed-exercises  # seed/update exercise catalog
npm run auth:secret        # generate AUTH_SECRET
```

---

## Güvenlik

- `.env.local` asla commit edilmez (gitignored).
- Chat / screenshot vb. yollarla sızdırılan token'lar **revoke** edilmeli (Turso, Z.AI, Google Cloud Console).
- DB enforce'lar: PK + FK cascade, unique constraints (email, username); zod input validation tüm POST/PATCH'larda.

---

## Lisans

MIT — bkz. [LICENSE](./LICENSE).
