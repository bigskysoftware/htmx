$(function () {
  var debugPanel = $(window).data('ic-debug-panel');
  if (debugPanel == null) {
    (function () {

      function generateDetailPanel(elt) {
        var dp = $("<div><div><strong>Details</strong></div>" +
          "<div><strong>URL: </strong>" + elt.attr('ic-src') + "</div>" +
          "<div><strong>Verb: </strong>" + Intercooler.verbFor(elt) + "</div>" +
          (elt.attr('ic-trigger-on') ? "<div><strong>Trigger: </strong>" + elt.attr('ic-trigger-on') + "</div>" : "") +
          "</div>"
        );
        if (elt.attr('ic-target')) {
          dp.append($("<div><strong>Target: </strong></div>").append(linkForElt(Intercooler.getTarget(elt))));
        }
        if (elt.attr('ic-deps')) {
          dp.append($("<div><strong>Dependencies: </strong></div>").append(elt.attr('ic-deps')));
        }
        if (Intercooler.verbFor(elt) != "GET") {
          var depsList = $("<div><strong>Dependant Elements:</strong><ul style='list-style-position: inside;font-size:12px;'></ul></div>")
            .appendTo(dp).find("ul");
          $('[ic-src]').each(function () {
            if (Intercooler.verbFor($(this)) == "GET" && $(this).attr('ic-deps') != 'ignore') {
              if ((Intercooler.isDependent(elt.attr('ic-src'), $(this).attr('ic-src'))) ||
                (Intercooler.isDependent(elt.attr('ic-src'), $(this).attr('ic-deps')) || $(this).attr('ic-deps') == "*")) {
                if (elt == null || elt[0] != $(this)[0]) {
                  $("<li style='font-size:12px'></li>").append(linkForElt($(this))).appendTo(depsList);
                }
              }
            }
          });
        }
        return dp;
      }

      function linkForElt(that) {
        if (that && that.length > 0) {
          return $("<a style='border-bottom: 1px solid #d3d3d3'>&lt;" +
            that.prop("tagName").toLowerCase() +
            "&gt;" + (that.attr('ic-src') ? " - " + that.attr('ic-src') : "") +
            "</a>").data('ic-debug-elt', that);
        } else {
          return $("<span>no element</span>")
        }
      }

      function generateDebugPanel() {
        return $("<div id='ic-debug-panel' style='font-size: 14px;font-family: Arial;background:white;width:100%;height:200px;position:fixed;left:0;border-top:1px solid #d3d3d3;'>" +
          "  <div style='padding:4px;width:100%;border-bottom: 1px solid #d3d3d3;background: #f5f5f5'><strong>intercooler.js debugger</strong>" +
          "    <span style='float:right'><a>Hide</a> | <a>[x]</a></span>" +
          "  </div>" +
          "  <div style='padding:4px;width:100%;border-bottom: 1px solid #d3d3d3;'>" +
          "    <a style='font-weight: bold'>Elements</a> | <a>Logs</a> | <a>Errors</a>" +
          "  </div>" +
          "  <div>" +
          "    <div id='ic-debug-Elements'>" +
          "      <div id='ic-debug-Elements-list' style='width:200px;float: left;height: 142px;overflow-y: scroll;'>" +
          "      </div>" +
          "      <div id='ic-debug-Elements-detail' style='height: 142px;overflow-y: scroll;'>" +
          "      </div>" +
          "    </div>" +
          "    <div id='ic-debug-Logs' style='display:none;overflow-y: scroll;height: 142px'>" +
          "    </div>" +
          "    <div id='ic-debug-Errors' style='display:none;overflow-y: scroll;height: 142px'>" +
          "    </div>" +
          "  </div>" +
          "</div>");
      }

      function debugSourceElt(elt) {
        var eltLink = linkForElt(elt);
        eltLink.clone(true).css({'display': 'block'}).appendTo($("#ic-debug-Elements-list"));
        if (elt.attr('ic-target') && Intercooler.getTarget(elt).length == 0) {
          $("<div> - bad target selector:" + elt.attr('ic-target') + "</div>").prepend(eltLink.clone(true)).appendTo($("#ic-debug-Errors"));
        }
        if (elt.attr('ic-indicator') && $(elt.attr('ic-indicator')).length == 0) {
          $("<div> - bad indicator selector:" + elt.attr('ic-indicator') + "</div>").prepend(eltLink.clone(true)).appendTo($("#ic-debug-Errors"));
        }
        if (elt.attr('ic-push-url') && Intercooler.getTarget($(elt)).attr('id') == null) {
          $("<div> - ic-push-url requires target to have id</div>").prepend(eltLink.clone(true)).appendTo($("#ic-debug-Errors"));
        }
      }

      function maybeCleanDebugInfo() {
        $('#ic-debug-Elements-list').find('a').each(function () {
          if ($(this).data('ic-debug-elt') && $.contains(document.body, $(this).data('ic-debug-elt')[0])) {
            // you live
          } else {
            $(this).remove();
          }
        });
      }

      debugPanel = generateDebugPanel().appendTo($('body'));
      $(window).data('ic-debug-panel', debugPanel);
      var lastElt;
      $('#ic-debug-panel').on('click', 'a', function () {
        if ($(this).text() == "Hide") {
          $("#ic-debug-panel").data('ic-minimized', true);
          $(this).text("Show");
          $(window).resize();
        } else if ($(this).text() == "Show") {
          $("#ic-debug-panel").data('ic-minimized', false);
          $(this).text("Hide");
          $(window).resize();
        } else if ($(this).text() == "[x]") {
          if (lastElt) {
            lastElt.css({'border': ''});
          }
          debugPanel.hide();
          $('html').css('margin-bottom', "0");
        } else if (["Elements", "Logs", "Errors"].indexOf($(this).text()) >= 0) {
          $(this).parent().find('a').css({"font-weight": "normal"});
          $(this).css({"font-weight": "bold"});
          $("#ic-debug-" + $(this).text()).parent().children().hide();
          $("#ic-debug-" + $(this).text()).show();
        } else if ($(this).data('ic-debug-elt')) {
          var that = $(this);
          var newElt = that.data('ic-debug-elt');
          var delay = Math.min(newElt.offset().top - 75, 300);
          $('html, body').animate({ scrollTop: newElt.offset().top - 75 }, delay);
          if (lastElt) {
            lastElt.css({'border': ''});
          }
          lastElt = newElt;
          newElt.css({'border': "2px solid red"});
          if (that.parent().attr('id') == 'ic-debug-Elements-list') {
            $('#ic-debug-Elements-detail').html(generateDetailPanel(newElt));
          }
        }
      });

      $('[ic-src]').each(function () {
        debugSourceElt($(this));
      });

      $(window).on('log.ic',function (e, msg, level) {
        $("<div style='border-bottom: 1px solid #d3d3d3'>] - " + msg.replace(/</g, '&lt;') + "</div>")
          .appendTo($("#ic-debug-Logs"))
          .prepend(linkForElt($(e.target)))
          .prepend(level + " [");
      }).on('elementAdded.ic',function (e) {
          debugSourceElt($(e.target));
        }).on('nodesProcessed.ic',function () {
          maybeCleanDebugInfo();
        }).on('resize', function () {
          if (!debugPanel.is(":hidden")) {
            var winOffset = $(window).height() - (debugPanel.data('ic-minimized') == true ? 29 : 200);
            debugPanel.css('top', winOffset + "px");
            $('html').css('margin-bottom', (debugPanel.data('ic-minimized') == true ? 29 : 200) + "px");
          }
        });
    })();
  } else {
    debugPanel.show();
  }
  $(window).resize();
});
