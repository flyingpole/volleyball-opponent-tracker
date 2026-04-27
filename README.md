# Volleyball Opponent Tracker

Static web app for tracking serve receive scores by player during volleyball scouting.

## Files

- `index.html`: app shell and markup
- `styles.css`: UI styles
- `app.js`: scoring, persistence, exports, and ranking logic
- `manifest.webmanifest`: mobile install metadata for hosted use

## Best Way To Use It

Use it from a normal hosted URL instead of opening `index.html` with `file://`.

That gives better behavior on:

- Chrome on Android
- Safari and Chrome on iPhone/iPad
- local storage persistence
- downloads for CSV and JSON
- print/PDF workflows

## Quick Hosting Options

You can host this as a plain static site on:

- GitHub Pages
- Netlify
- Cloudflare Pages
- any simple web server

## GitHub Pages

This folder is ready to publish from the repository root. In GitHub Pages,
set the source to the `main` branch and the root directory.

## Local Testing

For local testing, serve the folder with a lightweight web server instead of double-clicking the file.
