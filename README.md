# 🎹 KeyPulse - Keyboard Heatmap Tracker

(VibeCoded)

KeyPulse is a real-time keyboard heatmap tracker. It allows you to monitor and visualize your typing habits instantly. It is built as a lightweight web application using a **Python Flask** backend and standard **vanilla HTML/CSS/JavaScript** for the frontend.

As you type on your computer while the page is open, the app records your keypresses and visualizes them on a virtual QWERTY keyboard using a color-coded relative heatmap ranging from cool slate-blue (rarely pressed) to neon-hot red (most pressed).

---

## ✨ Features

- **Global Event Tracking:** Listens for keydown events while the page is focused.
- **Interactive Sandbox:** Includes an input textbox directly in the web page for convenient typing and testing.
- **Dynamic HSL Heatmap:** Automatically normalizes the press count of every key against the most active key, transitioning colors smoothly.
- **Real-Time Updates:** Syncs keypresses instantly to the backend and auto-polls `/stats` every 1.5 seconds to refresh the heatmap.
- **Persistent Storage:** Keeps running counts of keypresses stored in a local `keydata.json` file. Data is preserved even if you restart the Flask server.
- **Stats Dashboard:** Tracks and displays total keypresses, the peak active key, and the number of unique keys typed.
- **Heatmap Reset:** Clear all tracked statistics with a single click of the reset button.
- **Modifier Key Customization:** Features proper width scaling for special keys like Spacebar, Backspace, Enter, Shift, and Control.

---

## 🛠️ Tech Stack

- **Backend:** Python 3 + [Flask](https://flask.palletsprojects.com/)
- **Frontend:** Vanilla HTML5, CSS3 (variables, flexbox, glassmorphism), Vanilla ES6 JavaScript (Fetch API)

---

## 📁 Project Structure

```text
Keyboard Heatmap Tracker/
├── app.py                  # Flask web server & persistence API
├── templates/
│   └── index.html          # HTML structure & virtual keyboard rows
├── static/
│   ├── style.css           # Slate-dark design system & layout styles
│   └── script.js           # Key event tracking, polling, & HSL heat calculations
├── .gitignore              # Ignores local JSON state, caches, & venv
└── README.md               # Setup & usage documentation
```

---

## 🚀 Getting Started & Local Setup

Follow these simple steps to run KeyPulse locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/Soutikkk/Keyboard_Heatmap_Tracker.git
cd "Keyboard Heatmap Tracker"
```

### 2. Install Flask
Make sure you have Python installed, then install Flask:
```bash
pip install flask
```

### 3. Run the Application
Start the Flask web server:
```bash
python app.py
```

### 4. Open in Browser
Once running, open your web browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## 🔌 API Endpoints

- **`GET /`**: Serves the primary dashboard application page.
- **`POST /track`**: Sends a key event to the backend.
  - *Payload format:* `{"key": "KeyQ"}`
  - *Response:* Returns success status and the updated count object.
- **`GET /stats`**: Returns all recorded key frequencies.
  - *Response format:* `{"KeyQ": 12, "Space": 34}`
- **`POST /reset`**: Clears all persisted data from memory and `keydata.json`.

---

## 🛡️ Thread Safety
The backend endpoints utilize Python's standard `threading.Lock` to guarantee that concurrent requests (which naturally occur when typing fast) are serialized cleanly when loading and updating `keydata.json`.
