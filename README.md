# Faraid Simulator Malaysia (`com.faraid.simulator`)

> **Single Source of Truth** for developers, maintainers, and autonomous AI agents working on this repository.

---

## 1. Project Overview

**Faraid Simulator Malaysia** is an Android application designed to calculate, simulate, and educate users on Islamic inheritance distribution (*Faraid*) under the Shariah legal rulings of **Mazhab Shafi'i** as recognized in Malaysian courts and Islamic religious departments (JKSM / Pejabat Agama Islam Negeri / Akta Pembahagian Pusaka Kecil 1955).

### Key Features
- **Estate Valuation Deductions**: Handles the Shariah-mandated order of estate settlement (*Tertib Pengurusan Harta*): Funeral expenses $\rightarrow$ Outstanding debts $\rightarrow$ Validated bequests/wasiat (maximum $\frac{1}{3}$) $\rightarrow$ Net distributable estate.
- **Dynamic Heir Matrix**: Calculates shares for primary heirs (Spouse, Sons, Daughters, Father, Mother) with automated handling of Quranic fixed quotas (*Ashabul Furud*), residuary entitlements (*‘Asabah*), and disqualification/blocking (*Hajb*).
- **Offline-First & Privacy Preserving**: Zero server dependency; all calculation logic, state transitions, and case persistence execute locally on-device.
- **Bilingual Interface**: Malaysian Bahasa Melayu interface with Shariah and legal English terminology references.

---

## 2. Architecture

The project is structured as a decoupled, high-performance hybrid Android application pairing a lightweight native Kotlin container with an offline web core.

```
┌────────────────────────────────────────────────────────┐
│                   Android Native Host                  │
│  MainActivity.kt               WebAppInterface.kt      │
│  - Edge-to-edge window insets   - @JavascriptInterface │
│  - WebView hardware config     - Native Toast & Share │
│  - OnBackPressedDispatcher     - Haptic feedback      │
└─────────────────────────▲──────────────────────────────┘
                          │ window.AndroidBridge
┌─────────────────────────▼──────────────────────────────┐
│             Web Application Runtime (Assets)           │
│  file:///android_asset/www/                            │
│  - HTML5 & Tailwind UI screens                         │
│  - faraid_app.js (Shariah Engine & Router)             │
│  - localStorage Sandbox (State Persistence)            │
└────────────────────────────────────────────────────────┘
```

