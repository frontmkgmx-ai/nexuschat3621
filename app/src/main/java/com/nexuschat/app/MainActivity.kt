package com.nexuschat.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.nexuschat.app.data.firebase.FirebaseManager
import com.nexuschat.app.data.model.Chat
import com.nexuschat.app.ui.components.ConfirmModal
import com.nexuschat.app.ui.components.UserProfileModal
import com.nexuschat.app.ui.screens.CallScreen
import com.nexuschat.app.ui.screens.ChatScreen
import com.nexuschat.app.ui.screens.HomeScreen
import com.nexuschat.app.ui.screens.LoginScreen
import com.nexuschat.app.ui.theme.NexusAppTheme
import com.nexuschat.app.ui.theme.NexusBackground
import com.nexuschat.app.viewmodel.AuthViewModel
import com.nexuschat.app.viewmodel.CallViewModel
import com.nexuschat.app.viewmodel.ChatViewModel

class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()
    private val chatViewModel: ChatViewModel by viewModels()
    private val callViewModel: CallViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Firebase SDK with application context
        FirebaseManager.init(this)

        setContent {
            NexusAppTheme {
                // Request runtime permissions for Camera and Audio
                val permissionsLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestMultiplePermissions()
                ) { /* permissions granted/denied handled gracefully */ }

                LaunchedEffect(Unit) {
                    val perms = mutableListOf(
                        Manifest.permission.CAMERA,
                        Manifest.permission.RECORD_AUDIO,
                        Manifest.permission.MODIFY_AUDIO_SETTINGS
                    )
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        perms.add(Manifest.permission.POST_NOTIFICATIONS)
                    }
                    permissionsLauncher.launch(perms.toTypedArray())
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = NexusBackground
                ) {
                    NexusAppNavigation(
                        authViewModel = authViewModel,
                        chatViewModel = chatViewModel,
                        callViewModel = callViewModel
                    )
                }
            }
        }
    }
}

@Composable
fun NexusAppNavigation(
    authViewModel: AuthViewModel,
    chatViewModel: ChatViewModel,
    callViewModel: CallViewModel
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val activeChat by chatViewModel.activeChat.collectAsState()
    val activeCall by callViewModel.currentCall.collectAsState()

    var showProfileModal by remember { mutableStateOf(false) }
    var showLogoutConfirm by remember { mutableStateOf(false) }

    when {
        currentUser == null -> {
            LoginScreen(authViewModel = authViewModel)
        }

        activeCall != null -> {
            val call = activeCall!!
            CallScreen(
                callId = call.callId,
                isVideo = call.isVideo,
                callerName = call.callerName,
                callViewModel = callViewModel,
                onEndCall = { callViewModel.endCall() }
            )
        }

        activeChat != null -> {
            ChatScreen(
                chat = activeChat!!,
                currentUser = currentUser!!,
                chatViewModel = chatViewModel,
                onBack = { chatViewModel.selectChat(null) },
                onStartCall = { callId, isVideo ->
                    callViewModel.startCall(
                        callId = callId,
                        userId = currentUser!!.id,
                        targetId = activeChat!!.id,
                        isVideo = isVideo,
                        callerName = currentUser!!.name
                    )
                }
            )
        }

        else -> {
            HomeScreen(
                currentUser = currentUser!!,
                chatViewModel = chatViewModel,
                onSelectChat = { chatViewModel.selectChat(it) },
                onStartCall = { callId, isVideo ->
                    callViewModel.startCall(
                        callId = callId,
                        userId = currentUser!!.id,
                        targetId = "nexus_broadcast",
                        isVideo = isVideo,
                        callerName = currentUser!!.name
                    )
                },
                onOpenProfile = { showProfileModal = true },
                onLogout = { showLogoutConfirm = true }
            )
        }
    }

    if (showProfileModal && currentUser != null) {
        UserProfileModal(
            user = currentUser!!,
            onDismiss = { showProfileModal = false }
        )
    }

    if (showLogoutConfirm) {
        ConfirmModal(
            title = "Sair da Conta",
            message = "Tem certeza que deseja sair da sua conta no Nexus Chat?",
            confirmText = "Sair",
            onConfirm = {
                showLogoutConfirm = false
                authViewModel.logout()
            },
            onDismiss = { showLogoutConfirm = false }
        )
    }
}
