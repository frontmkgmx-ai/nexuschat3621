package com.nexuschat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.nexuschat.app.ui.theme.*
import com.nexuschat.app.viewmodel.CallViewModel
import org.webrtc.SurfaceViewRenderer

@Composable
fun CallScreen(
    callId: String,
    isVideo: Boolean,
    callerName: String,
    callViewModel: CallViewModel,
    onEndCall: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isAudioMuted by callViewModel.isAudioMuted.collectAsState()
    val isVideoMuted by callViewModel.isVideoMuted.collectAsState()

    var remoteSurfaceView by remember { mutableStateOf<SurfaceViewRenderer?>(null) }
    var localSurfaceView by remember { mutableStateOf<SurfaceViewRenderer?>(null) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(NexusBackground)
    ) {
        if (isVideo && !isVideoMuted) {
            // Remote Video Surface
            AndroidView(
                factory = { context ->
                    SurfaceViewRenderer(context).apply {
                        remoteSurfaceView = this
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // Local Video Floating Thumbnail
            Box(
                modifier = Modifier
                    .size(110.dp, 160.dp)
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
                    .clip(CircleShape)
                    .background(Color.Black)
            ) {
                AndroidView(
                    factory = { context ->
                        SurfaceViewRenderer(context).apply {
                            localSurfaceView = this
                            setZOrderMediaOverlay(true)
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        } else {
            // Audio Call Mode Display
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 120.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(110.dp)
                        .clip(CircleShape)
                        .background(NexusPrimary),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = callerName.take(1).uppercase(),
                        color = Color.White,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = callerName,
                    color = NexusTextPrimary,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = if (isVideo) "Chamada de vídeo Nexus" else "Chamada de áudio Nexus",
                    color = NexusTextSecondary,
                    fontSize = 15.sp
                )
            }
        }

        // Call Control Bar
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 48.dp, start = 24.dp, end = 24.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Mute Button
            IconButton(
                onClick = { callViewModel.toggleAudio() },
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(if (isAudioMuted) NexusDestructive else NexusSurfaceElevated)
            ) {
                Icon(
                    imageVector = if (isAudioMuted) Icons.Default.MicOff else Icons.Default.Mic,
                    contentDescription = "Mudo",
                    tint = Color.White
                )
            }

            // End Call Button
            IconButton(
                onClick = {
                    callViewModel.endCall()
                    onEndCall()
                },
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(NexusDestructive)
            ) {
                Icon(
                    imageVector = Icons.Default.CallEnd,
                    contentDescription = "Encerrar",
                    tint = Color.White,
                    modifier = Modifier.size(32.dp)
                )
            }

            // Switch Camera or Toggle Video
            if (isVideo) {
                IconButton(
                    onClick = { callViewModel.switchCamera() },
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(NexusSurfaceElevated)
                ) {
                    Icon(
                        imageVector = Icons.Default.Cameraswitch,
                        contentDescription = "Alternar Câmera",
                        tint = Color.White
                    )
                }
            } else {
                IconButton(
                    onClick = { callViewModel.toggleVideo() },
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(NexusSurfaceElevated)
                ) {
                    Icon(
                        imageVector = Icons.Default.Videocam,
                        contentDescription = "Vídeo",
                        tint = Color.White
                    )
                }
            }
        }
    }
}
