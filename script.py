import os
import sys
from flask import Flask, json, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import threading
import time
import webbrowser
import shutil

BASE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))

last_heartbeat = time.time()

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
CORS(app)


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.htm")


@app.route("/api/heartbeat", methods=["POST"])
def heartbeat():
    global last_heartbeat
    last_heartbeat = time.time()
    return "", 204


def watchdog():
    global last_heartbeat
    time.sleep(8)
    while True:
        time.sleep(1)
        if time.time() - last_heartbeat > 5:
            print("--> Ο browser έκλεισε. Τερματισμός server...")
            os._exit(0)


def get_db():
    db_path = os.path.join(os.path.expanduser("~"), ".pndb.db")

    # Αν η βάση δεν υπάρχει στο home folder ή αν δημιουργήθηκε κατά λάθος κενή (0 bytes)
    if not os.path.exists(db_path) or os.path.getsize(db_path) == 0:
        # Πιθανές τοποθεσίες όπου το AppImage / PyInstaller μπορεί να έχει το αρχικό PNDB
        candidate_paths = [
            os.path.join(BASE_DIR, "PNDB"),
            os.path.join(BASE_DIR, "_internal", "PNDB"),
            os.path.join(os.path.dirname(sys.executable), "PNDB"),
            os.path.join(os.path.dirname(sys.executable), "_internal", "PNDB"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "PNDB"),
            os.path.join(os.getcwd(), "PNDB"),
        ]

        copied = False
        for src in candidate_paths:
            if os.path.exists(src) and os.path.getsize(src) > 0:
                shutil.copyfile(src, db_path)
                print(
                    f"--> [DB AUTO-SETUP] Αντιγράφηκε η αρχική βάση από: {src} στο {db_path}"
                )
                copied = True
                break

        if not copied:
            print(
                "--> ΣΦΑΛΜΑ: Το αρχικό αρχείο PNDB δεν βρέθηκε πουθενά μέσα στο πακέτο!"
            )

    db = sqlite3.connect(db_path)
    db.execute("PRAGMA foreign_keys = ON")
    db.row_factory = sqlite3.Row
    return db


# ---------------------------------------------------------------------------------------
# LOAD CONTRACT NUMBER FROM DB
@app.route("/api/contracts", methods=["GET"])
def get_contracts():
    db = get_db()
    contracts = db.execute("SELECT * FROM Contracts").fetchall()
    db.close()

    return jsonify([dict(row) for row in contracts])


# ADD CONTRACT NUMBER TO DB
@app.route("/api/contracts", methods=["POST"])
def add_contract():
    data = request.json
    contract_name = data.get("contract", "").strip()
    if not contract_name:
        return jsonify({"error": "Εισάγετε όνομα σύμβασης"}), 400

    db = get_db()
    try:
        contract = db.execute(
            "INSERT INTO Contracts(contract) VALUES (?)", (data["contract"],)
        )
        db.commit()
        new_id = contract.lastrowid
        db.close()
        return jsonify({"id": new_id, "contract": data["contract"]})
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({"error": "Αυτή η σύμβαση υπάρχει ήδη!"}), 409


# DELETE CONTRACT NUMBER FROM DB
@app.route("/api/contracts/<int:contract_id>", methods=["DELETE"])
def rmv_contract(contract_id):
    db = get_db()
    db.execute("DELETE FROM Contracts WHERE id = ?", (contract_id,))
    db.commit()
    db.close()
    return jsonify({"message": "Contract deleted successfully"}), 200


# --------------------------------------------------------------------------------------


# ---------------------------------------------------------------------------------------
# MATERIAL NAME
@app.route("/api/contracts/<int:contract_id>", methods=["PUT"])
def saveName(contract_id):
    data = request.json
    material_name = data.get("material_name", "").strip()

    db = get_db()
    db.execute(
        "UPDATE Contracts SET matName=? WHERE id=?", (material_name, contract_id)
    )
    db.commit()
    db.close()

    return jsonify({"message": "MATERIAL NAME UPDATED SUCCESSFULLY"}), 200


# ---------------------------------------------------------------------------------------


