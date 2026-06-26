document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const virtualKeyboard = document.getElementById('virtual-keyboard');
    const typingSandbox = document.getElementById('typing-sandbox');
    const resetBtn = document.getElementById('reset-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    const statTotal = document.getElementById('stat-total');
    const statPeak = document.getElementById('stat-peak');
    const statUnique = document.getElementById('stat-unique');

    // Global counts cache to allow instant redraw on theme changes
    let currentCounts = {};

    // Create a map of virtual key elements for fast DOM access
    const keyElements = {};
    document.querySelectorAll('.key').forEach(keyEl => {
        const keyCode = keyEl.getAttribute('data-key');
        if (keyCode) {
            keyElements[keyCode] = keyEl;
        }
    });

    // Helper to format Key Codes into user-friendly names for stats dashboard
    function formatKeyName(code) {
        if (!code) return '-';
        if (code.startsWith('Key')) return code.slice(3);
        if (code.startsWith('Digit')) return code.slice(5);
        if (code === 'Space') return 'Spacebar';
        if (code.endsWith('Left')) return code.replace('Left', ' (Left)');
        if (code.endsWith('Right')) return code.replace('Right', ' (Right)');
        return code.replace(/([A-Z])/g, ' $1').trim();
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'cyber-dark';
    if (savedTheme === 'cyber-dark') {
        document.body.classList.add('cyber-dark');
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Cyber Dark';
    } else {
        document.body.classList.remove('cyber-dark');
        themeIcon.textContent = '🌸';
        themeText.textContent = 'Light Aesthetic';
    }

    // Toggle Theme Event
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('cyber-dark');
        if (isDark) {
            localStorage.setItem('theme', 'cyber-dark');
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Cyber Dark';
        } else {
            localStorage.setItem('theme', 'light');
            themeIcon.textContent = '🌸';
            themeText.textContent = 'Light Aesthetic';
        }
        // Redraw heatmap immediately with the active theme's styling formulas
        updateHeatmapUI(currentCounts);
    });

    // Function to calculate and render heatmap colors
    function updateHeatmapUI(counts) {
        currentCounts = counts; // cache counts locally
        
        let totalCount = 0;
        let uniqueCount = 0;
        let maxCount = 0;
        let peakKey = '-';

        // Calculate metrics
        for (const [key, count] of Object.entries(counts)) {
            if (count > 0) {
                totalCount += count;
                uniqueCount++;
                if (count > maxCount) {
                    maxCount = count;
                    peakKey = key;
                }
            }
        }

        // Update dashboard counters
        statTotal.textContent = totalCount.toLocaleString();
        statUnique.textContent = uniqueCount;
        statPeak.textContent = maxCount > 0 
            ? `${formatKeyName(peakKey)} (${maxCount.toLocaleString()})` 
            : '-';

        const isCyberDark = document.body.classList.contains('cyber-dark');

        // Update each key's styling and count badge in the virtual keyboard
        Object.entries(keyElements).forEach(([keyCode, element]) => {
            const count = counts[keyCode] || 0;
            const countBadge = element.querySelector('.key-count');
            
            // Set count text
            countBadge.textContent = count.toLocaleString();

            if (count > 0) {
                element.classList.add('has-count');
                const ratio = count / maxCount;
                
                if (isCyberDark) {
                    // FUTURISTIC NEON GLOW COLOR FORMULAS
                    // Hue: 240 (neon blue) down to 340 (neon magenta/pink, effectively -20)
                    const hue = 240 - (ratio * 260);
                    // Saturation: Neon values (80% to 100%)
                    const saturation = 80 + (ratio * 20);
                    // Lightness: Glowing background levels (30% to 45%)
                    const lightness = 30 + (ratio * 15);

                    element.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                    element.style.borderColor = `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;
                    element.style.color = '#ffffff';
                    element.style.boxShadow = `0 0 12px hsl(${hue}, ${saturation}%, ${lightness}%, 0.55)`;
                    element.style.textShadow = '0 0 4px rgba(255, 255, 255, 0.6)';
                } else {
                    // LIGHT AESTHETIC PASTEL COLOR FORMULAS
                    // Hue: 200 (pastel sky blue) down to 350 (soft rose, effectively -10)
                    const hue = 200 - (ratio * 210);
                    // Saturation: Soft pastel values (60% to 75%)
                    const saturation = 60 + (ratio * 15);
                    // Lightness: Bright background levels (85% to 75%)
                    const lightness = 85 - (ratio * 10);

                    element.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                    element.style.borderColor = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
                    element.style.color = '#1e293b';
                    element.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
                    element.style.textShadow = '';
                }
            } else {
                element.classList.remove('has-count');
                // Revert to CSS stylesheet defaults
                element.style.backgroundColor = '';
                element.style.borderColor = '';
                element.style.color = '';
                element.style.boxShadow = '';
                element.style.textShadow = '';
            }
        });
    }

    // API Call: Fetch current statistics from the backend
    async function fetchStats() {
        try {
            const response = await fetch('/stats');
            if (response.ok) {
                const counts = await response.json();
                updateHeatmapUI(counts);
            }
        } catch (error) {
            console.error('Error fetching key stats:', error);
        }
    }

    // API Call: Track keypress to backend
    async function trackKeyPress(keyCode) {
        try {
            const response = await fetch('/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: keyCode })
            });
            if (response.ok) {
                const result = await response.json();
                updateHeatmapUI(result.counts);
            }
        } catch (error) {
            console.error('Error tracking key:', error);
        }
    }

    // Event Listener: Track physical keyboard presses
    window.addEventListener('keydown', (event) => {
        if (event.repeat) return;

        const keyCode = event.code;
        const keyElement = keyElements[keyCode];

        if (keyElement) {
            keyElement.classList.add('active');
            setTimeout(() => {
                keyElement.classList.remove('active');
            }, 120);

            trackKeyPress(keyCode);
        }
    });

    // Support clicking virtual keyboard keys directly
    virtualKeyboard.addEventListener('click', (event) => {
        const keyElement = event.target.closest('.key');
        if (keyElement) {
            const keyCode = keyElement.getAttribute('data-key');
            if (keyCode) {
                keyElement.classList.add('active');
                setTimeout(() => {
                    keyElement.classList.remove('active');
                }, 120);

                trackKeyPress(keyCode);
            }
        }
    });

    // Reset Heatmap logic
    resetBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all tracked heatmap stats? This cannot be undone.')) {
            try {
                const response = await fetch('/reset', { method: 'POST' });
                if (response.ok) {
                    const result = await response.json();
                    updateHeatmapUI(result.counts);
                }
            } catch (error) {
                console.error('Error resetting stats:', error);
            }
        }
    });

    // Initial load: Fetch stats
    fetchStats();

    // Auto-polling: Refresh heatmap stats every 1.5 seconds
    setInterval(fetchStats, 1500);
});
