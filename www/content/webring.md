+++
title = "htmx webring"
+++

<style>
  h1 {
    display: none;
  }
  footer {
    display: none;
  }
  #webring-div {
    font-family: Times New Roman;
  }

@media only screen and (max-width: 720px) {
  .built-with-tds {
     display:none;
  }
}
</style>

<div id="webring-div">

<table id="nav-table" style="border: black 4px double; text-align: center">
<tr>
  <td class="built-with-tds" style="border: 1px black solid">
    <img width="200px" src="/img/createdwith.jpeg">
  </td>
  <td  width="70%" style="text-align: center; font-size: 20px; border: 1px black solid">
     This Great <a href="https://htmx.org">htmx</a> Webring site is owned by <a href="https://bigsky.software">Your Name Here</a>.
  </td>
  <td class="built-with-tds" style="; border: 1px black solid"">
    <img width="200px" src="/img/createdwith.jpeg">
  </td>
</tr>
<tr>
<td colspan="3" style="text-align: center; ; border: 1px black solid">
    [<a href="#" _="on click
             set links to <a/> in the #ring-table
             decrement :index
             if :index is -1
                get the length of the links
                set :index to the result - 1 
             end
             log :index
             get links[:index]
             set the #webring's src to the result's @href
             ">Prev</a>][<a href="#" _="on click
             set links to <a/> in the #ring-table
             set :index to Math.floor(Math.random() * length of the links)
             get links[:index]
             set the #webring's src to the result's @href
             ">Random</a>][<a href="#" _="on click
             set links to <a/> in the #ring-table
             increment :index
             if :index is length of the links
                set :index to 0
             end
             get links[:index]
             set the #webring's src to the result's @href
             ">Next</a>]<br/>
    [<a href="#" id="show-sites"
        _="on click 
             transition the #webring's opacity to 0
             transition #site-table's height to 100% over 300ms then 
             hide me then
             show #return-to-webring">List Sites</a><a id="return-to-webring"
        style="display: none"
        _="on click 
             transition #site-table's height to 0px over 800ms then
             transition the #webring's opacity to 100%
             hide me then
             show #show-sites">Return To Webring</a>]
</td>
</tr>
</table>

<div id="site-table" style="height: 0px; overflow: hidden">
<table>
<thead>
  <tr><th>Name</th><th>Description</th></tr>
</thead>
<tbody id="ring-table">
  <tr><td><a rel="nofollow" target="_blank" href="https://www.commspace.co.za/">Commspace</a></td><td>The ultimate solution for managing, tracking, splitting and analysing Financial Adviser revenue.</td></tr>
  <tr><td><a rel="noopener" target="_blank" href="https://zorro.management">Zorro Management</a></td><td>Manage your projects, time, and progress!</td></tr>
  <tr><td><a rel="nofollow" target="_blank" href="https://www.contexte.com/">Contexte</a></td><td>L’écosystème politique, au-delà des politiques publiques sectorielles : les métiers, les gens, les textes, les institutions</td></tr>
  <tr><td><a rel="nofollow" target="_blank" href="https://ocaml.org/">ocaml.org</a></td><td>An industrial-strength functional programming language with an emphasis on expressiveness and safety</td></tr>
  <tr><td><a rel="nofollow" target="_blank" href="https://www.nikevision.com/">Nike Vision</a></td><td>Eye-wear</td></tr>
</tbody>
</table>
</div>

</div>

<iframe id="webring" src="https://www.commspace.co.za" style="position:fixed;right:0;left:0;bottom:0;top:250px;width:100%;height:100%" name="webring"></iframe>
