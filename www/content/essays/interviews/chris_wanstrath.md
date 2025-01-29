+++
title = "An interview with Chris Wanstrath aka @defunkt, Creator of pjax"
description = """\
  This article features an in-depth interview with Chris Wanstrath (defunkt), the co-founder of GitHub and creator of \
  pjax, where he discusses his journey from early web development to creating pjax, an innovative JavaScript library \
  that helped bridge the gap between traditional web navigation and dynamic content loading."""
date = 2025-01-27
updated = 2025-01-27
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

I'm very excited to be able to interview @defunkt, the author of [pjax](https://github.com/defunkt/jquery-pjax), an
early hypermedia-oriented javascript library that served as an inspiration for intercooler.js, which later became
htmx. He's done a few other things too, like co-founding GitHub, but in this interview I want to focus on pjax, how it
came to be, what influenced it and what it in turn influenced.

Thank you for agreeing to an interview @defunkt!

Q: To begin with, why don't you give the readers a bit of your background both professionally & technically:

> I think I can sum up most of my technical background in two quick anecdotes:
> 
> 1. For "show and tell" in 6th grade, I brought in a printout of a web page I had made - including its source code. I
>    like to imagine that everyone was impressed.
> 
> 2. Right after 7th grade, a bunch of rowdy high schoolers took me down to the local university during a Linux
>    installfest and put Red Hat on my family's old PC. That became my main computer for all of high school.
> 
> So pretty much from the start I was a web-slinging, UNIX-loving hippie.
> 
> In terms of coding, I started on QBasic using the IBM PC running OS/2 in my grandparents' basement. Then I got deep into
> MUDs (and MUSHes and MUXes and MOOs...) which were written in C and usually included their own custom scripting
> language. Writing C was "hardcoding", writing scripts was "softcoding". I had no idea what I was doing in C, but I
> really liked the softcoding aspect.
> 
> The same rowdy high schoolers who introduced me to Linux gave me the O'Reilly camel book and told me to learn Perl. I
> did not enjoy it. But they also showed me php3, and suddenly it all came together: HTML combined with MUD-like
> softcoding. I was hooked.
> 
> I tried other things like ASP 3.0 and Visual Basic, but ultimately PHP was my jam for all of high school. I loved making
> dynamic webpages, and I loved Linux servers. My friends and I had a comedy website in high school that shall remain
> nameless, and I wrote the whole mysql/php backend myself before blogging software was popular. It was so much fun.
> 
> My first year of college I switched to Gentoo and became fascinated with their package manager, which was written in
> Python. You could write real Linux tools with it, which was amazing, but at the time the web story felt weak.
> 
> I bought the huge Python O'Reilly book and was making my way through it when, randomly, I discovered Ruby on Rails. It
> hit me like a bolt of lightning and suddenly my PHP and Python days were over.
> 
> At the same time, Web 2.0 had just been coined and JavaScript was, like, "Hey, everyone. I've been here all along." So
> as I was learning Rails, I was also learning JavaScript. Rails had helpers to abstract the JS away, but I actually
> really liked the language (mostly) and wanted to learn it without relying on a framework or library.
> 
> The combination of administering my own Linux servers, writing backend code in Rails, and writing frontend code in
> JavaScript made me fall deeper in love with the web as a platform and exposed me to concepts like REST and HATEOAS.
> Which, as someone who had been writing HTML for over a decade, felt natural and made sense.
> 
> GitHub launched in 2008 powered by, surprise, Gentoo, Rails, and JavaScript. But due to GitHub's position as not just a
> Rails community, but a collection of programming communities, I quickly evolved into a massive polyglot.
> 
> I went back and learned Python, competing in a few programming competitions like Django Dash and attending (and
> speaking) at different PyCons. I learned Objective-C and made Mac (and later iPhone) apps. I learned Scheme and Lisp,
> eventually switching to Emacs from Vim and writing tons of Emacs Lisp. I went back and learned what all the sigils mean
> in Perl. Then Lua, Java, C++, C, even C# - I wanted to try everything.
> 
> And I'm still that way today. I've written projects in Go, Rust, Haskell, OCaml, F#, all sorts of Lisps (Chicken Scheme,
> Clojure, Racket, Gambit), and more. I've written a dozen programming languages, including a few that can actually do
> something. Right now I'm learning Zig.
> 
> But I always go back to the web. It's why I created the Atom text editor using web technologies, it's why Electron
> exists, and it's why I just cofounded the Ladybird Browser Initiative with Andreas Kling to develop the independent,
> open source Ladybird web browser.

Q: Can you give me the history of how pjax came to be?

