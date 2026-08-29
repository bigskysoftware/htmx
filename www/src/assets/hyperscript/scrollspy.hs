behavior Scrollspy

  def activate(hash)
    for a in <a[aria-current]/> in me
      remove @aria-current from a
    end
    set link to first <a[href='${hash}']/> in me
    if link exists
      set link's @aria-current to 'true'
      -- Only the desktop rail scrolls. The mobile TOC sits inline in the
      -- page, so scrolling a link into view drags the page back up to the
      -- nav and undoes the jump to the anchor.
      if me.closest('details') is null
        call link.scrollIntoView({block: 'nearest', behavior: 'instant'})
      end
    end
  end

  on scroll from window throttled at 50ms
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
