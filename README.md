# 📦 Inventory & Contract Management System

Ένα αυτόνομο, ελαφρύ και φορητό σύστημα διαχείρισης συμβάσεων, στρατιωτικών κωδικών υλικών (NSN), Part Numbers και σειριακών αριθμών (Serial Numbers). Η εφαρμογή βασίζεται σε αρχιτεκτονική **Flask + SQLite** με διεπαφή **Vanilla JS / Bootstrap 5** και διανέμεται ως αυτόνομο εκτελέσιμο **Linux AppImage**. Ξεκίνησε ως project για το Microsoft Access, ωστόσο αφού συνηδητοποίησα τους περιορισμούς του αποφάσισα να το φτιάξω από την αρχή.

---

## 🚀 Χαρακτηριστικά

- **Ιεραρχική Διαχείριση Υλικών:** Συσχέτιση Συμβάσεων $\rightarrow$ NSN $\rightarrow$ Part Numbers $\rightarrow$ Serial Numbers.
- **Πολυπαραμετρική Αναζήτηση σε Πραγματικό Χρόνο:** Δυναμικό φιλτράρισμα του Dropdown συμβάσεων βάσει αριθμού σύμβασης, περιγραφής υλικού, NSN, Part Number ή Serial Number.
- **Αυτόματη Επιμονή Δεδομένων (Data Persistence):** Αυτόματη αρχικοποίηση και συγχρονισμός της βάσης δεδομένων στο `~/.pndb.db` για απρόσκοπτη λειτουργία σε περιβάλλοντα μόνο ανάγνωσης (Read-Only AppImage).
- **Μηχανισμός Auto-Shutdown:** Αυτόματος τερματισμός του τοπικού server και άμεση απελευθέρωση της θύρας δικτύου (`port 5000`) μόλις κλείσει ο περιηγητής (μέσω watchdog heartbeat).
- **Πλήρης Φορητότητα:** Δεν απαιτείται προεγκατεστημένη Python ή πρόσθετες βιβλιοθήκες από τον τελικό χρήστη.

---

## 🗄️ Αρχιτεκτονική & Δομή Βάσης Δεδομένων (`SQLite`)

Η βάση δεδομένων αποθηκεύεται τοπικά ως αρχείο SQLite (`PNDB` / `~/.pndb.db`). Υποστηρίζει ξένα κλειδιά (`PRAGMA foreign_keys = ON`) για τη διασφάλιση της ακεραιότητας των σχέσεων μεταξύ των εγγραφών.

### Διάγραμμα Συσχετίσεων (ER Concept)

```text
[ Contracts ] ──< (1:N) >── [ contract2nsn ] ──< (N:1) >── [ NSN ]
      │                                                      │
      └──────────────< (1:N) >─────────────┬─────────────────┘
                                           ▼
                                   [ PartNumbers ]
                                           │
                                     < (1:N) >
                                           ▼
                                  [ SerialNumbers ]
```

---

## 🛠️ Τεχνολογικό Stack

- **Backend:** Python 3, Flask, Flask-CORS
- **Database:** SQLite3
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
  
---

## 💻 Τοπική Εκτέλεση (Development)

1. **Κλωνοποίηση του αποθετηρίου:**
   ```bash
   git clone https://github.com/Agony-sol/parts-database.git
   cd parts-database
   ```

2. **Δημιουργία και ενεργοποίηση virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Εγκατάσταση εξαρτήσεων:**
   ```bash
   pip install flask flask-cors
   ```

4. **Εκκίνηση εφαρμογής:**
   ```bash
   python script.py
   ```
   *Η εφαρμογή θα ξεκινήσει τον server και θα ανοίξει αυτόματα στον προεπιλεγμένο περιηγητή στη διεύθυνση `http://127.0.0.1:5000`.*

---

## 📄 Άδεια Χρήσης (License)

Το παρόν έργο διατίθεται υπό την άδεια **MIT License** - δείτε το αρχείο [LICENSE](LICENSE) για λεπτομέρειες.
