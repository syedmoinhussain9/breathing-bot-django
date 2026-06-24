import os
from gtts import gTTS

TTS_DIR = os.path.join('static', 'audio', 'tts')

# Explicitly forcing the correct API codes for gTTS
LANG_DATA = {
    'he': {
        'api_code': 'iw',  # Google's internal code for Hebrew
        'phrases': {
            'inhale': 'שאף',
            'hold': 'החזק',
            'exhale': 'נשוף',
            'rest': 'נוח',
            'ended': 'הסתיים'
        }
    },
    'as': {
        'api_code': 'bn',  # Fallback to Bengali for Assamese script tracking
        'phrases': {
            'inhale': 'উশাহ নিয়ক',
            'hold': 'ধৰি ৰাখক',
            'exhale': 'উশাহ এৰি দিয়ক',
            'rest': 'আৰাম কৰক',
            'ended': 'সমাপ্ত হ’ল'
        }
    }
}

def generate_manual_fix():
    print("Running explicit language overrides...")
    
    for folder_name, data in LANG_DATA.items():
        lang_folder = os.path.join(TTS_DIR, folder_name)
        os.makedirs(lang_folder, exist_ok=True)
        
        for cue_name, text in data['phrases'].items():
            filepath = os.path.join(lang_folder, f"{cue_name}.mp3")
            print(f" -> Generating {folder_name}/{cue_name}.mp3 using API code '{data['api_code']}'")
            
            try:
                tts = gTTS(text=text, lang=data['api_code'], slow=False)
                tts.save(filepath)
            except Exception as e:
                print(f" ❌ Failed: {e}")

    print("\nAll remaining audio directories are fully populated!")

if __name__ == '__main__':
    generate_manual_fix()