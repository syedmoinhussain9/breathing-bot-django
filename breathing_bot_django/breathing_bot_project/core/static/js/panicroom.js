document.addEventListener("DOMContentLoaded", () => {
    // ── 1. Configuration ───────────────────────────────────────────────────
    const phases = [
        { key: 'Inhale', duration: 6 },
        { key: 'Exhale', duration: 6 },
    ];

    const appContainer = document.getElementById('breathing-app-container');
    const currentLangCode = appContainer?.getAttribute('data-lang') || 'en';
    const staticAudioBase = appContainer?.getAttribute('data-audio-base') || '/static/audio/tts';

    const audioCues = {
        'Inhale': appContainer?.getAttribute('data-txt-inhale') || 'Inhale',
        'Exhale': appContainer?.getAttribute('data-txt-exhale') || 'Exhale',
        'Ended': appContainer?.getAttribute('data-txt-ended') || 'Session has ended',
    };

    // ── 2. DOM Elements ────────────────────────────────────────────────────
    const timerNumber = document.getElementById('countdown-number');
    const stateLabel = document.getElementById('pacing-state-label');
    const actionBtn = document.getElementById('action-trigger-btn');
    const stopBtn = document.getElementById('stop-trigger-btn');
    const breathingRing = document.getElementById('breathing-ring');

    let isRunning = false;
    let currentInterval = null;
    let phaseIndex = 0;
    let currentAudio = null;
    let cycleCount = 0;

    // ── 3-7. Utility Functions (Voice, Audio, Cues) ────────────────────────
    function playCue(key) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        const fileName = key.toLowerCase(); 
        const audioPath = `${staticAudioBase}/${currentLangCode}/${fileName}.mp3`;

        console.log("Attempting to play:", audioPath);

        currentAudio = new Audio(audioPath);
        
        currentAudio.play().catch(error => {
            console.error("Playback failed for:", audioPath, error);
        });
    }

    // ── 8. Session Logger ─────────────────────────────────────────────────
    function logSession(cycles) {
        if (cycles <= 0) return;
        
        // Inside panicroom.js -> logSession function
        // 2 cycles (24s) or 3 cycles (36s) will floor to 0 minutes
        const minutes = Math.floor((phases[0].duration * 2 * cycles) / 60);
        
        fetch('/api/log-session/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: JSON.stringify({
                technique_name: 'Coherent Breathing',
                cycles_completed: cycles,
                minutes_meditated: minutes, // Universal parameter tracked across all rooms
            })
        }).catch(e => console.warn('Session log failed:', e));
    }

    // ── 9. Animations ──────────────────────────────────────────────────────
    function animateRing(phaseKey, durationSeconds) {
        if (!breathingRing) return;
        breathingRing.style.transition = `all ${durationSeconds}s linear`;
        if (phaseKey === 'Inhale') {
            breathingRing.style.width = '220px';
            breathingRing.style.height = '220px';
            breathingRing.style.opacity = '1';
        } else {
            breathingRing.style.width = '80px';
            breathingRing.style.height = '80px';
            breathingRing.style.opacity = '0.5';
        }
    }

    // ── 10. Core Engine ───────────────────────────────────────────────────
    function startPhase(index) {
        const phase = phases[index];
        if (stateLabel) stateLabel.textContent = audioCues[phase.key];
        if (timerNumber) timerNumber.textContent = phase.duration.toString().padStart(2, '0');
        playCue(phase.key);
        animateRing(phase.key, phase.duration);
    }

    function runInterval() {
        let timeLeft = phases[phaseIndex].duration;

        currentInterval = setInterval(() => {
            timeLeft--;
            if (timerNumber) timerNumber.textContent = timeLeft.toString().padStart(2, '0');

            if (timeLeft <= 0) {
                const prevIndex = phaseIndex;
                phaseIndex = (phaseIndex + 1) % phases.length;

                if (phaseIndex === 0 && prevIndex !== 0) cycleCount++;

                startPhase(phaseIndex);
                timeLeft = phases[phaseIndex].duration;
            }
        }, 1000);
    }

    function startPanicSession() {
        if (isRunning) return;
        isRunning = true;
        phaseIndex = 0;
        cycleCount = 0;

        actionBtn?.classList.add('d-none');
        stopBtn?.classList.remove('d-none');

        startPhase(0);
        runInterval();
    }

    // ── 11. Stop Session ───────────────────────────────────────────────────
    function stopSession() {
        clearInterval(currentInterval);
        currentInterval = null;
        isRunning = false;

        if (cycleCount > 0) logSession(cycleCount);

        if (currentAudio) { 
            currentAudio.pause();
            currentAudio.currentTime = 0; 
        }
        
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        } 

        actionBtn?.classList.remove('d-none');
        stopBtn?.classList.add('d-none');

        if (stateLabel) stateLabel.textContent = 'Ready';
        if (timerNumber) timerNumber.textContent = '00';
        
        // Reset the breathing ring animation container safely
        if (breathingRing) {
            breathingRing.style.transition = 'all 0.8s ease';
            breathingRing.style.width = '100px';
            breathingRing.style.height = '100px';
            breathingRing.style.opacity = '1';
        }
    }

    // ── 13. Event Listeners ────────────────────────────────────────────────
    actionBtn?.addEventListener('click', () => {
        actionBtn.disabled = true;
        startPanicSession();
    });

    stopBtn?.addEventListener('click', () => {
        stopSession();
        actionBtn.disabled = false;
    });
});