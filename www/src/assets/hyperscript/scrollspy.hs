behavior Scrollspy

  def activate(hash)
    for a in <a[aria-current]/> in me
      remove @aria-current from a
    end
    set link to first <a[href='${hash}']/> in me
    if link exists
      set link's @aria-current to 'true'
      set pageY to window.scrollY
      call link.scrollIntoView({block: 'nearest', behavior: 'instant'})
      call window.scrollTo(0, pageY)
    end
  end

  on scroll from window throttled at 50ms
    set current to null
    for a in <a[href^='#']/> in me
      set href to a's @href
      set id to href.slice(1)
      set el to document.getElementById(id)
      if el exists
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
