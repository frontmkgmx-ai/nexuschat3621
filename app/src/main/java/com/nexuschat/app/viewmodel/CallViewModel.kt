package com.nexuschat.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import com.nexuschat.app.data.model.CallSession
import com.nexuschat.app.data.webrtc.WebRTCClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.webrtc.SurfaceViewRenderer

class CallViewModel(application: Application) : AndroidViewModel(application) {

    private val _currentCall = MutableStateFlow<CallSession?>(null)
    val currentCall: StateFlow<CallSession?> = _currentCall.asStateFlow()

    private var webrtcClient: WebRTCClient? = null

    private val _isAudioMuted = MutableStateFlow(false)
    val isAudioMuted: StateFlow<Boolean> = _isAudioMuted.asStateFlow()

    private val _isVideoMuted = MutableStateFlow(false)
    val isVideoMuted: StateFlow<Boolean> = _isVideoMuted.asStateFlow()

    fun startCall(
        callId: String,
        userId: String,
        targetId: String,
        isVideo: Boolean,
        callerName: String,
        localView: SurfaceViewRenderer? = null,
        remoteView: SurfaceViewRenderer? = null
    ) {
        val session = CallSession(
            callId = callId,
            isVideo = isVideo,
            callerId = userId,
            callerName = callerName,
            status = "connected"
        )
        _currentCall.value = session
        _isVideoMuted.value = !isVideo

        val client = WebRTCClient(
            context = getApplication(),
            callId = callId,
            userId = userId,
            isVideo = isVideo
        )
        webrtcClient = client
        client.initialize(localView, remoteView)
        client.startCall(targetId)
    }

    fun toggleAudio() {
        webrtcClient?.toggleAudio()
        _isAudioMuted.value = !(_isAudioMuted.value)
    }

    fun toggleVideo() {
        webrtcClient?.toggleVideo()
        _isVideoMuted.value = !(_isVideoMuted.value)
    }

    fun switchCamera() {
        webrtcClient?.switchCamera()
    }

    fun endCall() {
        webrtcClient?.endCall()
        webrtcClient = null
        _currentCall.value = null
    }

    override fun onCleared() {
        super.onCleared()
        endCall()
    }
}
