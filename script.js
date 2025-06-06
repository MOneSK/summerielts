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
    const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // --- Helper Functions ---
    const getYYYYMMDD = date => date.toISOString().split('T')[0];
    const saveData = () => localStorage.setItem('ieltsWorkoutData', JSON.stringify(workoutData));
    const loadData = () => workoutData = JSON.parse(localStorage.getItem('ieltsWorkoutData') || '{}');

    // --- UPDATED Custom Notification Function ---
    function showNotification(message) {
        clearTimeout(notificationTimeout);
        
        notificationMessage.textContent = message;
        
        const timerLine = notification.querySelector('.notification-timer-line');
        
        // Remove and re-add the 'running' class to restart the animation
        timerLine.classList.remove('running');
        void timerLine.offsetWidth; // This is a trick to force the browser to reflow the element
        timerLine.classList.add('running');
        
        notification.classList.remove('hidden');

        notificationTimeout = setTimeout(() => {
            notification.classList.add('hidden');
        }, 15000); // 15 seconds
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
        const streakText = currentStreak === 1 ? `🔥 1 Day Streak` : `🔥 ${currentStreak} Days Streak`;
        streakCounterDiv.innerHTML = streakText;
        if (window.runEmojiReplacer) window.runEmojiReplacer(streakCounterDiv);
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
                showNotification(`Hey man it's ${dayMapping[today.getDay()]}!!!`);
                return;
            }
            if (box.classList.contains('checked')) return;
            box.classList.add('checked');
            if (tickSound) {
                const playPromise = tickSound.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => tickSound.currentTime = 0).catch(err => console.error("Audio playback error:", err));
                }
            }
            workoutData[rowDateString] = true;
            saveData();
            calculateStreak();
        });
    });

    // --- Audio Recorder Logic (remains unchanged) ---
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
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
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
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            btn.disabled = true;
            btn.closest('.day-card').querySelector('.record-btn').disabled = false;
        });
    });
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const day = btn.closest('.day-card').querySelector('.record-btn').dataset.day;
            const today = new Date();
            const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            const filename = `${day}-${dateString}.wav`;
            const a = document.createElement("a");
            a.href = audioUrl; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
        });
    });

    // --- Initial Load ---
    loadData();
    updateUI();
});
