import os
import json
import threading
from flask import Flask, request, jsonify, render_template

# Initialize Flask Application
app = Flask(__name__)

# File path for persisting keypress count data
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'keydata.json')

# Create a threading Lock to ensure thread-safe read/write operations to the JSON file
data_lock = threading.Lock()

def load_data():
    """
    Loads keypress count data from the JSON file.
    Returns an empty dictionary if the file does not exist or fails to load.
    """
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        app.logger.error(f"Error reading data file: {e}")
        return {}

def save_data(data):
    """
    Saves keypress count data to the JSON file.
    """
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
    except IOError as e:
        app.logger.error(f"Error writing data file: {e}")

@app.route('/')
def index():
    """
    Serves the main frontend dashboard.
    """
    return render_template('index.html')

@app.route('/track', methods=['POST'])
def track():
    """
    Accepts a single keypress, increments its count, persists the data, and returns the stats.
    Expected JSON input: { "key": "KeyA" }
    """
    req_data = request.get_json() or {}
    key = req_data.get('key')
    
    if not key:
        return jsonify({"error": "Missing 'key' parameter in request body"}), 400

    # Ensure thread-safety during parallel track requests (e.g., fast typing)
    with data_lock:
        data = load_data()
        data[key] = data.get(key, 0) + 1
        save_data(data)

    return jsonify({"success": True, "counts": data})

@app.route('/stats', methods=['GET'])
def stats():
    """
    Returns the current keypress frequency stats.
    """
    with data_lock:
        data = load_data()
    return jsonify(data)

@app.route('/reset', methods=['POST'])
def reset():
    """
    Clears all recorded keypress counts from memory and disk.
    """
    with data_lock:
        save_data({})
    return jsonify({"success": True, "counts": {}})

if __name__ == '__main__':
    # Run the Flask app on localhost, port 5000, with debugging enabled for local development
    app.run(host='127.0.0.1', port=5000, debug=True)
