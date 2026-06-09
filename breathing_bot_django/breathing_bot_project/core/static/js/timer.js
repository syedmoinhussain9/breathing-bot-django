document.addEventListener("DOMContentLoaded", () => {
    console.log("Timer Engine: Initializing...");

    // ── 1. Data Setup ──────────────────────────────────────────────────────
    const presetsDataEl = document.getElementById('django-presets-data');
    if (!presetsDataEl) return;
    const PRESETS = JSON.parse(presetsDataEl.textContent);

    const appContainer = document.getElementById('breathing-app-container');
    const currentLangCode = appContainer?.getAttribute('data-lang') || 'en';
    const staticAudioBase = appContainer?.getAttribute('data-audio-base') ||
        '/static/audio/tts';

    const audioCues = {
        "Inhale": appContainer?.getAttribute('data-txt-inhale') || "Inhale",
        "Hold": appContainer?.getAttribute('data-txt-hold') || "Hold",
        "Exhale": appContainer?.getAttribute('data-txt-exhale') || "Exhale",
        "Rest": appContainer?.getAttribute('data-txt-rest') || "Rest",
        "Ended": appContainer?.getAttribute('data-txt-ended') || "Session has ended"
    };

    // ── 2. DOM Elements ────────────────────────────────────────────────────
    const form = document.getElementById('breathing-config-form');
    const techniqueSelect = document.getElementById('technique-select');
    const techDescriptionBox = document.getElementById('technique-description-box');
    const levelGroup = document.getElementById('level-selection-group');
    const customSlidersBlock = document.getElementById('custom-sliders-block');
    const stateLabel = document.getElementById('pacing-state-label');
    const timerNumber = document.getElementById('countdown-number');
    const actionBtn = document.getElementById('action-trigger-btn');
    const cycleCountEl = document.getElementById('current-cycle-count');
    const targetCycleEl = document.getElementById('target-cycle-total');
    const breathingRing = document.getElementById('breathing-ring');

    let currentInterval = null;
    let isRunning = false;
    let activeLevel = 1;
    let currentAudio = null;

    // ── 3. Level Button Wiring ─────────────────────────────────────────────
    levelGroup?.querySelectorAll('[data-level]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeLevel = parseInt(btn.getAttribute('data-level'), 10);
            levelGroup.querySelectorAll('[data-level]').forEach(b => b
                .classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ── 4. Custom Sliders Builder ──────────────────────────────────────────
    function buildCustomSliders() {
        if (!customSlidersBlock) return;
        if (customSlidersBlock.querySelector('input[type="range"]')) return;
        const phases = [
            { id: 'custom-inhale', label: audioCues['Inhale'], default: 4 },
            { id: 'custom-hold1', label: audioCues['Hold'], default: 0 },
            { id: 'custom-exhale', label: audioCues['Exhale'], default: 4 },
            { id: 'custom-hold2', label: audioCues['Rest'], default: 0 },
        ];
        customSlidersBlock.innerHTML = phases.map(p => `
            <div class="mb-2">
                <label class="form-label fw-semibold text-secondary small d-flex justify-content-between">
                    <span>${p.label}</span>
                    <span id="${p.id}-display">${p.default}s</span>
                </label>
                <input type="range" class="form-range" id="${p.id}" min="0" max="20" value="${p.default}">
            </div>
        `).join('');
        phases.forEach(p => {
            const slider = document.getElementById(p.id);
            const display = document.getElementById(`${p.id}-display`);
            slider?.addEventListener('input', () => { if (display) display
                    .textContent = `${slider.value}s`; });
        });
    }

    // ── 5. Read Active Settings ────────────────────────────────────────────
    function getActiveSettings() {
        const key = techniqueSelect?.value;
        if (key === 'custom') {
            return [
                parseInt(document.getElementById('custom-inhale')?.value || 4, 10),
                parseInt(document.getElementById('custom-hold1')?.value || 0, 10),
                parseInt(document.getElementById('custom-exhale')?.value || 4, 10),
                parseInt(document.getElementById('custom-hold2')?.value || 0, 10),
            ];
        }
        const preset = PRESETS[key];
        if (!preset?.levels) { console.warn(`Preset "${key}" has no levels.`); return [4, 0,
                4, 0]; }
        const levelData = preset.levels[activeLevel] || preset.levels[String(activeLevel)]
            || preset.levels[1] || preset.levels['1'];
        if (!levelData) { console.warn(
            `Level ${activeLevel} not found in "${key}".`); return [4, 0, 4, 0]; }
        return levelData;
    }

    // ── 6. Language Code Map ───────────────────────────────────────────────
    const LANG_CODE_MAP = {
        'ur': ['ur-PK', 'ur'],
        'ar': ['ar-SA', 'ar-EG', 'ar-AE', 'ar'],
        'bn': ['bn-BD', 'bn-IN', 'bn'],
        'zh-hans': ['zh-CN', 'zh-Hans-CN', 'zh'],
        'hi': ['hi-IN', 'hi'],
        'id': ['id-ID', 'id'],
        'pt': ['pt-BR', 'pt-PT', 'pt'],
        'ru': ['ru-RU', 'ru'],
        'de': ['de-DE', 'de'],
        'es': ['es-ES', 'es-MX', 'es'],
        'fr': ['fr-FR', 'fr'],
        'ja': ['ja-JP', 'ja'],
        'en': ['en-US', 'en-GB', 'en'],
    };

    const AUDIO_CUE_FILES = {
        'Inhale': 'inhale.mp3',
        'Hold': 'hold.mp3',
        'Exhale': 'exhale.mp3',
        'Rest': 'rest.mp3',
        'Ended': 'ended.mp3',
    };

    // ── 7. Voice Resolver ──────────────────────────────────────────────────
    function findBestVoice() {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) return null;
        const candidates = LANG_CODE_MAP[currentLangCode] || [currentLangCode];
        for (const candidate of candidates) {
            const match = voices.find(v => v.lang.toLowerCase() === candidate
        .toLowerCase());
            if (match) return match;
        }
        const base = candidates[candidates.length - 1];
        const prefix = voices.find(v => v.lang.toLowerCase().startsWith(base
    .toLowerCase()));
        if (prefix) return prefix;
        return voices.find(v => v.lang.startsWith('en-'))
            || voices.find(v => v.lang.startsWith('en'))
            || null;
    }

    // ── 8. Audio File Playback ─────────────────────────────────────────────
    function playAudioCue(cueKey, onFallback) {
        const filename = AUDIO_CUE_FILES[cueKey];
        if (!filename) { onFallback(); return; }
        const url = `${staticAudioBase}/${currentLangCode}/${filename}`;
        if (currentAudio) { currentAudio.pause();
            currentAudio.currentTime = 0; }
        currentAudio = new Audio(url);
        currentAudio.onerror = () => { console.warn(`Audio not found: ${url}`);
            onFallback(); };
        currentAudio.play().catch(() => onFallback());
    }

    // ── 9. Web Speech API Cue ─────────────────────────────────────────────
    function speakCue(text) {
        if (!('speechSynthesis' in window) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = (LANG_CODE_MAP[currentLangCode] || [currentLangCode])[0];
        utterance.rate = 0.9;
        const voice = findBestVoice();
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
    }

    // ── 10. Unified Cue Dispatcher ─────────────────────────────────────────
    // MP3-first for all languages; Web Speech API as fallback only
    function playCue(cueKey) {
        playAudioCue(cueKey, () => speakCue(audioCues[cueKey]));
    }

    // ── 11. Session Logger ─────────────────────────────────────────────────
    function logSession(techniqueName, level, cycles, settings) {
        const cycleSeconds = settings.filter(s => s > 0).reduce((a, b) => a + b, 0);
        const minutes = Math.round((cycleSeconds * cycles) / 60) || 1;
        fetch('/api/log-session/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                technique_name: techniqueName,
                level_selected: level,
                cycles_completed: cycles,
                minutes_meditated: minutes,
            })
        }).catch(e => console.warn('Session log failed:', e));
    }

    // ── 12. Breathing Ring Animation ───────────────────────────────────────
    function animateRing(phaseKey, durationSeconds) {
        if (!breathingRing) return;
        if (phaseKey === 'Inhale') {
            breathingRing.style.transition = `all ${durationSeconds}s linear`;
            breathingRing.style.width = '220px';
            breathingRing.style.height = '220px';
            breathingRing.style.opacity = '1';
        } else if (phaseKey === 'Exhale') {
            breathingRing.style.transition = `all ${durationSeconds}s linear`;
            breathingRing.style.width = '80px';
            breathingRing.style.height = '80px';
            breathingRing.style.opacity = '0.5';
        } else {
            breathingRing.style.transition = 'opacity 0.3s ease';
            breathingRing.style.opacity = '0.7';
        }
    }

    function resetRing() {
        if (!breathingRing) return;
        breathingRing.style.transition = 'all 0.8s ease';
        breathingRing.style.width = '100px';
        breathingRing.style.height = '100px';
        breathingRing.style.opacity = '1';
    }

    // ── 13. Core Engine ────────────────────────────────────────────────────
    function runExerciseEngine(settings, targetCycles) {
        const phaseDefinitions = [
            { key: 'Inhale', duration: settings[0] },
            { key: 'Hold', duration: settings[1] },
            { key: 'Exhale', duration: settings[2] },
            { key: 'Rest', duration: settings[3] },
        ].filter(p => p.duration > 0);

        if (phaseDefinitions.length === 0) { console.error("All phases are 0.");
            endSession(); return; }

        let phaseIndex = 0;
        let timeLeft = 0;
        let currentCycle = 1;
        const techniqueName = techniqueSelect?.options[techniqueSelect.selectedIndex]?.text
            || 'Breathing';

        if (cycleCountEl) cycleCountEl.textContent = currentCycle;
        if (targetCycleEl) targetCycleEl.textContent = targetCycles;

        if ('speechSynthesis' in window) {
            const warmup = new SpeechSynthesisUtterance('');
            warmup.volume = 0;
            window.speechSynthesis.speak(warmup);
        }

        function startPhase(index) {
            const phase = phaseDefinitions[index];
            timeLeft = phase.duration;
            if (stateLabel) stateLabel.textContent = audioCues[phase.key];
            if (timerNumber) timerNumber.textContent = timeLeft.toString().padStart(2, '0');
            playCue(phase.key);
            animateRing(phase.key, phase.duration);
        }

        startPhase(0);

        currentInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                phaseIndex++;
                if (phaseIndex >= phaseDefinitions.length) {
                    phaseIndex = 0;
                    currentCycle++;
                    if (currentCycle > targetCycles) {
                        playCue('Ended');
                        logSession(techniqueName, activeLevel, targetCycles,
                            settings);
                        endSession();
                        return;
                    }
                    if (cycleCountEl) cycleCountEl.textContent = currentCycle;
                }
                startPhase(phaseIndex);
            } else {
                if (timerNumber) timerNumber.textContent = timeLeft.toString()
                    .padStart(2, '0');
            }
        }, 1000);
    }

    // ── 14. End / Reset Session ────────────────────────────────────────────
    function endSession() {
        clearInterval(currentInterval);
        currentInterval = null;
        isRunning = false;
        if (currentAudio) { currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null; }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (actionBtn) {
            actionBtn.textContent = "🚀 Initialize Breathing Tracker";
            actionBtn.className = "btn btn-primary w-100 py-2 fw-bold shadow-sm";
        }
        if (stateLabel) stateLabel.textContent = "Ready to Begin";
        if (timerNumber) timerNumber.textContent = "00";
        if (cycleCountEl) cycleCountEl.textContent = '0';
        if (targetCycleEl) targetCycleEl.textContent = '--';
        resetRing();
    }

    // ── 15. UI Sync on Technique Change ────────────────────────────────────
    function syncUIForTechnique() {
        if (!techniqueSelect) return;
        const key = techniqueSelect.value;
        const selectedOption = techniqueSelect.options[techniqueSelect.selectedIndex];
        if (techDescriptionBox && selectedOption) {
            techDescriptionBox.textContent = selectedOption.getAttribute('data-description')
                || '';
        }
        if (key === 'custom') {
            levelGroup?.classList.add('d-none');
            customSlidersBlock?.classList.remove('d-none');
            buildCustomSliders();
        } else {
            levelGroup?.classList.remove('d-none');
            customSlidersBlock?.classList.add('d-none');
        }
    }

    // ── 16. Pre-warm Voice List ────────────────────────────────────────────
    if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.addEventListener('voiceschanged', () => {
            window.speechSynthesis.getVoices();
        });
    }

    // ── 17. Form Submit ────────────────────────────────────────────────────
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isRunning) { endSession(); return; }
        const settings = getActiveSettings();
        const totalCycles = parseInt(document.getElementById('cycles-input')?.value
            || 10, 10);
        if (settings[0] === 0 || settings[2] === 0) {
            alert("Inhale and Exhale durations must be greater than 0.");
            return;
        }
        isRunning = true;
        if (actionBtn) {
            actionBtn.textContent = "🛑 Terminate Current Session";
            actionBtn.className = "btn btn-danger w-100 py-2 fw-bold shadow-sm";
        }
        runExerciseEngine(settings, totalCycles);
    });

    // ── 18. Init ───────────────────────────────────────────────────────────
    techniqueSelect?.addEventListener('change', syncUIForTechnique);
    syncUIForTechnique();
});
