package com.nexuschat.app.data.model

data class Message(
    val id: String = "",
    val chatId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val text: String = "",
    val type: String = "text", // "text", "image", "audio", "video", "call"
    val mediaUrl: String? = null,
    val audioDuration: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val status: String = "sent" // "sent", "delivered", "read"
)
