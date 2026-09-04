package com.nexuschat.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = NexusPrimary,
    onPrimary = NexusTextPrimary,
    primaryContainer = NexusSurfaceElevated,
    onPrimaryContainer = NexusPrimaryLight,
    secondary = NexusSecondary,
    onSecondary = NexusBackground,
    background = NexusBackground,
    onBackground = NexusTextPrimary,
    surface = NexusSurface,
    onSurface = NexusTextPrimary,
    surfaceVariant = NexusSurfaceElevated,
    onSurfaceVariant = NexusTextSecondary,
    outline = NexusBorder,
    error = NexusDestructive
)

@Composable
fun NexusAppTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
