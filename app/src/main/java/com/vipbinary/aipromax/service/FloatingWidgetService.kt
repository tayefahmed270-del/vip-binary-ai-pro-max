package com.vipbinary.aipromax.service

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
 * FloatingWidgetService - VIP Binary AI Pro Max
 * 
 * Provides an always-on-top floating signal overlay window that hovers
 * over any binary options trading broker (Quotex, Pocket Option, Binomo, etc.).
 * Displays real-time CALL/PUT predictions, win confidence, and expiry timers.
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
    private var layoutSignalContainer: LinearLayout? = null

    companion object {
        const val CHANNEL_ID = "vip_floating_widget_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_STOP_SERVICE = "ACTION_STOP_SERVICE"
        const val ACTION_UPDATE_SIGNAL = "ACTION_UPDATE_SIGNAL"

        const val EXTRA_ASSET = "EXTRA_ASSET"
        const val EXTRA_DIRECTION = "EXTRA_DIRECTION"
        const val EXTRA_CONFIDENCE = "EXTRA_CONFIDENCE"
        const val EXTRA_EXPIRY = "EXTRA_EXPIRY"
        const val EXTRA_MTG = "EXTRA_MTG"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification("VIP AI Overlay Active", "Scanning OTC Market..."))
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
        layoutSignalContainer = floatingView?.findViewById(R.id.layout_signal_container)

        // Default initial state: Collapsed bubble or mini card
        collapsedView?.visibility = View.GONE
        expandedView?.visibility = View.VISIBLE

        // Touch listener for smooth dragging and tapping
        setupDragTouchListener(params)

        // Close button handler
        btnCloseWidget?.setOnClickListener {
            stopSelf()
        }

        // Tap collapsed bubble to toggle expanded view
        collapsedView?.setOnClickListener {
            collapsedView?.visibility = View.GONE
            expandedView?.visibility = View.VISIBLE
        }

        // Tap header to collapse
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
                    val direction = intent.getStringExtra(EXTRA_DIRECTION) ?: "CALL"
                    val confidence = intent.getDoubleExtra(EXTRA_CONFIDENCE, 92.4)
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

        if (direction.equals("CALL", ignoreCase = true)) {
            tvSignalDirection?.setTextColor(0xFF10B981.toInt())
            layoutSignalContainer?.setBackgroundColor(0xFF0A2318.toInt())
        } else {
            tvSignalDirection?.setTextColor(0xFFF43F5E.toInt())
            layoutSignalContainer?.setBackgroundColor(0xFF250D14.toInt())
        }
    }

    private fun buildForegroundNotification(title: String, content: String): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = Intent(this, FloatingWidgetService::class.java).apply {
            action = ACTION_STOP_SERVICE
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_vip_signal)
            .setContentIntent(pendingIntent)
            .addAction(R.drawable.ic_close, "Stop Overlay", stopPendingIntent)
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
            ).apply {
                description = "Shows live VIP Binary AI trading signals floating over broker apps"
            }
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
}
