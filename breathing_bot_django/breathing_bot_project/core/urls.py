from django.urls import path, include
from django.contrib.auth import views as auth_views
from . import views
from django.views.defaults import page_not_found

app_name = 'core'

urlpatterns = [
    # --- NAVIGATION & DASHBOARD ---
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('profile/', views.ProfileHistoryView.as_view(), name='profile_history'),
    path('profile/update/', views.UpdateProfileView.as_view(), name='update_profile'),
    path('profile/export/', views.ExportSessionsView.as_view(), name='export_sessions'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('logout/', auth_views.LogoutView.as_view(next_page='core:dashboard'), name='logout'),
    path('privacy/', views.PrivacyView.as_view(), name='privacy'),
    path('404-preview/', lambda request: page_not_found(request, None), name='404_preview'),
    path('profile/delete/', views.DeleteAccountView.as_view(), name='delete_account'),

    # --- BREATHING & MEDITATION ROOMS ---
    path('session/', views.SessionView.as_view(), name='session'),
    path('free/', views.FreeBreathingView.as_view(), name='free_breathing'),
    path('meditate/', views.MeditateRoomView.as_view(), name='meditate'),
    path('panicroom/', views.CoherentBreathingView.as_view(), name='panicroom'),

    # --- PASSWORD RESET ---
    path('reset/', auth_views.PasswordResetView.as_view(
        template_name='core/password_reset_form.html',
        email_template_name='core/password_reset_email.html',
        success_url='/reset/done/'
    ), name='password_reset'),
    path('reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='core/password_reset_done.html'
    ), name='password_reset_done'),
    path('reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='core/password_reset_confirm.html',
        success_url='/reset/complete/'
    ), name='password_reset_confirm'),
    path('reset/complete/', auth_views.PasswordResetCompleteView.as_view(
        template_name='core/password_reset_complete.html'
    ), name='password_reset_complete'),

    # --- API & UTILITY ---
    path('api/log-session/', views.LogSessionView.as_view(), name='log_session'),
    path('lang/<str:lang_code>/', views.set_language_preference, name='set_language'),
    path('i18n/', include('django.conf.urls.i18n')),
    path("ads.txt", views.ads_txt_view, name="ads_txt"),
]
 