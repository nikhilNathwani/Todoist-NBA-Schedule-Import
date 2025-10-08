# Todoist NBA Schedule Saver

This project imports NBA team schedules into Todoist as tasks.

## Project Structure

```
├── package.json           # Node.js dependencies
├── server.js              # Express server entry point
├── app.js                 # Main application logic
├── vercel.json            # Vercel deployment config
├── backend/               # Backend server code
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

For detailed annual update workflow, see [YEARLY-WORKFLOW.md](YEARLY-WORKFLOW.md).

## Development

The main application files are at the root level following Node.js conventions. The `backend/` folder contains all backend web application code, `scrape/` contains standalone data scraping tools, and `public/` contains frontend assets.
