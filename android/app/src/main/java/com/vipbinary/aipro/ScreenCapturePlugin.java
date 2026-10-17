package com.vipbinary.aipro;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Base64;
import java.io.File;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenCapture")
public class ScreenCapturePlugin extends Plugin {

    @PluginMethod
    public void getLatestScreenshot(PluginCall call) {
        File file = new File(getContext().getCacheDir(), "quotex-screen.jpg");

        if (!file.isFile() || file.length() < 100) {
            call.reject("No screenshot is available yet. Start screen sharing and wait briefly.");
            return;
        }

        if (file.length() > 4500000) {
            call.reject("Screenshot is too large. A smaller image is required.");
            return;
        }

        try (FileInputStream input = new FileInputStream(file);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) {
                output.write(buffer, 0, count);
            }

            JSObject response = new JSObject();
            response.put("mimeType", "image/jpeg");
            response.put("imageBase64",
                Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP));
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Could not read the screenshot.", e);
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        MediaProjectionManager manager =
            (MediaProjectionManager) getContext().getSystemService(
                Context.MEDIA_PROJECTION_SERVICE
            );

        if (manager == null) {
            call.reject("Screen capture is unavailable.");
            return;
        }

        startActivityForResult(
            call,
            manager.createScreenCaptureIntent(),
            "permissionResult"
        );
    }

    @ActivityCallback
    private void permissionResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Intent resultData = result.getData();

        if (result.getResultCode() != Activity.RESULT_OK
                || resultData == null) {
            JSObject response = new JSObject();
            response.put("granted", false);
            response.put("message", "Screen sharing permission denied.");
            call.resolve(response);
            return;
        }

        try {
            Intent serviceIntent = new Intent(
                getContext(),
                ScreenCaptureService.class
            );
            serviceIntent.setAction(ScreenCaptureService.ACTION_START);
            serviceIntent.putExtra(
                ScreenCaptureService.EXTRA_RESULT_CODE,
                result.getResultCode()
            );
            serviceIntent.putExtra(
                ScreenCaptureService.EXTRA_RESULT_DATA,
                resultData
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }

            JSObject response = new JSObject();
            response.put("granted", true);
            response.put(
                "message",
                "Permission granted; capture service start requested."
            );
            call.resolve(response);
        } catch (Exception e) {
            call.reject("Could not start screen capture service.", e);
        }
    }
}
