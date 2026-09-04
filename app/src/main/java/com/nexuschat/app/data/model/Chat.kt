package com.nexuschat.app.data.model

data class Chat(
    val id: String = "",
    val name: String = "",
    val isGroup: Boolean = false,
    val participants: List<String> = emptyList(),
    val participantDetails: Map<String, User> = emptyMap(),
    val lastMessage: String = "",
    val lastMessageSender: String = "",
    val lastMessageTime: Long = System.currentTimeMillis(),
    val unreadCount: Int = 0,
    val avatar: String = ""
)
