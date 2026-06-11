+++
title = "The University In The AI Era"
description = """\
  In this essay, Carson Gross thinks about the best way for the university to prepare students in the AI era."""
date = 2026-06-11
updated = 2026-06-11
authors = ["Carson Gross"]
[taxonomies]
tag = ["posts"]
+++

As I mentioned in ["Yes, And"](@/essays/yes-and.md), I teach computer science at [Montana State
University](https://www.cs.montana.edu).

In that earlier essay, I say that computer science is probably still a reasonably good area to study, but that you
should also expand your skills beyond "just" computer science to help make yourself more employable in the future.

In this essay I want to think more about what AI means for universities in general and computer science programs in
particular.

_Note: I apologize that this is a longer essay. I have provided a Table of Contents to help you navigate it._

<br/>

# Table of Contents

* [First: Is The University Still Relevant?](#first-is-the-university-still-relevant)
* [Writing Code](#writing-code)
* [Signaling Competence in an AI World](#signaling-competence-in-an-ai-world)
* [Towards An AI-accepting CS Curriculum](#towards-an-ai-accepting-cs-curriculum)
    * [Current Changes](#current-changes)
        * [Homework Is No Longer A Strong Signal](#homework-is-no-longer-a-strong-signal)
        * [Homework Can Be More Ambitious & Realistic](#homework-can-be-more-ambitious-realistic)
        * [AI is a Great TA](#ai-is-a-great-ta)
        * [The Return of Butt-in-chair, Handwritten Tests](#the-return-of-butt-in-chair-handwritten-tests)
        * [Demos & Visualizations Are Cheap](#demos-visualizations-are-cheap)
        * [Class Content Should Be In Markdown](#class-content-should-be-in-markdown)
        * [Class Analysis & Improvements](#class-analysis-improvements)
        * [Automate *Everything*](#automate-everything)
    * [Upcoming Changes](#upcoming-changes)
        * [Stronger Pseudocode Standards](#stronger-pseudocode-standards)
        * [AI & Non-AI Tracks](#ai-non-ai-tracks)
        * [Open Source Work](#open-source-work)
        * [Clearly, Honestly Communicating The Dangers of AI](#clearly-honestly-communicating-the-dangers-of-ai)
    * [Speculative Changes](#speculative-changes)
        * [The "CS+" Concept](#the-cs-concept)
        * [Network Isolated Computers](#network-isolated-computers)
        * [Interview-Based Grading](#interview-based-grading)
* [Conclusion](#conclusion)

<br/>
<br/>

# First: Is The University Still Relevant?

An initial question that many people are asking is: in the era of AI, is the University still relevant?

This is not a new question. Many people have pointed to famous software industry figures who dropped out of college as
proof that a university education isn't useful in technology. And most people who have worked in Silicon Valley know at
least one excellent engineer who either dropped out or simply never went to college.

So a college degree has never been a hard requirement for a successful career in technology. But, in reality, *most*
software engineers have some sort of college under their belt and many of the best developers have studied computer
science in their undergraduate education.

That being said, there is
[clearly an emerging crisis](https://www.dailycal.org/news/campus/academics/failing-grades-soar-as-professors-see-greater-ai-usage-dwindling-math-skills-in-uc-berkeley/article_16fad0bf-02cb-4b8c-8d88-888ffd9f8608.html)
in Computer Science education that needs to be addressed in order to keep the university relevant in the post-AI world.

# Writing Code

Historically, many computer science departments have looked at writing code as a secondary skill, to be picked up by
students on their own, while the department focuses more on the theoretical foundations of computer science.

Since I was mature enough to have an opinion on the matter, I have viewed this as wrongheaded: I think you need to learn
how to write code in order to appreciate those deeper theoretical foundations of computer science. If you can't code up
a linked list or use a hash table effectively, learning about the big-O behavior of them is much more abstract and
difficult to grasp.

Ironically, in the era of AI, many _professional_ environments are _also_ starting to look at raw coding somewhat
skeptically, sometimes insisting that their own engineers not write code at all, but rather use agents to generate it.

This approach may work for more experienced seniors, who have already written a lot of code and know what reasonable
code looks like, but it puts junior developers in a bind: they don't have pre-AI experience writing code, and now they
are going into environments where no one is writing code.

As I said in "Yes, And", you must write the code if you want to develop the ability to read code.

How is that supposed to happen at companies where nobody is writing the code?

I think this presents an opportunity for Computer Science departments: *we* can be the places where young software
engineers write the code. By refocusing our curriculum on practical, code heavy assignments we can give students a safe
environment, free of the time pressures and demands of corporate work, to write the code.

This experience can then put them in position to go into environments that use AI more heavily with the confidence that
they know how to code and, because of that, are in a position to read and understand the code necessary for their
career.

# Signaling Competence in an AI World

Now, of course, students are famously lazy and famously clever in figuring out how to be lazy. So, many students will
use AI to complete many of these code-heavy assignments. They will learn very little or nothing, but will get a good
grade because, let's be honest, AI can perform at or above the level required for most reasonable undergraduate
projects.

Here another irony of the AI era becomes evident: Universities are now in a position to signal competence in a way that
nearly no other institution can. AI has made online testing pointless. I know this because the last semester I offered
online tests (which I like to do because it is convenient for my working students) the testing scores were through the
roof.

While I feel I am a pretty good teacher, this was clearly a case of AI being used by my students, despite my pleas.

When thinking about what I could do about this I realized that we had all the infrastructure for the perfect answer: in
person, on paper testing. Universities have large lecture halls, expensive printers, testing centers for people who need
additional help, etc.

Previously, I would have scoffed at this infrastructure as antiquated. But now I see that it puts me in a position to
_more accurately establish_ the competence of my students in a way that is difficult to game: I offer in-person quizzes,
with one page of handwritten notes and no digital equipment, roughly every three weeks of my courses.

Of course students can still cheat, but the quizzes are proctored and now at least they have to work for it.

This in-person, on-paper testing infrastructure puts universities in a unique position to provide a high signal-to-noise
indication of the competence of their students to the outside world.

# Towards An AI-accepting CS Curriculum

While I believe that the University CS degree is not only still relevant, but perhaps of *more* value than it was in the
pre-AI era, I do think that significant changes need to be made to adapt to the new state of affairs. In this section I
will describe what I have done over the last year with my courses, what I plan to do in the near future & then finish
with some more speculative changes that I believe would help increase the usefulness of undergraduate CS degrees.

## Current Changes

So I believe that a computer science degree will, somewhat ironically, become *more* important in the post-AI world, but
also that computer science departments will need to change in some fundamental ways to remain effective at communicating
knowledge and properly evaluating students.

Below are some changes that I have made to my courses over the last year to deal with this new reality.

### Homework Is No Longer A Strong Signal

As with take home quizzes, due to the use of AI, homeworks & projects are no longer a strong signal of the understanding
of material. Homeworks must become for the student's benefit rather than for evaluating their competency.

This is actually a good thing: homeworks can be more ambitious and the students that want to learn will have more
opportunities to write the code. Yes, some (many?) will cheat on assignments, but the good students will have an
opportunity to write code in a supportive environment.

To deal with this reality, I have reduced the weight of assignments in my classes from 60-80% (I have always had
code-heavy classes) down to 50%, and expect most students will get A's on most assignments. I try to strike a balance on
how challenging assignments are so that the students that are honestly trying have a sense of accomplishment when they
are finished.

### Homework Can Be More Ambitious & Realistic

Another homework related change that I have made is that my assignments are now more ambitious and realistic. I don't
mean they are much harder, but I can, with the help of AI, present much larger software systems to my students with
better sample data, as a basis for their projects.

This allows students to see software systems that go beyond "Hello World" levels of complexity and develop the ability
to read as well as write code in a larger, more complicated context.

### AI is a Great TA

Another thing I have found in the post-AI era is that my office hours traffic has dropped precipitously. I have always
done my office hours in the computer lab on campus and, particularly for my compilers class, expected large crowds of
students to come in asking for help on projects.

I think, unfortunately, this is most likely due to many students using AI to solve their programming problems.

However, there is a more optimistic take here: the students are using AI to better understand the projects and therefore
do not need as much one on one help.

While I am ambivalent in many ways towards AI, this is an area where AI can significantly improve the university
experience for students: with proper use, AI can be a fantastic TA. It is infinitely patient, has no other students
waiting in line and is usually very competent at undergraduate level concepts in computer science.

The danger, of course, is that students simply use AI as a code generator to complete assignments and head off to the
bars.

To address this danger, I ship a [`CLAUDE.md/AGENTS.md`](https://gist.github.com/1cg/a6c6f2276a1fe5ee172282580a44a7ac)
file in my class repos that directs AI agents to act like a good TA rather than a code generator. Of course students can
modify or delete this file, but there is no system so perfect that no one needs to be good.

Stanford University has recently [modified this file for one of their own
classes](https://github.com/stanford-cs336/assignment1-basics/blob/main/CLAUDE.md), and I encourage other people and
departments to do the same: it is public domain.

### The Return of Butt-in-chair, Handwritten Tests

As I discussed above, Universities have infrastructure for in-person testing that make them uniquely qualified to assess
expertise and competence in the post AI world.

I have switched to all in-person quizzes, roughly every three weeks. The three-week cadence gives enough time to cover a
significant amount of material, even if holidays are interspersed in those weeks, while de-escalating each quiz when
compared to a traditional midterm/final setup.

I also allow one page of handwritten notes. I do not allow printed notes. The idea here is to force the knowledge
through the student's eye-brain-hand pathway multiple times to help reinforce it.

My students have grumbled about this process, but also admit that it works in helping them learn the material.

My questions are all written response, never multiple choice. Sometimes I ask for prose, sometimes I ask for pseudocode,
sometimes I will provide code and ask students to annotate/explain it, etc. This makes it harder to grade the tests, but
also makes it much harder to cheat.

I have found that AI is very good at suggesting questions based on class material for quizzes. I will work with an AI
agent based on my class slides (see below) to create appropriate quiz questions and then create a quiz review sheet to
help students study for the quiz based on it. Students love the review sheet because it helps them focus their efforts.

I think that, from a learning perspective, the butt-in-chair quizzes have been the single most positive change I have
made to my classes. I now make them 50% of a student's grade, and my class grading curve has returned to a reasonable
shape.

### Demos & Visualizations Are Cheap

Another adjustment I have had to make is that demos & visualizations are now very cheap to create with AI.

For a long time I was unhappy with the computer emulators that were available to me to teach my [computer
systems](https://www.montana.edu/cope/activity_insight/catalog.php?rubric=CSCI&number=366) class. I wanted a 16-bit
computer that struck a balance between the simplicity of something like [The Scott
CPU](https://www.youtube.com/playlist?list=PLnAxReCloSeTJc8ZGogzjtCtXl_eE6yzA) and the full complexity of something like
[SPIM](https://spimsimulator.sourceforge.net/).

Two summers ago we spent an entire summer building such a computer, called [The Montana Mini
Computer](https://mtmc.cs.montana.edu/) that provided strong visualizations of how low level computing works.

Unfortunately, when I got into a class using it, I realized that the architecture I had picked was too exotic (mixing
concepts from MIPS & the JVM) and that students would be better off learning an assembly closer to x86. This would be
particularly useful later in our security classes.

I was able to work with AI to produce a new MTMC that was much closer to x86 in only a few weeks. It was so successful
that I switched to the new version of the MTMC mid-class in fall, and used it exclusively in spring.

Another visualization that I have created with AI is a JVM emulator that shows how stack frames and the operand stack
work together to do computation. It is a visualization that I always wanted, but was unable to create not due to lack of
skill (I am a reasonably competent programmer) but just lack of time and energy (I am old.)

So I have had to reset my thinking on demos & visualizations: If you can think it and describe it, and if you are a
reasonably good programmer, you can probably create it.

### Class Content Should Be In Markdown

I have moved all my class slides to Markdown, using a tool called [slidev](https://sli.dev/) and, generally, embraced
[Markdown](https://www.markdownguide.org/) for all my class content: SYLLABUS.md, etc. (Previously I was using Google
slides for my lectures.) All content is checked in to my class repository that students get.

Moving all my content to Markdown has been tremendously beneficial:

* I can run AI analysis over my slides and look for gaps or inconsistencies
* Students can run the content through an AI agent to create a more effective TA
* It is much easier to bulk-update my slides if I make a major change to a class

I have always liked Markdown and, with slidev, I have nice syntax highlighting and access to
[Mermaid](https://mermaid.ai/open-source/intro/) for technical diagrams. Or I can use good ol' ASCII art, which is often
very effective.

Having everything locally in text/Markdown makes it much easier for AI tools to work effectively in my classes.

### Class Analysis & Improvements

Another way I have used AI effectively is in reviewing my classes at a higher level:

* I can compare my classes with courses offered at other universities to see if there are topics that I am missing
* I can analyze my classes holistically and ensure that there are coherent threads between them (e.g. stack machines)

While this hasn't revolutionized any of my classes it has been useful in improving them.

### Automate *Everything*

The final way that I have been using AI to improve my classes is in automating everything possible. I have always had a
significant number of scripts that I use for the infrastructure in my classes: an autograder.py that runs the
autograding for projects in CI, etc.

I have become much more aggressive in what I will automate and optimize now. For example, I am using
[Tampermonkey](https://www.tampermonkey.net/) to make parts of [Canvas LMS](https://www.instructure.com/canvas) easier
to work with for my work flows:

* I can paste in a youtube URL, and it will automatically create a link for me in Canvas
* I can drag and drop files directly from my OS into Canvas

You can see the tampermonkey script [here](https://gist.github.com/1cg/b5ed907a53eee2faa0bd6d079eeadb17)

I have also created command line scripts for scheduling new Youtube streams, parsing our autograder output into Canvas
compatible format, etc.

At this point, if there is friction somewhere in my class I try to think how I would remove it if I had the time, then
consider if an LLM could generate that solution.

## Upcoming Changes

I plan on implementing the following changes in the upcoming semester.

### Stronger Pseudocode Standards

With on-paper quizzes becoming the standard, it is clear that I need a strong pseudocode standard for students to use on
quizzes.

We are working on an "executable" pseudocode, [Notch](https://notch.cs.montana.edu), to address this. It is english-like
(it is an [xTalk](https://en.wikipedia.org/wiki/HyperTalk) variant) and uses standards from Java, so the students should
be able to pick it up easily. We will of course be lenient on syntax when it is used as pseudocode.

I intend to provide a pseudo-code guide that students are allowed to bring to quizzes for reference.

We will see how it goes.

### AI & Non-AI Tracks

In many of my classes I will have students give end-of-semester presentations and I often offer a reward for the best in
show. In the upcoming year I am splitting these presentations into two tracks: AI & non-AI.

This will allow students who do not want to use AI to compete with one another and, I hope, encourage more students to
not use AI for their projects.

I will stress that I will review the non-AI winner's code base and, if I sniff any AI, they will be heavily penalized.

### Open Source Work

AI is disrupting Open Source work significantly. It changes the calculus on [build vs
buy](https://www.thoughtworks.com/content/dam/thoughtworks/documents/e-book/tw_ebook_build_vs_buy_2022.pdf) dramatically
in favor of build. This is made more compelling by people recognizing that dependencies [are
liabilities](https://x.com/htmx_org/status/2057205905222246455), especially from a security perspective.

Of course much of the AI model training set consists of open source work and many open source developers are
[understandably upset about this](https://opensourceainews.com/ai-is-destroying-open-source-not-even-good-yet/). Chad
Whitacre, an open source advocate who I respect tremendously, has decided to [step away from technology
entirely](https://openpath.quest/2026/i-am-retiring-from-tech-to-live-offline/) due to the situation.

I do not have any good answers of how to prevent AI models from using open source work for training, nor do I have a
good answer for financing open source work in general.

However, one possibility that I see is that universities become more explicitly involved in open source work, by forming
open source groups. We have done so at [Montana State](https://opensource.cs.montana.edu) to support tools we use in our
classes.

Universities have independent financing that allows them to pursue projects with steady (if unglamorous) levels of
financial backing. This also dovetails with the public mission of many universities. Montana State, for example, is a
land grant university, founded for "the advancement of agriculture, mechanical arts and military tactics."

Leaving aside military tactics, open source is one way that public universities can contribute to the public good in a
meaningful way.

### Clearly, Honestly Communicating The Dangers of AI

This upcoming semester I am going to spend more time communicating the dangers of AI to my students. The most obvious
short term danger is that [they won't write the code](@/essays/yes-and.md#juniors) and, therefore, will not learn the
skills needed to read the code.

They may get good grades on assignment, but my quizzes will be difficult and, when they enter the real world, they will
not be able to work effectively, either with or without AI.

There are also studies showing that AI is
[stultifying](https://www.media.mit.edu/projects/your-brain-on-chatgpt/overview/) and [homogenizes away
creativity](https://www.nature.com/articles/s41562-025-02173-x).

I have been telling my students for many years now that they face far, far more temptations to behave poorly than any
generation before them. That they face more difficult temptations in a week than their grandparents generation faced in
years and perhaps decades.

With AI we now have another dimension, automated cheating, along which they will need to exercise even greater virtue
than previous generations.

I stress to them that I admire the heroism of their generation in resisting these temptations.

(I think older generations would do well to recognize this fact.)

## Speculative Changes

Finally, I want to give a few concepts that I have thought of given an unlimited time & money budget.

### The "CS+" Concept

An idea proposed by MSU professor [Laura Stanley](https://www.cs.montana.edu/directory/1524633/laura-stanley) is "CS+":
integrating computer science education _plus_ other majors in a meaningful way. Studies have shown that this increases
the appeal of computer science more broadly to the student body.

I think this is a fantastic idea and will be working with our department to help re-orient our minor towards this
concept. My hope is that we can refocus the minor and the first two years of our major program towards practical
problem-solving with computers.

Perhaps AI will reduce the number of computer scientists needed in the world (I am skeptical of this claim) but it will
certainly not reduce the need for technically adept students across the economy, both public and private. I think we can
present a strong case to non-CS majors: "You can be a good X, but add CS and you will be among the best!"

I think this program can obviously appeal to engineering, science and technical majors such as economics, etc. However,
I also think it is an opportunity to expand into liberal arts and social sciences. I can imagine a "CS+" minor being
extremely useful for a sociology major, for example, and hope we can reach out to students in those departments once we
have established the shape of our program.

This may not just be a matter of my own preferences (I admit I like this idea conceptually, not just practically): if CS
departments do not consider this sort of program they may see falling enrollment as students avoid the CS major due to
AI fear.

### Network Isolated Computers

I think it would be very forward-thinking for computer science departments to create network isolated computer labs.

These systems could be used to assess student competency while still providing a nice computing environment with IDEs,
etc. without the risk of AI-generated solutions.

I can imagine assignments and quizzes that utilize this resource quite effectively. It would be a large investment and
require management and upkeep, but could be very valuable if done well and perhaps become a centerpiece of a
department's teaching strategy.

### Interview-Based Grading

Finally, another way to avoid AI poisoning the evaluation of students is, again, returning to the past: sitting down and
having [a conversation](https://en.wikipedia.org/wiki/Oral_exam) with a student to determine their grade.

While I do not have experience directly with oral exams, my experience in office hours tells me that I can determine the
competence of a given student in roughly five minutes of conversation, guiding the conversation to the level that they
are comfortable with, giving hints where necessary, etc. and determine a reasonable grade for them in a manner that
would be very hard to game.

Now, many of my classes have 100+ students, and if it took, say, 15 minutes per student interview, that is 25 hours of
total interview time. This is not realistic given the current structure of classes (I currently have 3 hours of lecture
over 15 weeks, or 45 total hours.)

However, a forward-looking university might restructure finals week (or perhaps two finals weeks) in such a way to allow
oral exams, and it would provide a much better final analysis of students' achievement in a class.

(Of course it would be a lot more work for professors, so I view this as unfortunately unlikely.)

# Conclusion

So, yes, I think The University is still relevant in the post-AI era and, in fact, may become *more* relevant due to
some structural advantages it has, particularly in signaling student's competence to the outside world.

I do think computer science departments will need to adjust to the new realities and consider some somewhat radical
changes in order to maximize their value to their students.  Most importantly, I think universities should increase their
focus on providing hand-coding opportunities to students.

I hope that this essay helps computer science educators improve their course offering so that we can continue to produce
competent and confident computer scientists for the foreseeable future.

_Note: No AI was used in the writing of this essay. AI was used to correct typos and to produce the table of contents._
