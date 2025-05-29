document.addEventListener('DOMContentLoaded', () => {
    const days = document.querySelectorAll('.day');
    days.forEach(day => {
        const checkboxes = day.querySelectorAll('input[type="checkbox"]');
        const completion = day.querySelector('.completion');
        day.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                day.classList.toggle('active');
            }
        });
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                completion.textContent = allChecked ? '☑' : '☐';
            });
        });
    });
});