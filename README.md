# ICNP System Pielęgniarski

System zarządzania pacjentami oparty o klasyfikację ICNP. React + Node.js + MariaDB.

## Funkcje

- Logowanie (JWT) z rolami: **admin**, **prowadzący**, **student**
- Lista pacjentów z zakładkami: aktualni / wypisani / archiwum
- Dodawanie, edycja, zmiana statusu pacjentów
- Panel admina: zarządzanie użytkownikami
- Prowadzący widzi pacjentów swoich studentów
- Student widzi tylko swoich pacjentów

## Wymagania

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose

## Szybki start (Docker)

```bash
# 1. Sklonuj repo
git clone https://github.com/xXGazikXx/ICNP_PROJECT_STUDIA.git
cd ICNP_PROJECT_STUDIA

# 2. Skopiuj i edytuj konfigurację
cp .env.example .env
# Zmień hasła i JWT_SECRET w pliku .env!

# 3. Uruchom wszystko
docker compose up --build

# 4. Utwórz konto admin (jednorazowo)
docker compose exec backend npm run seed
```

Aplikacja będzie dostępna pod:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

Domyślne konto admina: `admin` / `admin123` (zmień hasło po pierwszym logowaniu).

## Start bez Dockera

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Wymaga działającej instancji MariaDB (dane konfiguracyjne w `.env`).

## Struktura projektu

```
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── server.js
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── seeders/
└── frontend/
    ├── vite.config.js
    └── src/
        ├── api/
        ├── context/
        ├── components/
        ├── pages/
        └── styles/
```

## API Endpoints

| Metoda | Endpoint | Opis | Rola |
|--------|----------|------|------|
| POST | `/api/auth/login` | Logowanie | wszyscy |
| GET | `/api/auth/me` | Dane zalogowanego | zalogowany |
| GET | `/api/patients` | Lista pacjentów | zalogowany |
| POST | `/api/patients` | Dodaj pacjenta | zalogowany |
| PUT | `/api/patients/:id` | Edytuj pacjenta | zalogowany |
| DELETE | `/api/patients/:id` | Usuń pacjenta | admin |
| GET | `/api/users` | Lista użytkowników | admin/prowadzący |
| POST | `/api/users` | Utwórz użytkownika | admin |
| DELETE | `/api/users/:id` | Usuń użytkownika | admin |

## Technologie

- **Frontend:** React 18, Vite, styled-components, React Router, Axios
- **Backend:** Node.js, Express, Sequelize ORM, JWT, bcryptjs
- **Baza danych:** MariaDB 11
- **Konteneryzacja:** Docker, Docker Compose
