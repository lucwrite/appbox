# AppBox

Paste code from an AI assistant, add a custom icon, and download a single
`index.html` you can double-click to launch — no server, no build step, no
install.

## How it works

1. Paste code (a full HTML page, or just a snippet — either works).
2. Optionally add an icon: auto-generated from the app name, an emoji, or an
   uploaded image.
3. Preview it live, then download `index.html`.

The bundler (`lib/bundle.ts`) detects whether the pasted code is already a
full HTML document or just a fragment, and either injects the title/favicon
into the existing `<head>` or wraps the fragment in HTML boilerplate. Icons
are embedded as base64 data URIs so the output file is fully self-contained.

## Stack

Next.js (App Router) + Tailwind, entirely client-side — no API routes or
backend.

## Dev

```bash
npm install
npm run dev
```
