# Sarfex Calendar

Selbstgehostete Kalender-WebApp fuer Handelsfachwirt-Termine mit Nextcloud CalDAV als einziger Quelle der Wahrheit.

## Projektbeschreibung

Die App ist bewusst in zwei Datensphaeren getrennt:

- Echte Termine liegen ausschliesslich in Nextcloud und werden direkt per CalDAV gelesen, erstellt, aktualisiert und geloescht.
- Die lokale PostgreSQL-Datenbank speichert nur App-Metadaten wie Kategorien, Standortvorlagen, Terminvorlagen und UI-Einstellungen.

Damit bleiben Nextcloud, iPhone/iOS und diese WebApp immer auf derselben Terminbasis, ohne lokale Event-Kopien oder Sync-Duplikate.

## Architektur

### Event-Quelle

- Nextcloud CalDAV ist die einzige Quelle der Wahrheit fuer echte Termine.
- Die App verwendet `REPORT calendar-query` mit `time-range`, statt ungefiltert alle Eintraege zu laden.
- Updates und Deletes laufen mit `If-Match` gegen die aktuelle `ETag`, damit Konflikte mit iPhone oder Nextcloud-Web-UI sauber erkannt werden.

### Lokale Datenbank

Prisma/PostgreSQL speichert nur:

- `User`
- `Category`
- `LocationTemplate`
- `EventTemplate`
- `UiSettings`

Es gibt bewusst **keine** lokale Tabelle fuer echte Kalendertermine.

### Auth

- Einfacher Admin-Login ueber `ADMIN_EMAIL` und `ADMIN_PASSWORD_HASH`
- Signiertes `httpOnly` Session-Cookie
- Geschuetzte App-Seiten ohne Edge-Middleware
- Geschuetzte API-Routen mit JSON-`401`

### Tech-Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui Bausteine
- Prisma
- PostgreSQL
- Zod
- Docker
- Nextcloud CalDAV
- iCalendar/ICS Handling

## Wichtige Eigenschaften

- Keine Static Export App
- Keine Prisma-Imports in Client Components
- API-Routen mit `export const dynamic = "force-dynamic"` und `export const runtime = "nodejs"`
- Keine DB-Zugriffe waehrend des Builds
- Docker auf `node:22-bookworm-slim`
- `npx prisma migrate deploy` beim Containerstart

## Seiten

- `/login`
- `/`
- `/calendar`
- `/events`
- `/events/new`
- `/events/[id]`
- `/templates`
- `/locations`
- `/categories`
- `/settings`

## ENV

Beispieldatei: [`.env.example`](/C:/Users/Niklas/Documents/SarfexCalendar/.env.example)

```env
DATABASE_URL=
APP_URL=
APP_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
CALDAV_BASE_URL=
CALDAV_CALENDAR_URL=
CALDAV_USERNAME=
CALDAV_PASSWORD=
TIMEZONE=Europe/Berlin
```

### Bedeutung

- `DATABASE_URL`: PostgreSQL-Verbindung fuer Prisma
- `APP_URL`: Oeffentliche URL der App, z. B. `https://calendar.sarfex.net`
- `APP_SECRET`: Secret fuer die signierte Admin-Session
- `ADMIN_EMAIL`: Login-E-Mail des Admins
- `ADMIN_PASSWORD_HASH`: bcrypt-Hash des Admin-Passworts
- `CALDAV_BASE_URL`: Basis-URL der Nextcloud-Instanz, z. B. `https://cloud.example.com`
- `CALDAV_CALENDAR_URL`: Vollstaendige Kalender-Collection-URL
- `CALDAV_USERNAME`: Nextcloud-Benutzername
- `CALDAV_PASSWORD`: Nextcloud App-Passwort
- `TIMEZONE`: Standardmaessig `Europe/Berlin`

### Passwort-Hash erzeugen

Nach `npm install` kannst du z. B. so einen bcrypt-Hash erzeugen:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('DEIN_PASSWORT', 12))"
```

## Nextcloud CalDAV URL finden

Typische Muster:

- Basis-URL: `https://cloud.example.com`
- Kalender-URL: `https://cloud.example.com/remote.php/dav/calendars/<username>/<calendar-slug>/`

Praktisch ist meistens:

