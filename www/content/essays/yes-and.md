+++
title = "Yes, and..."
description = """\
  In this essay, Carson Gross discusses his advice to young people interested in computer science worried about the \
  future given the advancements in AI."""
date = 2026-02-27
updated = 2026-02-27
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

I teach computer science at [Montana State University](https://www.cs.montana.edu).  I am the father of three sons who
all know I am a computer programmer and one of whom, at least, has expressed interest in the field.  I love computer 
programming and try to communicate that love to my sons, the students in my classes and anyone else who will listen.

A question I am increasingly getting from relatives, friends and students is:

> Given AI, should I still consider becoming a computer programmer?

My response to this is: "Yes, and..."

## "Yes"

Computer programming is, fundamentally, about two things:

* Problem-solving using computers
* Learning to control complexity while solving these problems

I have a hard time imagining a future where knowing how to solve problems with computers and how to control the complexity
of those solutions is *less* valuable than it is today, so I think it will continue to be a viable career even with the
advent of AI tools.

### "You have to write the code"

That being said, I view AI as very dangerous for junior programmers because it _is_ able to effectively generate code for 
many problems.  If a junior programmer does not learn to write code and simply generates it, they are robbing 
themselves of the opportunity to develop the visceral understanding of code that comes with being down in the trenches.

Because of this, I warn my students: 

"Yes, AI can generate the code for this assignment. Don't let it. You _have_ to write the code."

I explain that, if they don't write the code, they will not be able to effectively _read_ the code.  The ability to 
read code is certainly going to be valuable, maybe _more_ valuable, in an AI-based coding future.

If you can't read the code you are going to fall into [The Sorcerer's Apprentice Trap](https://www.youtube.com/watch?v=m-W8vUXRfxU),
creating systems [you don't understand and can't control](https://www.youtube.com/watch?v=GFiWEjCedzY).

### Is Coding &rarr; Prompting like Assembly &rarr; High Level Coding?

Some people say that the move from high level languages to AI-generated code is like the move from assembly to 
[high level programming languages](https://en.wikipedia.org/wiki/High-level_programming_language).  

I do not agree with this simile.

Compilers are, for the most part, deterministic in a way that current AI tools are not.  Given a high-level programming
language construct such as a for loop or if statement, you can, with reasonable certainty, say what the generated 
assembly will look like for a given computer architecture (at least pre-optimization).

The same cannot be said for an LLM-based solution to a particular prompt.

High level programming languages are a _very good_ way to create highly specified solutions to problems 
using computers with a minimum of text in a way that assembly was not.  They eliminated a lot of
[accidental complexity](https://en.wikipedia.org/wiki/No_Silver_Bullet), leaving (assuming the code was written 
reasonably well) mostly necessary complexity.

LLM generated code, on the other hand, often does not eliminate accidental complexity and, in fact, can add
significant accidental complexity by choosing inappropriate approaches to problems, taking shortcuts, etc.  

If you can't read the code, how can you tell?

And if you want to read the code you must write the code.

### AI is a great TA

Another thing that I tell my students is that AI, used properly, is a tremendously effective TA.  If you don't use it
as a code-generator but rather as a partner to help you understand concepts and techniques, it can provide a huge boost
to your intellectual development.

One of the most difficult things when learning computer programming is getting "stuck".  You just don't see the trick 
or know where to even start well enough to make progress.  

Even worse is when you get stuck due to accidental complexity: you don't know how to work with a particular tool chain 
or even what a tool chain is.

This isn't a problem with *you*, this is a problem with your environment.  Getting stuck pointlessly robs you of time to
actually be learning and often knocks people out of computer science.  

(I got stuck trying to learn Unix on my own at Berkeley, which is one reason I dropped out of the computer science 
program there.)

AI can help you get past these roadblocks, and can be a great TA if used correctly.  I have posted an 
[AGENTS.md](https://gist.github.com/1cg/a6c6f2276a1fe5ee172282580a44a7ac) file that I provide to my students to configure
coding agents to behave like a great TA, rather than a code generator, and I encourage them to use AI in this role.

AI doesn't *have* to be a detriment to your ability to grow as a computer programmer, so long as it is used 
appropriately.

## ", and..."

I do think AI is going to change computer programming.  Not as dramatically as some people think, but in some 
fundamental ways.

### Raw coding may become less important

It may be that the *act* of coding will lose *relative* value.

I regard this as too bad: I usually like the act of coding, it is fun to make something do something with your 
(metaphorical) bare hands.  There is an art and satisfaction to writing code well, and lots of aesthetic decisions to be
made doing it.

However, it does appear that raw code writing prowess may be less important in the future.

As this becomes relatively less important, it seems to me that other skills will become more important.

### Communication Skills

For example, the ability to write, think and communicate clearly, both with LLMs and humans seems likely to be much more
important in the future.  Many computer programmers have a literary bent anyway, and this is a skill that will likely
increase in value over time and is worth working on.

Reading books and writing essays/blog posts seem like activities likely to help in this regard.

### Understanding Business

Another thing you can work on is turning some of your mental energy towards understanding a business (or government 
role, etc) better.

Computer programming is about solving problems with computers and businesses have plenty of both of these.  

Some business folks look at AI and say "Great, we don't need programmers!", but it seems just as plausible to me that
a programmer might say "Great, we don't need business people!"

I think both of these views are short-sighted, but I do think that AI can give programmers the ability to continue
fundamentally working as a programmer while *also* investing more time in understanding the real-world problems (business or 
otherwise) that they are solving.  

This dovetails well with improving communication skills.

### "Architecting" Systems

Like many computer programmers, I am ambivalent towards the term "software architect."  I have seen 
[architect astronauts](https://www.joelonsoftware.com/2001/04/21/dont-let-architecture-astronauts-scare-you/) inflict
a lot of pain on the world.

For lack of a better term, however, I think software architecture will become a more important skill over time: the 
ability to organize large software systems effectively and, crucially, to control the complexity of those systems.

A tough part of this for juniors is that traditionally the ability to architect larger solutions well has come from 
experience building smaller parts of systems, first poorly then, over time, more effectively.

Most bad architects I have met were either bad coders or simply didn't have much coding experience at all.

If you let AI take over as a code generator for the "simple" stuff, how are you going to develop the intuitions necessary
to be an effective architect?

This is why, again, you must write the code.

### Using LLMs Effectively

Another skill that seems likely to increase in value (obviously) is knowing how to use LLMs effectively.  I think that 
currently we are still in the process of figuring out what that means.  

I also think that what this means varies by experience level.

#### Seniors

Senior programmers who already have a lot of experience from the pre-AI era are in a good spot to use LLMs effectively:
they know what "good" code looks like, they have experience with building larger systems and know what matters and
what doesn't.  The danger with senior programmers is that they stop programming entirely and start suffering from 
[brain rot](https://www.media.mit.edu/publications/your-brain-on-chatgpt/).  

Particularly dangerous is firing off prompts and then getting sucked into 
[The Eternal Scroll](https://theneverendingstory.fandom.com/wiki/The_Nothing) while waiting.  

Ask me how I know.

I typically try to use LLMs in the following way:

* To analyze existing code to better understand it and find issues and inconsistencies in it
* To help organize my thoughts for larger projects I want to take on
* To generate relatively small bits of code for systems I am working on
* To generate code that I don't enjoy writing (e.g. regular expressions & CSS)
* To generate demos/exploratory code that I am willing to throw away or don't intend to maintain deeply
* To suggest tests for a particular feature I am working on

I try not to use LLMs to generate full solutions that I am going to need to support.  I will sometimes use LLMs alongside
my manual coding as I build out a solution to help me understand APIs and my options while coding.

I never let LLMs design the APIs to the systems I am building.

#### Juniors

Juniors are in a tougher spot.  I will say it again: you must write the code.

The temptation to vibe your way through problems is very, very high, but you will need to fight against that temptation.

Peers *will* be vibing their way through things and that will be annoying: you will need to work harder than they do,
and you may be criticized for being slow.  The work dynamics here are important to understand: if your company 
prioritizes speed over understanding (as many are currently) you need to accept that and not get fired.

However, I think that this is a temporary situation and that soon companies are going to realize that vibe coding at 
speed suffers from worse complexity explosion issues than well understood, deliberate coding does.  

At that point I expect slower, more deliberate coding with AI assistance will be understood as the best way to utilize 
this new technology.

Where AI _can_ help juniors is in accelerating the road to senior developer by eliminating accidental complexity that often
trips juniors up.  As I said above, viewing AI as a useful although sometimes overly-eager helper rather than a servant
can be very effective in understanding the shape of code bases, what the APIs and techniques available for a particular
problem are, how a given build system or programming language works, etc.

But you must write the code.

And companies: you must let juniors write the code.

## Getting a Job Today

The questions I get around AI and programming fundamentally revolve around getting a decent job.

It is no secret that the programmer job market is bad right now, and I am seeing good CS students struggle to find
positions programming.

While I do not have a crystal ball, I believe this is a temporary rather than permanent situation.  The computer 
programmer job market tends to be cyclical with booms and busts, and I believe we will recover from the current bust
at some point.

That's cold comfort to someone looking for a job now, however, so I want to offer the specific job-seeking advice that
I give to my students.

### Family, Friends, Family of Friends

I view the online job sites as mostly pointless, especially for juniors.  They are a lottery and the chances of finding
a good job through them are low.  Since they are free they are probably still worth using, but they are not worth 
investing a lot of time in.

A better approach is the four F's: Family, Friends & Family of Friends.  Use your personal connections to find positions
at companies in which you have a competitive advantage of knowing people in the company.  Family is the strongest
possibility.  Friends are often good too.  Family of friends is weaker, but also worth asking about.  If you know or
are only a few degrees separated from someone at a company you have a much stronger chance of getting a job at that 
company.

I stress to many students that this doesn't mean your family has to work for Google or some other big tech company.  

*All* companies of any significant size have problems that need to be solved using computers.  Almost every company over 100 
people has some sort of development group, even if they don't call it that.

As an example, I had a student who was struggling to find a job.  I asked what their parent did, and they said they worked
for Costco corporate.  

I told them that they were in fact extremely lucky and that this was their ticket into a great company.

Maybe they don't start as a "computer programmer" there, maybe they start as an analyst or some other role.  But the
ability to program on top of that role will be very valuable and likely set up a great career.

## Conclusion

So I still think pursuing computer programming as a career is a good idea.  The current job market is bad, no doubt, but
I think this is temporary.

I do think how computer programming is done is changing, and programmers should look at building up skills beyond
"pure" code-writing.  This has always been a good idea.

I don't think programming is changing as dramatically as some people claim and I think the fundamentals of programming, 
particularly writing good code and controlling complexity, will be perennially important.

I hope this essay is useful in answering that question, especially for junior programmers, and helps people feel
more confident entering a career that I have found very rewarding and expect to continue to do for a long time.

And companies: let the juniors write at least some of the code.  It is in your interest.