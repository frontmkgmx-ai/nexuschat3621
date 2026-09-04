package com.nexuschat.app.data.model

data class CallSession(
    val callId: String = "",
    val isVideo: Boolean = false,
    val callerId: String = "",
    val callerName: String = "",
    val callerAvatar: String = "",
    val participants: List<String> = emptyList(),
    val isIncoming: Boolean = false,
    val status: String = "initiating" // "ringing", "connected", "ended"
)
