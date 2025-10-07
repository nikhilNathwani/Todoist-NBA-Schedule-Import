# Todoist NBA Schedule Saver

This project imports NBA team schedules into Todoist as tasks.

## Project Structure

```
├── package.json           # Node.js dependencies
├── server.js              # Express server entry point
├── app.js                 # Main application logic
├── vercel.json            # Vercel deployment config
├── routes/                # Express route handlers
├── public/                # Static assets (CSS, JS, images)
├── utils/                 # Shared application utilities
├── scrape/                # NBA schedule scraping scripts
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
cd scrape
python3 main.py
```

## Development

The main application files are at the root level following Node.js conventions. The `utils/` folder contains shared application utilities, `scrape/` contains NBA data scraping scripts, and `data/` contains the application data files.
