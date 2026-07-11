document.addEventListener("DOMContentLoaded", () => {
    // ── Global Audio Variables ──────────────────────────────────────────
    let audioCtx = null;
    let sourceNode = null;
    let gainNode = null;
    let currentNoiseType = 'brown';
    let isRunning = false;
    let intervalId = null;
    let totalSeconds = 300;
    let remainingSeconds = 0;

    // ── Media Session (Lock Screen Support) ─────────────────────────────
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Breathing Session',
            artist: 'Breathing Bot',
            album: 'Wellness'
        });
        navigator.mediaSession.setActionHandler('play', () => {});
        navigator.mediaSession.setActionHandler('pause', () => {});
    }

    // ── 2. Initialize UI ──────────────────────────────────────────────────
    updateDisplay(totalSeconds);
    const defaultChip = document.querySelector('[data-noise="brown"]');
    if (defaultChip) defaultChip.classList.add('active');

    // ── 3. Generators ─────────────────────────────────────────────────────
    function normalize(data) {
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
        const scale = 0.1 / peak;
        for (let i = 0; i < data.length; i++) data[i] *= scale;
        return data;
    }

    function buildNoiseBuffer(ctx, type) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (type === 'white') {
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        } else if (type === 'brown') {
            let lastOut = 0.0;
            for (let i = 0; i < data.length; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
            }
        } else if (type === 'pink') {
            let b0 = 0,
                b1 = 0,
                b2 = 0,
                b3 = 0,
                b4 = 0,
                b5 = 0,
                b6 = 0;
            for (let i = 0; i < data.length; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                b6 = white * 0.115926;
            }
        }
        normalize(data);
        return buffer;
    }

    // ── 4. Audio Engine ───────────────────────────────────────────────────
    function startAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 3);

        sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = buildNoiseBuffer(audioCtx, currentNoiseType);
        sourceNode.loop = true;

        const lpf = audioCtx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.value = (currentNoiseType === 'brown') ? 400 : (currentNoiseType === 'pink' ? 1500 : 3000);

        sourceNode.connect(lpf);
        lpf.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        sourceNode.start(0);
    }

    function playEndingTing() {
        if (!audioCtx) return;
        
        // Ensure the context is running
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        
        g.gain.setValueAtTime(0.1, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
        
        osc.connect(g);
        g.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    }

    // ── 5. UI Handlers ────────────────────────────────────────────────────
    const noiseChips = document.querySelectorAll('.noise-chip');
    const timeChips = document.querySelectorAll('.time-chip');
    const startBtn = document.getElementById('start-meditation-btn');
    const stopBtn = document.getElementById('stop-meditation-btn');

    noiseChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (isRunning) return;
            noiseChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentNoiseType = chip.getAttribute('data-noise');
        });
    });

    timeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            if (isRunning) return;

            // Clear the custom input field so it doesn't conflict
            const customInput = document.getElementById(
                'custom-minutes-input');
            customInput.value = '';

            timeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            totalSeconds = parseInt(chip.getAttribute('data-minutes'), 10) *
                60;
            updateDisplay(totalSeconds);
        });
    });

    function updateDisplay(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        const display = document.getElementById('meditation-timer');
        if (display) display.textContent = `${m}:${s}`;
    }

    function startSession() {
        const customInput = document.getElementById('custom-minutes-input');
        const customVal = parseInt(customInput.value, 10);

        // 1. Set the duration
        if (!isNaN(customVal) && customVal >= 1 && customVal <= 120) {
            totalSeconds = customVal * 60;
        }

        // 2. Safety check: If totalSeconds is still <= 0, do not start
        if (totalSeconds <= 0) {
            console.error("Timer duration is invalid:", totalSeconds);
            return;
        }

        if (isRunning) return;

        // 3. Reset state
        isRunning = true;
        startBtn.disabled = true;
        remainingSeconds = totalSeconds; // Explicit assignment
        
        console.log("Starting session. Duration:", remainingSeconds, "seconds");

        updateDisplay(remainingSeconds);
        startBtn?.classList.add('d-none');
        stopBtn?.classList.remove('d-none');

        startAudio();

        // 4. Start interval
        intervalId = setInterval(() => {
            remainingSeconds--;
            updateDisplay(remainingSeconds);
            
            if (remainingSeconds <= 0) {
                console.log("Timer hit zero. Ending session...");
                endSession(true); 
            }
        }, 1000);
    }

    // ── 1. New Helper: Session Logger ─────────────────────────────────────
    function logSession(durationInSeconds) {
        const minutes = Math.round(durationInSeconds / 60);
        fetch('/api/log-session/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')
                    ?.value
            },
            body: JSON.stringify({
                technique_name: `${currentNoiseType.charAt(0).toUpperCase() + currentNoiseType.slice(1)} Noise`,
                level_selected: 1, // Defaulting to 1 for meditation room
                cycles_completed: 0, // Not applicable for noise
                minutes_meditated: minutes,
            })
        }).catch(e => console.warn('Session log failed:', e));
    }

    // ── 2. Updated End Session ────────────────────────────────────────────
    function endSession(isAutomatic = false) {
        clearInterval(intervalId);

        // Only log the session if it finished naturally
        if (isAutomatic) {
            logSession(totalSeconds);
            playEndingTing(); // Keep your "ting" here
        }

        // UI Cleanup (happens whether manual or automatic)
        isRunning = false;
        if (gainNode) {
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
            setTimeout(() => {
                sourceNode?.stop();
                sourceNode?.disconnect();
                gainNode?.disconnect();
                sourceNode = null;
            }, 2100);
        }
        
        startBtn?.classList.remove('d-none');
        stopBtn?.classList.add('d-none');
        startBtn.disabled = false;
        updateDisplay(totalSeconds);
    }

    startBtn?.addEventListener('click', startSession);
    stopBtn?.addEventListener('click', () => endSession(false));
});