# --------------------------------------------------------------------------------------
# LOAD NSN FROM DB
@app.route("/api/nsn/<int:contract_id>", methods=["GET"])
def get_nsn(contract_id):
    db = get_db()
    nsnumber = db.execute(
        "SELECT NSN.* FROM NSN JOIN contract2nsn ON NSN.id = nsn_id WHERE contract_id = ?",
        (contract_id,),
    ).fetchall()
    db.close()

    return jsonify([dict(row) for row in nsnumber])


# ADD NSN TO DB
@app.route("/api/nsn/<int:contract_id>", methods=["POST"])
def add_nsn(contract_id):
    data = request.json
    nsn_text = data.get("NSN", "").strip()

    db = get_db()

    try:
        existing_nsn = db.execute(
            "SELECT id FROM NSN WHERE NSN = ? COLLATE NOCASE", (nsn_text,)
        ).fetchone()

        if existing_nsn:
            nsn_id = existing_nsn["id"]
        else:
            new_nsn = db.execute("INSERT INTO NSN(NSN) VALUES (?)", (data["NSN"],))
            nsn_id = new_nsn.lastrowid

        link = db.execute(
            "SELECT 1 FROM contract2nsn WHERE contract_id=? AND nsn_id=?",
            (
                contract_id,
                nsn_id,
            ),
        ).fetchone()

        if link:
            db.close()
            return jsonify({"error": "Το NSN υπάρχει ήδη σε αυτή την σύμβαση!"}), 409
        else:
            db.execute(
                "INSERT INTO contract2nsn(contract_id, nsn_id) VALUES (?,?)",
                (
                    contract_id,
                    nsn_id,
                ),
            )
        db.commit()
        db.close()
        return jsonify({"message": "Added NSN successfully"})

    except sqlite3.IntegrityError:
        db.close()
        return jsonify({"error": "Το NSN αυτό υπάρχει ήδη!"}), 409


# REMOVE NSN FROM DB
@app.route("/api/nsn/<int:nsn_id>", methods=["DELETE"])
def rmv_nsn(nsn_id):
    db = get_db()
    db.execute("DELETE FROM NSN WHERE id=?", (nsn_id,))
    db.commit()
    db.close()

    return jsonify({"message": "Deleted NSN from DB successfully"})


# ------------------------------------------------------------------------------------


# ------------------------------------------------------------------------------------
# LOAD PARTS FROM DB
@app.route("/api/parts/<int:nsn_id>/<int:contract_id>", methods=["GET"])
def get_parts(nsn_id, contract_id):
    db = get_db()
    partnum = db.execute(
        "SELECT * FROM PartNumbers WHERE nsn_id = ? AND contract_id = ?",
        (
            nsn_id,
            contract_id,
        ),
    ).fetchall()
    db.close()

    return jsonify([dict(row) for row in partnum])


# ADD PART NUMBER TO DB
@app.route("/api/parts/<int:nsn_id>/<int:contract_id>", methods=["POST"])
def add_part(nsn_id, contract_id):
    data = request.json
    db = get_db()

    existing_part = db.execute(
        "SELECT 1 FROM PartNumbers WHERE partNumber=? COLLATE NOCASE AND nsn_id=? AND contract_id=?",
        (
            data["part"],
            nsn_id,
            contract_id,
        ),
    ).fetchone()
    if existing_part:
        db.close()
        return jsonify({"error": "Το Part Number υπάρδχει ήδη στην σύμβαση!"}), 409

    else:
        db.execute(
            "INSERT INTO PartNumbers(partNumber, nsn_id, contract_id) VALUES (?,?, ?)",
            (
                data["part"],
                nsn_id,
                contract_id,
            ),
        )
        db.commit()
        db.close()
        return jsonify({"message": "Successfully added new Part Number"})


# REMOVE PART NUMBER FROM DB
@app.route("/api/parts/<int:pn_id>/<int:contract_id>", methods=["DELETE"])
def rmv_part(pn_id, contract_id):
    db = get_db()
    db.execute(
        "DELETE FROM PartNumbers WHERE pn_id=? AND contract_id=?",
        (
            pn_id,
            contract_id,
        ),
    )
    db.commit()
    db.close()

    return jsonify({"message": "DELETED PART NUMBER SUCCESSFULLY"})


# -------------------------------------------------------------------------------------


