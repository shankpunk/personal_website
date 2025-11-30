from flask_cors import CORS

from flask import Flask, render_template, request, send_from_directory, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")
DATA_DIR = "data"
MESSAGES_FILE = os.path.join(DATA_DIR, "messages.json")
RESUME_FOLDER = "resume"

os.makedirs(DATA_DIR, exist_ok=True)
if not os.path.exists(MESSAGES_FILE):
    with open(MESSAGES_FILE, "w") as f:
        json.dump([], f, indent=2)

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/hidden-gem", methods=["GET"])
def hidden_gem():
    return render_template("hidden-gem.html")


@app.route("/resume/<path:filename>", methods=["GET"])
def resume(filename):
    # Serve the resume file (put your PDF in resume/)
    return send_from_directory(RESUME_FOLDER, filename)

@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.json or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message", "").strip()

    if not (name and email and message):
        return jsonify({"ok": False, "error": "name, email and message required"}), 400

    entry = {
        "name": name,
        "email": email,
        "message": message,
        "time": datetime.utcnow().isoformat() + "Z"
    }

    try:
        with open(MESSAGES_FILE, "r+", encoding="utf-8") as f:
            arr = json.load(f)
            arr.append(entry)
            f.seek(0)
            json.dump(arr, f, indent=2)
            f.truncate()
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    return jsonify({"ok": True})

if __name__ == "__main__":
    # for local dev
    app.run(debug=True)
