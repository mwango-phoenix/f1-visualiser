# config.py
# App-wide constants live here

OPENF1_BASE_URL = "https://api.openf1.org/v1"

# How densely we sample position data (samples per real second).
DEFAULT_RESAMPLE_HZ = 10

# How many seconds per lap to allow as a fallback.
FALLBACK_LAP_DURATION_SECONDS = 100

# Shown when OpenF1 returns no team_colour for a driver.
FALLBACK_COLORS = [
    "#FF4444", "#44AAFF", "#44FF88", "#FFD700",
    "#FF8C00", "#DA70D6", "#00CED1", "#FF69B4",
]