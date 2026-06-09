from django.contrib import admin
from .models import Profile, BreathingSession, CustomPreset


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_language', 'total_minutes_meditated')
    search_fields = ('user__username', 'preferred_language')


@admin.register(BreathingSession)
class BreathingSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'technique_name', 'level_selected', 'timestamp')
    list_filter = ('technique_name', 'timestamp')
    search_fields = ('user__username', 'technique_name')


@admin.register(CustomPreset)
class CustomPresetAdmin(admin.ModelAdmin):
    # Standardized fallback fields that exist safely on the relationship model
    list_display = ('id', 'user')
    search_fields = ('user__username',)