### 2.1 Hybrid Android WebView Shell
- [`MainActivity.kt`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/MainActivity.kt):
  - Manages Android window insets (`#F9F9FF` status bar, `#FFFFFF` navigation bar with light icons).
  - Configures the [`WebView`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/MainActivity.kt#L63-L97) engine (`javaScriptEnabled = true`, `domStorageEnabled = true`, `loadWithOverviewMode = true`, `useWideViewPort = true`).
  - Registers [`OnBackPressedCallback`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/MainActivity.kt#L37-L53) to support multi-step hierarchical back-navigation without abruptly quitting the application (`keputusan.html` $\rightarrow$ `langkah2.html` $\rightarrow$ `langkah1.html` $\rightarrow$ `utama.html`).
- [`WebAppInterface.kt`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt):
  - Bridges JavaScript calls to Android native system services via the `@JavascriptInterface` annotation.
  - Injected into the browser DOM under the global identifier `window.AndroidBridge`.

### 2.2 Web Application Runtime
All assets reside in [`app/src/main/assets/www/`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/):
- [`index.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/index.html): Immediate redirect entry point pointing to `utama.html`.
- [`utama.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/utama.html): Home dashboard displaying quick actions, recent draft cards, and hero calculator launch button.
- [`langkah1.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/langkah1.html): Step 1 — Gross estate input, funeral deduction, debts, wasiat input, and dynamic net estate calculator.
- [`langkah2.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/langkah2.html): Step 2 — Heir configuration (deceased gender, spouse counts, sons/daughters counter, parents toggles).
- [`keputusan.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/keputusan.html): Step 3 — Result breakdown with SVG donut chart, fraction distribution cards, and native share triggers.
- [`panduan.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/panduan.html): Reference guide with legal articles, FAQ, and Mazhab Shafi'i rule lookup.
- [`faraid_app.js`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/faraid_app.js): Single client controller managing Shariah calculation, localStorage state, navigation links, and Android native bridge dispatches.

### 2.3 Stitch MCP Asset Pipeline
The canonical visual mockups and HTML templates originate from the Stitch MCP Project `6673898581680894408` and are archived in [`stitch_assets/`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/stitch_assets/):
- `stitch_assets/screens/screen1_langkah2_waris.*`: Step 2 heir selection screen specification.
- `stitch_assets/screens/screen2_langkah1_harta.*`: Step 1 estate valuation screen specification.
- `stitch_assets/screens/screen3_utama.*`: Home dashboard layout specification.
- `stitch_assets/screens/screen4_panduan.*`: Shariah guide screen specification.
- `stitch_assets/screens/screen5_keputusan.*`: Calculation result screen specification.

---

## 3. Faraid Calculation Engine

The engine is encapsulated in [`calculateFaraid()`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/faraid_app.js#L75-L303) inside [`faraid_app.js`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/faraid_app.js).

### 3.1 Estate Valuation Deductions (*Tertib Pengurusan Harta*)
Prior to Faraid allocation, deductions must occur in exact sequential priority:
1. **Gross Estate ($E_{gross}$)**: Total registered movable and immovable assets.
2. **Funeral Costs ($C_{funeral}$)**: Reasonable burial expenses (*Tajhiz al-Janazah*).
3. **Liabilities ($C_{debt}$)**: Formal debts (*Duyun*), encompassing both debts to Allah (unpaid Zakat, Nazar, Kaffarah) and debts to humans.
4. **Post-Debt Balance**:
   $$E_{postDebt} = \max(0, E_{gross} - C_{funeral} - C_{debt})$$
5. **Wasiat to Non-Heirs ($W$)**: Capped strictly at one-third of post-debt estate:
   $$W_{max} = \frac{E_{postDebt}}{3}, \quad W_{effective} = \min(W, W_{max})$$
6. **Net Distributable Estate ($E_{net}$)**:
   $$E_{net} = E_{postDebt} - W_{effective}$$

### 3.2 Ashabul Furud (Fixed Quranic Portions)
Fixed portions are allocated first according to Quranic decrees (Surah An-Nisa: 11–12):

| Heir | Condition | Share | Notes |
|---|---|:---:|---|
| **Husband** (*Suami*) | Children present | **$\frac{1}{4}$** (25.0%) | Female deceased |
| **Husband** (*Suami*) | No children | **$\frac{1}{2}$** (50.0%) | Female deceased |
| **Wife / Wives** (*Isteri*) | Children present | **$\frac{1}{8}$** (12.5%) | Male deceased; shared equally among 1–4 wives |
| **Wife / Wives** (*Isteri*) | No children | **$\frac{1}{4}$** (25.0%) | Male deceased; shared equally among 1–4 wives |
| **Mother** (*Ibu*) | Children present | **$\frac{1}{6}$** (16.67%) | Reduced from $\frac{1}{3}$ via *Hajb Nuqsan* |
| **Mother** (*Ibu*) | No children | **$\frac{1}{3}$** (33.33%) | Standard share |
| **Father** (*Bapa*) | Sons present | **$\frac{1}{6}$** (16.67%) | Pure *Fardh* allocation |
| **Father** (*Bapa*) | Only Daughters present | **$\frac{1}{6}$ + Remainder** | Inherits fixed $\frac{1}{6}$ and any remaining residue |
| **Single Daughter** (*Anak Perempuan*) | 1 Daughter, No Sons | **$\frac{1}{2}$** (50.0%) | Fixed *Fardh* |
| **Multiple Daughters** (*Anak Perempuan*) | $\ge 2$ Daughters, No Sons | **$\frac{2}{3}$** (66.67%) | Shared equally |

### 3.3 ‘Asabah (Residuary Beneficiaries)
After *Ashabul Furud* claims are fulfilled, remaining estate ($R = \max(0, E_{net} - \sum \text{Furud})$) is distributed:
- **‘Asabah bi al-Ghayr (Sons + Daughters)**:
  - Sons convert daughters into residuary heirs.
  - Divided by total units $U = (2 \times N_{sons}) + (1 \times N_{daughters})$.
  - Son gets 2 units; daughter gets 1 unit ($2:1$ Quranic ratio).
- **‘Asabah bi Nafsihi (Sons only)**:
  - Sons take 100% of remaining residue divided equally.
- **‘Asabah bi Nafsihi (Father without children)**:
  - If no children exist, Father inherits the entire remainder after spouse and mother.

### 3.4 Hajb (Blocking / Exclusion Rules)
- **Hajb Nuqsan (Reduction)**: Children reduce Husband's share from $\frac{1}{2} \rightarrow \frac{1}{4}$, Wife's share from $\frac{1}{4} \rightarrow \frac{1}{8}$, and Mother's share from $\frac{1}{3} \rightarrow \frac{1}{6}$.
- **Hajb Hirman (Full Exclusion)**: Sons block collateral heirs (brothers, sisters, uncles, nephews) from any inheritance entitlement.

### 3.5 Asal Mas'alah (Common Denominator: Base 24)
Standard complex estates involving both Spouse ($\frac{1}{8}$) and Parents ($\frac{1}{6}$) resolve to a classical lowest common denominator of **24 units**:
- **Wife**: $\frac{3}{24}$ ($12.5\%$)
- **Father**: $\frac{4}{24}$ ($16.67\%$)
- **Mother**: $\frac{4}{24}$ ($16.67\%$)
- **Residue for Children**: $\frac{13}{24}$ ($54.16\%$)

---

## 4. Android Native Bridge (`WebAppInterface`)

The native bridge [`WebAppInterface`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt) is bound to JavaScript as `window.AndroidBridge`.

| Method | Signature | Parameters | Native Behavior | JavaScript Invocation |
|---|---|---|---|---|
| [`showToast`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt#L15-L18) | `showToast(message: String)` | `message` (String) | Displays native Android `Toast.LENGTH_SHORT`. | `window.AndroidBridge?.showToast("Data disimpan");` |
| [`shareText`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt#L20-L31) | `shareText(title: String, text: String)` | `title` (String)<br>`text` (String) | Spawns `Intent.ACTION_SEND` chooser sheet (WhatsApp, Telegram, Notes, etc.). | `window.AndroidBridge?.shareText("Sijil Faraid", summary);` |
| [`vibrate`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt#L33-L47) | `vibrate(durationMs: Long)` | `durationMs` (Long) | Triggers haptic vibration via `VibratorManager` (Android 12+) or legacy `Vibrator`. | `window.AndroidBridge?.vibrate(50);` |
| [`navigateTo`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt#L49-L54) | `navigateTo(page: String)` | `page` (String) | Posts `loadUrl("file:///android_asset/www/$page")` to WebView UI thread. | `window.AndroidBridge?.navigateTo("langkah1.html");` |

---

## 5. Project Directory Layout

```
Faraid-Sim-Malaysia/
├── README.md                                   # Single source of truth documentation
├── SYSTEM_ARCHITECTURE.md                      # High-level architecture and Shariah math specs
├── AGENT_HANDOFF.md                            # Detailed runbook and operational log
├── .gitignore                                  # Git ignore specifications
├── docs/
│   └── screenshots/                            # Emulator UI verification screenshots
├── build.gradle.kts                            # Root Gradle build script
├── settings.gradle.kts                         # Module declarations & plugin management
├── gradle.properties                           # JVM args and AndroidX configuration
├── local.properties                            # Machine-specific SDK directory mapping
├── gradlew.bat / gradlew                       # Gradle wrapper executables
├── gradle/
│   └── libs.versions.toml                      # Version catalog (AGP 8.13.2, Kotlin 2.2.10)
├── stitch_assets/                              # Canonical Stitch MCP design references
│   └── screens/                                # Raw exported HTML and screenshot assets
└── app/
    ├── build.gradle.kts                        # App module configuration (targetSdk 35, minSdk 26)
    └── src/main/
        ├── AndroidManifest.xml                 # App manifest, permissions, and theme binding
        ├── java/com/faraid/simulator/
        │   ├── MainActivity.kt                 # Host activity, WebView config & back callback
        │   └── WebAppInterface.kt             # Native JS bridge implementation
        ├── res/
        │   ├── values/
        │   │   ├── colors.xml                  # Emerald & warm palette (#00492A, #F9F9FF)
        │   │   ├── strings.xml                 # App title and localized strings
        │   │   └── themes.xml                  # Theme.AppCompat.Light.NoActionBar
        │   └── drawable/                       # Vector assets & adaptive launcher icons
        └── assets/www/                         # Production WebView Web Core
            ├── index.html                      # Root trampoline redirecting to utama.html
            ├── utama.html                      # Dashboard screen
            ├── langkah1.html                   # Step 1: Estate & deduction inputs
            ├── langkah2.html                   # Step 2: Heirs & family configuration
            ├── keputusan.html                  # Step 3: Faraid calculation results
            ├── panduan.html                    # Legal guide & knowledge repository
            └── faraid_app.js                   # Unified Shariah calculation and bridge script
```

---

## 6. Build & Development Runbook

### 6.1 Required Environment Variables
Configure PowerShell before running build tasks:
```powershell
# Point to Android Studio bundled JBR (Java 17+)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

# Point to Android SDK
$env:ANDROID_HOME = "C:\Users\ash_s\AppData\Local\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;" + $env:PATH
```

### 6.2 Gradle Build Commands
```powershell
# Check project compilation and dependencies
.\gradlew.bat assembleDebug

# Clean build and re-assemble debug APK
.\gradlew.bat clean assembleDebug
```
The compiled output is generated at:
`app\build\outputs\apk\debug\app-debug.apk`

### 6.3 ADB Deployment & Execution (`emulator-5554`)
```powershell
# 1. Verify emulator connection and boot completion
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 shell getprop sys.boot_completed
# Expected output: 1

# 2. Install debug APK
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 install -r "app\build\outputs\apk\debug\app-debug.apk"

# 3. Launch the application
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 shell am start -n com.faraid.simulator/.MainActivity

# 4. View live debug logs (filtering for crashes and Chromium WebView messages)
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5554 logcat -d -s AndroidRuntime:E chromium:W
```

---

## 7. Verification & UI Smoke Testing

Tested on AVD `Pixel_9_Pro` (1344 $\times$ 2992 screen resolution).

### 7.1 Key Screen Coordinates for UI Smoke Tests

| Screen | Target UI Element | ADB Command | Result / Action |
|---|---|---|---|
| **Utama (Dashboard)** | "Mula Kira Sekarang" Hero Button | `adb -s emulator-5554 shell input tap 640 750` | Navigates to `langkah1.html` |
| **Utama (Dashboard)** | "Panduan Waris" Shortcut Card | `adb -s emulator-5554 shell input tap 750 1150` | Navigates to `panduan.html` |
| **Langkah 1 (Harta)** | "Seterusnya: Pilih Waris" Button | `adb -s emulator-5554 shell input tap 640 2280` | Saves estate data and navigates to `langkah2.html` |
| **Langkah 2 (Waris)** | "Kira Agihan (Step 3)" Button | `adb -s emulator-5554 shell input tap 750 2750` | Calculates Faraid and navigates to `keputusan.html` |
| **Keputusan / Panduan** | In-app Top Back Button | `adb -s emulator-5554 shell input tap 60 110` | Navigates to preceding step in stack |
| **Any Screen** | Android Device Back Button | `adb -s emulator-5554 shell input keyevent 4` | Handled by `OnBackPressedCallback` |
| **Any Screen** | Bottom Navigation "Panduan" Tab | `adb -s emulator-5554 shell input tap 750 2700` | Opens `panduan.html` directly |

### 7.2 Screenshot Capture & Verification Script
Run the automated end-to-end smoke verification pipeline:
```powershell
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
$device = "emulator-5554"

# 1. Tap "Mula Kira Sekarang" on Utama
& $adb -s $device shell input tap 640 750
Start-Sleep -Seconds 2

# 2. Tap "Seterusnya: Pilih Waris" on Langkah 1
& $adb -s $device shell input tap 640 2280
Start-Sleep -Seconds 2

# 3. Tap "Kira Agihan (Step 3)" on Langkah 2
& $adb -s $device shell input tap 750 2750
Start-Sleep -Seconds 2

# 4. Capture result screenshot to device and pull locally
& $adb -s $device shell screencap -p /sdcard/smoke_result.png
& $adb -s $device pull /sdcard/smoke_result.png "smoke_result.png"
```
