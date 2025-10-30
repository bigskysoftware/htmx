+++
title = "Active Search"
template = "demo.html"
+++

This pattern demonstrates active search functionality that queries as the user types.

We start with a search input and an empty table:

```html
<h3>
  Search Contacts
  <span class="htmx-indicator">
    <img src="/img/bars.svg" alt=""/> Searching...
   </span>
</h3>
<input class="form-control" type="search"
       name="search" placeholder="Begin Typing To Search Users..."
       hx-post="/search"
       hx-trigger="input changed delay:500ms, keyup[key=='Enter'], load"
       hx-target="#search-results"
       hx-indicator=".htmx-indicator">

<table class="table">
    <thead>
    <tr>
      <th>First Name</th>
      <th>Last Name</th>
      <th>Email</th>
    </tr>
    </thead>
    <tbody id="search-results">
    </tbody>
</table>
```

The input issues a `POST` to `/search` on the [`input`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) event and sets the body of the table to be the resulting content.

We add the `delay:500ms` modifier to the trigger to delay sending the query until the user stops typing. Additionally,
we add the `changed` modifier to the trigger to ensure we don't send new queries when the user doesn't change the
value of the input (e.g. they hit an arrow key, or pasted the same value).

We can use multiple triggers by separating them with a comma, this way we add 2 more triggers:
- `keyup[key=='Enter']` triggers once enter is pressed. We use [event filters](/attributes/hx-trigger#standard-event-filters) here to check for [the key property in the KeyboardEvent object](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).
- `load` in order to show all results initially on load.

Finally, we show an indicator when the search is in flight with the `hx-indicator` attribute.

{{ demoenv() }}

<script>
    //=========================================================================
    // Mock Server - Intercepts fetch requests
    //=========================================================================

    // Contact database
    const contacts = [
        { "FirstName": "Venus", "LastName": "Grimes", "Email": "lectus.rutrum@Duisa.edu" },
        { "FirstName": "Fletcher", "LastName": "Owen", "Email": "metus@Aenean.org" },
        { "FirstName": "William", "LastName": "Hale", "Email": "eu.dolor@risusodio.edu" },
        { "FirstName": "TaShya", "LastName": "Cash", "Email": "tincidunt.orci.quis@nuncnullavulputate.co.uk" },
        { "FirstName": "Kevyn", "LastName": "Hoover", "Email": "tristique.pellentesque.tellus@Cumsociis.co.uk" },
        { "FirstName": "Jakeem", "LastName": "Walker", "Email": "Morbi.vehicula.Pellentesque@faucibusorci.org" },
        { "FirstName": "Malcolm", "LastName": "Trujillo", "Email": "sagittis@velit.edu" },
        { "FirstName": "Wynne", "LastName": "Rice", "Email": "augue.id@felisorciadipiscing.edu" },
        { "FirstName": "Evangeline", "LastName": "Klein", "Email": "adipiscing.lobortis@sem.org" },
        { "FirstName": "Jennifer", "LastName": "Russell", "Email": "sapien.Aenean.massa@risus.com" },
        { "FirstName": "Rama", "LastName": "Freeman", "Email": "Proin@quamPellentesquehabitant.net" },
        { "FirstName": "Jena", "LastName": "Mathis", "Email": "non.cursus.non@Phaselluselit.com" },
        { "FirstName": "Alexandra", "LastName": "Maynard", "Email": "porta.elit.a@anequeNullam.ca" },
        { "FirstName": "Tallulah", "LastName": "Haley", "Email": "ligula@id.net" },
        { "FirstName": "Timon", "LastName": "Small", "Email": "velit.Quisque.varius@gravidaPraesent.org" },
        { "FirstName": "Randall", "LastName": "Pena", "Email": "facilisis@Donecconsectetuer.edu" },
        { "FirstName": "Conan", "LastName": "Vaughan", "Email": "luctus.sit@Classaptenttaciti.edu" },
        { "FirstName": "Dora", "LastName": "Allen", "Email": "est.arcu.ac@Vestibulumante.co.uk" },
        { "FirstName": "Aiko", "LastName": "Little", "Email": "quam.dignissim@convallisest.net" },
        { "FirstName": "Jessamine", "LastName": "Bauer", "Email": "taciti.sociosqu@nibhvulputatemauris.co.uk" },
        { "FirstName": "Gillian", "LastName": "Livingston", "Email": "justo@atiaculisquis.com" },
        { "FirstName": "Laith", "LastName": "Nicholson", "Email": "elit.pellentesque.a@diam.org" },
        { "FirstName": "Paloma", "LastName": "Alston", "Email": "cursus@metus.org" },
        { "FirstName": "Freya", "LastName": "Dunn", "Email": "Vestibulum.accumsan@metus.co.uk" },
        { "FirstName": "Griffin", "LastName": "Rice", "Email": "justo@tortordictumeu.net" },
        { "FirstName": "Catherine", "LastName": "West", "Email": "malesuada.augue@elementum.com" },
        { "FirstName": "Jena", "LastName": "Chambers", "Email": "erat.Etiam.vestibulum@quamelementumat.net" },
        { "FirstName": "Neil", "LastName": "Rodriguez", "Email": "enim@facilisis.com" },
        { "FirstName": "Freya", "LastName": "Charles", "Email": "metus@nec.net" },
        { "FirstName": "Anastasia", "LastName": "Strong", "Email": "sit@vitae.edu" },
        { "FirstName": "Bell", "LastName": "Simon", "Email": "mollis.nec.cursus@disparturientmontes.ca" },
        { "FirstName": "Minerva", "LastName": "Allison", "Email": "Donec@nequeIn.edu" },
        { "FirstName": "Yoko", "LastName": "Dawson", "Email": "neque.sed@semper.net" },
        { "FirstName": "Nadine", "LastName": "Justice", "Email": "netus@et.edu" },
        { "FirstName": "Hoyt", "LastName": "Rosa", "Email": "Nullam.ut.nisi@Aliquam.co.uk" },
        { "FirstName": "Shafira", "LastName": "Noel", "Email": "tincidunt.nunc@non.edu" },
        { "FirstName": "Jin", "LastName": "Nunez", "Email": "porttitor.tellus.non@venenatisamagna.net" },
        { "FirstName": "Barbara", "LastName": "Gay", "Email": "est.congue.a@elit.com" },
        { "FirstName": "Riley", "LastName": "Hammond", "Email": "tempor.diam@sodalesnisi.net" },
        { "FirstName": "Molly", "LastName": "Fulton", "Email": "semper@Naminterdumenim.net" },
        { "FirstName": "Dexter", "LastName": "Owen", "Email": "non.ante@odiosagittissemper.ca" },
        { "FirstName": "Kuame", "LastName": "Merritt", "Email": "ornare.placerat.orci@nisinibh.ca" },
        { "FirstName": "Maggie", "LastName": "Delgado", "Email": "Nam.ligula.elit@Cum.org" },
        { "FirstName": "Hanae", "LastName": "Washington", "Email": "nec.euismod@adipiscingelit.org" },
        { "FirstName": "Jonah", "LastName": "Cherry", "Email": "ridiculus.mus.Proin@quispede.edu" },
        { "FirstName": "Cheyenne", "LastName": "Munoz", "Email": "at@molestiesodalesMauris.edu" },
        { "FirstName": "India", "LastName": "Mack", "Email": "sem.mollis@Inmi.co.uk" },
        { "FirstName": "Lael", "LastName": "Mcneil", "Email": "porttitor@risusDonecegestas.com" },
        { "FirstName": "Jillian", "LastName": "Mckay", "Email": "vulputate.eu.odio@amagnaLorem.co.uk" },
        { "FirstName": "Shaine", "LastName": "Wright", "Email": "malesuada@pharetraQuisqueac.org" }
    ];

    // Search function
    function searchContacts(query) {
        if (!query) return contacts;

        const searchTerm = query.toLowerCase();
        return contacts.filter(contact =>
            contact.FirstName.toLowerCase().includes(searchTerm) ||
            contact.LastName.toLowerCase().includes(searchTerm) ||
            contact.Email.toLowerCase().includes(searchTerm)
        );
    }

    // Template function
    function renderResults(contacts) {
        return contacts.map(c =>
            `<tr>
                <td>${c.FirstName}</td>
                <td>${c.LastName}</td>
                <td>${c.Email}</td>
            </tr>`
        ).join('\n');
    }

    function renderSearchUI() {
        return `<h3>
Search Contacts
<span class="htmx-indicator">
<img src="/img/bars.svg" alt=""/> Searching...
</span>
</h3>

<input class="form-control" type="search"
       name="search" placeholder="Begin Typing To Search Users..."
       hx-post="/search"
       hx-trigger="input changed delay:500ms, keyup[key=='Enter'], load"
       hx-target="#search-results"
       hx-indicator=".htmx-indicator">

<table class="table">
<thead>
<tr>
  <th>First Name</th>
  <th>Last Name</th>
  <th>Email</th>
</tr>
</thead>
<tbody id="search-results">
</tbody>
</table>`;
    }

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        // Handle /init request
        if (url.includes('/init')) {
            return new Response(renderSearchUI(), {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Handle /search request
        if (url.includes('/search')) {
            // Add small delay to simulate network
            await new Promise(resolve => setTimeout(resolve, 200));

            // Parse form data from request body
            const formData = new URLSearchParams(await options.body);
            const searchQuery = formData.get('search') || '';

            const results = searchContacts(searchQuery);
            const html = renderResults(results);

            return new Response(html, {
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Pass through other requests
        return originalFetch(url, options);
    };
</script>
