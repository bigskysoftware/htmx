/* global define */

/* ================================================
 * Make use of Bootstrap's modal more monkey-friendly.
 *
 * For Bootstrap 3.
 *
 * javanoob@hotmail.com
 *
 * https://github.com/nakupanda/bootstrap3-dialog
 *
 * Licensed under The MIT License.
 * ================================================ */
(function(root, factory) {

  "use strict";

  // CommonJS module is defined
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('jquery'), require('bootstrap'));
  }
  // AMD module is defined
  else if (typeof define === "function" && define.amd) {
    define("bootstrap-dialog", ["jquery", "bootstrap"], function($) {
      return factory($);
    });
  } else {
    // planted over the root!
    root.BootstrapDialog = factory(root.jQuery);
  }

}(this, function($) {

  "use strict";

  /* ================================================
   * Definition of BootstrapDialogModal.
   * Extend Bootstrap Modal and override some functions.
   * BootstrapDialogModal === Modified Modal.
   * ================================================ */
  var Modal = $.fn.modal.Constructor;
  var BootstrapDialogModal = function(element, options) {
    Modal.call(this, element, options);
  };
  BootstrapDialogModal.getModalVersion = function() {
    var version = null;
    if (typeof $.fn.modal.Constructor.VERSION === 'undefined') {
      version = 'v3.1';
    } else if (/3\.2\.\d+/.test($.fn.modal.Constructor.VERSION)) {
      version = 'v3.2';
    } else if (/3\.3\.[1,2]/.test($.fn.modal.Constructor.VERSION)) {
      version = 'v3.3';  // v3.3.1, v3.3.2
    } else {
      version = 'v3.3.4';
    }

    return version;
  };
  BootstrapDialogModal.ORIGINAL_BODY_PADDING = parseInt(($('body').css('padding-right') || 0), 10);
  BootstrapDialogModal.METHODS_TO_OVERRIDE = {};
  BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.1'] = {};
  BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.2'] = {
    hide: function(e) {
      if (e) {
        e.preventDefault();
      }
      e = $.Event('hide.bs.modal');

      this.$element.trigger(e);

      if (!this.isShown || e.isDefaultPrevented()) {
        return;
      }

      this.isShown = false;

      // Remove css class 'modal-open' when the last opened dialog is closing.
      var openedDialogs = this.getGlobalOpenedDialogs();
      if (openedDialogs.length === 0) {
        this.$body.removeClass('modal-open');
      }

      this.resetScrollbar();
      this.escape();

      $(document).off('focusin.bs.modal');

      this.$element
        .removeClass('in')
        .attr('aria-hidden', true)
        .off('click.dismiss.bs.modal');

      $.support.transition && this.$element.hasClass('fade') ?
        this.$element
          .one('bsTransitionEnd', $.proxy(this.hideModal, this))
          .emulateTransitionEnd(300) :
        this.hideModal();
    }
  };
  BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.3'] = {
    /**
     * Overrided.
     *
     * @returns {undefined}
     */
    setScrollbar: function() {
      var bodyPad = BootstrapDialogModal.ORIGINAL_BODY_PADDING;
      if (this.bodyIsOverflowing) {
        this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
      }
    },
    /**
     * Overrided.
     *
     * @returns {undefined}
     */
    resetScrollbar: function() {
      var openedDialogs = this.getGlobalOpenedDialogs();
      if (openedDialogs.length === 0) {
        this.$body.css('padding-right', BootstrapDialogModal.ORIGINAL_BODY_PADDING);
      }
    },
    /**
     * Overrided.
     *
     * @returns {undefined}
     */
    hideModal: function() {
      this.$element.hide();
      this.backdrop($.proxy(function() {
        var openedDialogs = this.getGlobalOpenedDialogs();
        if (openedDialogs.length === 0) {
          this.$body.removeClass('modal-open');
        }
        this.resetAdjustments();
        this.resetScrollbar();
        this.$element.trigger('hidden.bs.modal');
      }, this));
    }
  };
  BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.3.4'] = $.extend({}, BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.3']);
  BootstrapDialogModal.prototype = {
    constructor: BootstrapDialogModal,
    /**
     * New function, to get the dialogs that opened by BootstrapDialog.
     *
     * @returns {undefined}
     */
    getGlobalOpenedDialogs: function() {
      var openedDialogs = [];
      $.each(BootstrapDialog.dialogs, function(id, dialogInstance) {
        if (dialogInstance.isRealized() && dialogInstance.isOpened()) {
          openedDialogs.push(dialogInstance);
        }
      });

      return openedDialogs;
    }
  };

  // Add compatible methods.
  BootstrapDialogModal.prototype = $.extend(BootstrapDialogModal.prototype, Modal.prototype, BootstrapDialogModal.METHODS_TO_OVERRIDE[BootstrapDialogModal.getModalVersion()]);

  /* ================================================
   * Definition of BootstrapDialog.
   * ================================================ */
  var BootstrapDialog = function(options) {
    this.defaultOptions = $.extend(true, {
      id: BootstrapDialog.newGuid(),
      buttons: [],
      data: {},
      onshow: null,
      onshown: null,
      onhide: null,
      onhidden: null
    }, BootstrapDialog.defaultOptions);
    this.indexedButtons = {};
    this.registeredButtonHotkeys = {};
    this.draggableData = {
      isMouseDown: false,
      mouseOffset: {}
    };
    this.realized = false;
    this.opened = false;
    this.initOptions(options);
    this.holdThisInstance();
  };

  BootstrapDialog.BootstrapDialogModal = BootstrapDialogModal;

  /**
   *  Some constants.
   */
  BootstrapDialog.NAMESPACE = 'bootstrap-dialog';
  BootstrapDialog.TYPE_DEFAULT = 'type-default';
  BootstrapDialog.TYPE_INFO = 'type-info';
  BootstrapDialog.TYPE_PRIMARY = 'type-primary';
  BootstrapDialog.TYPE_SUCCESS = 'type-success';
  BootstrapDialog.TYPE_WARNING = 'type-warning';
  BootstrapDialog.TYPE_DANGER = 'type-danger';
  BootstrapDialog.DEFAULT_TEXTS = {};
  BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_DEFAULT] = 'Information';
  BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_INFO] = 'Information';
  BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_PRIMARY] = 'Information';
  BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_SUCCESS] = 'Success';
  BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_WARNING] = 'Warning';
  BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_DANGER] = 'Danger';
  BootstrapDialog.DEFAULT_TEXTS['OK'] = 'OK';
  BootstrapDialog.DEFAULT_TEXTS['CANCEL'] = 'Cancel';
  BootstrapDialog.DEFAULT_TEXTS['CONFIRM'] = 'Confirmation';
  BootstrapDialog.SIZE_NORMAL = 'size-normal';
  BootstrapDialog.SIZE_SMALL = 'size-small';
  BootstrapDialog.SIZE_WIDE = 'size-wide';    // size-wide is equal to modal-lg
  BootstrapDialog.SIZE_LARGE = 'size-large';
  BootstrapDialog.BUTTON_SIZES = {};
  BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_NORMAL] = '';
  BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_SMALL] = '';
  BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_WIDE] = '';
  BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_LARGE] = 'btn-lg';
  BootstrapDialog.ICON_SPINNER = 'glyphicon glyphicon-asterisk';

  /**
   * Default options.
   */
  BootstrapDialog.defaultOptions = {
    type: BootstrapDialog.TYPE_PRIMARY,
    size: BootstrapDialog.SIZE_NORMAL,
    cssClass: '',
    title: null,
    message: null,
    nl2br: true,
    closable: true,
    closeByBackdrop: true,
    closeByKeyboard: true,
    spinicon: BootstrapDialog.ICON_SPINNER,
    autodestroy: true,
    draggable: false,
    animate: true,
    description: '',
    tabindex: -1
  };

  /**
   * Config default options.
   */
  BootstrapDialog.configDefaultOptions = function(options) {
    BootstrapDialog.defaultOptions = $.extend(true, BootstrapDialog.defaultOptions, options);
  };

  /**
   * Open / Close all created dialogs all at once.
   */
  BootstrapDialog.dialogs = {};
  BootstrapDialog.openAll = function() {
    $.each(BootstrapDialog.dialogs, function(id, dialogInstance) {
      dialogInstance.open();
    });
  };
  BootstrapDialog.closeAll = function() {
    $.each(BootstrapDialog.dialogs, function(id, dialogInstance) {
      dialogInstance.close();
    });
  };

  /**
   * Move focus to next visible dialog.
   */
  BootstrapDialog.moveFocus = function() {
    var lastDialogInstance = null;
    $.each(BootstrapDialog.dialogs, function(id, dialogInstance) {
      lastDialogInstance = dialogInstance;
    });
    if (lastDialogInstance !== null && lastDialogInstance.isRealized()) {
      lastDialogInstance.getModal().focus();
    }
  };

  BootstrapDialog.METHODS_TO_OVERRIDE = {};
  BootstrapDialog.METHODS_TO_OVERRIDE['v3.1'] = {
    handleModalBackdropEvent: function() {
      this.getModal().on('click', {dialog: this}, function(event) {
        event.target === this && event.data.dialog.isClosable() && event.data.dialog.canCloseByBackdrop() && event.data.dialog.close();
      });

      return this;
    },
    /**
     * To make multiple opened dialogs look better.
     *
     * Will be removed in later version, after Bootstrap Modal >= 3.3.0, updating z-index is unnecessary.
     */
    updateZIndex: function() {
      var zIndexBackdrop = 1040;
      var zIndexModal = 1050;
      var dialogCount = 0;
      $.each(BootstrapDialog.dialogs, function(dialogId, dialogInstance) {
        dialogCount++;
      });
      var $modal = this.getModal();
      var $backdrop = $modal.data('bs.modal').$backdrop;
      $modal.css('z-index', zIndexModal + (dialogCount - 1) * 20);
      $backdrop.css('z-index', zIndexBackdrop + (dialogCount - 1) * 20);

      return this;
    },
    open: function() {
      !this.isRealized() && this.realize();
      this.getModal().modal('show');
      this.updateZIndex();

      return this;
    }
  };
  BootstrapDialog.METHODS_TO_OVERRIDE['v3.2'] = {
    handleModalBackdropEvent: BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']['handleModalBackdropEvent'],
    updateZIndex: BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']['updateZIndex'],
    open: BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']['open']
  };
  BootstrapDialog.METHODS_TO_OVERRIDE['v3.3'] = {};
  BootstrapDialog.METHODS_TO_OVERRIDE['v3.3.4'] = $.extend({}, BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']);
  BootstrapDialog.prototype = {
    constructor: BootstrapDialog,
    initOptions: function(options) {
      this.options = $.extend(true, this.defaultOptions, options);

      return this;
    },
    holdThisInstance: function() {
      BootstrapDialog.dialogs[this.getId()] = this;

      return this;
    },
    initModalStuff: function() {
      this.setModal(this.createModal())
        .setModalDialog(this.createModalDialog())
        .setModalContent(this.createModalContent())
        .setModalHeader(this.createModalHeader())
        .setModalBody(this.createModalBody())
        .setModalFooter(this.createModalFooter());

      this.getModal().append(this.getModalDialog());
      this.getModalDialog().append(this.getModalContent());
      this.getModalContent()
        .append(this.getModalHeader())
        .append(this.getModalBody())
        .append(this.getModalFooter());

      return this;
    },
    createModal: function() {
      var $modal = $('<div class="modal" role="dialog" aria-hidden="true"></div>');
      $modal.prop('id', this.getId());
      $modal.attr('aria-labelledby', this.getId() + '_title');

      return $modal;
    },
    getModal: function() {
      return this.$modal;
    },
    setModal: function($modal) {
      this.$modal = $modal;

      return this;
    },
    createModalDialog: function() {
      return $('<div class="modal-dialog"></div>');
    },
    getModalDialog: function() {
      return this.$modalDialog;
    },
    setModalDialog: function($modalDialog) {
      this.$modalDialog = $modalDialog;

      return this;
    },
    createModalContent: function() {
      return $('<div class="modal-content"></div>');
    },
    getModalContent: function() {
      return this.$modalContent;
    },
    setModalContent: function($modalContent) {
      this.$modalContent = $modalContent;

      return this;
    },
    createModalHeader: function() {
      return $('<div class="modal-header"></div>');
    },
    getModalHeader: function() {
      return this.$modalHeader;
    },
    setModalHeader: function($modalHeader) {
      this.$modalHeader = $modalHeader;

      return this;
    },
    createModalBody: function() {
      return $('<div class="modal-body"></div>');
    },
    getModalBody: function() {
      return this.$modalBody;
    },
    setModalBody: function($modalBody) {
      this.$modalBody = $modalBody;

      return this;
    },
    createModalFooter: function() {
      return $('<div class="modal-footer"></div>');
    },
    getModalFooter: function() {
      return this.$modalFooter;
    },
    setModalFooter: function($modalFooter) {
      this.$modalFooter = $modalFooter;

      return this;
    },
    createDynamicContent: function(rawContent) {
      var content = null;
      if (typeof rawContent === 'function') {
        content = rawContent.call(rawContent, this);
      } else {
        content = rawContent;
      }
      if (typeof content === 'string') {
        content = this.formatStringContent(content);
      }

      return content;
    },
    formatStringContent: function(content) {
      if (this.options.nl2br) {
        return content.replace(/\r\n/g, '<br />').replace(/[\r\n]/g, '<br />');
      }

      return content;
    },
    setData: function(key, value) {
      this.options.data[key] = value;

      return this;
    },
    getData: function(key) {
      return this.options.data[key];
    },
    setId: function(id) {
      this.options.id = id;

      return this;
    },
    getId: function() {
      return this.options.id;
    },
    getType: function() {
      return this.options.type;
    },
    setType: function(type) {
      this.options.type = type;
      this.updateType();

      return this;
    },
    updateType: function() {
      if (this.isRealized()) {
        var types = [BootstrapDialog.TYPE_DEFAULT,
          BootstrapDialog.TYPE_INFO,
          BootstrapDialog.TYPE_PRIMARY,
          BootstrapDialog.TYPE_SUCCESS,
          BootstrapDialog.TYPE_WARNING,
          BootstrapDialog.TYPE_DANGER];

        this.getModal().removeClass(types.join(' ')).addClass(this.getType());
      }

      return this;
    },
    getSize: function() {
      return this.options.size;
    },
    setSize: function(size) {
      this.options.size = size;
      this.updateSize();

      return this;
    },
    updateSize: function() {
      if (this.isRealized()) {
        var dialog = this;

        // Dialog size
        this.getModal().removeClass(BootstrapDialog.SIZE_NORMAL)
          .removeClass(BootstrapDialog.SIZE_SMALL)
          .removeClass(BootstrapDialog.SIZE_WIDE)
          .removeClass(BootstrapDialog.SIZE_LARGE);
        this.getModal().addClass(this.getSize());

        // Smaller dialog.
        this.getModalDialog().removeClass('modal-sm');
        if (this.getSize() === BootstrapDialog.SIZE_SMALL) {
          this.getModalDialog().addClass('modal-sm');
        }

        // Wider dialog.
        this.getModalDialog().removeClass('modal-lg');
        if (this.getSize() === BootstrapDialog.SIZE_WIDE) {
          this.getModalDialog().addClass('modal-lg');
        }

        // Button size
        $.each(this.options.buttons, function(index, button) {
          var $button = dialog.getButton(button.id);
          var buttonSizes = ['btn-lg', 'btn-sm', 'btn-xs'];
          var sizeClassSpecified = false;
          if (typeof button['cssClass'] === 'string') {
            var btnClasses = button['cssClass'].split(' ');
            $.each(btnClasses, function(index, btnClass) {
              if ($.inArray(btnClass, buttonSizes) !== -1) {
                sizeClassSpecified = true;
              }
            });
          }
          if (!sizeClassSpecified) {
            $button.removeClass(buttonSizes.join(' '));
            $button.addClass(dialog.getButtonSize());
          }
        });
      }

      return this;
    },
    getCssClass: function() {
      return this.options.cssClass;
    },
    setCssClass: function(cssClass) {
      this.options.cssClass = cssClass;

      return this;
    },
    getTitle: function() {
      return this.options.title;
    },
    setTitle: function(title) {
      this.options.title = title;
      this.updateTitle();

      return this;
    },
    updateTitle: function() {
      if (this.isRealized()) {
        var title = this.getTitle() !== null ? this.createDynamicContent(this.getTitle()) : this.getDefaultText();
        this.getModalHeader().find('.' + this.getNamespace('title')).html('').append(title).prop('id', this.getId() + '_title');
      }

      return this;
    },
    getMessage: function() {
      return this.options.message;
    },
    setMessage: function(message) {
      this.options.message = message;
      this.updateMessage();

      return this;
    },
    updateMessage: function() {
      if (this.isRealized()) {
        var message = this.createDynamicContent(this.getMessage());
        this.getModalBody().find('.' + this.getNamespace('message')).html('').append(message);
      }

      return this;
    },
    isClosable: function() {
      return this.options.closable;
    },
    setClosable: function(closable) {
      this.options.closable = closable;
      this.updateClosable();

      return this;
    },
    setCloseByBackdrop: function(closeByBackdrop) {
      this.options.closeByBackdrop = closeByBackdrop;

      return this;
    },
    canCloseByBackdrop: function() {
      return this.options.closeByBackdrop;
    },
    setCloseByKeyboard: function(closeByKeyboard) {
      this.options.closeByKeyboard = closeByKeyboard;

      return this;
    },
    canCloseByKeyboard: function() {
      return this.options.closeByKeyboard;
    },
    isAnimate: function() {
      return this.options.animate;
    },
    setAnimate: function(animate) {
      this.options.animate = animate;

      return this;
    },
    updateAnimate: function() {
      if (this.isRealized()) {
        this.getModal().toggleClass('fade', this.isAnimate());
      }

      return this;
    },
    getSpinicon: function() {
      return this.options.spinicon;
    },
    setSpinicon: function(spinicon) {
      this.options.spinicon = spinicon;

      return this;
    },
    addButton: function(button) {
      this.options.buttons.push(button);

      return this;
    },
    addButtons: function(buttons) {
      var that = this;
      $.each(buttons, function(index, button) {
        that.addButton(button);
      });

      return this;
    },
    getButtons: function() {
      return this.options.buttons;
    },
    setButtons: function(buttons) {
      this.options.buttons = buttons;
      this.updateButtons();

      return this;
    },
    /**
     * If there is id provided for a button option, it will be in dialog.indexedButtons list.
     *
     * In that case you can use dialog.getButton(id) to find the button.
     *
     * @param {type} id
     * @returns {undefined}
     */
    getButton: function(id) {
      if (typeof this.indexedButtons[id] !== 'undefined') {
        return this.indexedButtons[id];
      }

      return null;
    },
    getButtonSize: function() {
      if (typeof BootstrapDialog.BUTTON_SIZES[this.getSize()] !== 'undefined') {
        return BootstrapDialog.BUTTON_SIZES[this.getSize()];
      }

      return '';
    },
    updateButtons: function() {
      if (this.isRealized()) {
        if (this.getButtons().length === 0) {
          this.getModalFooter().hide();
        } else {
          this.getModalFooter().show().find('.' + this.getNamespace('footer')).html('').append(this.createFooterButtons());
        }
      }

      return this;
    },
    isAutodestroy: function() {
      return this.options.autodestroy;
    },
    setAutodestroy: function(autodestroy) {
      this.options.autodestroy = autodestroy;
    },
    getDescription: function() {
      return this.options.description;
    },
    setDescription: function(description) {
      this.options.description = description;

      return this;
    },
    setTabindex: function(tabindex) {
      this.options.tabindex = tabindex;

      return this;
    },
    getTabindex: function() {
      return this.options.tabindex;
    },
    updateTabindex: function() {
      if (this.isRealized()) {
        this.getModal().attr('tabindex', this.getTabindex());
      }

      return this;
    },
    getDefaultText: function() {
      return BootstrapDialog.DEFAULT_TEXTS[this.getType()];
    },
    getNamespace: function(name) {
      return BootstrapDialog.NAMESPACE + '-' + name;
    },
    createHeaderContent: function() {
      var $container = $('<div></div>');
      $container.addClass(this.getNamespace('header'));

      // title
      $container.append(this.createTitleContent());

      // Close button
      $container.prepend(this.createCloseButton());

      return $container;
    },
    createTitleContent: function() {
      var $title = $('<div></div>');
      $title.addClass(this.getNamespace('title'));

      return $title;
    },
    createCloseButton: function() {
      var $container = $('<div></div>');
      $container.addClass(this.getNamespace('close-button'));
      var $icon = $('<button class="close">&times;</button>');
      $container.append($icon);
      $container.on('click', {dialog: this}, function(event) {
        event.data.dialog.close();
      });

      return $container;
    },
    createBodyContent: function() {
      var $container = $('<div></div>');
      $container.addClass(this.getNamespace('body'));

      // Message
      $container.append(this.createMessageContent());

      return $container;
    },
    createMessageContent: function() {
      var $message = $('<div></div>');
      $message.addClass(this.getNamespace('message'));

      return $message;
    },
    createFooterContent: function() {
      var $container = $('<div></div>');
      $container.addClass(this.getNamespace('footer'));

      return $container;
    },
    createFooterButtons: function() {
      var that = this;
      var $container = $('<div></div>');
      $container.addClass(this.getNamespace('footer-buttons'));
      this.indexedButtons = {};
      $.each(this.options.buttons, function(index, button) {
        if (!button.id) {
          button.id = BootstrapDialog.newGuid();
        }
        var $button = that.createButton(button);
        that.indexedButtons[button.id] = $button;
        $container.append($button);
      });

      return $container;
    },
    createButton: function(button) {
      var $button = $('<button class="btn"></button>');
      $button.prop('id', button.id);
      $button.data('button', button);

      // Icon
      if (typeof button.icon !== 'undefined' && $.trim(button.icon) !== '') {
        $button.append(this.createButtonIcon(button.icon));
      }

      // Label
      if (typeof button.label !== 'undefined') {
        $button.append(button.label);
      }

      // Css class
      if (typeof button.cssClass !== 'undefined' && $.trim(button.cssClass) !== '') {
        $button.addClass(button.cssClass);
      } else {
        $button.addClass('btn-default');
      }

      // Hotkey
      if (typeof button.hotkey !== 'undefined') {
        this.registeredButtonHotkeys[button.hotkey] = $button;
      }

      // Button on click
      $button.on('click', {dialog: this, $button: $button, button: button}, function(event) {
        var dialog = event.data.dialog;
        var $button = event.data.$button;
        var button = $button.data('button');
        if (typeof button.action === 'function') {
          button.action.call($button, dialog, event);
        }

        if (button.autospin) {
          $button.toggleSpin(true);
        }
      });

      // Dynamically add extra functions to $button
      this.enhanceButton($button);

      return $button;
    },
    /**
     * Dynamically add extra functions to $button
     *
     * Using '$this' to reference 'this' is just for better readability.
     *
     * @param {type} $button
     * @returns {_L13.BootstrapDialog.prototype}
     */
    enhanceButton: function($button) {
      $button.dialog = this;

      // Enable / Disable
      $button.toggleEnable = function(enable) {
        var $this = this;
        if (typeof enable !== 'undefined') {
          $this.prop("disabled", !enable).toggleClass('disabled', !enable);
        } else {
          $this.prop("disabled", !$this.prop("disabled"));
        }

        return $this;
      };
      $button.enable = function() {
        var $this = this;
        $this.toggleEnable(true);

        return $this;
      };
      $button.disable = function() {
        var $this = this;
        $this.toggleEnable(false);

        return $this;
      };

      // Icon spinning, helpful for indicating ajax loading status.
      $button.toggleSpin = function(spin) {
        var $this = this;
        var dialog = $this.dialog;
        var $icon = $this.find('.' + dialog.getNamespace('button-icon'));
        if (typeof spin === 'undefined') {
          spin = !($button.find('.icon-spin').length > 0);
        }
        if (spin) {
          $icon.hide();
          $button.prepend(dialog.createButtonIcon(dialog.getSpinicon()).addClass('icon-spin'));
        } else {
          $icon.show();
          $button.find('.icon-spin').remove();
        }

        return $this;
      };
      $button.spin = function() {
        var $this = this;
        $this.toggleSpin(true);

        return $this;
      };
      $button.stopSpin = function() {
        var $this = this;
        $this.toggleSpin(false);

        return $this;
      };

      return this;
    },
    createButtonIcon: function(icon) {
      var $icon = $('<span></span>');
      $icon.addClass(this.getNamespace('button-icon')).addClass(icon);

      return $icon;
    },
    /**
     * Invoke this only after the dialog is realized.
     *
     * @param {type} enable
     * @returns {undefined}
     */
    enableButtons: function(enable) {
      $.each(this.indexedButtons, function(id, $button) {
        $button.toggleEnable(enable);
      });

      return this;
    },
    /**
     * Invoke this only after the dialog is realized.
     *
     * @returns {undefined}
     */
    updateClosable: function() {
      if (this.isRealized()) {
        // Close button
        this.getModalHeader().find('.' + this.getNamespace('close-button')).toggle(this.isClosable());
      }

      return this;
    },
    /**
     * Set handler for modal event 'show.bs.modal'.
     * This is a setter!
     */
    onShow: function(onshow) {
      this.options.onshow = onshow;

      return this;
    },
    /**
     * Set handler for modal event 'shown.bs.modal'.
     * This is a setter!
     */
    onShown: function(onshown) {
      this.options.onshown = onshown;

      return this;
    },
    /**
     * Set handler for modal event 'hide.bs.modal'.
     * This is a setter!
     */
    onHide: function(onhide) {
      this.options.onhide = onhide;

      return this;
    },
    /**
     * Set handler for modal event 'hidden.bs.modal'.
     * This is a setter!
     */
    onHidden: function(onhidden) {
      this.options.onhidden = onhidden;

      return this;
    },
    isRealized: function() {
      return this.realized;
    },
    setRealized: function(realized) {
      this.realized = realized;

      return this;
    },
    isOpened: function() {
      return this.opened;
    },
    setOpened: function(opened) {
      this.opened = opened;

      return this;
    },
    handleModalEvents: function() {
      this.getModal().on('show.bs.modal', {dialog: this}, function(event) {
        var dialog = event.data.dialog;
        dialog.setOpened(true);
        if (dialog.isModalEvent(event) && typeof dialog.options.onshow === 'function') {
          var openIt = dialog.options.onshow(dialog);
          if (openIt === false) {
            dialog.setOpened(false);
          }

          return openIt;
        }
      });
      this.getModal().on('shown.bs.modal', {dialog: this}, function(event) {
        var dialog = event.data.dialog;
        dialog.isModalEvent(event) && typeof dialog.options.onshown === 'function' && dialog.options.onshown(dialog);
      });
      this.getModal().on('hide.bs.modal', {dialog: this}, function(event) {
        var dialog = event.data.dialog;
        dialog.setOpened(false);
        if (dialog.isModalEvent(event) && typeof dialog.options.onhide === 'function') {
          var hideIt = dialog.options.onhide(dialog);
          if (hideIt === false) {
            dialog.setOpened(true);
          }

          return hideIt;
        }
      });
      this.getModal().on('hidden.bs.modal', {dialog: this}, function(event) {
        var dialog = event.data.dialog;
        dialog.isModalEvent(event) && typeof dialog.options.onhidden === 'function' && dialog.options.onhidden(dialog);
        if (dialog.isAutodestroy()) {
          delete BootstrapDialog.dialogs[dialog.getId()];
          $(this).remove();
        }
        BootstrapDialog.moveFocus();
      });

      // Backdrop, I did't find a way to change bs3 backdrop option after the dialog is popped up, so here's a new wheel.
      this.handleModalBackdropEvent();

      // ESC key support
      this.getModal().on('keyup', {dialog: this}, function(event) {
        event.which === 27 && event.data.dialog.isClosable() && event.data.dialog.canCloseByKeyboard() && event.data.dialog.close();
      });

      // Button hotkey
      this.getModal().on('keyup', {dialog: this}, function(event) {
        var dialog = event.data.dialog;
        if (typeof dialog.registeredButtonHotkeys[event.which] !== 'undefined') {
          var $button = $(dialog.registeredButtonHotkeys[event.which]);
          !$button.prop('disabled') && $button.focus().trigger('click');
        }
      });

      return this;
    },
    handleModalBackdropEvent: function() {
      this.getModal().on('click', {dialog: this}, function(event) {
        $(event.target).hasClass('modal-backdrop') && event.data.dialog.isClosable() && event.data.dialog.canCloseByBackdrop() && event.data.dialog.close();
      });

      return this;
    },
    isModalEvent: function(event) {
      return typeof event.namespace !== 'undefined' && event.namespace === 'bs.modal';
    },
    makeModalDraggable: function() {
      if (this.options.draggable) {
        this.getModalHeader().addClass(this.getNamespace('draggable')).on('mousedown', {dialog: this}, function(event) {
          var dialog = event.data.dialog;
          dialog.draggableData.isMouseDown = true;
          var dialogOffset = dialog.getModalDialog().offset();
          dialog.draggableData.mouseOffset = {
            top: event.clientY - dialogOffset.top,
            left: event.clientX - dialogOffset.left
          };
        });
        this.getModal().on('mouseup mouseleave', {dialog: this}, function(event) {
          event.data.dialog.draggableData.isMouseDown = false;
        });
        $('body').on('mousemove', {dialog: this}, function(event) {
          var dialog = event.data.dialog;
          if (!dialog.draggableData.isMouseDown) {
            return;
          }
          dialog.getModalDialog().offset({
            top: event.clientY - dialog.draggableData.mouseOffset.top,
            left: event.clientX - dialog.draggableData.mouseOffset.left
          });
        });
      }

      return this;
    },
    realize: function() {
      this.initModalStuff();
      this.getModal().addClass(BootstrapDialog.NAMESPACE)
        .addClass(this.getCssClass());
      this.updateSize();
      if (this.getDescription()) {
        this.getModal().attr('aria-describedby', this.getDescription());
      }
      this.getModalFooter().append(this.createFooterContent());
      this.getModalHeader().append(this.createHeaderContent());
      this.getModalBody().append(this.createBodyContent());
      this.getModal().data('bs.modal', new BootstrapDialogModal(this.getModal(), {
        backdrop: 'static',
        keyboard: false,
        show: false
      }));
      this.makeModalDraggable();
      this.handleModalEvents();
      this.setRealized(true);
      this.updateButtons();
      this.updateType();
      this.updateTitle();
      this.updateMessage();
      this.updateClosable();
      this.updateAnimate();
      this.updateSize();
      this.updateTabindex();

      return this;
    },
    open: function() {
      !this.isRealized() && this.realize();
      this.getModal().modal('show');

      return this;
    },
    close: function() {
      this.getModal().modal('hide');

      return this;
    }
  };

  // Add compatible methods.
  BootstrapDialog.prototype = $.extend(BootstrapDialog.prototype, BootstrapDialog.METHODS_TO_OVERRIDE[BootstrapDialogModal.getModalVersion()]);

  /**
   * RFC4122 version 4 compliant unique id creator.
   *
   * Added by https://github.com/tufanbarisyildirim/
   *
   *  @returns {String}
   */
  BootstrapDialog.newGuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  /* ================================================
   * For lazy people
   * ================================================ */

  /**
   * Shortcut function: show
   *
   * @param {type} options
   * @returns the created dialog instance
   */
  BootstrapDialog.show = function(options) {
    return new BootstrapDialog(options).open();
  };

  /**
   * Alert window
   *
   * @returns the created dialog instance
   */
  BootstrapDialog.alert = function() {
    var options = {};
    var defaultOptions = {
      type: BootstrapDialog.TYPE_PRIMARY,
      title: null,
      message: null,
      closable: false,
      draggable: false,
      buttonLabel: BootstrapDialog.DEFAULT_TEXTS.OK,
      callback: null
    };

    if (typeof arguments[0] === 'object' && arguments[0].constructor === {}.constructor) {
      options = $.extend(true, defaultOptions, arguments[0]);
    } else {
      options = $.extend(true, defaultOptions, {
        message: arguments[0],
        callback: typeof arguments[1] !== 'undefined' ? arguments[1] : null
      });
    }

    return new BootstrapDialog({
      type: options.type,
      title: options.title,
      message: options.message,
      closable: options.closable,
      draggable: options.draggable,
      data: {
        callback: options.callback
      },
      onhide: function(dialog) {
        !dialog.getData('btnClicked') && dialog.isClosable() && typeof dialog.getData('callback') === 'function' && dialog.getData('callback')(false);
      },
      buttons: [{
        label: options.buttonLabel,
        action: function(dialog) {
          dialog.setData('btnClicked', true);
          typeof dialog.getData('callback') === 'function' && dialog.getData('callback')(true);
          dialog.close();
        }
      }]
    }).open();
  };

  /**
   * Confirm window
   *
   * @returns the created dialog instance
   */
  BootstrapDialog.confirm = function() {
    var options = {};
    var defaultOptions = {
      type: BootstrapDialog.TYPE_PRIMARY,
      title: null,
      message: null,
      closable: false,
      draggable: false,
      btnCancelLabel: BootstrapDialog.DEFAULT_TEXTS.CANCEL,
      btnOKLabel: BootstrapDialog.DEFAULT_TEXTS.OK,
      btnOKClass: null,
      callback: null
    };
    if (typeof arguments[0] === 'object' && arguments[0].constructor === {}.constructor) {
      options = $.extend(true, defaultOptions, arguments[0]);
    } else {
      options = $.extend(true, defaultOptions, {
        message: arguments[0],
        closable: false,
        buttonLabel: BootstrapDialog.DEFAULT_TEXTS.OK,
        callback: typeof arguments[1] !== 'undefined' ? arguments[1] : null
      });
    }
    if (options.btnOKClass === null) {
      options.btnOKClass = ['btn', options.type.split('-')[1]].join('-');
    }

    return new BootstrapDialog({
      type: options.type,
      title: options.title,
      message: options.message,
      closable: options.closable,
      draggable: options.draggable,
      data: {
        callback: options.callback
      },
      buttons: [{
        label: options.btnCancelLabel,
        action: function(dialog) {
          typeof dialog.getData('callback') === 'function' && dialog.getData('callback')(false);
          dialog.close();
        }
      }, {
        label: options.btnOKLabel,
        cssClass: options.btnOKClass,
        action: function(dialog) {
          typeof dialog.getData('callback') === 'function' && dialog.getData('callback')(true);
          dialog.close();
        }
      }]
    }).open();
  };

  /**
   * Warning window
   *
   * @param {type} message
   * @returns the created dialog instance
   */
  BootstrapDialog.warning = function(message, callback) {
    return new BootstrapDialog({
      type: BootstrapDialog.TYPE_WARNING,
      message: message
    }).open();
  };

  /**
   * Danger window
   *
   * @param {type} message
   * @returns the created dialog instance
   */
  BootstrapDialog.danger = function(message, callback) {
    return new BootstrapDialog({
      type: BootstrapDialog.TYPE_DANGER,
      message: message
    }).open();
  };

  /**
   * Success window
   *
   * @param {type} message
   * @returns the created dialog instance
   */
  BootstrapDialog.success = function(message, callback) {
    return new BootstrapDialog({
      type: BootstrapDialog.TYPE_SUCCESS,
      message: message
    }).open();
  };

  return BootstrapDialog;

}));
