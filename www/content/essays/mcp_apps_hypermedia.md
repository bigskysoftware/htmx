# Hypermedia Friendly Model Context Protocol App Architecture

### Author: Sung Oh

## Business Case
I am working on [speedystride.com](https://speedystride.com), a programming tool that helps athletes quickly input workouts on their Apple and Garmin watches.

These watches come with a built-in workout programming feature that is especially useful for structured programs.
For example, runners will often do interval training, which could be something like 5x1000m with 2 minute rest.
And sometimes they'll want to do a fartlek (Swedish for 'Speed Play') where they will vary their speed: run 400 meters fast - run 800 meters slower - sprint 200 meters.
These smartwatches will vibrate and beep to help the user perform at the desired target, and also count down rest periods so the user is rested
enough for that next hard interval.

Unfortunately, I did not like any of the first party workout builders. These are form-based, with a drag-and-drop interface to structure your workouts.
I think these builders have a high user friction; more user inputs are required in proportion to the output. Additionally, these builders [run on a small watch screen](https://support.apple.com/en-gb/guide/watch/apd66fcd5c5c/watchos),
or require a separate app.
This is less than ideal when you are trying to program your watch right before a track workout. There are third party tools in this space, but as far as I can tell, they do not fundamentally break this pattern. 

I also wanted to share these workouts with everyone at my city's track club. My service provides a scheduler that pushes workouts automatically at a specified time for our club training; about 90% of our members have either an Apple Watch
or a Garmin so cross-platform compatibility is a very important factor.

To solve these problems, I came up with a very simple domain specific language (DSL) for both people and machines.
It can describe exercises, define rest times, and combine everything together into repeat intervals.
I implemented a simple recursive descent parser, and it outputs data formats for both Apple and Garmin devices.
By defining a small language, I was able to avoid implementing complex forms unlike the current offerings. User input is reduced
to plain text.

### Example workout DSL
User:
```
10x200m max effort with 2 minute rest
```

DSL:
```
Repeat 10 times:
- Run 200m @RPE 10
- Rest 2 minutes
```

I had initially wanted coaches to learn this DSL and enter programs into my website assisted by a Codemirror editor.
I incorrectly thought that it was close enough to English for people to quickly learn it when assisted by autocomplete features.
I was not meeting my users where they were at; graybeard track coaches had zero interest in learning how to program. What I needed
was a translator that could convert natural English into my DSL.


## Model Context Protocol (MCP) and MCP Apps
As I started sharing my project with other people, large language models were becoming popular, and it was an obvious tool to translate natural English workouts into my training DSL.
By integrating LLMs, I can massively reduce user friction. There are no forms with complex UIs to implement. There is no DSL to learn as the AI can translate natural
language for you. Users can now express their workouts in their own way.

An AI can transform the above user input to this Domain Specific Language with a relatively small language specification. There was also a nice side effect of being very token efficient.
JSON payloads defining a repeated workout set can get quite large while my DSL can stay compact.
Any errors can be corrected as my parser can provide rich feedback on what went wrong. I have found that 95% of interval workouts I see can be expressed through my language.

LLMs also enable new capabilities, such as programming your watch from a photo of a whiteboard.
Even more importantly, Model Context Protocol (MCP) was starting to gain traction. MCPs are a way for LLM systems to interact with the real world, which means that besides
just outputting workout programs, the LLM can call a remote function to actually send that workout to your device.

Anthropic and OpenAI both support MCP. So it would be awesome for my business to support LLM integrations since so many users already have Claude and ChatGPT installed on their phone.

Still, there were opportunities to further improve user experience.

I had mentioned earlier that my track club uses speedystride.com to program members' watches. In order to do so, we have to define a few parameters:
* What is the workout?
* Should the workout be added to my Monday night track intervals, or for Tuesday fartleks?

LLMs can help massively with the first question. But how about the second? Much of the current human-to-LLM interaction is text-based, and MCPs are no exception.
Besides improving workout building UX, AI tools introduced new frictions. To associate a workout with an event, I had an events tool that would fetch upcoming events for the user and add them
to the LLM context. Then it was up to the LLM to guide the user. Some systems like Claude do provide simple select controls if your tools output JSON objects that look like a set of choices.
However, this interaction forces the developer to surrender control of the happy path, which often leaves users confused. Also, the AI would sometimes try to be too helpful and just guess the tool inputs.
In summary, back and forth conversation with the LLM is not an ideal UX as the users have to figure out how to guide the AI to the right inputs.

A form with a selector interface is an obvious way to solve this problem.

Luckily for me, the new MCP Apps specification was released in January 2026. This is an extension to the MCP specification
that allows rendering custom UI inside an `<iframe>` of the MCP Host.

References:
* [MCP](https://modelcontextprotocol.io/docs/getting-started/intro)
* [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview)

### MCP App Architecture

You need to host an MCP server that can communicate with the AI systems.

#### Communication model:
```
MCP Server <-Proxied Request-> LLM Host (Claude or ChatGPT) <-App Bridge-> MCP App UI (rendered inside LLM <iframe>)
```

All traffic between the MCP App UI and the LLM host must be routed through the App Bridge. The LLM host will then make proxied requests to my MCP server.

### Interactive Hypermedia UIs in MCP Apps

Let's say that we are developing a simple workout scheduler, where we have the LLM generated workout program. Our goal is to 
associate this workout with a calendar event occurrence.
A user could have multiple events on her calendar, so a dynamic choice of occurrences should be available for each event she is subscribed to.
On a traditional website, this could be trivially handled by a full page refresh.

On MCP App systems without interactivity, we would have to ask the LLM to fully render the MCP App
in the chat. This adds friction and unnecessarily consumes tokens. So we must find a path to interactivity within the same UI context.

There are existing UI toolkits, such as [MCP-UI](https://mcpui.dev) that works really well with React. However, using React for a simple `<form>` felt too complex, so I wanted a hypermedia solution.

I initially considered using HTMX, since my HTTP site uses it already. The challenge was that HTMX is heavily geared towards processing HTTP requests.
Since my MCP App UI renders inside an `<iframe>`, I don't need to push URLs or manage history.

Then I remembered [Fixi](https://github.com/bigskysoftware/fixi) library from the creator of HTMX. It is a minimal version of generalized hypermedia controls. Fixi proved to be very useful precisely because it doesn't do much.
In addition to lacking history or URL push features, I can also copy & paste Fixi to my project to skip build steps. I also don't have to worry about CSP configuration if my Fixi code is served with my HTML.

The killer feature of Fixi is its [hackability](https://github.com/bigskysoftware/fixi?tab=readme-ov-file#mocking).
Because it expects a Response compatible object (or a Promise) rather than a strict network request, we can entirely bypass HTTP.
I can configure Fixi to call `app.callServerTool` when it sees any `fx-action` that starts with `tool:`. If I use a `<form>`, its inputs will become the function args.

Let's examine how to architect MCP features to serve hypermedia.

#### MCP App Lifecycle

From [MCP docs](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#architecture):
1. Create: Instantiate App with info and capabilities
2. Connect: Call `connect()` to establish transport and perform handshake
3. Interactive: Send requests, receive notifications, call tools
4. Cleanup: Host sends teardown request before unmounting

We will focus on items 2 and 3 to demonstrate a hypermedia driven MCP App.

#### The MCP Server

##### MCP Server Architecture
I host my server on a Gunicorn + Uvicorn monolith. ASGI Django handles regular HTTP traffic, and MCP traffic is routed to
FastMCP. Since both Django and FastMCP work together, I can share resources between the HTTP and MCP domains including
ORM and template rendering.

The LLM host will render a UI by calling an MCP **tool** and its associated **resource**.

A **tool** is similar to a view- it is a function that can return JSON or hypertext. Let's say that our UI tool is called `show_user_ui`.

A **resource** is a bit like a pointer to assets. LLM hosts can preload resources to deliver them more quickly to users.

Tools and resources are registered by `@mcp.tool` or `@mcp.resource` decorators. You could think of registration as
defining `urls.py` in Django.


Since our Django and FastMCP Applications live on the same server, we can render HTML with Django's `render_to_string` function with ORMs and templatetags.
Django 6's new [built-in template partials](https://docs.djangoproject.com/en/6.0/ref/templates/language/#template-partials) also make
template organization and partial rendering easy. This allows us to co-locate our initial UI render and our dynamic hypermedia fragments in a single file, keeping the MCP tool logic incredibly clean.

##### After lifecycle item 2: The initial MCP App render
Let's talk about the **resource** first. It points to a HTML where our Fixi and MCP App Bridge code will be placed.
```python
from django.template.loader import render_to_string

@mcp.resource(
    "ui://user_ui_resource.html",
    mime_type="text/html;profile=mcp-app",
    description="User UI resource",
)
async def user_ui_resource():
    return render_to_string("mcp/user_ui_resource.html")
```
This resource serves HTML rendered with `render_to_string` to resolve static files and template tags, but not any user-specific data.

mcp/user_ui_resource.html
```html
<html>
    <head>
        {% include "fixi, app bridge source code, styles, etc" %}
        
        <style>
            /* CSS indicator classes to toggle visibility during requests */
            #indicator {
                display: none;
            }
            #indicator.fixi-request-in-flight {
                display: inline-block;
            }
        </style>
        
        <script type="module">
            ...MCP App bridge setup...
        
            // 1. Configure Fixi to route `tool:` fx-actions through MCP App bridge
            document.addEventListener("fx:config", (evt) => {
                const action = evt.detail.cfg.action;
                if (action.startsWith("tool:")) {
                    const toolName = action.replace("tool:", "");
                    console.log(`callServerTool: ${toolName}`);
                    const args = Object.fromEntries(evt.detail.cfg.body ?? []);
                    evt.detail.cfg.fetch = async () => {
                        const result = await app.callServerTool({name: toolName, arguments: args});
                        return {text: async () => result.structuredContent?.html};
                    };
                }
            });
            
            // 2. Set up request indicator extension: ext-fx-indicator
            document.addEventListener("fx:init", (evt) => {
                if (evt.target.matches("[ext-fx-indicator]")) {
                    let disableSelector = evt.target.getAttribute("ext-fx-indicator")
                    evt.target.addEventListener("fx:before", () => {
                        let disableTarget = disableSelector === "" ? evt.target : document.querySelector(disableSelector)
                        disableTarget.classList.add("fixi-request-in-flight")
                        evt.target.addEventListener("fx:after", (afterEvt) => {
                            if (afterEvt.target === evt.target) {
                                disableTarget.classList.remove("fixi-request-in-flight")
                            }
                        })
                    })
                }
            });
            
            // 3. Populate UI on initial render with dynamic content fetched with `show_user_ui` tool
            app.ontoolresult = (params) => {
                document.body.innerHTML = params.structuredContent?.html ?? document.body.innerHTML;
            };
        </script>
    </head>
    
    {# Empty body, since `app.ontoolresult` will populate it on load #}
    <body></body>

    {% partialdef save-form-fragment %}
        <div id="save-form-fragment">
        Workout {{ workout.id }} has been saved for {{ workout.occurrence.event.id }} on {{ workout.occurrence.start_date }}.
        </div>
    {% endpartialdef %}
    
    {% partialdef main-contents %}
        <div id="main-contents">
            <form>
                <input name="workout_dsl" type="hidden" value="{{workout_dsl}}">
                
                <select
                    id="event-selector"
                    name="event_id"
                    fx-action="tool:render_occurrences_fragment"
                    fx-target="#occurrence-fragment"
                    fx-swap="outerHTML"
                >
                    <option>-----</option>
                    {% for evt in events %}
                        <option value="{{ evt.id }}">{{ evt.name }}</option>                
                    {% endfor %}
                </select>
                
                {% partialdef occurrence-fragment inline %}
                    <select id="occurrence-fragment" name="occurrence_id">
                        {% for occ in occurrences %}
                            <option value="{{ occ.id }}">{{ occ.start_date }}</option>
                        {% endfor %}
                    </select>
                {% endpartialdef %}
                
                <button
                    type="submit"
                    fx-action="tool:save_form_fragment"
                    fx-swap="outerHTML"
                    fx-target="#main-contents"
                    ext-fx-indicator
                >
                    <span>Save Workout</span>
                    <svg id="indicator">...</svg>
                </button>
            </form>
        </div>
    {% endpartialdef %}
</html>
```

This HTML resource defines three core pieces of logic within its `<script>` tag:

1. Event listener for `fx:config`: We can use `fx-action` attribute to make MCP tool calls.
2. Event listener for `fx:init`: Set up an indicator to show that a tool call is being processed.
3. Handle `app.ontoolresult`: Display the main UI with the output by processing `CallToolResult`.

The LLM will load the **resource** in the chat, and then call `show_user_ui` **tool**, which renders the `main-contents` template partial.

```python
from django.template.loader import render_to_string

from mcp.server.fastmcp import FastMCP
from mcp.server.fastmcp import Context
from mcp.types import CallToolResult

from events.models import Events, Occurrences
from workout_validator import validate_program, DSLValidationError

mcp = FastMCP(...)
    
@mcp.tool(
    name="show_user_ui",
    description="Display UI",
    meta={"ui/resourceUri": "ui://user_ui_resource.html"}
)
async def show_user_ui(ctx: Context, workout_dsl: str) -> CallToolResult:
    user = await get_user_from_context(ctx)
    
    try:
        validate_workout = validate_program(workout_dsl)
    except DSLValidationError as e:
        ...handle invalid workout data...
    
    initial_events_qs = Events.objects.filter(user=user)
    initial_events = [evt async for evt in initial_events_qs.aiterator()]
    
    if len(initial_events) > 0:
        initial_occurrences_qs = Occurrences.objects.select_related("event").filter(event_id=initial_events[0]).order_by("start_date")
        initial_occurrences = [occ async for occ in initial_occurrences_qs.aiterator()]
    else:
        initial_occurrences = []
    
    template_context = {"user": user, "workout_dsl": workout_dsl, "events": initial_events, "occurrences": initial_occurrences}    
    rendered_html = render_to_string("mcp/user_ui_resource.html#main-contents", template_context)
    
    return CallToolResult(
        content=[TextContent(type="text", text="UI ready")],
        structuredContent={"html": rendered_html}
    )
```

Args for `show_user_ui`:
* `ctx`: object will allow us to authenticate our users, and is passed to our tool by the LLM host.
* `workout_dsl`: AI will generate and pass this parameter. We will render our HTML with this data stored in `<input type="hidden">` and save it later.

Return values from `show_user_ui`:
* content: An array of text or other data to show the User/LLM
* structuredContent: Rendered hypertext

MCP's `ontoolresult` handler will insert `structuredContent.html` into `<body>` tag to render our initial UI.

Note that this `innerHTML` assignment is reasonably safe in our context. The only untrusted input here is AI generated
`workout_dsl`, and we run validation on it before rendering our template.

#### Lifecycle 3: Rendering Hypermedia Fragments

Now we have a full `<form>` with two `<select>` controls. How do we add interactivity for our event occurrence selectors? 
Every time the user changes `#event-selector` option, we should update our options shown in `#occurrence-fragment` with a new tool.
We need to use template fragments to fetch occurrence options for different events without triggering another UI render.

Let's first examine how Fixi will trigger a fragment request. Scroll back above and read `#event-selector` defined in `#main-contents`.

We see these Fixi attributes:
* fx-action: Calls `render_occurrences_fragment` MCP tool. Fixi will bind `fx-action` to appropriate default events, such as `change` for `<select>`.
* fx-target: Insert `render_occurrences_fragment` tool's HTML output in the `#occurrence-fragment` div
* fx-swap: Use `outerHTML` swap on `#occurrence-fragment`, which replaces this div instead of inserting contents.

Below shows occurrence HTML fragment rendering `occurrence-fragment` Django template partial. This tool's output will replace `#occurrence-fragment`.

```python
from events.models import Occurrences

@mcp.tool(
    name="render_occurrences_fragment",
    description="Fetches event occurrences available to the logged in user",
    meta={"ui": {"visibility": ["app"]}}
)
async def render_occurrences_fragment(ctx: Context, event_id) -> CallToolResult:
    
    ...validate event_id and authenticate user...
    
    occurrences_qs = Occurrences.objects.select_related("event").filter(
        event_id=event_id
    ).order_by("start_date")
    occurrences = [occ async for occ in occurrences_qs.aiterator()]
    
    rendered_html = render_to_string("mcp/user_ui_resource.html#occurrence-fragment", {"occurrences": occurrences})
    return CallToolResult(
        text="Here are this user's event occurrences",
        structuredContent={"html": rendered_html}
    )
```
>It does not make sense for LLM to fetch this HTML fragment by itself, so we can set `meta={"ui": {"visibility": ["app"]}}` registration parameter to prevent unnecessary tool calling.

Finally, let's submit this form. This action is triggered by `<button>`, and all of the `<form>` fields will be sent to
`save_form_fragment` as function args.

```python
from workouts.models import Workout
from events.models import Events, Occurrences

@mcp.tool(
    name="save_form_fragment",
    description="Saves workout",
    meta={"ui": {"visibility": ["app"]}}
)
async def save_form_fragment(ctx: Context, workout_dsl, event_id, occurrence_id) -> CallToolResult:
    ...validate args and authenticate user...
    occurrence = await Occurrences.objects.select_related("event").aget(id=occurrence_id, event_id=event_id)
    workout = await Workout.objects.acreate(occurrence=occurrence, workout_dsl=workout_dsl)
    
    # Render the events fragment
    rendered_html = render_to_string("mcp/user_ui_resource.html#save-form-fragment", {"workout": workout})
    return CallToolResult(
        text="Workout saved",
        structuredContent={"html": rendered_html}
    )
```
The submit indicator is defined by configuring Fixi event `fx:init` to add `.fixi-request-in-flight` class to `#indicator` SVG inside our submit button if it has `ext-fx-indicator` attribute.
After this, the interaction cycle is finished. If the user wants to make modifications, she can ask the AI to render a new UI or visit the website to make quick changes.


## Conclusion
I hope to have demonstrated a simple way to develop user interfaces that work well with AI.
MCP Apps introduce a new rendering environment, but hypermedia systems continue to work well in this context with some modifications.

This is worth emphasizing because the current zeitgeist when building with AI is to reach for a client-side framework.
But the constraints of MCP Apps actually push in the opposite direction. Your `<iframe>` cannot talk directly to your server and every interaction must cross the bridge.
The less state and logic you pack into the client, the less surface area you have for things to go wrong across that boundary.

Throughout my design process, I tried to channel Nintendo's Gunpei Yokoi: What can we do with old-fashioned technology using lateral thinking?
I was able to sidestep complex drag-and-drop form builders by combining a small DSL with AI and hypermedia.
Integrating MCP Apps solved the friction of coaxing the AI to select the right inputs, and using hypermedia made the entire system almost trivially simple: forms, selectors, fragment updates, loading indicators.
Simplicity does not guarantee success, but I think that it will give me a better fighting chance.

Special thanks to Carson Gross for creating Fixi, HTMX, and Hyperscript, and for encouraging me to write this post.
