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

## Deploy to AWS (S3)

Requires AWS credentials with permission to create/manage S3 buckets and objects.

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1   # optional
# optional: export AWS_S3_BUCKET=my-unique-bucket-name

./deploy/aws-s3.sh
```

The script creates a public S3 website bucket (if needed), uploads the static files, and prints the website URL.

