+++
title = "REST Copypasta"
description = """\
  These page provides some pre-written critiques of the common misuse of the term 'REST' in modern web development, \
  contrasting it with the true REST architecture defined by Roy Fielding. Copy these ready-made responses to helpfully \
  explain how JSON/RPC is often mislabeled as REST and highlight the role of hypermedia and API specifications in \
  defining REST-ful systems. You will surely not make any enemies or regret posting these responses in any way."""
date = 2023-06-26
updated = 2023-06-26
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
[extra]
show_title = false
show_author = false
+++

## REST copy-pastas

## Ackshually...

<div style="font-family: monospace">

I'd just like to interject for a moment.  What you're referring to as REST,
is in fact, JSON/RPC, or as I've recently taken to calling it, REST-less.
JSON is not a hypermedia unto itself, but rather a plain data format made
useful by out of band information as defined by swagger documentation or
similar.

Many computer users work with a canonical version of REST every day,
without realizing it.  Through a peculiar turn of events, the version of REST
which is widely used today is often called "The Web", and many of its users are
not aware that it is basically the REST-ful architecture, defined by Roy Fielding.

There really is a REST, and these people are using it, but it is just a
part of The Web they use.  REST is the network architecture: hypermedia encodes the state
of resources for hypermedia clients. JSON is an essential part of Single Page Applications,
but useless by itself; it can only function in the context of a complete API specification.
JSON is normally used in combination with SPA libraries: the whole system
is basically RPC with JSON added, or JSON/RPC.  All these so-called "REST-ful"
APIs are really JSON/RPC.

</div>
<button _="on click
             get the innerText of the previous <div/>
             then writeText(the result) with the navigator's clipboard
             put 'Copied!' into the next <output/>
             wait 2s
             put '' into the next <output/>">
Copy
</button>
<button _="on click
             get the innerText of the previous <div/>
             get result.split('\n').map( \ l -> '  ' + l ).join('\n')
             then writeText(the result) with the navigator's clipboard
             put 'Copied for HN!' into the next <output/>
             wait 2s
             put '' into the next <output/>">
Copy For HN
</button>
<output></output>

<br/>

## l໐, t໐ thē ¢໐ຖtrคrฯ

<div style="font-family: monospace">

In a world of digital wonder, allow me to take a moment to clarify. What many name as REST is, in truth, JSON/RPC, or as
I've lately begun to refer to it, the REST-less. JSON is not a magical script unto itself, but rather a simple parchment
of data made meaningful by wisdom from unseen sources, shaped by the likes of the Swagger tomes and their ilk.

Countless keepers of the code interact with a revered form of REST each day, oblivious to its presence. Through an
unexpected twist of fate, the interpretation of REST most commonly employed today is frequently dubbed "The Web", and
many of its inhabitants are unaware that they are, in essence, dwelling within the architectural dominion of REST, as
laid out by the sage Roy Fielding.

Indeed, there exists a true REST, and these individuals are making use of it, but it is merely a facet of The Web they
engage with. REST is the great network architecture: hypermedia inscribes the state of resources for the hypermedia
voyagers. JSON is a vital element of Single Page Applications, yet worthless in solitude; it can only exhibit its power
within the realm of a comprehensive API specification. JSON is typically deployed in alliance with SPA libraries: the
entire realm is fundamentally RPC embellished with JSON, or JSON/RPC. All these entities hailed as "REST-ful" APIs are
in actuality, the embodiment of JSON/RPC.

</div>
<button _="on click
             get the innerText of the previous <div/>
             then writeText(the result) with the navigator's clipboard
             put 'Copied!' into the next <output/>
             wait 2s
             put '' into the next <output/>">
Copy
</button>
<button _="on click
             get the innerText of the previous <div/>
             get result.split('\n').map( \ l -> '  ' + l ).join('\n')
             then writeText(the result) with the navigator's clipboard
             put 'Copied for HN!' into the next <output/>
             wait 2s
             put '' into the next <output/>">
Copy For HN
</button>
<output></output>
