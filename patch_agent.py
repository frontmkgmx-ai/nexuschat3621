"""Reapplies the Nexus Agent safety/UI patch after upstream GitHub updates.

This script is intentionally conservative: it never adds provider API keys,
never changes the APK, and never invents a LiveKit voice mapping. The TTS
model/voice can be supplied by environment after confirming the LiveKit catalog.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

AGENT = Path("meu-agente/src/agent.py")
if not AGENT.exists():
    raise SystemExit(f"Missing {AGENT}; run this script from the repository root")

content = AGENT.read_text(encoding="utf-8")

# Never reintroduce the retired/unsupported ElevenLabs Inference model.
if "model=\"elevenlabs/eleven_multilingual_v2\"" in content:
    model = os.getenv("LIVEKIT_TTS_MODEL", "cartesia/sonic-3.5")
    content = content.replace(
        'model="elevenlabs/eleven_multilingual_v2"',
        f'model="{model}"',
    )
    print(f"Updated unsupported TTS model to {model!r}")

# Keep a catalog-provided voice if present. Only inject an environment-driven
# value when the old code has no voice field; the catalog mapping is external.
if "voice=" not in content:
    voice = os.getenv("LIVEKIT_TTS_VOICE", "")
    if voice:
        content = re.sub(
            r'(tts=inference\.TTS\(\s*model=.*?\n)',
            r'\1            voice="' + voice + r'",\n',
            content,
            count=1,
        )

required_tools = ("open_navigation", "collect_contact_form", "request_confirmation")
missing = [name for name in required_tools if f"def {name}(" not in content]
if missing:
    raise SystemExit(
        "Refusing to overwrite agent tools after upstream update; missing: "
        + ", ".join(missing)
        + ". Reapply the tools manually from the reviewed commit."
    )

AGENT.write_text(content, encoding="utf-8")
print("Nexus Agent patch verified: tools preserved; no APK changes made.")
