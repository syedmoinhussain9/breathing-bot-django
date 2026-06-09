import json
import csv
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, login as auth_login
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.views.generic import TemplateView, ListView
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils import translation
from django.utils.translation import gettext as _
from django.utils.translation import get_language
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings
from .models import Profile, BreathingSession, CustomPreset
from .presets import BREATHING_PRESETS
from django.http import HttpResponse


# ─── REGISTRATION FORM ──────────────────────────────────────────────────────────

class RegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta(UserCreationForm.Meta):
        fields = ('username', 'email', 'password1', 'password2')

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user


# ─── REGISTER VIEW ──────────────────────────────────────────────────────────────

class RegisterView(View):
    template_name = 'core/register.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('core:free_breathing')
        return render(request, self.template_name, {'form': RegistrationForm()})

    def post(self, request):
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('core:free_breathing')
        return render(request, self.template_name, {'form': form})


# ─── DASHBOARD (handles login form POST) ────────────────────────────────────────

class DashboardView(View):
    template_name = 'core/dashboard.html'

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('core:free_breathing')
        return render(request, self.template_name)

    def post(self, request):
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            auth_login(request, user)
            return redirect('core:free_breathing')
        return render(request, self.template_name, {'login_error': True})


# ─── BREATHING ENGINE ────────────────────────────────────────────────────────────

class SessionView(TemplateView):
    """The dedicated Breathing Engine room."""
    template_name = 'core/session.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['presets'] = BREATHING_PRESETS
        context['txt_inhale'] = _('Inhale')
        context['txt_hold'] = _('Hold')
        context['txt_exhale'] = _('Exhale')
        context['txt_rest'] = _('Rest')
        context['txt_ended'] = _('Session has ended')
        return context


# ─── NAVIGATION VIEWS ────────────────────────────────────────────────────────────

class FreeBreathingView(LoginRequiredMixin, TemplateView):
    template_name = 'core/free.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['sessions'] = BreathingSession.objects.filter(
            user=self.request.user
        ).order_by('-timestamp')[:10]
        return context


class MeditateRoomView(TemplateView):
    template_name = 'core/meditate.html'


class CoherentBreathingView(TemplateView):
    template_name = 'core/panicroom.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['technique_name'] = "Coherent Breathing"
        context['txt_inhale'] = _('Inhale')
        context['txt_exhale'] = _('Exhale')
        context['txt_ended'] = _('Session has ended')
        return context


class PrivacyView(TemplateView):
    template_name = 'core/privacy.html'


# ─── ASYNC SESSION LOGGER ────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class LogSessionView(View):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            user = request.user if request.user.is_authenticated else None
            technique = data.get('technique_name', 'Custom Routine')
            level = int(data.get('level_selected', 1))
            cycles = int(data.get('cycles_completed', 0))
            minutes = int(data.get('minutes_meditated', 0))

            session = BreathingSession.objects.create(
                user=user,
                technique_name=technique,
                level_selected=level,
                cycles_completed=cycles,
                minutes_meditated=minutes  # This now maps the variable to the model field
            )

            if user:
                profile = user.profile
                profile.total_minutes_meditated += minutes
                profile.save()

            return JsonResponse({'status': 'success', 'session_id': session.id})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except (ValueError, TypeError, KeyError) as err:
            return JsonResponse({'status': 'error', 'message': str(err)}, status=400)
        except Exception:
            return JsonResponse({'status': 'error', 'message': 'Internal server error'}, status=500)


# ─── LANGUAGE SWITCHER ───────────────────────────────────────────────────────────

def set_language_preference(request, lang_code):
    next_url = request.META.get('HTTP_REFERER', '/')
    response = redirect(next_url)

    if lang_code in dict(settings.LANGUAGES):
        translation.activate(lang_code)
        request.session['django_language'] = lang_code

        if request.user.is_authenticated:
            profile, _ = Profile.objects.get_or_create(user=request.user)
            profile.preferred_language = lang_code
            profile.save()

        response.set_cookie(
            settings.LANGUAGE_COOKIE_NAME,
            lang_code,
            max_age=365 * 24 * 60 * 60,
            httponly=True,
            samesite='Lax'
        )

    return response


# ─── PROFILE HISTORY ─────────────────────────────────────────────────────────────

class ProfileHistoryView(LoginRequiredMixin, ListView):
    model = BreathingSession
    template_name = 'core/profile.html'
    context_object_name = 'sessions'
    paginate_by = 15

    def get_queryset(self):
        return BreathingSession.objects.filter(
            user=self.request.user
        ).order_by('-timestamp')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        profile, _ = Profile.objects.get_or_create(user=self.request.user)
        context['profile'] = profile
        context['total_sessions'] = BreathingSession.objects.filter(
            user=self.request.user
        ).count()
        return context


class UpdateProfileView(LoginRequiredMixin, View):
    def post(self, request):
        action = request.POST.get('action')
        if action == 'avatar':
            profile, _ = Profile.objects.get_or_create(user=request.user)
            profile.avatar_url = request.POST.get('avatar_url', '').strip()
            profile.save()
        return redirect('core:profile_history')


class ExportSessionsView(LoginRequiredMixin, View):
    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="breathing_sessions.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Technique', 'Level', 'Cycles Completed'])

        sessions = BreathingSession.objects.filter(
            user=request.user
        ).order_by('-timestamp')

        for s in sessions:
            writer.writerow([
                s.timestamp.strftime('%Y-%m-%d %H:%M'),
                s.technique_name,
                s.level_selected,
                s.cycles_completed,
            ])

        return response
