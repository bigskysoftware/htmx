behavior Scrollspy

  def activate(hash)
    for a in <a[aria-current]/> in me
      remove @aria-current from a
    end
    set link to first <a[href='${hash}']/> in me
    if link exists
      set link's @aria-current to 'true'
      if me.closest('details') is null
        call link.scrollIntoView({block: 'nearest', behavior: 'instant'})
      end
    end
  end

  def update()
    -- Hidden nav (mobile TOC) must not do scroll work.
    if my offsetParent is null then exit end
    set current to null
    for a in <a[href^='#']/> in me
      set href to a's @href
      set id to href.slice(1)
      set el to document.getElementById(id)
      -- checkVisibility skips content-visibility sections without forcing layout.
      if el exists and (no el.checkVisibility or el.checkVisibility({contentVisibilityAuto: true}))
        measure el
        if its top <= 150
          set current to href
        end
      end
    end
    if current is not empty and current is not :lastHash
      set :lastHash to current
      call activate(current)
    end
  end

  on scroll from window throttled at 50ms
    call update()
  end

  -- debounce so we get a final event too
  --  (TODO arguably a bug in throttled)
  on scroll from window debounced at 100ms
    call update()
  end

  on hashchange from window
    if window.location.hash is not empty
      call activate(window.location.hash)
    end
  end

  init
    if window.location.hash is not empty
      wait 50ms then call activate(window.location.hash)
    end
  end

end
