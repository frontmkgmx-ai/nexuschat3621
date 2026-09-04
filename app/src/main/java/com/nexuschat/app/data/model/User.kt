package com.nexuschat.app.data.model

data class User(
    val id: String = "",
    val username: String = "",
    val name: String = "",
    val avatar: String = "",
    val status: String = "offline",
    val bio: String = "",
    val phone: String = "",
    val createdAt: Long = System.currentTimeMillis()
)
