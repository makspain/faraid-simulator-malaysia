# System Architecture & Technical Specification

## 1. Project Purpose & Context

**Faraid Simulator Malaysia** (`com.faraid.simulator`) is an Android mobile application designed to calculate, simulate, and educate users on Islamic estate distribution (*Faraid*) following the legal framework and Shariah rulings of **Mazhab Shafi'i** as practiced in Malaysia.

The core objectives of the system are:
1. **Interactive Estate Valuation**: Computing net distributable estate through proper Shariah settlement priority: Funeral Expenses (*Tajhiz al-Janazah*) $\rightarrow$ Debts (*Duyun*) $\rightarrow$ Bequests to Non-Heirs (*Wasiat*, max $\frac{1}{3}$) $\rightarrow$ Net Estate for Faraid.
2. **Heir Configuration & Shariah Allocation**: Evaluating primary heirs (Spouse, Sons, Daughters, Father, Mother) with automated validation of *Ashabul Furud* (fixed Quranic shares) and *‘Asabah* (residuary shares).
3. **Legal Compliance & Education**: Offering bilingual (Bahasa Melayu / English) explanatory references based on Malaysian statutory enactments (e.g., *Akta Pembahagian Pusaka Kecil 1955*, State Islamic Enactments, and Civil Court / Shariah Court jurisdiction boundaries).

---

## 2. Hybrid Architecture (Native Shell + Web Core)

The application employs a decoupled hybrid architecture consisting of a lightweight native Android container hosting an optimized, offline-first client-side web application.

```mermaid
flowchart TD
    subgraph Android Native Runtime
        MA[MainActivity.kt] -->|Initializes & Hosts| WV[Android WebView]
        MA -->|Back Button Handling| OBPD[OnBackPressedDispatcher]
        WV -->|Exposes @JavascriptInterface| WI[WebAppInterface.kt]
        WI -->|Android System Calls| Sys[Toast / Intent Chooser / Vibrator]
    end

    subgraph Web Runtime Assets (file:///android_asset/www/)
        WV -->|Loads Entrypoint| IDX[index.html / utama.html]
        IDX --> FA[faraid_app.js Engine]
        FA -->|State Persistence| LS[(localStorage)]
        FA -->|Calls Bridge| WI
        FA -->|Multi-Screen Routing| SC[Screens: langkah1, langkah2, keputusan, panduan]
    end
```

### 2.1 Native Layer
- **`MainActivity.kt`**:
  - Initializes `WebView` with hardware acceleration and responsive viewport settings (`useWideViewPort = true`, `loadWithOverviewMode = true`).
  - Sets up status bar and navigation bar system window insets with light icon styling matching the primary background (`#F9F9FF`).
  - Configures `OnBackPressedCallback` to maintain an in-app hierarchical navigation stack across Faraid steps (`keputusan.html` $\rightarrow$ `langkah2.html` $\rightarrow$ `langkah1.html` $\rightarrow$ `utama.html`).
- **`WebAppInterface.kt`**:
  - Registered as `window.AndroidBridge` within the JavaScript context.
  - Exposes thread-safe native services (`showToast`, `shareText`, `vibrate`, `navigateTo`, `openExternalUrl`).

### 2.2 Web Runtime Layer
- Fully offline-ready HTML5/Tailwind/ES6 static assets served directly from `file:///android_asset/www/`.
- Single shared computation and persistence controller: [`faraid_app.js`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/faraid_app.js).

---

## 3. Domain Logic & Math Engine (Mazhab Shafi'i)

The calculation engine in `faraid_app.js` enforces the Quranic rules of inheritance according to the classical Shafi'i legal consensus adopted across Malaysian states.

### 3.1 Pre-Distribution Deductions (Tertib Pengurusan Harta)
Given Gross Estate $E_{gross}$, funeral expenses $C_{funeral}$, liabilities/debts $C_{debt}$, and optional non-heir bequest $W$:

$$E_{postDebt} = \max(0, E_{gross} - C_{funeral} - C_{debt})$$

$$W_{max} = \frac{E_{postDebt}}{3}$$

$$W_{effective} = \min(W, W_{max})$$

$$E_{net} = \max(0, E_{postDebt} - W_{effective})$$

If $E_{net} \le 0$, execution is blocked from proceeding to heir allocation.

---

### 3.2 Primary Heir Entitlements

Let $H_{children} = (N_{sons} + N_{daughters}) > 0$.

#### 1. Spouse (Pasangan)
- **Husband** (when deceased is Female):
  - With children ($H_{children} = \text{true}$): Share = $\frac{1}{4}$ (25.0%)
  - Without children ($H_{children} = \text{false}$): Share = $\frac{1}{2}$ (50.0%)
- **Wife / Wives** (when deceased is Male, count $1 \le N_{wives} \le 4$):
  - With children ($H_{children} = \text{true}$): Total Share = $\frac{1}{8}$ (12.5%), divided equally:
    $$\text{Per Wife} = \frac{E_{net} \times 0.125}{N_{wives}}$$
  - Without children ($H_{children} = \text{false}$): Total Share = $\frac{1}{4}$ (25.0%), divided equally.

#### 2. Mother (Ibu)
- With children ($H_{children} = \text{true}$): Share = $\frac{1}{6}$ (16.67%)
- Without children ($H_{children} = \text{false}$): Share = $\frac{1}{3}$ (33.33%)

#### 3. Father (Bapa)
- With Son present ($N_{sons} > 0$): Fixed *Fardh* Share = $\frac{1}{6}$ (16.67%).
- With only Daughters ($N_{sons} = 0 \land N_{daughters} > 0$): Receives $\frac{1}{6}$ fixed *Fardh* PLUS any remainder as *‘Asabah*.
- Without children ($H_{children} = \text{false}$): Inherits entirety of remainder via *‘Asabah bi Nafsihi*.

