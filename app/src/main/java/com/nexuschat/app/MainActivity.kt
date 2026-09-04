package com.nexuschat.app

import android.annotation.SuppressLint
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
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

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
                    request?.grant(request.resources)
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

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
