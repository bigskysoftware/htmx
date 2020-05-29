---
layout: layout.njk
title: </> htmx - high power tools for html
---
## Locality of Behavior (LoB)

> "The primary feature for easy maintenance is locality: Locality is that characteristic of source code that enables a 
> programmer to understand that source by looking at only a small portion of it." -- [Richard Gabriel](https://www.dreamsongs.com/Files/PatternsOfSoftware.pdf)

### The LoB Principle:

> The behavior of a code unit should be as obvious as possible by looking only at that unit of code

### Discussion

The LoB principle is a simple prescriptive formulation of the quoted statement from [Richard Gabriel](https://www.dreamsongs.com).
In as much as it is possible, and in balance with other concerns, developers should strive to make the behavior of
a code element obvious on inspection.

Consider two different implementations of an AJAX request in HTML, the first in [htmx](https://htmx.org):

```html
<div hx-get="/clicked">Click Me</div>
```

and the second in [jQuery](https://jquery.com/):

```javascript
  $("#d1").on("click", function(){
    $.ajax({
         ...
    });
  });
```

```html
<div id="d1">Click Me</div>
```

In the former, the behavior of the `div` element is obvious on inspection, satisfying the LoB principle.

In the latter, the behavior of the `div` element is spread out amongst multiple files.  It is difficult to know
exactly what the div does without a total knowledge of the code base.

#### Surfacing Behavior vs. Inlining Implementation

A common conflation is surfacing behavior with inlining implementation of that behavior.  These are separate concepts
and, while inlining the implementation of a behavior isn't *always* incorrect, it may *often* be incorrect.

Increasing the obviousness of the behavior of an element is, ceteris paribus, a good thing, but it falls to both end-developers
and especially framework developers to make LoB as easy as possible.

#### Conflict With Other Development Principles

The LoB will often conflict with other software development principles.  Two important ones
are:

* [DRY - Don't Repeat Yourself](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
  
  Software developers typically strive to avoid redundancy in their code or data.  This as come to be called "Staying DRY",
  i.e. Don't Repeat Yourself.  Like other software design principles this, on its own, is a good thing.  htmx, for example, 
  allows you to place many attributes on parent elements in a DOM and avoid repeating these attributes on children.  This is a 
  violation of LoB, in favor of DRY, and such tradeoffs need to be made judiciously by developers.
  
  Note that the further behavior gets from the code unit it effects, the more severe the violation of LoB.  If it is
  within a few lines of the code unit, this is less serious than if it is a page away, which is less serious than if
  it is in a separate file entirely.  
  
  There is no hard and fast rule, but rather subjective tradeoffs that must be made as software developers.
  
* [SoC - Separation Of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
  
  Separation of concerns a design principle for separating a computer program into distinct sections such that each 
  section addresses a separate concern.  A canonical example of this is CSS vs. Javascript.  Again, on its own and
  in isolation this may, indeed, be a good thing.  Inlining styles has become more prevalent lately, but there are
  still strong arguments in favor of SoC in this regard.
  
  Note that SoC is, however, in conflict with LoB.  By tweaking a CSS file the look and, to an extent, behavior of an
  element can change dramatically, and it is not obvious where this dramatic change came from.  Tools help to an extent
  here, but there is still "spooky action at a distance" going on.
  
  Again, this isn't to condemn SoC wholesale, just to say that there are subjective tradeoffs that must be made when
  considering how to structure your code.  The fact that inline styles have become more prevalent as of late is an
  indication that SoC is losing some support amongst developers.
  
#### Conclusion

LoB is a software design principle that can help make a code bases more humane and maintainable.  It must be traded
off against other design principles and be considered in terms of the limitations of the system a code unit is
written in, but, as much as is it is practical, adherence to this principle will increase your developer productivity 
and well-being. 