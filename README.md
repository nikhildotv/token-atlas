# Token Atlas

A simple static dashboard that visualizes **global token usage** with generated sample data. No backend or build step required.

## What’s included

- 30-day worldwide input/output volume
- Regional and model-family breakdowns
- Estimated spend summary
- Top workspace consumers table

All figures in `data.js` are fictional and for demo purposes only.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Stack

- HTML / CSS / vanilla JS
- [Chart.js](https://www.chartjs.org/) (CDN)
- Google Fonts (Outfit, IBM Plex Mono)
