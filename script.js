document.addEventListener('DOMContentLoaded', function() {
    const dayRows = document.querySelectorAll('#weekly-recap tbody tr');
    const workoutCards = document.querySelectorAll('.day-card');

    // Function to show a specific card and highlight the corresponding row
    function showWorkout(day) {
        // Hide all cards first
        workoutCards.forEach(card => {
            card.classList.add('hidden');
        });

        // Remove 'active' class from all rows
        dayRows.forEach(row => {
            row.classList.remove('active');
        });

        // Find the specific card and row for the selected day
        const selectedCard = document.getElementById(day + '-card');
        const selectedRow = document.querySelector(`tr[data-day="${day}"]`);

        // Show the selected card and highlight the row
        if (selectedCard && selectedRow) {
            selectedCard.classList.remove('hidden');
            selectedRow.classList.add('active');
        }
    }

    // Add a click event listener to each row in the table
    dayRows.forEach(row => {
        row.addEventListener('click', () => {
            const day = row.dataset.day;
            showWorkout(day);
        });
    });

    // --- Automatically show the card for the current day on page load ---
    const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay();
    const todayString = dayMapping[todayIndex];
    
    // Show the workout for today by default
    showWorkout(todayString);
});