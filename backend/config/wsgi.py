import os
import sys
from pathlib import Path

# Add backend directory to sys.path so modules like config, common, profiles can be imported
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import shutil

# If running on Vercel, copy seed database to /tmp so SQLite is writable
if os.getenv('VERCEL'):
    tmp_db = Path('/tmp/db.sqlite3')
    seed_db = BASE_DIR / 'db.sqlite3'
    if not tmp_db.exists() and seed_db.exists():
        try:
            shutil.copy2(seed_db, tmp_db)
        except Exception:
            pass

import traceback

startup_error = None
try:
    from django.core.wsgi import get_wsgi_application
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
    django_app = get_wsgi_application()
except Exception:
    startup_error = traceback.format_exc()
    django_app = None

def app(environ, start_response):
    if startup_error:
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [f"DJANGO STARTUP ERROR:\n{startup_error}".encode('utf-8')]
    try:
        return django_app(environ, start_response)
    except Exception:
        err = traceback.format_exc()
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [f"DJANGO INVOCATION ERROR:\n{err}".encode('utf-8')]

application = app
