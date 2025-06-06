document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const dayRows = document.querySelectorAll('#weekly-recap tbody tr');
    const workoutCards = document.querySelectorAll('.day-card');
    const tickSound = document.getElementById('tick-sound');
    const streakDisplay = document.getElementById('current-streak');

    // --- State and Data ---
    let mediaRecorder;
    let audioChunks = [];
    let audioUrl;
    let workoutData = {};

    // --- Date Formatting Helper ---
    function getYYYYMMDD(date) {
        return date.toISOString().split('T')[0];
    }

    // --- Data Persistence Functions ---
    function saveData() {
        localStorage.setItem('ieltsWorkoutData', JSON.stringify(workoutData));
    }

    function loadData() {
        const data = localStorage.getItem('ieltsWorkoutData');
        workoutData = data ? JSON.parse(data) : {};
    }

    // --- Streak Calculation ---
    function calculateStreak() {
        let currentStreak = 0;
        let today = new Date();
        
        // If today isn't checked, the streak is 0
        if (!workoutData[getYYYYMMDD(today)]) {
            streakDisplay.textContent = 0;
            return;
        }

        // Loop backwards from today
        for (let i = 0; i < 365; i++) {
            let dateToCheck = new Date();
            dateToCheck.setDate(today.getDate() - i);
            const dateKey = getYYYYMMDD(dateToCheck);

            if (workoutData[dateKey]) {
                currentStreak++;
            } else {
                break; // End of streak
            }
        }
        streakDisplay.textContent = currentStreak;
    }

    // --- UI Update Functions ---
    function updateUI() {
        // Associate dates with each row and update checkboxes
        const today = new Date();
        const currentDayIndex = today.getDay(); // Sunday = 0, Monday = 1...

        dayRows.forEach(row => {
            const rowDayIndex = parseInt(row.dataset.dayIndex, 10);
            let dateForRow = new Date(today);
            dateForRow.setDate(today.getDate() - (currentDayIndex - rowDayIndex));
            
            const dateKey = getYYYYMMDD(dateForRow);
            row.dataset.date = dateKey; // Set data-date attribute

            const checkbox = row.querySelector('.checkbox');
            if (workoutData[dateKey]) {
                checkbox.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
            }
        });

        // Highlight today's card
        const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        showWorkout(dayMapping[currentDayIndex]);
        calculateStreak();
    }

    function showWorkout(day) {
        workoutCards.forEach(card => card.classList.add('hidden'));
        dayRows.forEach(row => row.classList.remove('active'));

        const selectedCard = document.getElementById(day + '-card');
        const selectedRow = document.querySelector(`tr[data-day="${day}"]`);

        if (selectedCard && selectedRow) {
            selectedCard.classList.remove('hidden');
            selectedRow.classList.add('active');
        }
    }

    // --- Event Handlers ---
    // Table Row Click (for navigation)
    dayRows.forEach(row => {
        row.addEventListener('click', (e) => {
            // Navigate only if not clicking the checkbox
            if (!e.target.classList.contains('checkbox')) {
                const day = row.dataset.day;
                showWorkout(day);
            }
        });
    });

    // Checkbox Click
    document.querySelectorAll('.checkbox').forEach(box => {
        box.addEventListener('click', () => {
            box.classList.toggle('checked');
            if (tickSound) {
                tickSound.currentTime = 0;
                tickSound.play();
            }

            const dateKey = box.closest('tr').dataset.date;
            if (box.classList.contains('checked')) {
                workoutData[dateKey] = true;
            } else {
                delete workoutData[dateKey];
            }
            saveData();
            calculateStreak();
        });
    });


    // --- Audio Recorder Logic (remains the same) ---
    document.querySelectorAll('.record-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const card = btn.closest('.day-card');
            const stopBtn = card.querySelector('.stop-btn');
            const player = card.querySelector('.audio-player');
            const downloadBtn = card.querySelector('.download-btn');
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];
            btn.disabled = true;
            stopBtn.disabled = false;
            player.style.display = 'none';
            downloadBtn.disabled = true;

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                audioUrl = URL.createObjectURL(audioBlob);
                player.src = audioUrl;
                player.style.display = 'block';
                downloadBtn.disabled = false;
                stream.getTracks().forEach(track => track.stop());
            });
        });
    });

    document.querySelectorAll('.stop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.day-card');
            const recordBtn = card.querySelector('.record-btn');
            mediaRecorder.stop();
            recordBtn.disabled = false;
            btn.disabled = true;
        });
    });
    
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.day-card');
            const day = card.querySelector('.record-btn').dataset.day;
            const today = new Date();
            const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            const filename = `${day}-${dateString}.wav`;
            const a = document.createElement("a");
            a.href = audioUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });

    // --- Initial Load ---
    loadData();
    updateUI();
});