1. In Nextcloud die Kalender-App oeffnen.
2. Beim gewuenschten Kalender die Einstellungen oder Freigabeoptionen oeffnen.
3. Den privaten CalDAV-Link bzw. die Kalender-URL kopieren.
4. Diese URL als `CALDAV_CALENDAR_URL` setzen.

## Nextcloud App-Passwort erstellen

1. In Nextcloud zu `Einstellungen` gehen.
2. `Sicherheit` oder `Devices & sessions` oeffnen.
3. Ein neues App-Passwort fuer diese WebApp erstellen.
4. Benutzername in `CALDAV_USERNAME` und App-Passwort in `CALDAV_PASSWORD` hinterlegen.

## Lokale Entwicklung

1. `.env.example` nach `.env` kopieren und alle benoetigten Werte setzen.
2. Abhaengigkeiten installieren:

```bash
npm install
```

3. Prisma Client generieren:

```bash
npm run prisma:generate
```

4. Migrationen auf die lokale Datenbank anwenden:

```bash
npm run prisma:migrate:deploy
```

5. Seed fuer Standardkategorien und UI-Einstellungen ausfuehren:

```bash
npm run prisma:seed
```

6. Development-Server starten:

```bash
npm run dev
```

7. Browser oeffnen:

```text
http://localhost:3000
```

## Docker Build

```bash
docker build -t sarfex-calendar .
```

Beispielstart:

```bash
docker run --env-file .env -p 3000:3000 sarfex-calendar
```

Der Container:

- hoert auf Port `3000`
- fuehrt beim Start `npx prisma migrate deploy` aus
- startet danach `npm run start`

## Coolify Deployment

Empfohlener Ablauf:

1. Repository bei GitHub anlegen und pushen.
2. In Coolify eine neue Application aus dem GitHub-Repo erstellen.
3. Den Root-Dockerfile verwenden.
4. Eine PostgreSQL-Resource in Coolify anlegen.
5. `DATABASE_URL` aus der Coolify-Postgres-Resource setzen.
6. Weitere ENV-Werte setzen:
   `APP_URL`, `APP_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `CALDAV_BASE_URL`, `CALDAV_CALENDAR_URL`, `CALDAV_USERNAME`, `CALDAV_PASSWORD`, `TIMEZONE`
7. Port `3000` verwenden.
8. Domain wie `https://calendar.sarfex.net` an die App binden.
9. Deploy ausloesen.

Hinweis:

- HTTPS und Routing uebernimmt Coolify/Traefik.
- Secrets werden ausschliesslich als Runtime-ENV gesetzt, nicht im Dockerfile.

## Prisma Migrationen

Vorhandene Initial-Migration:

- [`prisma/migrations/0001_init/migration.sql`](/C:/Users/Niklas/Documents/SarfexCalendar/prisma/migrations/0001_init/migration.sql)

Wichtige Befehle:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
```

## Manuelle Testcheckliste

1. Login funktioniert
2. Falscher Login wird blockiert
3. CalDAV Verbindungstest
4. Termine laden
5. Termin erstellen
6. Termin erscheint in Nextcloud
7. Termin erscheint auf iPhone
8. Termin bearbeiten
9. Aenderung erscheint auf iPhone
10. Termin loeschen
11. Termin verschwindet auf iPhone
12. Ganztagiger Termin ohne Tagesverschiebung
13. Standortvorlage testen
14. Terminvorlage testen
15. Mobile Wochenansicht testen
16. Coolify Redeploy testen

## Bekannte Einschraenkungen

- Die Kalenderansichten sind bewusst uebersichtlich und funktional gehalten, nicht als minuten-genauer Scheduling-Grid.
- Links werden aktuell ueber die Event-Beschreibung mit einer `Link:`-Zeile transportiert, nicht ueber eine separate URL-Property.
- Wiederkehrende Regeln (`RRULE`) haben aktuell keine eigene Spezialbehandlung in der UI.
- Mehrtaegige Termine werden in Woche und Monat sichtbar, aber noch nicht mit einer speziell optimierten Mehrtagesdarstellung gerendert.

## Sicherheitswarnung

- Keine echten Secrets committen.
- Keine CalDAV-Zugangsdaten ins Frontend geben.
- Keine `NEXT_PUBLIC_` Secrets fuer Admin- oder CalDAV-Daten verwenden.
- Runtime-Secrets nur ueber Coolify oder lokale `.env` setzen.

## Build-Status

Der Produktions-Build wurde lokal erfolgreich mit `npm run build` geprueft.
