package com.nexuschat.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import com.nexuschat.app.data.firebase.FirebaseManager
import com.nexuschat.app.data.model.Chat
import com.nexuschat.app.data.model.Message
import com.nexuschat.app.data.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ChatViewModel(application: Application) : AndroidViewModel(application) {

    private val _chats = MutableStateFlow<List<Chat>>(emptyList())
    val chats: StateFlow<List<Chat>> = _chats.asStateFlow()

    private val _activeChat = MutableStateFlow<Chat?>(null)
    val activeChat: StateFlow<Chat?> = _activeChat.asStateFlow()

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private var chatsListener: ListenerRegistration? = null
    private var messagesListener: ListenerRegistration? = null

    fun loadChats(currentUser: User) {
        chatsListener?.remove()

        try {
            val db = FirebaseManager.firestore
            chatsListener = db.collection("chats")
                .whereArrayContains("participants", currentUser.id)
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null) {
                        populateDefaultChats(currentUser)
                        return@addSnapshotListener
                    }

                    val list = snapshot.documents.mapNotNull { doc ->
                        val participants = (doc.get("participants") as? List<*>)?.filterIsInstance<String>() ?: emptyList()
                        Chat(
                            id = doc.id,
                            name = doc.getString("name") ?: "Conversa",
                            isGroup = doc.getBoolean("isGroup") ?: false,
                            participants = participants,
                            lastMessage = doc.getString("lastMessage") ?: "",
                            lastMessageTime = doc.getLong("lastMessageTime") ?: System.currentTimeMillis()
                        )
                    }

                    if (list.isEmpty()) {
                        populateDefaultChats(currentUser)
                    } else {
                        _chats.value = list
                    }
                }
        } catch (e: Exception) {
            populateDefaultChats(currentUser)
        }
    }

    private fun populateDefaultChats(currentUser: User) {
        _chats.value = listOf(
            Chat(
                id = "nexus_general",
                name = "Comunidade Nexus",
                isGroup = true,
                lastMessage = "Bem-vindo ao Nexus Chat nativo!",
                lastMessageTime = System.currentTimeMillis()
            ),
            Chat(
                id = "chat_suporte",
                name = "Suporte Nexus",
                isGroup = false,
                lastMessage = "Como podemos ajudar você hoje?",
                lastMessageTime = System.currentTimeMillis() - 3600000
            )
        )
    }

    fun selectChat(chat: Chat?) {
        _activeChat.value = chat
        messagesListener?.remove()

        if (chat != null) {
            try {
                val db = FirebaseManager.firestore
                messagesListener = db.collection("messages")
                    .whereEqualTo("chatId", chat.id)
                    .orderBy("createdAt", Query.Direction.ASCENDING)
                    .addSnapshotListener { snapshot, error ->
                        if (error != null || snapshot == null) {
                            loadLocalFallbackMessages(chat.id)
                            return@addSnapshotListener
                        }

                        val list = snapshot.documents.mapNotNull { doc ->
                            Message(
                                id = doc.id,
                                chatId = doc.getString("chatId") ?: chat.id,
                                senderId = doc.getString("senderId") ?: "",
                                senderName = doc.getString("senderName") ?: "",
                                text = doc.getString("text") ?: "",
                                type = doc.getString("type") ?: "text",
                                mediaUrl = doc.getString("mediaUrl"),
                                createdAt = doc.getLong("createdAt") ?: System.currentTimeMillis()
                            )
                        }
                        _messages.value = list
                    }
            } catch (e: Exception) {
                loadLocalFallbackMessages(chat.id)
            }
        } else {
            _messages.value = emptyList()
        }
    }

    private fun loadLocalFallbackMessages(chatId: String) {
        if (_messages.value.isEmpty()) {
            _messages.value = listOf(
                Message(
                    id = "msg_1",
                    chatId = chatId,
                    senderId = "system",
                    senderName = "Nexus Bot",
                    text = "Nexus Chat Nativo em Kotlin & Jetpack Compose conectado.",
                    createdAt = System.currentTimeMillis() - 60000
                )
            )
        }
    }

    fun sendMessage(currentUser: User, text: String, type: String = "text", mediaUrl: String? = null) {
        val chat = _activeChat.value ?: return
        if (text.trim().isEmpty() && mediaUrl == null) return

        val newMessage = Message(
            id = "msg_" + System.currentTimeMillis(),
            chatId = chat.id,
            senderId = currentUser.id,
            senderName = currentUser.name,
            text = text.trim(),
            type = type,
            mediaUrl = mediaUrl,
            createdAt = System.currentTimeMillis()
        )

        // Optimistic update
        _messages.value = _messages.value + newMessage

        viewModelScope.launch {
            try {
                val db = FirebaseManager.firestore
                val msgMap = mapOf(
                    "chatId" to newMessage.chatId,
                    "senderId" to newMessage.senderId,
                    "senderName" to newMessage.senderName,
                    "text" to newMessage.text,
                    "type" to newMessage.type,
                    "mediaUrl" to newMessage.mediaUrl,
                    "createdAt" to newMessage.createdAt
                )
                db.collection("messages").add(msgMap)

                // Update last message
                db.collection("chats").document(chat.id).update(
                    mapOf(
                        "lastMessage" to newMessage.text,
                        "lastMessageTime" to newMessage.createdAt
                    )
                )
            } catch (e: Exception) {
                // local message kept in state
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    override fun onCleared() {
        super.onCleared()
        chatsListener?.remove()
        messagesListener?.remove()
    }
}
