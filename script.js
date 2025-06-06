document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const dayRows = document.querySelectorAll('#weekly-recap tbody tr');
    const workoutCards = document.querySelectorAll('.day-card');
    const tickSound = document.getElementById('tick-sound');
    const streakCounterDiv = document.getElementById('streak-counter');

    // --- State and Data ---
    let mediaRecorder;
    let audioChunks = [];
    let audioUrl;
    let workoutData = {};
    const dayMapping = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


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

    // --- Streak Calculation (with updated text for emoji script) ---
    function calculateStreak() {
        let currentStreak = 0;
        let today = new Date();
        
        if (workoutData[getYYYYMMDD(today)]) {
            for (let i = 0; i < 365 * 5; i++) {
                let dateToCheck = new Date();
                dateToCheck.setDate(today.getDate() - i);
                const dateKey = getYYYYMMDD(dateToCheck);
                if (workoutData[dateKey]) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
        
        // NEW: Generate HTML with the span for the emoji script to target
        let streakText;
        const fireEmojiHTML = `<span ms-code-emoji="https://em-content.zobj.net/source/apple/419/fire_1f525.png">🔥</span>`;

        if (currentStreak === 1) {
            streakText = `${fireEmojiHTML} 1 Day Streak`;
        } else {
            streakText = `${fireEmojiHTML} ${currentStreak} Days Streak`;
        }
        streakCounterDiv.innerHTML = streakText;
        
        // After setting the HTML, we need to run the emoji replacer for this dynamic element
        runEmojiReplacer(streakCounterDiv);
    }

    // --- UI Update Functions ---
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
            if (workoutData[dateKey]) {
                checkbox.classList.add('checked');
            } else {
                checkbox.classList.remove('checked');
            }
        });
        
        const dayName = dayMapping[currentDayIndex].toLowerCase();
        showWorkout(dayName);
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
    
    // --- Emoji Replacer Function ---
    // We put your script logic into a function so we can call it on dynamic content
    function runEmojiReplacer(scope) {
        const elements = (scope || document).querySelectorAll('[ms-code-emoji]');
        elements.forEach(element => {
            // Check if it has already been replaced
            if (element.querySelector('img')) {
                return;
            }
            var imageUrl = element.getAttribute('ms-code-emoji');
            var img = document.createElement('img');
            img.src = imageUrl;

            var textStyle = window.getComputedStyle(element);
            var adjustedHeight = parseFloat(textStyle.fontSize) * 1.2;

            img.style.height = adjustedHeight + 'px';
            img.style.width = 'auto';
            img.style.verticalAlign = 'middle';
            img.style.marginRight = '0.2em';

            element.innerHTML = ''; // Clears the text emoji
            element.appendChild(img);
        });
    }

    // --- Event Handlers ---
    document.querySelectorAll('.checkbox').forEach(box => {
        box.addEventListener('click', () => {
            const today = new Date();
            const todayDateString = getYYYYMMDD(today);
            const rowDateString = box.closest('tr').dataset.date;

            if (rowDateString !== todayDateString) {
                const currentDayName = dayMapping[today.getDay()];
                alert(`Hey man it's ${currentDayName}!!!`);
                return;
            }
            if (box.classList.contains('checked')) {
                return;
            }
            
            box.classList.add('checked');
            
            if (tickSound) {
                const playPromise = tickSound.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        tickSound.currentTime = 0;
                    }).catch(error => {
                        console.log("Autoplay prevented: ", error);
                    });
                }
            }
            workoutData[rowDateString] = true;
            saveData();
            calculateStreak();
        });
    });
    
    // Other event handlers remain the same...

    // --- Initial Load ---
    loadData();
    updateUI();
    runEmojiReplacer(); // Run for all static emojis on page load
});