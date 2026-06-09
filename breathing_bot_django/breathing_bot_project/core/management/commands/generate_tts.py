import os
from django.core.management.base import BaseCommand
from django.conf import settings
from gtts import gTTS


class Command(BaseCommand):
    help = "Generates fallback audio files for the breathing tracker using server-side TTS."

    def handle(self, *args, **options):
        vocab = {
            'inhale': 'Inhale',
            'hold': 'Hold',
            'exhale': 'Exhale',
            'rest': 'Rest',
            'ended': 'Session has ended'
        }

        # ADDED: Include all your new languages here
        languages = [
            'en', 'bn', 'hi', 'ur', 'es', 'fr', 'de', 'ja', 'ar',
            'pt', 'ru', 'id', 'zh-hans', 'ta', 'te', 'kn', 'ml',
            'gu', 'mr', 'as', 'sv', 'ko', 'vi', 'he'
        ]

        # Maps internal settings codes to target gTTS language engine keys
        # If the key is the same as the language code, no mapping is needed
        gtts_lang_map = {
            'zh-hans': 'zh-cn',
            'ta': 'ta',
            'te': 'te',
            'kn': 'kn',
            'ml': 'ml',
            'gu': 'gu',
            'mr': 'mr',
            'as': 'as',
            'sv': 'sv',
            'ko': 'ko',
            'vi': 'vi',
            'he': 'he',
            'bn': 'bn',
            'ur': 'ur',
            'ar': 'ar'
        }

        base_dir = os.path.join(settings.BASE_DIR, 'core', 'static', 'audio', 'tts')
        self.stdout.write("Generating server-side fallback audio tracks...")

        from django.utils import translation
        from django.utils.translation import gettext as _

        for lang in languages:
            target_lang = gtts_lang_map.get(lang, lang)
            lang_dir = os.path.join(base_dir, lang)
            os.makedirs(lang_dir, exist_ok=True)

            translation.activate(lang)

            for key, default_text in vocab.items():
                translated_text = _(default_text)
                file_path = os.path.join(lang_dir, f"{key}.mp3")

                # Skip if already exists to save time
                if os.path.exists(file_path):
                    continue

                try:
                    tts = gTTS(text=translated_text, lang=target_lang, slow=False)
                    tts.save(file_path)
                    self.stdout.write(f"Success [{lang}]: Saved {key}.mp3 -> '{translated_text}'")
                except Exception as e:
                    self.stderr.write(f"Error generating [{lang}] for '{key}': {e}")

            translation.deactivate()

        self.stdout.write(self.style.SUCCESS("All fallback audio assets compiled successfully!"))
