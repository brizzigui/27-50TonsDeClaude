import sqlite3
import os

db_path = r'c:\Users\gabri\OneDrive\Documentos\antigravitygit\50TonsDeClaude\back\database.db'
print("DB Path:", db_path)

if not os.path.exists(db_path):
    print("DB file does not exist!")
else:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = c.fetchall()
    print("Tables:", tables)

    if ('users',) in tables:
        try:
            c.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(20);")
        except Exception as e:
            print("Phone col error:", e)
        try:
            c.execute("ALTER TABLE users ADD COLUMN farm_name VARCHAR(120);")
        except Exception as e:
            print("Farm col error:", e)
        conn.commit()
        print("Done.")
    conn.close()
