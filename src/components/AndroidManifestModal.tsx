import React, { useState } from 'react';
import { Smartphone, Copy, Check, Download, X, Shield, Cpu, Bell, Layers, FileCode, Terminal, BookOpen } from 'lucide-react';
import { Language } from '../types/trading';

interface AndroidManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const AndroidManifestModal: React.FC<AndroidManifestModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'service' | 'build_guide'>('manifest');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.vipbinary.aipromax">

    <!-- Essential Network Permissions for Real-Time Quotex Ticks & AI Signals -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

    <!-- Haptic Feedback on Signal Generation & Trade Execution -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- VIP AI Signal Notifications for Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Keep Screen Awake during Live Trading Sessions -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- Floating Window Permission to Overlay Over Broker Apps (Quotex, Pocket Option) -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

    <!-- High-Performance GPU Rendering Feature Requirements -->
    <uses-feature
        android:name="android.hardware.touchscreen"
        android:required="false" />
    <uses-feature
        android:glEsVersion="0x00020000"
        android:required="true" />

    <application
        android:name=".VIPBinaryApplication"
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VIPBinaryAIProMax"
        android:usesCleartextTraffic="true"
        tools:targetApi="34">

        <!-- Main Trading Terminal Activity -->
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|uiMode"
            android:exported="true"
            android:label="@string/app_name"
            android:launchMode="singleTop"
            android:screenOrientation="unspecified"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Floating Overlay Window Service (FloatingWidgetService.kt) -->
        <service
            android:name=".service.FloatingWidgetService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse">
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Floating real-time trading signal HUD overlay over third-party broker interfaces" />
        </service>

    </application>

</manifest>`;

  const floatingWidgetServiceKt = `package com.vipbinary.aipromax.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import com.vipbinary.aipromax.MainActivity
import com.vipbinary.aipromax.R

/**
 * FloatingWidgetService - VIP Binary AI Pro Max (com.vipbinary.aipromax)
 * 
 * Provides an always-on-top floating HUD signal overlay window that hovers
 * over any binary options broker app (Quotex, Pocket Option, Binomo, etc.).
 */
class FloatingWidgetService : Service() {

    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var collapsedView: View? = null
    private var expandedView: View? = null

    private var tvSignalDirection: TextView? = null
    private var tvAssetPair: TextView? = null
    private var tvConfidence: TextView? = null
    private var tvExpiryTimer: TextView? = null
    private var tvMtgAdvice: TextView? = null
    private var btnCloseWidget: ImageView? = null

    companion object {
        const val CHANNEL_ID = "vip_floating_widget_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_STOP_SERVICE = "ACTION_STOP_SERVICE"
        const val ACTION_UPDATE_SIGNAL = "ACTION_UPDATE_SIGNAL"

        const val EXTRA_ASSET = "EXTRA_ASSET"
        const val EXTRA_DIRECTION = "EXTRA_DIRECTION" // CALL, PUT, or WAIT
        const val EXTRA_CONFIDENCE = "EXTRA_CONFIDENCE"
        const val EXTRA_EXPIRY = "EXTRA_EXPIRY"
        const val EXTRA_MTG = "EXTRA_MTG"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification("VIP AI Overlay Active", "Scanning Quotex Live & OTC Market..."))
        setupFloatingWindow()
    }

    private fun setupFloatingWindow() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 50
            y = 200
        }

        val inflater = getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
        floatingView = inflater.inflate(R.layout.layout_floating_widget, null)

        collapsedView = floatingView?.findViewById(R.id.layout_collapsed_bubble)
        expandedView = floatingView?.findViewById(R.id.layout_expanded_signal)
        tvSignalDirection = floatingView?.findViewById(R.id.tv_signal_direction)
        tvAssetPair = floatingView?.findViewById(R.id.tv_asset_pair)
        tvConfidence = floatingView?.findViewById(R.id.tv_confidence)
        tvExpiryTimer = floatingView?.findViewById(R.id.tv_expiry_timer)
        tvMtgAdvice = floatingView?.findViewById(R.id.tv_mtg_advice)
        btnCloseWidget = floatingView?.findViewById(R.id.btn_close_widget)

        collapsedView?.visibility = View.GONE
        expandedView?.visibility = View.VISIBLE

        setupDragTouchListener(params)

        btnCloseWidget?.setOnClickListener { stopSelf() }
        collapsedView?.setOnClickListener {
            collapsedView?.visibility = View.GONE
            expandedView?.visibility = View.VISIBLE
        }
        floatingView?.findViewById<View>(R.id.btn_minimize_widget)?.setOnClickListener {
            expandedView?.visibility = View.GONE
            collapsedView?.visibility = View.VISIBLE
        }

        windowManager?.addView(floatingView, params)
    }

    private fun setupDragTouchListener(params: WindowManager.LayoutParams) {
        val rootLayout = floatingView?.findViewById<View>(R.id.root_floating_container)
        rootLayout?.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager?.updateViewLayout(floatingView, params)
                        return true
                    }
                }
                return false
            }
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            when (intent.action) {
                ACTION_STOP_SERVICE -> stopSelf()
                ACTION_UPDATE_SIGNAL -> {
                    val asset = intent.getStringExtra(EXTRA_ASSET) ?: "EUR/USD (OTC)"
                    val direction = intent.getStringExtra(EXTRA_DIRECTION) ?: "WAIT"
                    val confidence = intent.getDoubleExtra(EXTRA_CONFIDENCE, 75.0)
                    val expiry = intent.getStringExtra(EXTRA_EXPIRY) ?: "1M"
                    val mtg = intent.getStringExtra(EXTRA_MTG) ?: "MTG Step 0 Direct"
                    updateSignalUI(asset, direction, confidence, expiry, mtg)
                }
            }
        }
        return START_STICKY
    }

    private fun updateSignalUI(
        asset: String,
        direction: String,
        confidence: Double,
        expiry: String,
        mtg: String
    ) {
        tvAssetPair?.text = asset
        tvSignalDirection?.text = direction.uppercase()
        tvConfidence?.text = "$confidence% CONF"
        tvExpiryTimer?.text = "EXPIRY: $expiry"
        tvMtgAdvice?.text = mtg
    }

    private fun buildForegroundNotification(title: String, content: String): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_vip_signal)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "VIP Floating Overlay Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (floatingView != null) {
            windowManager?.removeView(floatingView)
            floatingView = null
        }
    }
}`;

  const apkBuildGuide = `# VIP Binary AI Pro Max - Android APK Build Instructions