# -------------------------------------------------------------------------------------
# GET SERIALS FROM DB
@app.route("/api/serials/<int:part_id>/<int:contract_id>", methods=["GET"])
def get_serials(part_id, contract_id):
    db = get_db()
    sernum = db.execute(
        "SELECT * FROM SerialNumbers WHERE part_id = ? AND contract_id = ?",
        (part_id, contract_id),
    ).fetchall()
    db.close()

    results = [dict(row) for row in sernum]
    print(
        f"--> Part: {part_id}, Contract: {contract_id} | Βρέθηκαν: {results}"
    )  # DEBUG PRINT
    return jsonify(results)


# ADD SERIAL NUMBER TO DB
@app.route("/api/serials/<int:part_id>/<int:contract_id>", methods=["POST"])
def add_serials(part_id, contract_id):
    data = request.json
    db = get_db()

    serial_exists = db.execute(
        "SELECT 1 FROM SerialNumbers WHERE serialNumber=? COLLATE NOCASE AND part_id=? AND contract_id=?",
        (data["serial"], part_id, contract_id),
    ).fetchone()

    if serial_exists:
        db.close()
        return jsonify({"error": "Το Serial Number υπάρχει ήδη στην σύμβαση!"}), 409

    db.execute(
        "INSERT INTO SerialNumbers(serialNumber, part_id, contract_id) VALUES (?, ?, ?)",
        (data["serial"], part_id, contract_id),
    )
    db.commit()
    db.close()

    return jsonify({"message": "SERIAL NUMBER SAVED SUCCESSFULLY"})


# REMOVE SERIAL NUMBER FROM DB
@app.route("/api/serials/<int:contract_id>/<int:serial_id>", methods=["DELETE"])
def rmvSerial(contract_id, serial_id):
    db = get_db()
    db.execute(
        "DELETE FROM SerialNumbers WHERE id=? AND contract_id=?",
        (serial_id, contract_id),
    )
    db.commit()
    db.close()

    return jsonify({"message": "SERIAL NUMBER DELETED SUCCESSFULLY"})


# -----------------------------------------------------------------------------------------


# ------------------------------------------------------------------------------------------
@app.route("/api/search", methods=["GET"])
def search():
    contract_search = request.args.get("contract", "").strip()
    nsn_search = request.args.get("nsn", "").strip()
    part_search = request.args.get("part", "").strip()
    serial_search = request.args.get("serial", "").strip()

    db = get_db()

    sql = """
		SELECT DISTINCT
			c.id AS contract_id,
			c.contract,
			n.id AS nsn_id,
			n.NSN,
			p.pn_id,
			p.partNumber,
			s.id AS serial_id,
			s.serialNumber
		FROM Contracts c
		LEFT JOIN contract2nsn c2n ON c.id = c2n.contract_id
		LEFT JOIN NSN n ON c2n.nsn_id = n.id
		LEFT JOIN PartNumbers p ON (p.contract_id = c.id AND p.nsn_id = n.id)
		LEFT JOIN SerialNumbers s ON (s.contract_id = c.id AND s.part_id = p.pn_id)
		WHERE 1=1
	"""
    params = []

    if contract_search:
        sql += " AND (c.contract LIKE ? OR c.matName LIKE ?)"
        params.extend([f"%{contract_search}%", f"%{contract_search}%"])
    if nsn_search:
        sql += " AND n.NSN LIKE ?"
        params.append(f"%{nsn_search}%")
    if part_search:
        sql += " AND p.partNumber LIKE ?"
        params.append(f"%{part_search}%")
    if serial_search:
        sql += " AND s.serialNumber LIKE ?"
        params.append(f"%{serial_search}%")

    sql += " ORDER BY c.contract DESC"

    results = db.execute(sql, params).fetchall()
    db.close()

    print(
        f"--> [SEARCH] Βρέθηκαν {len(results)} εγγραφές για contract='{contract_search}', nsn='{nsn_search}', part='{part_search}', serial='{serial_search}'"
    )

    return jsonify([dict(row) for row in results]), 200


def start_flask():
    app.run(port=5000)


if __name__ == "__main__":
    t = threading.Thread(target=start_flask, daemon=True)
    t.start()

    time.sleep(0.5)

    w = threading.Thread(target=watchdog, daemon=True)
    w.start()

    webbrowser.open("http://127.0.0.1:5000")

    t.join()
