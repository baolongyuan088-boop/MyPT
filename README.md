# MyPT. — Personal Trainer

> AI destekli kalori ve beslenme takibi. Saat saat ne yediğini doğal dille anlat, MyPT. parse etsin, kalori hesaplasın, sana öneriler versin.
>
> AI-powered calorie & nutrition tracking. Tell MyPT. what you ate in plain words, get auto calorie parsing and personal coaching.

**Açık kaynak (MIT) · PWA · Mobile-first · TR + EN**

---

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components, Turbopack)
- **Tailwind CSS v4** + custom UI primitives (siyah/beyaz/açık-gri/koyu tema)
- **Auth.js v5** (Google OAuth)
- **Turso** (libSQL) + **Drizzle ORM**
- **Z.AI GLM-5.1** (OpenAI-compatible SDK)
- **next-intl** (Türkçe + İngilizce)
- **next-themes** (dark / light / system)
- **PWA** (manifest + service worker)

---

## Kurulum / Setup

### 1. Klonla ve bağımlılıkları kur

```bash
git clone https://github.com/<your-user>/mypersonel.git mypt
cd mypt
npm install
```

### 2. Environment değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyala ve doldur:

```bash
cp .env.example .env.local
```

Gerekli anahtarlar:

| Değişken | Nereden alınır |
|---|---|
| `AUTH_SECRET` | `npx auth secret` ile üret |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | https://console.cloud.google.com/apis/credentials → OAuth Client ID |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | https://turso.tech → DB oluştur, token üret |
| `ZAI_API_KEY` | https://z.ai → API key |

**Google OAuth redirect URI**:
- Dev: `http://localhost:3000/api/auth/callback/google`
- Prod: `https://<your-domain>/api/auth/callback/google`

### 3. Veritabanı şemasını push'la

```bash
npm run db:push
```

### 4. Çalıştır

```bash
npm run dev
```

http://localhost:3000 → otomatik `/tr` ya da `/en` yönlendirme.

---

## Özellikler / Features

- 👤 **Profil**: boy, kilo, yaş, cinsiyet, aktivite seviyesi, hedef → Mifflin-St Jeor BMR + TDEE + günlük hedef kalori otomatik hesaplanır.
- 🍽️ **Yemek logu**: doğal dille yaz ("2 yumurta, 1 dilim tam buğday ekmeği"), AI parse etsin, makro besinleri (P/K/Y) ve kalori dağılımını çıkarsın.
- 📊 **Bugün dashboard**: günün özeti, saat saat öğün timeline'ı, kalori barı.
- 📅 **Geçmiş**: gün gün gruplanmış öğün listesi.
- ✨ **AI öneriler**: profil + son 3 gün → kişisel, sayısal öneriler.
- 🌍 **TR + EN**: locale URL prefix'i (`/tr/`, `/en/`).
- 🌗 **Tema**: light / dark / system (siyah, beyaz, açık gri palette).
- 📱 **PWA**: ana ekrana ekle, offline shell, safe-area destekli (iOS notch).

---

## Vercel Deploy

1. Vercel'de projeyi import et.
2. Environment Variables'a yukarıdaki tüm anahtarları gir.
3. Google OAuth redirect URI'sine Vercel domain'ini ekle.
4. `NEXTAUTH_URL`'i prod URL'e set et (opsiyonel, Vercel auto-detect).
5. Deploy.

---

## Klasör Yapısı

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (app)/         # auth'lu sayfalar (dashboard, log, history, profile, insights)
│   │   ├── signin/        # auth'suz
│   │   └── layout.tsx     # html/body, i18n provider, theme provider
│   ├── api/               # meals, profile, insights, auth
│   └── layout.tsx         # root (locale layout'a delege)
├── auth.ts                # NextAuth v5 config
├── components/
│   ├── ui/                # Button, Card, Input, Select, Textarea, Label
│   └── *.tsx              # daily-summary, meal-form, meal-timeline, profile-form, ...
├── db/                    # client, schema, queries
├── i18n/                  # routing, request, navigation, messages/{tr,en}.json
├── lib/
│   ├── ai/                # Z.AI client, parse-meal, suggest
│   ├── calories.ts        # BMR/TDEE/macro math
│   └── utils.ts
└── middleware.ts          # auth gate + locale routing
```

---

## Güvenlik notu

- `.env.local` asla commit edilmemeli (`.gitignore` ile korunuyor).
- Geçmişte chat/screenshot vb. yollarla sızdırdığın token'ları **revoke** etmeyi unutma (Turso panel, Z.AI panel, Google Cloud).

---

## Lisans

MIT — bkz. [LICENSE](./LICENSE).
