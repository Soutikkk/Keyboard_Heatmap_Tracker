import os
import json
import threading
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

DATA_FILE = "keydata.json"
lock = threading.Lock()


def load_data():
    """Load keypress data from the JSON file."""
    if not os.path.exists(DATA_FILE):
        return {}

    try:
        with open(DATA_FILE, "r") as file:
            return json.load(file)
    except (json.JSONDecodeError, IOError):
        return {}


def save_data(data):
    """Save keypress data to the JSON file."""
    with open(DATA_FILE, "w") as file:
        json.dump(data, file, indent=4)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/track", methods=["POST"])
def track():
    key = request.json.get("key")

    if not key:
        return jsonify({"error": "Key is required"}), 400

    with lock:
        data = load_data()
        data[key] = data.get(key, 0) + 1
        save_data(data)

    return jsonify({"success": True, "counts": data})


@app.route("/stats")
def stats():
    with lock:
        return jsonify(load_data())


@app.route("/reset", methods=["POST"])
def reset():
    with lock:
        save_data({})

    return jsonify({"success": True, "counts": {}})


if __name__ == "__main__":
    app.run(debug=True)
