require 'digest/md5'

module Jekyll
  class ActiveTag < Liquid::Tag
    def initialize(tag_name, text, tokens)
      super
      @text = text
    end
    def render(context)
      nav = context.registers[:page]['nav'] || ''
      'active' if nav.include? @text.chop
    end
  end
  class HideTag < Liquid::Tag
    def initialize(tag_name, text, tokens)
      super
      @text = text
    end
    def render(context)
      nav = context.registers[:page]['nav'] || ''
      'hide' unless nav.include? @text.chop
    end
  end
end

Liquid::Template.register_tag('active', Jekyll::ActiveTag)
Liquid::Template.register_tag('unless', Jekyll::HideTag)
