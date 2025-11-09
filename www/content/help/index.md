+++
title = "Help"
+++

<style>
.help-buttons {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}
.help-buttons .btn {
  padding: 8px 20px !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.help-buttons .btn:hover {
  text-decoration: none;
}
</style>

<div class="help-buttons">
  <a href="/discord" class="btn">💬 Discord</a>
  <a href="https://github.com/bigskysoftware/htmx/issues" class="btn">🐛 Github Issues</a>
  <a href="https://twitter.com/htmx_org" class="btn">𝕏 Twitter</a>
  <a href="https://www.reddit.com/r/htmx/" class="btn">🔴 Reddit</a>
  <a href="https://github.com/sponsors/bigskysoftware" class="btn">❤️ Sponsor</a>
  <a href="/webring" class="btn">🔗 Webring</a>
  <a href="mailto:htmx@bigsky.software" class="btn">✉️ Email</a>
</div>

## Books

<style>
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}
.book-card {
  text-align: center;
  text-decoration: none;
  display: block;
  transition: transform 0.2s;
}
.book-card:hover {
  transform: translateY(-5px);
  text-decoration: none;
}
.book-card img {
  width: 100%;
  height: auto;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  border-radius: 4px;
  margin-bottom: 1rem;
}
.book-card .book-title {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
  line-height: 1.3;
}
</style>

<div class="book-grid">
  <a href="https://www.amazon.com/Hypermedia-Systems-Carson-Gross/dp/B0C9S88QV6/" class="book-card">
    <img src="/img/hypermedia-systems.png" alt="Hypermedia Systems">
    <div class="book-title">Hypermedia Systems</div>
  </a>

  <a href="https://www.amazon.com/Server-Driven-Web-Apps-htmx-Language/dp/B0D9N35GKP" class="book-card">
    <img src="/img/server-driven-web-apps.png" alt="Server-Driven Web Apps with htmx">
    <div class="book-title">Server-Driven Web Apps with htmx</div>
  </a>

  <a href="https://www.wimdeblauwe.com/books/modern-frontends-with-htmx/" class="book-card">
    <img src="/img/modern-frontends-htmx.jpg" alt="Modern frontends with htmx">
    <div class="book-title">Modern frontends with htmx</div>
  </a>

  <a href="https://www.amazon.co.jp/-/en/dp/4297149451/" class="book-card">
    <img src="/img/hypermedia-systems-japanese.png" alt="ハイパーメディアシステム">
    <div class="book-title">ハイパーメディアシステム (Japanese Edition)</div>
  </a>

  <a href="https://www.amazon.co.jp/-/en/dp/4863544693" class="book-card">
    <img src="/img/htmx-japanese.png" alt="HTMX">
    <div class="book-title">HTMX (Japanese)</div>
  </a>
</div>

## Team

<style>
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}
.team-card {
  text-align: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}
.team-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.team-card img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
  border: 3px solid #eee;
}
.team-card .team-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}
.team-card .team-bio {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
}
</style>

<div class="team-grid">
  <div class="team-card">
    <img src="/img/team/latent.png" alt="Michael West">
    <div class="team-name">Michael West</div>
    <div class="team-bio">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
  </div>

  <div class="team-card">
    <img src="/img/team/scriptogre.png" alt="Christian Tanul">
    <div class="team-name">Christian Tanul</div>
    <div class="team-bio">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>
  </div>

  <div class="team-card">
    <img src="/img/team/telroshan.png" alt="Vincent Thébaudl">
    <div class="team-name">Vincent Thébaudl</div>
    <div class="team-bio">A game developer who hasn't released any game yet</div>
  </div>

  <div class="team-card">
    <img src="/img/team/grug.png" alt="Carson Gross">
    <div class="team-name">Carson Gross</div>
    <div class="team-bio">Carson is an <a href="https://www.cs.montana.edu/users/grug/">academic</a> with no real-world coding experience.</div>
  </div>
</div>

## Training

[HTMX + Flask: Modern Python Web Apps, Hold the JavaScript Course by Michael Kennedy](https://training.talkpython.fm/courses/htmx-flask-modern-python-web-apps-hold-the-javascript)

## Feed & Podcasts

Site Atom Feed: [atom.xml](/atom.xml)

{{ podcasts() }}
