# Agent Handoff & Developer Runbook

## 1. Quick-Start & Environment Setup

### 1.1 Prerequisites
- **Operating System**: Windows 11 / 10 (PowerShell 7+ or Windows PowerShell)
- **Android SDK**: `C:\Users\ash_s\AppData\Local\Android\Sdk`
  - Platform: `android-35`
  - Build Tools: `35.0.0` or `36.0.0`
- **JDK Runtime**: OpenJDK 17+ (Bundled Android Studio JBR located at `C:\Program Files\Android\Android Studio\jbr`)
- **Emulator / Device**: AVD `Pixel_9_Pro` or any Android 8.0+ (API 26+) physical device/emulator.

### 1.2 Environment Variables (PowerShell)
Execute before building in terminal sessions:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
$env:ANDROID_HOME = "C:\Users\ash_s\AppData\Local\Android\Sdk"
```

### 1.3 Exact Build & Run Commands
- **Assemble Debug APK**:
  ```powershell
  .\gradlew.bat assembleDebug
  ```
- **Install to Connected Emulator / Device**:
  ```powershell
  & "$env:ANDROID_HOME\platform-tools\adb.exe" install -r "app\build\outputs\apk\debug\app-debug.apk"
  ```
- **Launch Application**:
  ```powershell
  & "$env:ANDROID_HOME\platform-tools\adb.exe" shell am start -n com.faraid.simulator/.MainActivity
  ```

---

## 2. File & Directory Index

| Relative Path | Responsibility |
|---|---|
| [`SYSTEM_ARCHITECTURE.md`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/SYSTEM_ARCHITECTURE.md) | High-level system overview, architectural topology, Shariah math engine, and data flow. |
| [`AGENT_HANDOFF.md`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/AGENT_HANDOFF.md) | Operational runbook, bridge signatures, file index, debugging guides, and backlog. |
| [`settings.gradle.kts`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/settings.gradle.kts) | Root Gradle project descriptor containing module definitions and Maven repository blocks. |
| [`build.gradle.kts`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/build.gradle.kts) | Root buildscript applying Android Application and Kotlin plugins. |
| [`local.properties`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/local.properties) | Machine-specific SDK path mapping (`sdk.dir`). |
| [`gradle.properties`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/gradle.properties) | JVM arguments, AndroidX flags, and non-transitive R class directives. |
| [`gradle/libs.versions.toml`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/gradle/libs.versions.toml) | Version catalog for dependencies (AGP `8.13.2`, Kotlin `2.2.10`, AndroidX WebKit, Core, AppCompat). |
| [`app/build.gradle.kts`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/build.gradle.kts) | Application module build configuration, SDK targets (minSdk 26, compileSdk 35), and packaging options. |
| [`app/src/main/AndroidManifest.xml`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/AndroidManifest.xml) | Package manifest, network permissions, activity declaration, and theme configuration. |
| [`app/src/main/java/com/faraid/simulator/MainActivity.kt`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/MainActivity.kt) | Host Activity, WebView hardware setup, edge-to-edge window insets, and hierarchical back-button stack. |
| [`app/src/main/java/com/faraid/simulator/WebAppInterface.kt`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/java/com/faraid/simulator/WebAppInterface.kt) | `@JavascriptInterface` bridge communicating between WebView JS and native Android APIs. |
| [`app/src/main/res/values/themes.xml`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/res/values/themes.xml) | App theme inheriting from `Theme.AppCompat.Light.NoActionBar` with light status/nav bar colors. |
| [`app/src/main/res/values/colors.xml`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/res/values/colors.xml) | Native branding color palette (`#00492A` primary, `#F9F9FF` surface). |
| [`app/src/main/res/drawable/`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/res/drawable/) | Custom adaptive vector icons (`ic_launcher_foreground.xml` balance scale, `ic_launcher_background.xml`). |
| [`app/src/main/assets/www/index.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/index.html) | Default launch URL (alias of `utama.html`). |
| [`app/src/main/assets/www/utama.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/utama.html) | Home dashboard with hero calculator trigger, quick actions, and recent calculation cards. |
| [`app/src/main/assets/www/langkah1.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/langkah1.html) | Step 1 screen: Gross estate, funeral deductions, debts, and wasiat limit validation. |
| [`app/src/main/assets/www/langkah2.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/langkah2.html) | Step 2 screen: Gender selector, spouse counters, sons/daughters steppers, and parents toggles. |
| [`app/src/main/assets/www/keputusan.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/keputusan.html) | Step 3 screen: SVG distribution donut chart, Quranic fractions, and PDF share trigger. |
| [`app/src/main/assets/www/panduan.html`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/panduan.html) | Educational knowledge repository with live search and category filters. |
| [`app/src/main/assets/www/faraid_app.js`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/assets/www/faraid_app.js) | Centralized client-side routing, Shariah calculation logic, and bridge wrapper. |
| [`stitch_assets/screens/`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/stitch_assets/screens/) | Raw downloaded Stitch assets (HTML and screenshots) used as canonical design references. |

---

## 3. JS-to-Native Bridge Contract (`WebAppInterface.kt`)

The bridge is bound to `window.AndroidBridge` on the web runtime.

### 3.1 `showToast(message: String)`
- **Parameters**: `message` (String) - Toast content to display.
- **Side Effect**: Displays a short native Android `Toast` message.
- **Example**:
  ```javascript
  if (window.AndroidBridge) {
    window.AndroidBridge.showToast('Kes berjaya disimpan.');
  }
  ```

### 3.2 `shareText(title: String, text: String)`
- **Parameters**:
  - `title` (String): Dialog chooser title.
  - `text` (String): Plain text summary of the Faraid distribution to share.
- **Side Effect**: Spawns Android native `Intent.ACTION_SEND` chooser dialog (WhatsApp, Telegram, Gmail, Bluetooth, etc.).
- **Example**:
  ```javascript
  if (window.AndroidBridge) {
    window.AndroidBridge.shareText('Sijil Faraid', 'Jumlah Baki Harta: RM 500,000.00...');
  }
  ```

### 3.3 `vibrate(durationMs: Long)`
- **Parameters**: `durationMs` (Long) - Vibration duration in milliseconds.
- **Side Effect**: Triggers system haptic actuator using `VibratorManager` (Android 12+) or legacy `Vibrator`.
- **Example**:
  ```javascript
  if (window.AndroidBridge) {
    window.AndroidBridge.vibrate(50);
  }
  ```

### 3.4 `navigateTo(page: String)`
- **Parameters**: `page` (String) - Filename located in `file:///android_asset/www/` (e.g. `"langkah1.html"`).
- **Side Effect**: Dispatches URL loading onto the Android main UI thread safely.

---

## 4. Verification & Debugging Runbook

### 4.1 Launching the Android Emulator
```powershell
& "C:\Users\ash_s\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Pixel_9_Pro -netdelay none -netspeed full
```

### 4.2 Verifying Boot State
```powershell
& "C:\Users\ash_s\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell getprop sys.boot_completed
# Expected output: 1
```

### 4.3 Clean Build & Deployment
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
.\gradlew.bat clean assembleDebug
& "C:\Users\ash_s\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 install -r "app\build\outputs\apk\debug\app-debug.apk"
& "C:\Users\ash_s\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 shell am start -n com.faraid.simulator/.MainActivity
```

### 4.4 Capturing Live Logs
Filter for app crashes or WebView issues:
```powershell
& "C:\Users\ash_s\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 logcat -d -s AndroidRuntime:E chromium:W
```

### 4.5 Capturing & Inspecting Screencaps
```powershell
& "C:\Users\ash_s\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 shell screencap -p /sdcard/debug_screen.png
& "C:\Users\ash_s\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s emulator-5554 pull /sdcard/debug_screen.png "debug_screen.png"
```

---

## 5. Known Quirks & Backlog

### 5.1 Applied Fixes & Quirks
- **Theme Inheritance**: `MainActivity` extends `AppCompatActivity`, requiring `Theme.AppCompat.Light.NoActionBar` (or a descendant) instead of `android:Theme.Material.Light.NoActionBar`. Configured in [`themes.xml`](file:///c:/Users/ash_s/develop/projects/Faraid-Sim-Malaysia/app/src/main/res/values/themes.xml).
- **Safe Area Insets**: Status and navigation bar safe areas are handled via `.pt-safe` and `.pb-safe` CSS utilities in Tailwind accompanied by light status bar flags in Kotlin window insets controllers.

### 5.2 Priority Feature Backlog
1. **Full PDF Generator**: Currently `triggerExportAction()` calls `AndroidBridge.shareText()`. Future iterations can integrate `PdfDocument` or Android's Print Manager to create a downloadable official PDF Sijil Faraid.
2. **Extended Relatives (Zawil Arham & Siblings)**: Add secondary collapsible heir forms for cases without primary heirs (e.g., grandfather, paternal grandmother, uterine brothers/sisters, nephews).
3. **Room Database Persistence**: Replace `localStorage` with a native Room database synced across `WebAppInterface` for saved simulation history and cloud backup.
