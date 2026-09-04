package com.nexuschat.app.data.utils

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.MediaStore

data class AppDockItem(
    val id: String,
    val label: String,
    val packageName: String,
    val intentAction: String? = null,
    val intentUri: String? = null
)

object DefaultAppsResolver {

    fun resolveDefaultApps(context: Context): List<AppDockItem> {
        val pm = context.packageManager
        val items = mutableListOf<AppDockItem>()

        // 1. Telefone (Dialer)
        val phoneIntent = Intent(Intent.ACTION_DIAL)
        val phoneResolve = pm.resolveActivity(phoneIntent, PackageManager.MATCH_DEFAULT_ONLY)
        val phonePkg = phoneResolve?.activityInfo?.packageName ?: findFallbackPackage(
            pm, listOf("com.google.android.dialer", "com.samsung.android.dialer", "com.android.dialer")
        )
        items.add(
            AppDockItem(
                id = "phone",
                label = "Telefone",
                packageName = phonePkg,
                intentAction = Intent.ACTION_DIAL
            )
        )

        // 2. Mensagens (SMS)
        val smsIntent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:"))
        val smsResolve = pm.resolveActivity(smsIntent, PackageManager.MATCH_DEFAULT_ONLY)
        val smsPkg = smsResolve?.activityInfo?.packageName ?: findFallbackPackage(
            pm, listOf("com.google.android.apps.messaging", "com.samsung.android.messaging", "com.android.mms")
        )
        items.add(
            AppDockItem(
                id = "messages",
                label = "Mensagens",
                packageName = smsPkg,
                intentAction = Intent.ACTION_SENDTO,
                intentUri = "smsto:"
            )
        )

        // 3. Navegador Web
        val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com"))
        val browserResolve = pm.resolveActivity(browserIntent, PackageManager.MATCH_DEFAULT_ONLY)
        val browserPkg = browserResolve?.activityInfo?.packageName ?: findFallbackPackage(
            pm, listOf("com.android.chrome", "org.mozilla.firefox", "com.sec.android.app.sbrowser")
        )
        items.add(
            AppDockItem(
                id = "browser",
                label = "Navegador",
                packageName = browserPkg,
                intentAction = Intent.ACTION_VIEW,
                intentUri = "https://www.google.com"
            )
        )

        // 4. Câmera
        val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        val cameraResolve = pm.resolveActivity(cameraIntent, PackageManager.MATCH_DEFAULT_ONLY)
        val cameraPkg = cameraResolve?.activityInfo?.packageName ?: findFallbackPackage(
            pm, listOf("com.google.android.GoogleCamera", "com.sec.android.app.camera", "com.android.camera")
        )
        items.add(
            AppDockItem(
                id = "camera",
                label = "Câmera",
                packageName = cameraPkg,
                intentAction = MediaStore.ACTION_IMAGE_CAPTURE
            )
        )

        return items
    }

    private fun findFallbackPackage(pm: PackageManager, candidatePackages: List<String>): String {
        for (pkg in candidatePackages) {
            try {
                pm.getPackageInfo(pkg, 0)
                return pkg
            } catch (e: Exception) {
                // not found, try next
            }
        }
        return candidatePackages.first()
    }
}
