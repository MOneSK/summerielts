document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const dayRows = document.querySelectorAll('#weekly-recap tbody tr');
    const workoutCards = document.querySelectorAll('.day-card');
    const tickSound = document.getElementById('tick-sound');
    const streakCounterDiv = document.getElementById('streak-counter');
    const notification = document.getElementById('custom-notification');
    const notificationMessage = document.getElementById('notification-message');

    // --- State and Data ---
    let mediaRecorder, audioChunks = [], audioUrl, workoutData = {}, notificationTimeout;
    let audioBlob;
    const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // --- Helper Functions ---
    // NEW: Corrected function that respects local timezone
    function getYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const saveData = () => localStorage.setItem('ieltsWorkoutData', JSON.stringify(workoutData));
    const loadData = () => workoutData = JSON.parse(localStorage.getItem('ieltsWorkoutData') || '{}');

    function runEmojiReplacer(scope) {
        const elements = (scope || document).querySelectorAll('[ms-code-emoji]');
        elements.forEach(element => {
            if (element.querySelector('img')) { return; }
            var imageUrl = element.getAttribute('ms-code-emoji');
            var img = document.createElement('img');
            img.src = imageUrl;
            var textStyle = window.getComputedStyle(element);
            var adjustedHeight = parseFloat(textStyle.fontSize) * 1.2;
            img.style.height = adjustedHeight + 'px';
            img.style.width = 'auto';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '0.2em';
            element.innerHTML = '';
            element.appendChild(img);
        });
    }

    function showNotification(message) {
        clearTimeout(notificationTimeout);
        notificationMessage.textContent = message;
        const timerLine = notification.querySelector('.notification-timer-line');
        timerLine.classList.remove('running');
        void timerLine.offsetWidth;
        timerLine.classList.add('running');
        notification.classList.remove('hidden');
        notificationTimeout = setTimeout(() => {
            notification.classList.add('hidden');
        }, 3500);
    }

    // --- Core Logic ---
    function calculateStreak() {
        let currentStreak = 0;
        let today = new Date();
        if (workoutData[getYYYYMMDD(today)]) {
            for (let i = 0; i < 365 * 5; i++) {
                let dateToCheck = new Date();
                dateToCheck.setDate(today.getDate() - i);
                if (workoutData[getYYYYMMDD(dateToCheck)]) currentStreak++;
                else break;
            }
        }
        const fireImageHTML = `<img src="https://em-content.zobj.net/source/apple/419/fire_1f525.png" style="height: 1.2em; width: auto; vertical-align: middle; margin-right: 0.2em;">`;
        const streakText = currentStreak === 1 ? `${fireImageHTML} 1 Day Streak` : `${fireImageHTML} ${currentStreak} Days Streak`;
        streakCounterDiv.innerHTML = streakText;
    }

    function updateUI() {
        const today = new Date();
        const currentDayIndex = today.getDay();
        dayRows.forEach(row => {
            const rowDayIndex = parseInt(row.dataset.dayIndex, 10);
            let dateForRow = new Date(today);
            dateForRow.setDate(today.getDate() - (currentDayIndex - rowDayIndex));
            const dateKey = getYYYYMMDD(dateForRow);
            row.dataset.date = dateKey;
            const checkbox = row.querySelector('.checkbox');
            checkbox.classList.toggle('checked', !!workoutData[dateKey]);
        });
        const dayName = dayMapping[currentDayIndex].toLowerCase();
        showWorkout(dayName);
        calculateStreak();
    }

    function showWorkout(day) {
        workoutCards.forEach(card => card.classList.add('hidden'));
        dayRows.forEach(row => row.classList.remove('active'));
        const selectedRow = document.querySelector(`tr[data-day="${day}"]`);
        if (selectedRow) selectedRow.classList.add('active');
        const selectedCard = document.getElementById(day + '-card');
        if (selectedCard) selectedCard.classList.remove('hidden');
    }

    // --- Event Handlers ---
    dayRows.forEach(row => {
        row.addEventListener('click', e => {
            if (!e.target.closest('.checkbox')) showWorkout(row.dataset.day);
        });
    });

    document.querySelectorAll('.checkbox').forEach(box => {
        box.addEventListener('click', () => {
            const today = new Date();
            const todayDateString = getYYYYMMDD(today);
            const rowDateString = box.closest('tr').dataset.date;
            if (rowDateString !== todayDateString) {
                const dayName = dayMapping[today.getDay()].toUpperCase();
                const styledDayName = dayName.slice(0, -1) + dayName.slice(-1).repeat(3);
                const message = `HEYYYY MANN, IT'S ${styledDayName}!!!`;
                showNotification(message);
                return;
            }
            if (box.classList.contains('checked')) return;
            box.classList.add('checked');
            if (tickSound) {
                tickSound.play().then(() => tickSound.currentTime = 0).catch(err => console.error(err));
            }
            workoutData[rowDateString] = true;
            saveData();
            calculateStreak();
        });
    });

    // --- Audio Recorder Logic ---
    document.querySelectorAll('.record-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const card = btn.closest('.day-card');
            const stopBtn = card.querySelector('.stop-btn');
            const player = card.querySelector('.audio-player');
            const downloadBtn = card.querySelector('.download-btn');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                audioChunks = [];
                btn.disabled = true;
                stopBtn.disabled = false;
                player.style.display = 'none';
                downloadBtn.disabled = true;
                mediaRecorder.addEventListener("dataavailable", event => audioChunks.push(event.data));
                mediaRecorder.addEventListener("stop", () => {
                    audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    audioUrl = URL.createObjectURL(audioBlob);
                    player.src = audioUrl;
                    player.style.display = 'block';
                    downloadBtn.disabled = false;
                    stream.getTracks().forEach(track => track.stop());
                });
            } catch (err) {
                showNotification("Could not access microphone. Please grant permission.");
                console.error("Mic error:", err);
                btn.disabled = false;
            }
        });
    });

    document.querySelectorAll('.stop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
            btn.disabled = true;
            btn.closest('.day-card').querySelector('.record-btn').disabled = false;
        });
    });
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!audioBlob) return;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = "Encoding to MP3...";
            try {
                const reader = new FileReader();
                reader.readAsArrayBuffer(audioBlob);
                reader.onloadend = () => {
                    const buffer = reader.result;
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    audioCtx.decodeAudioData(buffer, (audioBuffer) => {
                        const pcmData = audioBuffer.getChannelData(0);
                        const sampleRate = audioBuffer.sampleRate;
                        const mp3Encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
                        const samples = new Int16Array(pcmData.length);
                        for (let i = 0; i < pcmData.length; i++) {
                            samples[i] = pcmData[i] * 32767.5;
                        }
                        const mp3Data = [];
                        const sampleBlockSize = 1152;
                        for (let i = 0; i < samples.length; i += sampleBlockSize) {
                            const sampleChunk = samples.subarray(i, i + sampleBlockSize);
                            const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
                            if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
                        }
                        const mp3buf = mp3Encoder.flush();
                        if (mp3buf.length > 0) mp3Data.push(new Int8Array(mp3buf));
                        const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
                        const day = btn.closest('.day-card').querySelector('.record-btn').dataset.day;
                        const today = new Date();
                        const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
                        const filename = `${day}-${dateString}.mp3`;
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(mp3Blob);
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    });
                };
            } catch (err) {
                showNotification("Failed to encode MP3.");
                console.error("MP3 encoding error:", err);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });

    // --- Initial Load ---
    loadData();
    updateUI();
    runEmojiReplacer();
});
