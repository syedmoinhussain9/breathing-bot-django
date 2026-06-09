# translations.py

translations = {
    "Inhale": {
        "ta": "உள்ளிழு", "te": "పీల్చండి", "kn": "ಉಸಿರು ಒಳಗೆ", "ml": "ശ്വാസം എടുക്കുക",
        "gu": "શ્વાસ લો", "mr": "श्वास घ्या", "as": "উশাহ লওক", "sv": "Andas in",
        "ko": "들이마시세요", "vi": "Hít vào", "he": "שאפו"
    },
    "Exhale": {
        "ta": "வெளியேற்று", "te": "వదలండి", "kn": "ಉಸಿರು ಹೊರಗೆ", "ml": "ശ്വാസം വിടുക",
        "gu": "શ્વાસ છોડો", "mr": "श्वास सोडा", "as": "নিশাহ এৰক", "sv": "Andas ut",
        "ko": "내쉬세요", "vi": "Thở ra", "he": "נשפו"
    },
    "Hold": {
        "ta": "நிறுத்து", "te": "ఆపండి", "kn": "ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳಿ", "ml": "പിടിക്കുക",
        "gu": "રોકો", "mr": "धरून ठेवा", "as": "ধৰি ৰাখক", "sv": "Håll",
        "ko": "멈추세요", "vi": "Giữ", "he": "החזיקו"
    },
    "Rest": {
        "ta": "ஓய்வெடு", "te": "విశ్రాంతి", "kn": "ವಿಶ್ರಮಿಸಿ", "ml": "വിശ്രമിക്കുക",
        "gu": "આરામ કરો", "mr": "विश्रांती घ्या", "as": "জিৰণি লওক", "sv": "Vila",
        "ko": "쉬세요", "vi": "Nghỉ", "he": "לנוח"
    },
    "Session has ended": {
        "ta": "பயிற்சி முடிந்தது", "te": "సెషన్ పూర్తయింది", "kn": "ತರಗತಿ ಮುಗಿಯಿತು", "ml": "സെഷൻ അവസാനിച്ചു",
        "gu": "સત્ર પૂર્ણ થયું", "mr": "सत्र पूर्ण झाले", "as": "অধিবেশন সমাপ্ত হ'ল", "sv": "Sessionen är slut",
        "ko": "세션이 종료되었습니다", "vi": "Phiên đã kết thúc", "he": "המפגש הסתיים"
    },
    "Dashboard": {
        "ta": "கண்ட்ரோல் பேனல்", "te": "డ్యాష్‌బోర్డ్", "kn": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "ml": "ഡാഷ്ബോർഡ്",
        "gu": "ડેશબોર્ડ", "mr": "डॅशबोर्ड", "as": "ডেশ্ব’ৰ্ড", "sv": "Instrumentpanel",
        "ko": "대시보드", "vi": "Bảng điều khiển", "he": "לוח מחוונים"
    },
    "Profile": {
        "ta": "சுயவிவரம்", "te": "ప్రొఫైల్", "kn": "ಪ್ರೊಫೈಲ್", "ml": "പ്രൊഫൈൽ",
        "gu": "પ્રોફાઇલ", "mr": "प्रोफाइल", "as": "প্ৰফাইল", "sv": "Profil",
        "ko": "프로필", "vi": "Hồ sơ", "he": "פרופיל"
    },
    "Settings": {
        "ta": "அமைப்புகள்", "te": "సెట్టింగ్‌లు", "kn": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", "ml": "ക്രമീകരണങ്ങൾ",
        "gu": "સેટિંગ્સ", "mr": "सेटिंग्ज", "as": "ছেটিংছ", "sv": "Inställningar",
        "ko": "설정", "vi": "Cài đặt", "he": "הגדרות"
    }
}

LANGUAGE_CONFIG = {
    'ta': {'native': 'தமிழ்', 'tts_code': 'ta'},
    'te': {'native': 'తెలుగు', 'tts_code': 'te'},
    'kn': {'native': 'ಕನ್ನಡ', 'tts_code': 'kn'},
    'ml': {'native': 'മലയാളம்', 'tts_code': 'ml'},
    'gu': {'native': 'ગુજરાતી', 'tts_code': 'gu'},
    'mr': {'native': 'मराठी', 'tts_code': 'mr'},
    'as': {'native': 'অসমীয়া', 'tts_code': 'as'},
    'sv': {'native': 'Svenska', 'tts_code': 'sv'},
    'ko': {'native': '한국어', 'tts_code': 'ko'},
    'vi': {'native': 'Tiếng Việt', 'tts_code': 'vi'},
    'he': {'native': 'עברית', 'tts_code': 'he'},
}

def get_language_list():
    return [(code, data['native']) for code, data in LANGUAGE_CONFIG.items()]
