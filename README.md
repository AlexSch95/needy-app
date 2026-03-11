# Cringe Dating App

Moderne, minimalistische Dating-App mit FiveM-Integration.

## Features

- Swipe-basiertes Dating (Links/Rechts)
- FiveM UUID-Token Integration bei Registrierung
- Profilbilder mit Cropping
- Geschlechtsauswahl (einmalig)
- Telefonnummer nur bei Matches sichtbar
- Desktop-optimiertes Design

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React, Vite
- **Hosting:** Railway

## Lokale Entwicklung

### Backend

```bash
cd backend
cp .env.example .env
# .env bearbeiten mit eigenen Werten
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Deployment auf Railway

### 1. Railway Projekt erstellen

1. Gehe zu [railway.app](https://railway.app)
2. Erstelle ein neues Projekt
3. Verbinde dein GitHub Repository

### 2. PostgreSQL hinzufuegen

1. Klicke auf "New" -> "Database" -> "PostgreSQL"
2. Railway erstellt automatisch die `DATABASE_URL` Variable

### 3. Backend Service

1. Klicke auf "New" -> "GitHub Repo"
2. Waehle das Repository
3. **WICHTIG:** Gehe zu Settings -> Root Directory und setze auf `backend`
4. Setze folgende Umgebungsvariablen:
   - `JWT_SECRET`: Ein sicherer Secret Key
   - `UUID_TOKEN_SECRET`: Secret zum Entschluesseln der FiveM Tokens
   - `FRONTEND_URL`: URL deines Frontends (z.B. https://cringe-frontend.up.railway.app)
   - `DATABASE_URL`: Wird automatisch von Railway gesetzt (verlinke es mit der PostgreSQL DB)

### 4. Frontend Service

1. Klicke auf "New" -> "GitHub Repo"  
2. Waehle das Repository
3. **WICHTIG:** Gehe zu Settings -> Root Directory und setze auf `frontend`
4. Setze folgende Umgebungsvariablen:
   - `VITE_API_URL`: URL deines Backends (z.B. https://cringe-backend.up.railway.app/api)

## FiveM Integration

Die App hoert auf FiveM Token-Nachrichten. Der Token muss ein JWT sein, signiert mit dem `UUID_TOKEN_SECRET`.

In deinem FiveM Script:

```lua
-- JWT Token erstellen und an Frontend senden
-- Der Token muss serverseitig mit dem UUID_TOKEN_SECRET signiert werden
SendNUIMessage({
    type = 'uuid-token',
    token = jwtToken
})
```

Der JWT Payload sollte folgendes Format haben:

```json
{
    "uuid": "fivem:12345",
    "type": "fivem-auth",
    "iat": 1738828800
}
```

Die UUID wird bei der Registrierung mit dem User gespeichert.

## Tastatursteuerung

- **Pfeil links:** Dislike
- **Pfeil rechts:** Like

## API Endpoints

### Auth
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller User

### Profil
- `PUT /api/profile/complete` - Profil vervollstaendigen
- `PUT /api/profile/update` - Profil aktualisieren
- `DELETE /api/profile` - Account loeschen

### Swipe
- `GET /api/swipe/next` - Naechstes Profil
- `POST /api/swipe` - Swipe ausfuehren

### Matches
- `GET /api/matches` - Alle Matches
- `DELETE /api/matches/:id` - Match entfernen
