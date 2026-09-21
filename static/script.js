```javascript
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

    // Used to prevent older async API responses from overwriting newer data
    let latestRequestId = 0;

    // Prevent overlapping reset requests
    let isResetting = false;

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

        if (code.startsWith('Key')) {
            return code.slice(3);
        }

        if (code.startsWith('Digit')) {
            return code.slice(5);
        }

        if (code === 'Space') {
            return 'Spacebar';
        }

        if (code.endsWith('Left')) {
            return code.replace('Left', ' (Left)');
        }

        if (code.endsWith('Right')) {
            return code.replace('Right', ' (Right)');
        }

        return code.replace(/([A-Z])/g, ' $1').trim();
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'cyber-dark';

    function applyTheme(theme) {
        const isDark = theme === 'cyber-dark';

        document.body.classList.toggle('cyber-dark', isDark);

        if (themeIcon) {
            themeIcon.textContent = isDark ? '🌙' : '🌸';
        }

        if (themeText) {
            themeText.textContent = isDark
                ? 'Cyber Dark'
                : 'Light Aesthetic';
        }

        // Redraw heatmap using the active theme
        updateHeatmapUI(currentCounts);
    }

    applyTheme(savedTheme);

    // Toggle Theme Event
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('cyber-dark');
            const newTheme = isDark ? 'cyber-dark' : 'light';

            localStorage.setItem('theme', newTheme);

            if (themeIcon) {
                themeIcon.textContent = isDark ? '🌙' : '🌸';
            }

            if (themeText) {
                themeText.textContent = isDark
                    ? 'Cyber Dark'
                    : 'Light Aesthetic';
            }

            updateHeatmapUI(currentCounts);
        });
    }

    // Function to calculate and render heatmap colors
    function updateHeatmapUI(counts) {
        // Make sure counts is always a valid object
        if (!counts || typeof counts !== 'object') {
            counts = {};
        }

        currentCounts = { ...counts };

        let totalCount = 0;
        let uniqueCount = 0;
        let maxCount = 0;
        let peakKey = '-';

        // Calculate metrics
        for (const [key, rawCount] of Object.entries(counts)) {
            const count = Number(rawCount) || 0;

            if (count > 0) {
                totalCount += count;
                uniqueCount++;

                if (count > maxCount) {
                    maxCount = count;
                    peakKey = key;
                }
            }
        }

        // Update dashboard counters safely
        if (statTotal) {
            statTotal.textContent = totalCount.toLocaleString();
        }

        if (statUnique) {
            statUnique.textContent = uniqueCount.toLocaleString();
        }

        if (statPeak) {
            statPeak.textContent = maxCount > 0
                ? `${formatKeyName(peakKey)} (${maxCount.toLocaleString()})`
                : '-';
        }

        const isCyberDark =
            document.body.classList.contains('cyber-dark');

        // Update each key's styling and count badge
        Object.entries(keyElements).forEach(([keyCode, element]) => {
            const count = Number(counts[keyCode]) || 0;
            const countBadge = element.querySelector('.key-count');

            // Safely update count badge
            if (countBadge) {
                countBadge.textContent = count.toLocaleString();
            }

            if (count > 0 && maxCount > 0) {
                element.classList.add('has-count');

                const ratio = Math.min(count / maxCount, 1);

                if (isCyberDark) {
                    // FUTURISTIC NEON GLOW COLOR FORMULAS
                    const hue = 240 - (ratio * 260);
                    const saturation = 80 + (ratio * 20);
                    const lightness = 30 + (ratio * 15);

                    element.style.backgroundColor =
                        `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                    element.style.borderColor =
                        `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;

                    element.style.color = '#ffffff';

                    element.style.boxShadow =
                        `0 0 12px hsla(${hue}, ${saturation}%, ${lightness}%, 0.55)`;

                    element.style.textShadow =
                        '0 0 4px rgba(255, 255, 255, 0.6)';
                } else {
                    // LIGHT AESTHETIC PASTEL COLOR FORMULAS
                    const hue = 200 - (ratio * 210);
                    const saturation = 60 + (ratio * 15);
                    const lightness = 85 - (ratio * 10);

                    element.style.backgroundColor =
                        `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                    element.style.borderColor =
                        `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;

                    element.style.color = '#1e293b';

                    element.style.boxShadow =
                        '0 2px 4px rgba(0, 0, 0, 0.04)';

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

    // API Call: Fetch current statistics from backend
    async function fetchStats() {
        const requestId = ++latestRequestId;

        try {
            const response = await fetch('/stats', {
                method: 'GET',
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`Stats request failed: ${response.status}`);
            }

            const counts = await response.json();

            // Ignore stale response
            if (requestId !== latestRequestId) {
                return;
            }

            updateHeatmapUI(counts);

        } catch (error) {
            console.error('Error fetching key stats:', error);
        }
    }

    // API Call: Track keypress to backend
    async function trackKeyPress(keyCode) {
        // Every new request invalidates older responses
        const requestId = ++latestRequestId;

        try {
            const response = await fetch('/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key: keyCode
                })
            });

            if (!response.ok) {
                throw new Error(`Track request failed: ${response.status}`);
            }

            const result = await response.json();

            // Ignore an older response if a newer request already happened
            if (requestId !== latestRequestId) {
                return;
            }

            if (result && result.counts) {
                updateHeatmapUI(result.counts);
            }

        } catch (error) {
            console.error('Error tracking key:', error);
        }
    }

    // Animate a key press
    function animateKey(keyElement) {
        if (!keyElement) return;

        keyElement.classList.add('active');

        setTimeout(() => {
            keyElement.classList.remove('active');
        }, 120);
    }

    // Event Listener: Track physical keyboard presses
    window.addEventListener('keydown', event => {
        // Ignore repeated keydown events when holding a key
        if (event.repeat) return;

        const keyCode = event.code;
        const keyElement = keyElements[keyCode];

        if (keyElement) {
            animateKey(keyElement);
            trackKeyPress(keyCode);
        }
    });

    // Support clicking virtual keyboard keys directly
    if (virtualKeyboard) {
        virtualKeyboard.addEventListener('click', event => {
            const keyElement = event.target.closest('.key');

            if (!keyElement) return;

            const keyCode = keyElement.getAttribute('data-key');

            if (!keyCode) return;

            animateKey(keyElement);
            trackKeyPress(keyCode);
        });
    }

    // Reset Heatmap logic
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (isResetting) return;

            const confirmed = confirm(
                'Are you sure you want to reset all tracked heatmap stats? This cannot be undone.'
            );

            if (!confirmed) return;

            isResetting = true;
            resetBtn.disabled = true;

            try {
                // Invalidate previous requests
                latestRequestId++;

                const response = await fetch('/reset', {
                    method: 'POST'
                });

                if (!response.ok) {
                    throw new Error(
                        `Reset request failed: ${response.status}`
                    );
                }

                const result = await response.json();

                if (result && result.counts) {
                    updateHeatmapUI(result.counts);
                } else {
                    updateHeatmapUI({});
                }

            } catch (error) {
                console.error('Error resetting stats:', error);
                alert('Failed to reset heatmap statistics. Please try again.');
            } finally {
                isResetting = false;
                resetBtn.disabled = false;
            }
        });
    }

    // Initial load
    fetchStats();

    // Auto-polling: Refresh heatmap stats every 1.5 seconds
    setInterval(fetchStats, 1500);
});
```

### One important bug I fixed

Your original code can produce this situation:

```text
Key A pressed
    ↓
POST /track

Key B pressed immediately
    ↓
POST /track

Response B arrives first
    ↓
UI = correct

Response A arrives later
    ↓
UI = OLD DATA ❌
```

This is especially noticeable when typing quickly.

The new `latestRequestId` prevents an older response from replacing newer information.

I also changed:

```javascript
hsl(..., 0.55)
```

to:

```javascript
hsla(..., 0.55)
```

for the neon glow, because `hsla()` explicitly expresses the alpha value and is clearer/safer across browsers.

**Your existing `/stats`, `/track`, and `/reset` backend API structure does not need to change.**
