import os
import sys
from pathlib import Path

# Add backend directory to sys.path so modules like config, common, profiles can be imported
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import shutil

# If running on Vercel without external Postgres, ensure SQLite in /tmp has tables
if os.getenv('VERCEL') and not os.getenv('DATABASE_URL'):
    tmp_db = Path('/tmp/db.sqlite3')
    if not tmp_db.exists() or tmp_db.stat().st_size == 0:
        seed_candidates = [
            BASE_DIR / 'db.sqlite3',
            BASE_DIR.parent / 'backend' / 'db.sqlite3',
            BASE_DIR.parent / 'db.sqlite3',
            Path('/var/task/backend/db.sqlite3'),
            Path('/var/task/db.sqlite3'),
        ]
        for candidate in seed_candidates:
            if candidate.exists() and candidate.stat().st_size > 0:
                try:
                    shutil.copy2(candidate, tmp_db)
                    break
                except Exception:
                    pass

import traceback

startup_error = None
try:
    from django.core.wsgi import get_wsgi_application
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
    django_app = get_wsgi_application()

    # Guarantee database tables exist on Vercel
    if os.getenv('VERCEL') and not os.getenv('DATABASE_URL'):
        try:
            from django.db import connection
            tables = connection.introspection.table_names()
            if 'auth_user' not in tables:
                from django.core.management import call_command
                call_command('migrate', interactive=False)
                from django.contrib.auth.models import User
                if not User.objects.filter(is_superuser=True).exists():
                    User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword123')
        except Exception as db_init_err:
            print(f"Vercel DB initialization notice: {db_init_err}")
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
