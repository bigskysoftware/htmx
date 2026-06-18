behavior ActiveSearch

  on input
    set q to my.value.toLowerCase()
    for item in <[data-filter]/>
      if q is '' or item.dataset.filter contains q
        remove @hidden from item
      else
        add @hidden to item
      end
    end
    for group in <[role='group']/>
      set visible to 0
      for item in <[data-filter]/> in group
        if item.hidden is false then increment visible
      end
      if visible is 0 then add @hidden to group else remove @hidden from group
    end
  end

end
