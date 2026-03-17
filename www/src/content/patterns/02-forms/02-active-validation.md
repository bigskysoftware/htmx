---
title: Active Validation
description: Validate form input as you type
icon: "icon-[mdi--check]"
---

<script>
server.get("/demo", () =>
  `<div class="w-full max-w-sm mx-auto starting:opacity-0 transition duration-300">
    <form class="flex flex-col gap-1" autocomplete="off">
      <div class="mb-6">
        <label for="username" class="block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">Username</label>
        <div class="relative">
          <input name="username" id="username" class="block w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none transition-shadow focus:border-neutral-400 dark:focus:border-neutral-500" placeholder="e.g. johndoe"
                 hx-post="/check-username"
                 hx-trigger="input changed delay:300ms"
                 hx-target="#username-msg"
                 hx-swap="innerMorph"
                 autocomplete="new-password" data-1p-ignore>
          <div id="username-msg" class="absolute right-0 -bottom-6.5 text-right"></div>
        </div>
      </div>
      <div class="mb-6">
        <label for="password" class="block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3">Password</label>
        <div class="relative">
          <input name="password" id="password" type="password" class="block w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none transition-shadow focus:border-neutral-400 dark:focus:border-neutral-500" placeholder="••••••••"
                 hx-post="/check-password"
                 hx-trigger="input changed delay:200ms"
                 hx-target="#password-msg"
                 hx-swap="innerMorph"
                 autocomplete="new-password" data-1p-ignore>
          <div id="password-msg" class="absolute right-0 -bottom-6.5 text-right"></div>
        </div>
      </div>
      <button type="button" onclick="this.closest('form').reset(); document.getElementById('username-msg').innerHTML=''; document.getElementById('password-msg').innerHTML='';" class="w-full mt-1 px-5 py-2.5 text-sm font-medium rounded-md text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 cursor-pointer hover:bg-neutral-700 dark:hover:bg-neutral-300 active:scale-[0.98] transition">Sign up</button>
    </form>
  </div>`);

server.post(/\/check-username.*/, (req) => {
  const taken = ["admin", "htmx", "test", "user", "root", "moderator"];
  const raw = (req.params.username || '').trim();
  const name = raw.toLowerCase();
  if (!name) return '<span></span>';
  if (name.length < 3) return `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-red-600 dark:text-red-400">Must be at least 3 characters.</span>`;
  if (!/^[a-z0-9_]+$/.test(name)) return `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-red-600 dark:text-red-400">Only letters, numbers, and underscores.</span>`;
  if (taken.includes(name)) return `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-red-600 dark:text-red-400">"${raw}" is already taken.</span>`;
  return { delay: 150, body: `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-green-700 dark:text-green-400">${raw} is available!</span>` };
});

server.post(/\/check-password.*/, (req) => {
  const pw = req.params.password || '';
  if (!pw) return '<span></span>';
  if (pw.length < 6) return `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-red-600 dark:text-red-400">Too short.</span>`;
  if (pw.length < 10) return `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-amber-600 dark:text-amber-400">Decent password.</span>`;
  return `<span class="text-[0.675rem] starting:opacity-0 transition-opacity duration-200 text-green-700 dark:text-green-400">Strong password.</span>`;
});

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex items-center justify-center min-h-[400px]"></div>

## Basic usage

On the client, the input validates on each keystroke (debounced).

```html
<input name="username"
       hx-post="/check-username"
       hx-trigger="input changed delay:300ms"
       hx-target="next span">

<span></span>
```

- [`hx-post`](/reference/attributes/hx-post) sends the value to `/check-username`.
- [`hx-trigger`](/reference/attributes/hx-trigger) fires on [`input`](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) after a 300ms [`delay`](/reference/attributes/hx-trigger#delay), and only when the value has [`changed`](/reference/attributes/hx-trigger#changed).
- [`hx-target`](/reference/attributes/hx-target)=[`"next span"`](/reference/attributes/hx-target#relative-targets) puts the response into the next sibling `<span>`.

On the server, respond with a validation message:

```html
<span class="error">That username is taken.</span>
```

Or an empty `<span>` when valid.