#### 4. Children (Anak-Anak)
- **Sons and Daughters present together** (*‘Asabah bi al-Ghayr*):
  - Remaining balance after spouse and parents:
    $$R = \max(0, E_{net} - \sum \text{Shares}_{furud})$$
  - Weight units: 2 per son, 1 per daughter:
    $$U = 2 \cdot N_{sons} + 1 \cdot N_{daughters}$$
    $$\text{Per Son} = R \times \frac{2}{U}, \quad \text{Per Daughter} = R \times \frac{1}{U}$$
- **Sons only** (*‘Asabah bi Nafsihi*):
  - Receive entire residue $R$ divided equally:
    $$\text{Per Son} = \frac{R}{N_{sons}}$$
- **Daughters only** (*Ashabul Furud*):
  - 1 Daughter: $\frac{1}{2}$ (50.0%)
  - 2 or more Daughters: $\frac{2}{3}$ (66.67%) shared equally.
  - Residue $R - \text{Share}_{daughters}$ reverts to Father if alive.

### 3.3 Asal Mas'alah (Common Denominator)
Standard cases with spouse ($\frac{1}{8}$) and parents ($\frac{1}{6}$) resolve to a base common denominator of **24 portions** (*Asal Mas'alah 24*):
- Wife: $3/24$
- Father: $4/24$
- Mother: $4/24$
- Residue for Children: $13/24$

---

## 4. State Management & Data Flow

Session data is stored in the browser `localStorage` engine within the WebView sandbox:

```
[Screen 1: utama.html]
       │
       ▼ (Tap "Mula Kira Sekarang")
[Screen 2: langkah1.html]  ──> Writes `faraid_estate_data` { gross, funeral, debt, wasiat, net }
       │
       ▼ (Tap "Seterusnya: Pilih Waris")
[Screen 3: langkah2.html]  ──> Reads `faraid_estate_data`
       │                   ──> Computes `faraid_result_data`
       │                   ──> Writes `faraid_result_data` { netEstate, shares, heirsSummary, asalMasalah }
       │
       ▼ (Tap "Kira Agihan (Step 3)")
[Screen 4: keputusan.html] ──> Reads `faraid_result_data` & renders charts/shares
       │                   ──> Calls `AndroidBridge.shareText()` or `AndroidBridge.showToast()`
       ▼
[Screen 5: panduan.html]   ──> Independent Shariah knowledge repository & search engine
```

### Storage Schema
- `faraid_estate_data`:
  ```json
  {
    "gross": 550000.0,
    "funeral": 5000.0,
    "debt": 30000.0,
    "wasiat": 15000.0,
    "net": 500000.0
  }
  ```
- `faraid_result_data`:
  ```json
  {
    "netEstate": 500000.0,
    "asalMasalah": 24,
    "heirsSummary": {
      "deceasedGender": "male",
      "wifeCount": 1,
      "husbandCount": 0,
      "sons": 2,
      "daughters": 1,
      "fatherAlive": true,
      "motherAlive": true
    },
    "shares": [
      {
        "id": "sons",
        "title": "Anak Lelaki (2x)",
        "fraction": "Baki (4/5)",
        "percentage": 43.33,
        "totalRM": 216666.67,
        "perPersonRM": 108333.33,
        "count": 2,
        "category": "‘Asabah bi al-Ghair",
        "color": "#00492a"
      }
    ],
    "totalHeirCount": 5
  }
  ```
- `faraid_saved_cases`:
  ```json
  [
    {
      "id": "case-hj-ismail",
      "title": "Keluarga Arwah Hj. Ismail",
      "status": "completed",
      "date": "24 Okt 2024",
      "estate": { "gross": 550000.0, "funeral": 5000.0, "debt": 30000.0, "wasiat": 15000.0, "net": 500000.0 },
      "heirs": { "deceasedGender": "male", "wifeCount": 1, "husbandCount": 0, "sons": 2, "daughters": 1, "fatherAlive": true, "motherAlive": true },
      "summary": "Isteri (1) • 1/8 (RM 62.5k) | 2 Anak Lelaki, 1 Perempuan • Asabah (2:1)",
      "totalHeirCount": 4
    }
  ]
  ```
- `faraid_user_prefs`:
  ```json
  {
    "displayName": "",
    "language": "ms",
    "lastUpdated": 1729212345678
  }
  ```

---

## 5. UI/Asset Pipeline (Stitch to Android Assets)

The original high-fidelity design specifications were generated in Google Stitch Project `6673898581680894408` and mirrored locally:

```
Stitch Remote Design
  │
  ├── 0abb4f0cd80a41c8b799e95094f30263 (Langkah 2: Waris)
  ├── 72238526b55440a69b89b20b7294f8a3 (Langkah 1: Harta)
  ├── 980793803c074d0da93f88a01045e000 (Utama Dashboard)
  ├── abdb32492b1948eb8adb451bee7a5aeb (Panduan Asas)
  └── 63ed38ec6f9242f6988125ef8e0caa70 (Keputusan Agihan)
  │
  ▼ (curl -L via Stitch MCP URLs)
stitch_assets/screens/
  ├── screen1_langkah2_waris.html / .png
  ├── screen2_langkah1_harta.html / .png
  ├── screen3_utama.html / .png
  ├── screen4_panduan.html / .png
  └── screen5_keputusan.html / .png
  │
  ▼ (Packaged into APK assets)
app/src/main/assets/www/
  ├── index.html (aliases utama.html)
  ├── utama.html
  ├── langkah1.html
  ├── langkah2.html
  ├── keputusan.html
  ├── panduan.html
  ├── faraid_app.js (unified client logic & bridge)
  └── screenshots/*.png (mirrored design specs)
```
