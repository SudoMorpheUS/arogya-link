# 07 — Frontend and UI

**Goal:** one consistent, clean healthcare dashboard used by all three roles. Build the base once, then reuse it.

## Layout
- Left sidebar (links depend on role), top bar (user name, logout), main content, summary cards, tables, forms, confirmation dialogs.
- Template inheritance: `base.html` has the shell; each page fills a `content` block. Sidebar links are rendered per role.

## Visual style
- Light background, dark navy text, teal/blue accents, rounded cards, consistent spacing.
- Status badges with text + colour: Active, Revoked, Expired, Allowed, Denied.
- Define colours as CSS variables in `static/css/style.css` (`--navy`, `--teal`, `--bg`, `--danger`, ...).
- Desktop first; add `@media (max-width: 768px)` so the sidebar collapses and tables scroll horizontally.

## `static/js/api.js` (build this first; every page uses it)
```javascript
const csrf = document.querySelector('meta[name="csrf-token"]')?.content;

async function api(url, options = {}) {
  const res = await fetch(url, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
    body: options.body ? JSON.stringify(options.body) : undefined,
    credentials: "same-origin",
  });
  if (res.status === 401) { window.location = "/login"; return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || "Something went wrong");
  return data;
}
```

## Reusable pieces
- `renderTable(columns, rows, el)`, pagination control, `showToast(msg, type)`, `confirmDialog(msg)`.
- States for every data view: loading spinner, empty message, error banner, success toast, form validation errors.
- Use `textContent` (or Jinja auto-escaping) for any data from the database. Do not put database text into `innerHTML`.

## Page checklist
| Role | Pages |
|---|---|
| All | Login, 403/404 page |
| Patient | Dashboard, profile, history, visit detail, prescriptions, labs, consents, access history |
| Doctor | Dashboard, search, patient history, new visit, duplicates, my access log |
| Admin | Dashboard + charts, hospitals, doctors, users, audit |

## Working in parallel
1. Agree on JSON shapes (see `02`–`06` endpoint tables).
2. Frontend builds against a small `static/mock/*.json` set or hard-coded fetch stubs.
3. As each backend endpoint lands, switch the page to the real call.
4. Before the demo: search the code for "mock" and remove every leftover.

## Done when
- [ ] Every page works with real API data
- [ ] Loading, empty, error and denied states exist
- [ ] Sensitive actions (revoke consent, disable user) ask for confirmation
- [ ] Usable on a phone-width screen
