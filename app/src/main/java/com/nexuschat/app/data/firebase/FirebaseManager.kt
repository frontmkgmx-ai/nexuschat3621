package com.nexuschat.app.data.firebase

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage

object FirebaseManager {
    private var isInitialized = false

    fun init(context: Context) {
        if (isInitialized) return

        try {
            if (FirebaseApp.getApps(context).isEmpty()) {
                val options = FirebaseOptions.Builder()
                    .setProjectId("nexuschat-app")
                    .setApplicationId("com.nexuschat.app")
                    .setApiKey("AIzaSyDummyKeyForNexusAppInit12345678")
                    .setDatabaseUrl("https://nexuschat-default-rtdb.firebaseio.com")
                    .setStorageBucket("nexuschat.appspot.com")
                    .build()
                FirebaseApp.initializeApp(context, options)
            }
            isInitialized = true
        } catch (e: Exception) {
            e.printStackTrace()
            // If already initialized by google-services or fallback, mark true
            isInitialized = FirebaseApp.getApps(context).isNotEmpty()
        }
    }

    val auth: FirebaseAuth get() = FirebaseAuth.getInstance()
    val firestore: FirebaseFirestore get() = FirebaseFirestore.getInstance()
    val database: FirebaseDatabase get() = FirebaseDatabase.getInstance()
    val storage: FirebaseStorage get() = FirebaseStorage.getInstance()
}
