---
title: "Lazy Load"
description: Load content after the page renders
icon: "icon-[bitcoin-icons--visible-filled]"
---
This pattern loads content after the page renders using `hx-trigger="load"`. The browser fires the request as soon as the element enters the DOM, letting you defer heavy content until it is actually needed.

A placeholder element triggers a `GET` on load:

```html
<div hx-get="/weather" hx-trigger="load">
  <div class="loading-placeholder">Loading...</div>
</div>
```

htmx replaces the placeholder with the server response. A settling CSS transition fades the new content in smoothly:

```css
.htmx-settling > div { opacity: 0; }
#demo-content div { transition: opacity 300ms ease-in; }
```

_During the settle phase htmx briefly adds `.htmx-settling` to the parent, starting the element at `opacity: 0`. The transition then eases it to full visibility._

<script>
server.get("/demo", () => `
<div hx-get="/weather" hx-trigger="load" hx-swap="innerHTML settle:300ms">
  <div class="loading-placeholder">
    <span class="spinner"></span>
    Loading forecast...
  </div>
</div>`);

server.get("/weather", () => ({ delay: 1500, body: `
<div class="weather-card">
  <div class="weather-header">
    <span class="weather-icon">&#9729;</span>
    <span class="weather-title">5-Day Forecast</span>
  </div>
  <div class="weather-grid">
    <div class="weather-day"><strong>Mon</strong><span>72 &deg;F</span><span class="weather-desc">Sunny</span></div>
    <div class="weather-day"><strong>Tue</strong><span>68 &deg;F</span><span class="weather-desc">Cloudy</span></div>
    <div class="weather-day"><strong>Wed</strong><span>65 &deg;F</span><span class="weather-desc">Rain</span></div>
    <div class="weather-day"><strong>Thu</strong><span>70 &deg;F</span><span class="weather-desc">Partly cloudy</span></div>
    <div class="weather-day"><strong>Fri</strong><span>74 &deg;F</span><span class="weather-desc">Sunny</span></div>
  </div>
</div>` }));

server.start("/demo");
</script>

<style>
#demo-content .htmx-settling > div { opacity: 0; }
#demo-content div { transition: opacity 300ms ease-in; }

#demo-content .loading-placeholder {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 2rem; justify-content: center;
  color: #6b7280; font-size: 0.875rem;
}

#demo-content .spinner {
  display: inline-block; width: 1rem; height: 1rem;
  border: 2px solid #d1d5db; border-top-color: #6b7280;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

#demo-content .weather-card {
  border: 1px solid #e5e7eb; border-radius: 0.5rem;
  padding: 1rem 1.25rem; max-width: 28rem;
}

#demo-content .weather-header {
  display: flex; align-items: center; gap: 0.5rem;
  margin-bottom: 0.75rem; font-size: 0.9375rem; font-weight: 600;
  color: #111827;
}

#demo-content .weather-icon { font-size: 1.25rem; }

#demo-content .weather-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.25rem;
  text-align: center;
}

#demo-content .weather-day {
  display: flex; flex-direction: column; gap: 0.125rem;
  padding: 0.5rem 0.25rem; border-radius: 0.375rem;
  font-size: 0.8125rem; color: #374151;
}

#demo-content .weather-day:hover { background: #f3f4f6; }

#demo-content .weather-desc { font-size: 0.6875rem; color: #9ca3af; }

/* Dark mode */
.dark #demo-content .loading-placeholder { color: #9ca3af; }
.dark #demo-content .spinner { border-color: #4b5563; border-top-color: #9ca3af; }
.dark #demo-content .weather-card { border-color: #374151; }
.dark #demo-content .weather-header { color: #f3f4f6; }
.dark #demo-content .weather-day { color: #d1d5db; }
.dark #demo-content .weather-day:hover { background: #1f2937; }
.dark #demo-content .weather-desc { color: #6b7280; }
</style>
