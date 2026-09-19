# 全平台（iOS · Android · 鸿蒙 HarmonyOS NEXT）打包与落地指南

本项目是专为**“按国家生成特色白噪音与音乐”**设计的跨平台声景系统。前端采用高性能的 Web Audio API 物理建模合成与算法生成技术，零音频冗余体积（仅几十 KB），并已完整解耦。

本文档指导您如何将该系统打包并发布至 **Apple App Store (iOS)**、**Google Play / 国内应用市场 (Android)** 以及 **华为纯血鸿蒙应用市场 (HarmonyOS NEXT)**。

---

## 一、 核心平台技术方案选型

| 目标平台 | 打包方案 | 编译工具 | 关键底层能力 |
| :--- | :--- | :--- | :--- |
| **🍎 iOS** | Capacitor / Uni-app / Swift Native Web | Xcode 15+ | `AVAudioSessionCategoryPlayback` (锁屏保活) |
| **🤖 Android** | Capacitor / Uni-app / Kotlin Native Web | Android Studio Iguana+ | `ForegroundService` + `MediaSession` |
| **🔴 鸿蒙 HarmonyOS NEXT** | DevEco Web 容器 / Uni-app x (ArkTS) | DevEco Studio 5.0+ | `@ohos.multimedia.avsession` (长音频元服务/后台任务) |

---

## 二、 鸿蒙 HarmonyOS NEXT 原生落地规范 (ArkTS)

纯血鸿蒙（NEXT）不再兼容安卓 APK，必须使用 **ArkTS / ArkUI** 编译成 `.hap` 包。

### 1. 权限配置 (`module.json5`)
在 `entry/src/main/module.json5` 中声明后台播放长任务权限：

```json
{
  "module": {
    "requestPermissions": [
      {
        "name": "ohos.permission.KEEP_BACKGROUND_RUNNING",
        "reason": "$string:background_audio_reason",
        "usedScene": {
          "abilities": ["EntryAbility"],
          "when": "always"
        }
      },
      {
        "name": "ohos.permission.INTERNET"
      }
    ]
  }
}
```

### 2. 锁屏播控与后台长任务 (`AVSessionService.ets`)
详见同目录下的 [AVSessionService.ets](file:///c:/Users/zhang/Documents/portfolio/country_noice/cross_platform/harmonyos/AVSessionService.ets)。

---

## 三、 iOS 原生落地规范 (Swift & Xcode)

### 1. 开启后台播放权限 (`Info.plist`)
在 Xcode 中选择 Target -> **Signing & Capabilities** -> 勾选 **Background Modes** -> 勾选 **Audio, AirPlay, and Picture in Picture**。

或在 `Info.plist` 中添加：
```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

### 2. 音频会话配置 (`AppDelegateAudio.swift`)
详见同目录下的 [AppDelegateAudio.swift](file:///c:/Users/zhang/Documents/portfolio/country_noice/cross_platform/ios/AppDelegateAudio.swift)。

---

## 四、 Android 原生落地规范 (Kotlin)

### 1. 前台服务声明 (`AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<service
    android:name=".AudioService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="false" />
```

### 2. 前台服务与媒体通知 (`AudioService.kt`)
详见同目录下的 [AudioService.kt](file:///c:/Users/zhang/Documents/portfolio/country_noice/cross_platform/android/AudioService.kt)。

---

## 五、 本地运行与开发

1. **安装依赖**：
   ```bash
   npm install
   ```
2. **启动本地实时预览**：
   ```bash
   npm run dev
   ```
   打开浏览器访问 `http://localhost:3000` 即可实时体验多国白噪音与生成调式。

3. **打包生产构建**：
   ```bash
   npm run build
   ```
   生成的 `dist/` 目录可直接放入 iOS、Android 或鸿蒙的静态 Web 容器中无缝运行。
