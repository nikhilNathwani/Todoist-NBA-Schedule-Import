# Todoist NBA Schedule Saver

This project imports NBA team schedules into Todoist as tasks.

## Project Structure

```
├── package.json           # Node.js dependencies
├── server.js              # Local development server (boots `app.js`)
├── app.js                 # Main application logic (used by production)
├── vercel.json            # Vercel deployment config
├── app/                   # Server-side application code
│   ├── routes/            # Express route handlers
│   ├── utils/             # Server utilities
│   └── views/             # HTML rendering/templates
├── public/                # Frontend assets (CSS, JS, images)
├── scrape/                # NBA schedule scraping tools
├── demo/                  # Demo videos and documentation
└── data/                  # Application data
    └── nba_schedule.json  # NBA schedule data
```

## Getting Started

### Running the Application

```bash
npm install
npm start
```

### Updating NBA Schedules

```bash
python3 scrape/main.py
```

For detailed annual update workflow, see [scrape-instructions.md](scrape-instructions.md).

## Development

The main application files are at the root level following Node.js conventions. The `app/` folder contains all server-side application code, `scrape/` contains standalone data scraping tools, and `public/` contains frontend assets.

Note: This project uses ESM modules (package.json contains `"type": "module"`). For local development run `node server.js` (this file is a thin wrapper that starts `app.js`). In production (Vercel) `app.js` is used directly as the server entry.
