from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

# ─── USER PROFILE (Personalization & Habit Tracking) ───────────────────────────
class Profile(models.Model):
    # Links directly to Django's built-in secure User model (Handles login/auth)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar_url = models.URLField(max_length=500, blank=True, default='')

    # User Preferences
    preferred_language = models.CharField(max_length=10, default='en')
    high_contrast_mode = models.BooleanField(default=False)

    # Habit / Retention Tracking Engine
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)
    total_minutes_meditated = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Profile for {self.user.username}"


# ─── USER SESSIONS (The Historical Log Ledger) ─────────────────────────────────
class BreathingSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='breathing_sessions')
    technique_name = models.CharField(max_length=100)
    level_selected = models.PositiveIntegerField(default=1)
    cycles_completed = models.PositiveIntegerField(default=0)
    # ADD THIS FIELD:
    minutes_meditated = models.PositiveIntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_label = self.user.username if self.user else "Guest"
        return f"{user_label} - {self.technique_name} (Lvl {self.level_selected}) on {self.timestamp.date()}"


# ─── CUSTOM PRESETS (For Logged-In Personalization) ───────────────────────────
class CustomPreset(models.Model):
    # Tie the custom configurations to a specific registered account
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_presets')
    preset_name = models.CharField(max_length=50, default="My Custom Rhythm")

    # Strict bounds matching our physical validation rules
    inhale_duration = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(15)])
    hold1_duration = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(60)])
    exhale_duration = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(15)])
    hold2_duration = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(15)])
    target_cycles = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(50)])

    def __str__(self):
        return f"{self.user.username}'s Preset: {self.preset_name}"
