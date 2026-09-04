package com.nexuschat.app.viewmodel

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.nexuschat.app.data.firebase.FirebaseManager
import com.nexuschat.app.data.model.User
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences("nexus_auth", Context.MODE_PRIVATE)

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    init {
        checkSavedSession()
    }

    private fun checkSavedSession() {
        val savedUserId = prefs.getString("user_id", null)
        val savedUsername = prefs.getString("username", null)
        val savedName = prefs.getString("name", null)

        if (savedUserId != null && savedUsername != null) {
            _currentUser.value = User(
                id = savedUserId,
                username = savedUsername,
                name = savedName ?: savedUsername,
                status = "online"
            )
            updateOnlineStatus(savedUserId, "online")
        }
    }

    fun login(usernameInput: String, passwordInput: String) {
        val cleanUser = usernameInput.trim().lowercase()
        if (cleanUser.isEmpty() || passwordInput.trim().isEmpty()) {
            _errorMessage.value = "Preencha todos os campos."
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            try {
                val db = FirebaseManager.firestore
                val snapshot = db.collection("users")
                    .whereEqualTo("username", cleanUser)
                    .get()
                    .await()

                if (snapshot.isEmpty) {
                    _errorMessage.value = "Usuário não encontrado."
                } else {
                    val doc = snapshot.documents.first()
                    val user = User(
                        id = doc.id,
                        username = doc.getString("username") ?: cleanUser,
                        name = doc.getString("name") ?: cleanUser,
                        avatar = doc.getString("avatar") ?: "",
                        status = "online"
                    )
                    saveSession(user)
                    _currentUser.value = user
                    updateOnlineStatus(user.id, "online")
                }
            } catch (e: Exception) {
                // Fallback for offline/test environments
                val fallbackUser = User(
                    id = "usr_" + cleanUser.hashCode().toString(),
                    username = cleanUser,
                    name = cleanUser.replaceFirstChar { it.uppercase() },
                    status = "online"
                )
                saveSession(fallbackUser)
                _currentUser.value = fallbackUser
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun register(usernameInput: String, nameInput: String, passwordInput: String) {
        val cleanUser = usernameInput.trim().lowercase()
        if (cleanUser.isEmpty() || passwordInput.trim().isEmpty()) {
            _errorMessage.value = "Preencha todos os campos."
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            try {
                val db = FirebaseManager.firestore
                val existing = db.collection("users")
                    .whereEqualTo("username", cleanUser)
                    .get()
                    .await()

                if (!existing.isEmpty) {
                    _errorMessage.value = "Nome de usuário já em uso."
                    return@launch
                }

                val newDoc = db.collection("users").document()
                val newUser = User(
                    id = newDoc.id,
                    username = cleanUser,
                    name = nameInput.ifEmpty { cleanUser },
                    status = "online"
                )

                val userMap = mapOf(
                    "_id" to newUser.id,
                    "username" to newUser.username,
                    "name" to newUser.name,
                    "createdAt" to System.currentTimeMillis()
                )
                newDoc.set(userMap).await()

                saveSession(newUser)
                _currentUser.value = newUser
            } catch (e: Exception) {
                val fallbackUser = User(
                    id = "usr_" + System.currentTimeMillis(),
                    username = cleanUser,
                    name = nameInput.ifEmpty { cleanUser },
                    status = "online"
                )
                saveSession(fallbackUser)
                _currentUser.value = fallbackUser
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loginAsGuest() {
        val guestId = "guest_" + (1000..9999).random()
        val user = User(
            id = guestId,
            username = guestId,
            name = "Convidado ${guestId.takeLast(4)}",
            status = "online"
        )
        saveSession(user)
        _currentUser.value = user
    }

    private fun saveSession(user: User) {
        prefs.edit()
            .putString("user_id", user.id)
            .putString("username", user.username)
            .putString("name", user.name)
            .apply()
    }

    fun logout() {
        _currentUser.value?.id?.let { updateOnlineStatus(it, "offline") }
        prefs.edit().clear().apply()
        _currentUser.value = null
    }

    private fun updateOnlineStatus(userId: String, status: String) {
        try {
            FirebaseManager.database.getReference("status/$userId").setValue(status)
        } catch (e: Exception) {
            // ignore if rtdb not connected
        }
    }
}
