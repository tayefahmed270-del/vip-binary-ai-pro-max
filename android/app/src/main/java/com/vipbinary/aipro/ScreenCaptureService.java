package com.vipbinary.aipro;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.Display;
import android.view.WindowManager;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;

public class ScreenCaptureService extends Service {

    public static final String ACTION_START =
        "com.vipbinary.aipro.SCREEN_CAPTURE_START";
    public static final String ACTION_STOP =
        "com.vipbinary.aipro.SCREEN_CAPTURE_STOP";
    public static final String EXTRA_RESULT_CODE = "resultCode";
    public static final String EXTRA_RESULT_DATA = "resultData";

    private static final String CHANNEL_ID = "screen_capture_channel";
    private static final int NOTIFICATION_ID = 1001;

    private MediaProjection projection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private HandlerThread captureThread;
    private Handler captureHandler;
    private boolean capturing = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopCapture();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (!ACTION_START.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        if (capturing) {
            return START_NOT_STICKY;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            );
        } else {
            startForeground(NOTIFICATION_ID, buildNotification());
        }

        int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0);
        Intent resultData = getIntentExtra(intent, EXTRA_RESULT_DATA);

        if (resultData == null || resultCode != android.app.Activity.RESULT_OK) {
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            MediaProjectionManager manager =
                (MediaProjectionManager) getSystemService(
                    Context.MEDIA_PROJECTION_SERVICE
                );

            if (manager == null) {
                stopSelf();
                return START_NOT_STICKY;
            }

            projection = manager.getMediaProjection(resultCode, resultData);

            if (projection == null) {
                stopSelf();
                return START_NOT_STICKY;
            }

            projection.registerCallback(new MediaProjection.Callback() {
                @Override
                public void onStop() {
                    stopCapture();
                    stopSelf();
                }
            }, new Handler(getMainLooper()));

            startImageCapture();

        } catch (SecurityException | IllegalStateException e) {
            stopCapture();
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    private void startImageCapture() {
        DisplayMetrics metrics = new DisplayMetrics();
        WindowManager wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (wm == null) {
            stopSelf();
            return;
        }

        Display display = wm.getDefaultDisplay();
        display.getRealMetrics(metrics);

        int width = metrics.widthPixels;
        int height = metrics.heightPixels;
        int density = metrics.densityDpi;

        if (width <= 0 || height <= 0) {
            stopSelf();
            return;
        }

        captureThread = new HandlerThread("ScreenCaptureThread");
        captureThread.start();
        captureHandler = new Handler(captureThread.getLooper());

        imageReader = ImageReader.newInstance(
            width, height, PixelFormat.RGBA_8888, 2
        );

        imageReader.setOnImageAvailableListener(reader -> {
            Image image = null;
            Bitmap bitmap = null;

            try {
                image = reader.acquireLatestImage();
                if (image == null) return;

                Image.Plane plane = image.getPlanes()[0];
                ByteBuffer buffer = plane.getBuffer();
                int pixelStride = plane.getPixelStride();
                int rowStride = plane.getRowStride();
                int rowPadding = rowStride - pixelStride * width;
                int paddedWidth = width + rowPadding / pixelStride;

                bitmap = Bitmap.createBitmap(
                    paddedWidth, height, Bitmap.Config.ARGB_8888
                );
                bitmap.copyPixelsFromBuffer(buffer);

                Bitmap cropped = Bitmap.createBitmap(
                    bitmap, 0, 0, width, height
                );

                int maxWidth = 1280;
                Bitmap scaled = cropped;
                if (cropped.getWidth() > maxWidth) {
                    int scaledHeight = Math.max(1, cropped.getHeight() * maxWidth / cropped.getWidth());
                    scaled = Bitmap.createScaledBitmap(cropped, maxWidth, scaledHeight, true);
                }

                File output = new File(getCacheDir(), "quotex-screen.jpg");
                try (FileOutputStream stream = new FileOutputStream(output)) {
                    scaled.compress(Bitmap.CompressFormat.JPEG, 75, stream);
                    stream.flush();
                }
                if (scaled != cropped && !scaled.isRecycled()) scaled.recycle();
                if (cropped != bitmap && !cropped.isRecycled()) cropped.recycle();

            } catch (Exception e) {
                android.util.Log.e(
                    "ScreenCapture", "Could not save captured frame", e
                );
            } finally {
                if (bitmap != null && !bitmap.isRecycled()) bitmap.recycle();
                if (image != null) image.close();
            }
        }, captureHandler);

        virtualDisplay = projection.createVirtualDisplay(
            "VIPBinaryScreenCapture",
            width,
            height,
            density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader.getSurface(),
            null,
            captureHandler
        );

        capturing = virtualDisplay != null;
        if (!capturing) stopSelf();
    }

    private Intent getIntentExtra(Intent source, String key) {
        if (Build.VERSION.SDK_INT >= 33) {
            return source.getParcelableExtra(key, Intent.class);
        }
        return source.getParcelableExtra(key);
    }

    private Notification buildNotification() {
        return new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("VIP Binary AI Pro Max")
            .setContentText("Screen sharing is active. Stop it in the app.")
            .setSmallIcon(android.R.drawable.ic_menu_view)
            .setOngoing(true)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Screen capture",
                NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager =
                getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private void stopCapture() {
        capturing = false;

        if (virtualDisplay != null) {
            virtualDisplay.release();
            virtualDisplay = null;
        }

        if (imageReader != null) {
            imageReader.setOnImageAvailableListener(null, null);
            imageReader.close();
            imageReader = null;
        }

        if (projection != null) {
            MediaProjection oldProjection = projection;
            projection = null;
            oldProjection.stop();
        }

        if (captureThread != null) {
            captureThread.quitSafely();
            captureThread = null;
            captureHandler = null;
        }

        stopForeground(true);
    }

    @Override
    public void onDestroy() {
        stopCapture();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
