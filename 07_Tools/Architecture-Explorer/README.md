# Architecture Explorer

A static, three-panel review workspace for a large Markdown architecture document. The Markdown remains the single source of truth; the explorer reads and renders it in the browser without changing it.

## Add the architecture document

Place the source file at:

```text
docs/architecture.md
```

The included workspace uses `docs/Agent_Runtime_System_v1.md`.

## Run locally

Browsers normally block `fetch()` from pages opened directly with a `file://` URL, so serve the folder with any simple static server.

With Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No installation, build step, framework, or backend is required. An internet connection is needed for the `marked.js` CDN script.

## Features

- Automatically generated, collapsible heading tree
- Active-section context and scroll tracking
- Full-document section search
- Focus mode with previous/next navigation
- Persistent review status, bookmarks, reading position, notes-compatible state, and flowchart views using `localStorage`
- Review dashboard and All / Unread / New / Changed / Bookmarked filters
- Automatically mapped Mermaid companion diagrams with zoom, fullscreen, and source copy
- Non-destructive legacy-state backup and progress export
- Markdown tables, code, blockquotes, lists, and horizontal rules
- Responsive navigation for smaller screens

## Add flowcharts

Place `.md` or `.mmd` Mermaid sources in `docs/Flowcharts`, then refresh the generated static manifest:

```powershell
.\update-flowchart-manifest.ps1
```

The explorer discovers every file in that manifest and maps diagrams to the current document path by title similarity; diagram names are not hardcoded in the app.
