# Travel Chronicles

A personal travel guide — a static web app for browsing detailed trip itineraries, including day-by-day schedules, accommodation, transport, budget breakdowns, and route maps.

## Features

- Trip index with stats (countries, days abroad, adventures)
- Per-trip detail page with tabbed sections: itinerary, hotels, route, budget, notes
- Budget summary with LKR / USD equivalents
- Fully static — no build step, no dependencies to install

## Project Structure

```
├── index.html       # Trip listing page
├── tour.html        # Individual trip detail page
├── script.js        # All JS logic (index + tour rendering)
├── styles.css       # Styles
└── data/
    ├── tours.json   # Registry of available trips (list of filenames)
    └── srilanka.json
```

## Adding a Trip

1. Create `data/<trip-id>.json` following the schema in `srilanka.json`
2. Add the filename to `data/tours.json`

The trip will appear automatically on the index page.

## Running Locally

Open `index.html` in a browser, or serve with any static file server:

```sh
npx serve .
# or
python3 -m http.server
```

## Current Trips

| Destination | Dates | Duration | Travelers |
|---|---|---|---|
| Sri Lanka (Kandy · Ella · Colombo) | 24–31 May 2026 | 8 days | Couple |
