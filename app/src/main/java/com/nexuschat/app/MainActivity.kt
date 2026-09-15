package com.nexuschat.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    // Pending permission request from WebView
    private var pendingPermissionRequest: PermissionRequest? = null

    // Register Activity Result launcher for runtime camera and audio permissions
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false

        val currentRequest = pendingPermissionRequest
        pendingPermissionRequest = null

        if (currentRequest != null) {
            val resourcesToGrant = mutableListOf<String>()
            val requested = currentRequest.resources ?: emptyArray()

            if (audioGranted && requested.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                resourcesToGrant.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
            }
            if (cameraGranted && requested.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                resourcesToGrant.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
            }

            if (resourcesToGrant.isNotEmpty()) {
                currentRequest.grant(resourcesToGrant.toTypedArray())
                Log.d(TAG, "Granted resources to WebView: $resourcesToGrant")
            } else {
                currentRequest.deny()
                Log.w(TAG, "Denied all requested resources")
                Toast.makeText(
                    this,
                    "Permissões de microfone/câmera são necessárias para a chamada.",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                useWideViewPort = true
                loadWithOverviewMode = true
                mediaPlaybackRequiresUserGesture = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView?,
                    request: WebResourceRequest?
                ): WebResourceResponse? {
                    val url = request?.url ?: return null
                    if (url.host == "localhost") {
                        val rawPath = url.path?.trimStart('/') ?: ""
                        val assetPath = if (rawPath.isEmpty() || rawPath == "index.html") "index.html" else rawPath

                        return try {
                            val stream = assets.open(assetPath)
                            val mime = when {
                                assetPath.endsWith(".html") -> "text/html"
                                assetPath.endsWith(".js") || assetPath.endsWith(".mjs") -> "application/javascript"
                                assetPath.endsWith(".css") -> "text/css"
                                assetPath.endsWith(".json") -> "application/json"
                                assetPath.endsWith(".png") -> "image/png"
                                assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") -> "image/jpeg"
                                assetPath.endsWith(".svg") -> "image/svg+xml"
                                assetPath.endsWith(".webp") -> "image/webp"
                                assetPath.endsWith(".woff2") -> "font/woff2"
                                assetPath.endsWith(".woff") -> "font/woff"
                                assetPath.endsWith(".ttf") -> "font/ttf"
                                else -> "application/octet-stream"
                            }
                            WebResourceResponse(mime, "UTF-8", stream).apply {
                                responseHeaders = mapOf(
                                    "Access-Control-Allow-Origin" to "*",
                                    "Access-Control-Allow-Methods" to "GET, OPTIONS",
                                    "Access-Control-Allow-Headers" to "*"
                                )
                            }
                        } catch (e: Exception) {
                            if (!assetPath.contains(".")) {
                                try {
                                    WebResourceResponse("text/html", "UTF-8", assets.open("index.html"))
                                } catch (_: Exception) {
                                    null
                                }
                            } else {
                                null
                            }
                        }
                    }
                    return super.shouldInterceptRequest(view, request)
                }

                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest?) {
                    if (request == null) return

                    val origin = request.origin
                    val host = origin?.host ?: ""

                    // Validate origin to prevent unauthorized capture requests
                    val isAllowedOrigin = host == "localhost" ||
                            host == "127.0.0.1" ||
                            host.endsWith("cysmk.online") ||
                            host.endsWith("pages.dev")

                    if (!isAllowedOrigin) {
                        Log.w(TAG, "Rejecting permission request from untrusted origin: $origin")
                        request.deny()
                        return
                    }

                    val requestedResources = request.resources ?: emptyArray()
                    val permissionsNeeded = mutableListOf<String>()

                    if (requestedResources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.RECORD_AUDIO
                            ) != PackageManager.PERMISSION_GRANTED
                        ) {
                            permissionsNeeded.add(Manifest.permission.RECORD_AUDIO)
                        }
                    }

                    if (requestedResources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.CAMERA
                            ) != PackageManager.PERMISSION_GRANTED
                        ) {
                            permissionsNeeded.add(Manifest.permission.CAMERA)
                        }
                    }

                    // On Android 12+, Bluetooth connect for headsets
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        if (ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.BLUETOOTH_CONNECT
                            ) != PackageManager.PERMISSION_GRANTED
                        ) {
                            permissionsNeeded.add(Manifest.permission.BLUETOOTH_CONNECT)
                        }
                    }

                    if (permissionsNeeded.isNotEmpty()) {
                        // Keep reference to request and ask OS for permissions
                        pendingPermissionRequest = request
                        requestPermissionLauncher.launch(permissionsNeeded.toTypedArray())
                    } else {
                        // All requested permissions already granted at OS level
                        val resourcesToGrant = mutableListOf<String>()
                        if (requestedResources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            resourcesToGrant.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                        }
                        if (requestedResources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                            resourcesToGrant.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
                        }
                        request.grant(resourcesToGrant.toTypedArray())
                        Log.d(TAG, "Granted requested resources: $resourcesToGrant")
                    }
                }

                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                    Log.d("WebViewConsole", "${consoleMessage?.message()} [line:${consoleMessage?.lineNumber()}]")
                    return super.onConsoleMessage(consoleMessage)
                }
            }
        }

        setContentView(webView)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        webView.loadUrl("https://localhost/index.html")
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        pendingPermissionRequest?.deny()
        pendingPermissionRequest = null
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