Package: com.vipbinary.aipromax
Target SDK: 34 (Android 14)
Min SDK: 24 (Android 7.0+)

==================================================
METHOD 1: BUILD USING CAPACITOR (RECOMMENDED)
==================================================
1. Build the web production assets:
   npm run build

2. Initialize Capacitor in this project:
   npx @capacitor/cli init "VIP Binary AI Pro Max" "com.vipbinary.aipromax" --web-dir "dist"

3. Add the Android platform:
   npm install @capacitor/android
   npx cap add android

4. Copy the production build into the Android container:
   npx cap sync android

5. Open Android Studio:
   npx cap open android

6. In Android Studio:
   - Go to: Build > Generate Signed Bundle / APK
   - Choose APK > Next
   - Create your keystore or use debug key
   - Select release build variant
   - Click Finish to generate: app-release.apk

==================================================
METHOD 2: GRADLE COMMAND LINE BUILD
==================================================
If Android SDK is installed on your Linux / macOS / Windows machine:

1. Navigate to the android directory:
   cd android

2. Build debug APK:
   ./gradlew assembleDebug
   (Output located at: android/app/build/outputs/apk/debug/app-debug.apk)

3. Build production release APK:
   ./gradlew assembleRelease
   (Output located at: android/app/build/outputs/apk/release/app-release-unsigned.apk)

4. Install directly on USB-connected Android phone:
   adb install -r app/build/outputs/apk/debug/app-debug.apk

==================================================
METHOD 3: FLOATING HUD WINDOW PERMISSION SETUP
==================================================
To allow the floating signal HUD to hover over Quotex or other trading broker apps:
1. On Android phone, open Settings > Apps > VIP Binary AI Pro Max.
2. Select "Display over other apps" (SYSTEM_ALERT_WINDOW).
3. Toggle permission to ALLOW.
4. Open the VIP Binary app and toggle HUD on.
`;

  const currentCode =
    activeTab === 'manifest'
      ? manifestXml
      : activeTab === 'service'
      ? floatingWidgetServiceKt
      : apkBuildGuide;

  const currentFilename =
    activeTab === 'manifest'
      ? 'AndroidManifest.xml'
      : activeTab === 'service'
      ? 'FloatingWidgetService.kt'
      : 'APK_BUILD_INSTRUCTIONS.md';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const mime =
      activeTab === 'manifest'
        ? 'application/xml;charset=utf-8;'
        : 'text/plain;charset=utf-8;';
    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', currentFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {language === 'bn' ? 'অ্যান্ড্রয়েড আর্কিটেকচার ও APK বিল্ড নির্দেশিকা' : 'Android Source & APK Build Guide'}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Target API 34
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                com.vipbinary.aipromax
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('manifest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'manifest'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>AndroidManifest.xml</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('service')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'service'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>FloatingWidgetService.kt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('build_guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'build_guide'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>APK Build Guide</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            {activeTab === 'manifest'
              ? 'Permissions & Activity'
              : activeTab === 'service'
              ? 'SYSTEM_ALERT_WINDOW Overlay Service'
              : 'Gradle & Capacitor Instructions'}
          </span>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#090D16]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-blue-500/30 selection:text-blue-200">
            {currentCode}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#0B0F19]">
          <span className="text-xs text-slate-500 font-mono">
            {currentFilename}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (language === 'bn' ? 'কপি হয়েছে' : 'Copied') : (language === 'bn' ? 'কপি করুন' : `Copy ${currentFilename}`)}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'bn' ? 'ডাউনলোড' : `Download ${currentFilename}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