> It all starts with XMLHttpRequest, of course. Ajax. When I was growing up, walking to school both ways uphill in the
> snow, the web was simple: you clicked on a link and a new web page loaded. Nothing fancy. It was a thing of beauty, and
> it was good.
> 
> Then folks started building email clients and all sorts of application-like programs in HTML using `<frames>` and
> friends. It was not very beautiful, and not very good, but there was something there.
> 
> Luckily, in the mid-2000s, Gmail and Ajax changed things. Hotmail had been around for a while, but Gmail was fast. By
> updating content without a full page load using XMLHttpRequest, you could make a webpage that felt like a desktop
> application without resorting to frames or other chicanery. And while other sites had used Ajax before Gmail, Gmail
> became so popular that it really put this technique on the map.
> 
> Soon Ajax, along with the ability to add rounded corners to web pages, ushered in the era known as Web 2.0. By 2010,
> more and more web developers were pushing more and more of their code into JavaScript and loading dynamic content with
> Ajax. There was just one problem: in the original, good model of the web, each page had a unique URL that you could use
> to load its content in any context. This is one of the innovations of the web. When using Ajax, however, the URL doesn't
> change. And even worse, it can't be changed - not the part that gets read by the server, anyway. The web was broken.
> 
> As is tradition, developers created hacks to work around this limitation. The era of the #! began, pioneered by
> Ajax-heavy sites like Facebook and Twitter. Instead of http://twitter.com/htmx_org, you'd
> see http://twitter.com/#!/htmx_org in your browser's URL bar when visiting someone's profile. The # was traditionally
> used for anchor tags, to link to a sub-section within a full web page, and could be modified by JavaScript. These
> ancient web 2.0 developers took advantage of #'s malleability and started using it to represent permanent content that
> could be updated inline, much like a real URL. The only problem was that your server code never saw the # part of a URL
> when serving a request, so now you needed to start changing your backend architecture to make everything work.
> 
> Oh, and it was all very buggy. That was a problem too.
> 
> As an HTTP purist, I detested the #!. But I didn't have a better way.
> 
> Time passed and lo, a solution appeared. One magical day, the #!s quietly disappeared from Facebook, replaced by good
> old fashioned URLs. Had they abandoned Web 2.0? No... they had found a better way.
> 
> The `history.pushState()` function, along with its sibling `history.replaceState()`, had been recently added to all
> major web browsers. Facebook quickly took advantage of this new API to update the full URL in your browser whenever
> changing content via Ajax, returning the web to its previous glory.
> 
> And so there it was: the Missing Link.
> 
> We had our solution, but now a new problem: GitHub was not an SPA, and I didn't want it to be one. By 2011 I had been
> writing JavaScript for six years - more than enough time to know that too much JS is a terrible thing. The original
> GitHub Issue Tracker was a Gmail-style web application built entirely in JS, circa 2009. It was an awful experience for
> me, GitHub developers, and, ultimately, our users.
> 
> That said, I still believed Ajax could dramatically speed up a web page's user interface and improve the overall
> experience. I just didn't want to do it by writing lots of, or any, JavaScript. I liked the simple request/response
> paradigm that the web was built on.
> 
> Thus, Pjax was born. It sped up GitHub's UI by loading new pages via Ajax instead of full page loads, correctly updating
> URLs while not requiring any JS beyond the Pjax library itself. Our developers could just tag a link with `[data-pjax]`
> and our backend application would then automatically render a page's content without any layout, quickly getting you
> just the data you need without asking the browser to reload any JS or CSS or HTML that didn't need to change. It also (
> mostly) worked with the back button, just like regular web pages, and it had a JS API if you did need to dip into the
> dark side and write something custom.
> 
> The first commit to Pjax was Feb 26, 2011 and it was released publicly in late March 2011, after we had been using it to
> power GitHub.com for some time.

Q: I recall it being a big deal in the rails community. Did the advent of turbolinks hurt adoption there?

> My goal wasn't really adoption of the library. If it was, I probably would have put in the work to decouple it from
> jQuery. At the time, I was deep in building GitHub and wasn't the best steward of my many existing open source projects.
> 
> What I wanted instead was adoption of the idea - I wanted people to know about `pushState()`, and I wanted people to
> know there were ways to build websites other than just doing everything by hand in JavaScript. Rendering pages in whole
> or in part on the server was still viable, and could be sped up using modern techniques.
> 
> Turbolinks being created and integrated into Rails was amazing to see, and not entirely unsurprising. I was a huge fan
> of Sam Stephenson's work even pre-GitHub, and we had very similiar ideas about HTTP and the web. Part of my thinking was
> influenced by him and the Rails community, and part of what drew me to the Rails community was the shared ideas around
> what's great about the web.
> 
> Besides being coupled to jQuery, pjax's approach was quite limited. It was a simple library. I knew that other people
> could take it further, and I'm glad they did.

Q: How much "theory" was there to pjax? Did you think much about hypermedia, REST, etc. when you were building it? (
I backed into the theory after I had built intercooler, curious how it went for you!)

> Not much. It started by appending `?pjax=1` to every request, but before release we switched it to send an `X-PJAX`
> header instead. Very fancy.
> 
> Early GitHub developer Rick Olson (@technoweenie), also from the Rails community, was the person who introduced me to
> HATEOAS and drove that philosophy in GitHub's API. So anything good about Pjax came from him and Josh Peek, another
> early Rails-er.
> 
> My focus was mostly on the user experience, the developer experience, and trying to stick to what made the web great.

- First commit: https://github.com/defunkt/jquery-pjax/commit/3efcc3c
- X-PJAX: https://github.com/defunkt/jquery-pjax/commit/4367ec9
