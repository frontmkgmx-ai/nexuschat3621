package com.nexuschat.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.nexuschat.app.data.model.Chat
import com.nexuschat.app.data.model.Message
import com.nexuschat.app.data.model.User
import com.nexuschat.app.ui.theme.*
import com.nexuschat.app.viewmodel.ChatViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    chat: Chat,
    currentUser: User,
    chatViewModel: ChatViewModel,
    onBack: () -> Unit,
    onStartCall: (callId: String, isVideo: Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val messages by chatViewModel.messages.collectAsState()
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(if (chat.isGroup) NexusSecondary else NexusPrimary),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (chat.isGroup) Icons.Default.Groups else Icons.Default.Person,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Text(
                                text = chat.name,
                                color = NexusTextPrimary,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = if (chat.isGroup) "grupo" else "online",
                                color = if (chat.isGroup) NexusTextMuted else NexusOnlineGreen,
                                fontSize = 12.sp
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar", tint = NexusTextPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = { onStartCall(chat.id, false) }) {
                        Icon(Icons.Default.Call, contentDescription = "Voz", tint = NexusPrimaryLight)
                    }
                    IconButton(onClick = { onStartCall(chat.id, true) }) {
                        Icon(Icons.Default.VideoCall, contentDescription = "Vídeo", tint = NexusSecondary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NexusSurface)
            )
        },
        bottomBar = {
            ChatInputBar(
                text = inputText,
                onTextChanged = { inputText = it },
                onSend = {
                    if (inputText.isNotBlank()) {
                        chatViewModel.sendMessage(currentUser, inputText)
                        inputText = ""
                    }
                }
            )
        },
        containerColor = NexusBackground
    ) { paddingValues ->
        LazyColumn(
            state = listState,
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(messages, key = { it.id }) { msg ->
                val isMine = msg.senderId == currentUser.id
                MessageBubbleItem(msg = msg, isMine = isMine)
            }
        }
    }
}

@Composable
fun MessageBubbleItem(msg: Message, isMine: Boolean) {
    val timeFormat = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isMine) 16.dp else 4.dp,
                        bottomEnd = if (isMine) 4.dp else 16.dp
                    )
                )
                .background(if (isMine) NexusChatBubbleMine else NexusChatBubbleTheirs)
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            if (!isMine && msg.senderName.isNotEmpty()) {
                Text(
                    text = msg.senderName,
                    color = NexusSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(2.dp))
            }

            Text(
                text = msg.text,
                color = Color.White,
                fontSize = 15.sp
            )

            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.align(Alignment.End),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = timeFormat.format(Date(msg.createdAt)),
                    color = NexusTextSecondary.copy(alpha = 0.7f),
                    fontSize = 10.sp
                )
                if (isMine) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.DoneAll,
                        contentDescription = null,
                        tint = NexusSecondary,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun ChatInputBar(
    text: String,
    onTextChanged: (String) -> Unit,
    onSend: () -> Unit
) {
    Surface(
        color = NexusSurface,
        tonalElevation = 4.dp,
        modifier = Modifier
            .fillMaxWidth()
            .imePadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { /* Media Picker attach */ }) {
                Icon(Icons.Default.AttachFile, contentDescription = "Anexar", tint = NexusTextMuted)
            }

            OutlinedTextField(
                value = text,
                onValueChange = onTextChanged,
                placeholder = { Text("Digite uma mensagem...", color = NexusTextMuted, fontSize = 14.sp) },
                maxLines = 4,
                shape = RoundedCornerShape(24.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = NexusSurfaceElevated,
                    unfocusedContainerColor = NexusSurfaceElevated,
                    focusedBorderColor = NexusPrimary,
                    unfocusedBorderColor = NexusBorder,
                    focusedTextColor = NexusTextPrimary,
                    unfocusedTextColor = NexusTextPrimary
                ),
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 6.dp)
            )

            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(if (text.isNotBlank()) NexusPrimary else NexusSurfaceElevated)
            ) {
                IconButton(onClick = onSend) {
                    Icon(
                        imageVector = if (text.isNotBlank()) Icons.Default.Send else Icons.Default.Mic,
                        contentDescription = "Enviar",
                        tint = if (text.isNotBlank()) Color.White else NexusTextMuted,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}
