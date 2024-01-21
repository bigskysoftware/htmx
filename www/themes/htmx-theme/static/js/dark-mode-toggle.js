class CustomComponent extends HTMLElement {

  // Adds a button to the top right
  // Click event adds '.dark' class to body element

  constructor() {
    super();

    this.attachShadow({
      mode: 'open'
    });

    const button = document.createElement('button');

    button.setAttribute('id', 'toggle-btn')
    button.addEventListener('click', this.toggleDarkMode.bind(this));

    button.innerHTML = `<i class="icon-moon"><svg width="24px" height="24px" stroke-width="1.49" viewBox="0 0 24 24" fill="none" color="var(--color-light, #0f0)"><path d="M3 11.507a9.493 9.493 0 0018 4.219c-8.507 0-12.726-4.22-12.726-12.726A9.494 9.494 0 003 11.507z" stroke="var(--color-light, #ccc)" stroke-width="1.49" stroke-linecap="round" stroke-linejoin="round"></path></svg></i><i class="icon-sun"><svg width="24px" height="24px" stroke-width="1.49" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" color="var(--color-dark, #333)"><path d="M12 18a6 6 0 100-12 6 6 0 000 12zM22 12h1M12 2V1M12 23v-1M20 20l-1-1M20 4l-1 1M4 20l1-1M4 4l1 1M1 12h1" stroke="var(--color-dark, #333)" stroke-width="1.49" stroke-linecap="round" stroke-linejoin="round"  fill="var(--color-dark, #333)"></path></svg></i>`

    this.shadowRoot.appendChild(button);

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (prefersDark || isDarkMode) {
      document.body.classList.add('dark');
      button.classList.add('dark');
    }

    const style = document.createElement('style');

    style.textContent = `
      :host {

          // --color-light: #f0f;
          // --color-dark: #0f0;
      }

      @media(max-width:45rem) {
        :host {
          position: relative;
          margin: 10px;
        }
      }
      @media(min-width:45em) {
        :host {
          position: absolute;
          top: 20px;
          right: 20px;
        }
      }
      #toggle-btn {
          background: none;
          border: 0;
          cursor: pointer;
          padding: 0px;
      }
     .dark .icon-sun,  .icon-moon {
          display: none;
      }
     .dark .icon-moon,  .icon-sun {
          display: block;
      }
    `;
    this.shadowRoot.appendChild(style);
  }

  toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);

    const btn = this.shadowRoot.querySelector('#toggle-btn')
    btn.classList.toggle('dark')
  }

}

customElements.define('dark-mode-toggle', CustomComponent);