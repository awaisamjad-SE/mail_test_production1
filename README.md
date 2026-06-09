# MailFlow v3.0 – Django-Powered SaaS Email Marketing Platform

MailFlow is a professional SaaS email marketing tool equipped with direct Gmail SMTP sending capabilities, a Celery-powered asynchronous sending queue, secure Fernet app password storage, and an interactive analytics dashboard.

---

## 💻 Local Development Setup

To run the application locally for development and testing:

### 1. Backend REST API (Django)
Ensure you have Python 3.11 installed.
```bash
# Navigate to backend
cd backend
# Create virtual environment
python -m venv venv
# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates local db.sqlite3 automatically)
python manage.py migrate

# Seed test database (creates user awaisamjad.official@gmail.com and SMTP settings)
python seed_db.py

# Start Django dev server
python manage.py runserver
```
Runs at `http://127.0.0.1:8000/`.

### 2. Redis & Celery Worker
Ensure Redis is running (e.g. via Docker: `docker run -d -p 6379:6379 redis`), then start the worker:
```bash
# Activate venv, then run celery (use solo pool for Windows)
celery -A mailflow_backend worker --loglevel=info -P solo
```

### 3. Frontend Client (Vite + React)
```bash
# Navigate to root directory
npm install
# Start dev server
npm run dev
```
Runs at `http://localhost:5173/`.

---

## 🐳 Professional Docker Production Deployment (Ubuntu Server)

This project is optimized for deployment on Ubuntu servers using **Docker** and **Docker Compose**.

### Deployment Architecture
- **nginx**: Alpine Nginx container serving built static React files on port 80/443 and proxying `/api/` and `/admin/` requests to the backend.
- **backend**: Gunicorn WSGI server running the Django REST API on port 8000.
- **celery_worker**: Background process executing individual SMTP sends with automatic retries.
- **db**: PostgreSQL 15 container for secure data persistence.
- **redis**: Redis 7 cache and message broker with password protection.

---

### Step-by-Step Deployment Instructions

#### Step 1: Install Docker & Docker Compose on Ubuntu
Log in to your Ubuntu server and run:
```bash
# Update package database
sudo apt update
# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Step 2: Clone Code & Configure Environment
1. Copy the project source files to your Ubuntu server (e.g., to `/var/www/mailflow`).
2. Create and configure your production `.env` file at the root directory:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Update these variables inside `.env`:
   - `SECRET_KEY`: Set a secure random string.
   - `ALLOWED_HOSTS`: Add your server IP or domain name (e.g. `yourdomain.com`).
   - `ENCRYPTION_KEY`: Set a permanent 32-byte URL-safe base64-encoded key. You can generate one via:
     `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`
   - `DB_PASSWORD` & `REDIS_PASSWORD`: Change to strong passwords.

#### Step 3: Launch Containers
Launch the stack in detached background mode:
```bash
docker-compose up -d --build
```
This will:
1. Build the React app and bundle Nginx.
2. Initialize PostgreSQL and Redis.
3. Automatically run Django migrations.
4. Start Gunicorn and the Celery worker queue.

#### Step 4: Create Django Administrator (Superuser)
To access the Django Admin console (`/admin/`), run:
```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## 🔒 Production Security Best Practices

1. **Keep Secrets Private**: Ensure your `.env` file is added to `.gitignore` and is never committed to source control.
2. **Permanent Encryption Key**: The `ENCRYPTION_KEY` inside `.env` must remain **the same** for the lifetime of your database. If changed, any SMTP app passwords previously encrypted in the database will be unreadable.
3. **Worker Concurrency Limit**: The Celery worker will spin up standard concurrent threads on Linux. If your server is low-spec (e.g. 1GB RAM), you can restrict memory consumption in `docker-compose.yml` by appending `--concurrency=2` to the celery command.
4. **Regular Backups**: Ensure the `postgres_data` volume is regularly backed up using the mapped `./backup` host folder:
   `docker-compose exec db pg_dump -U mailflow_user mailflow > ./backup/db_backup.sql`
