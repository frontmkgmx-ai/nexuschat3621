package com.nexuschat.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nexuschat.app.data.model.Chat
import com.nexuschat.app.data.model.User
import com.nexuschat.app.data.utils.AppDockItem
import com.nexuschat.app.data.utils.DefaultAppsResolver
import com.nexuschat.app.ui.theme.*
import com.nexuschat.app.viewmodel.ChatViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    currentUser: User,
    chatViewModel: ChatViewModel,
    onSelectChat: (Chat) -> Unit,
    onStartCall: (callId: String, isVideo: Boolean) -> Unit,
    onOpenProfile: () -> Unit,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val chats by chatViewModel.chats.collectAsState()
    val searchQuery by chatViewModel.searchQuery.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    // Dock default apps persistence
    val dockApps = remember { DefaultAppsResolver.resolveDefaultApps(context) }

    LaunchedEffect(currentUser) {
        chatViewModel.loadChats(currentUser)
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = NexusSurface,
                modifier = Modifier.width(300.dp)
            ) {
                // User Profile Header in Drawer
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                colors = listOf(NexusPrimaryDark, NexusSurfaceElevated)
                            )
                        )
                        .padding(24.dp)
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(NexusPrimary),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = currentUser.name.take(1).uppercase(),
                                color = Color.White,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Text(
                            text = currentUser.name,
                            color = NexusTextPrimary,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "@${currentUser.username}",
                            color = NexusTextSecondary,
                            fontSize = 14.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                NavigationDrawerItem(
                    label = { Text("Conversas") },
                    selected = selectedTab == 0,
                    onClick = {
                        selectedTab = 0
                        scope.launch { drawerState.close() }
                    },
                    icon = { Icon(Icons.Default.Chat, contentDescription = null) },
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = NexusSurfaceElevated,
                        selectedTextColor = NexusPrimaryLight,
                        unselectedTextColor = NexusTextPrimary,
                        selectedIconColor = NexusPrimaryLight,
                        unselectedIconColor = NexusTextSecondary
                    ),
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                NavigationDrawerItem(
                    label = { Text("Comunidades") },
                    selected = selectedTab == 1,
                    onClick = {
                        selectedTab = 1
                        scope.launch { drawerState.close() }
                    },
                    icon = { Icon(Icons.Default.Groups, contentDescription = null) },
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = NexusSurfaceElevated,
                        selectedTextColor = NexusPrimaryLight,
                        unselectedTextColor = NexusTextPrimary,
                        selectedIconColor = NexusPrimaryLight,
                        unselectedIconColor = NexusTextSecondary
                    ),
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                NavigationDrawerItem(
                    label = { Text("Meu Perfil") },
                    selected = false,
                    onClick = {
                        scope.launch { drawerState.close() }
                        onOpenProfile()
                    },
                    icon = { Icon(Icons.Default.Person, contentDescription = null) },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedTextColor = NexusTextPrimary,
                        unselectedIconColor = NexusTextSecondary
                    ),
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                Spacer(modifier = Modifier.weight(1f))

                Divider(color = NexusBorder)

                NavigationDrawerItem(
                    label = { Text("Sair da Conta") },
                    selected = false,
                    onClick = {
                        scope.launch { drawerState.close() }
                        onLogout()
                    },
                    icon = { Icon(Icons.Default.Logout, contentDescription = null, tint = NexusDestructive) },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedTextColor = NexusDestructive,
                        unselectedIconColor = NexusDestructive
                    ),
                    modifier = Modifier.padding(12.dp)
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = "Nexus Chat",
                            color = NexusTextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu", tint = NexusTextPrimary)
                        }
                    },
                    actions = {
                        IconButton(onClick = { onStartCall("nexus_room_${System.currentTimeMillis()}", false) }) {
                            Icon(Icons.Default.Call, contentDescription = "Chamada de Voz", tint = NexusPrimaryLight)
                        }
                        IconButton(onClick = { onStartCall("nexus_room_${System.currentTimeMillis()}", true) }) {
                            Icon(Icons.Default.VideoCall, contentDescription = "Chamada de Vídeo", tint = NexusSecondary)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = NexusSurface)
                )
            },
            bottomBar = {
                // Persistent DockBar (Essential default apps dock)
                DockBar(dockApps = dockApps)
            },
            containerColor = NexusBackground
        ) { paddingValues ->
            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Search Field
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { chatViewModel.updateSearchQuery(it) },
                    placeholder = { Text("Buscar conversas ou contatos...", color = NexusTextMuted) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = NexusTextMuted) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { chatViewModel.updateSearchQuery("") }) {
                                Icon(Icons.Default.Close, contentDescription = null, tint = NexusTextMuted)
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = NexusSurfaceElevated,
                        unfocusedContainerColor = NexusSurface,
                        focusedBorderColor = NexusPrimary,
                        unfocusedBorderColor = NexusBorder,
                        focusedTextColor = NexusTextPrimary,
                        unfocusedTextColor = NexusTextPrimary
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )

                // Tabs
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = NexusSurface,
                    contentColor = NexusPrimaryLight,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = NexusPrimary
                        )
                    }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Conversas") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Comunidades") }
                    )
                }

                // Chat List
                val filteredChats = chats.filter {
                    it.name.contains(searchQuery, ignoreCase = true) ||
                    it.lastMessage.contains(searchQuery, ignoreCase = true)
                }

                if (filteredChats.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .weight(1f),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.ChatBubbleOutline,
                                contentDescription = null,
                                tint = NexusTextMuted,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Nenhuma conversa encontrada",
                                color = NexusTextMuted,
                                fontSize = 15.sp
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                    ) {
                        items(filteredChats, key = { it.id }) { chat ->
                            ChatItemRow(
                                chat = chat,
                                onClick = { onSelectChat(chat) }
                            )
                            Divider(color = NexusBorder.copy(alpha = 0.5f), thickness = 0.5.dp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChatItemRow(
    chat: Chat,
    onClick: () -> Unit
) {
    val timeFormat = remember { SimpleDateFormat("HH:mm", Locale.getDefault()) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(CircleShape)
                .background(if (chat.isGroup) NexusSecondary else NexusPrimary),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = if (chat.isGroup) Icons.Default.Groups else Icons.Default.Person,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(26.dp)
            )
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = chat.name,
                    color = NexusTextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )

                Text(
                    text = timeFormat.format(Date(chat.lastMessageTime)),
                    color = NexusTextMuted,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = chat.lastMessage.ifEmpty { "Inicie uma conversa..." },
                color = NexusTextSecondary,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun DockBar(dockApps: List<AppDockItem>) {
    val context = LocalContext.current

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        color = NexusSurfaceElevated,
        shape = RoundedCornerShape(20.dp),
        tonalElevation = 6.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, NexusBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            dockApps.forEach { item ->
                DockIconItem(
                    item = item,
                    onClick = {
                        try {
                            val intent = if (item.intentUri != null) {
                                Intent(item.intentAction ?: Intent.ACTION_VIEW, Uri.parse(item.intentUri))
                            } else if (item.intentAction != null) {
                                Intent(item.intentAction)
                            } else {
                                context.packageManager.getLaunchIntentForPackage(item.packageName)
                            }
                            intent?.let { context.startActivity(it) }
                        } catch (e: Exception) {
                            // Launch fallback or ignore if package not found
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun DockIconItem(
    item: AppDockItem,
    onClick: () -> Unit
) {
    val icon: ImageVector = when (item.id) {
        "phone" -> Icons.Default.Phone
        "messages" -> Icons.Default.ChatBubble
        "browser" -> Icons.Default.Language
        "camera" -> Icons.Default.PhotoCamera
        else -> Icons.Default.Apps
    }

    val iconColor = when (item.id) {
        "phone" -> NexusOnlineGreen
        "messages" -> NexusSecondary
        "browser" -> NexusPrimaryLight
        "camera" -> NexusAccent
        else -> NexusTextPrimary
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(CircleShape)
                .background(iconColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = item.label,
                tint = iconColor,
                modifier = Modifier.size(22.dp)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = item.label,
            color = NexusTextSecondary,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
