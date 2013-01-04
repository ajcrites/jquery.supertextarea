/**
 * Supertextarea
 * Created by Explosion Pills <explosion-pills@aysites.com>
 * Report Bugs: <bugs@truthanduntruth.com>
 * Documentation: http://explosion-pills.com/development/jquery/plugins/supertextarea/
 */
;(function ($, window, document, undefined) {

   var _counter = 0,
      pluginName = "supertextarea",
      defaultOptions = {
         /**#@+
          * Minimum/maximum width/height of the textarea.  By default, these are
          * the width/height of the textarea itself (for minumum) and its container
          * (parent by default) for maximum.
          */
         minWidth: undefined,
         maxWidth: undefined,
         minHeight: undefined,
         maxHeight: undefined,
         /**#@-*/

         //Tab key does not change focus, but is used in the textarea
         tabReplace: {
            //turn this setting on
            use: true,
            //change tabs into spaces
            space: true,
            //this many spaces
            num: 3
         },

         //supertextarea css; also used as CSS when placeholder is removed
         css: {'color': 'black'},

         //maximum length in characters allowed for submission
         //User cannot type more characters than this
         //If false, there is no limit.
         maxLength: false,

         //minumum length in characters required for submission
         minLength: 0,

         //Display the number of characters remaining
         displayRemaining: {
            //turn this setting on
            use: true,
            //The text displayed (e.g. 1000 Remaining)
            //You can use $ to insert the value anywhere
            //Otherwise, it is prepended
            notice: 'Remaining',
            /**
             * css for the display remaining text
             */
            css: {}
         },

         //If true, leading/trailing whitespace is not counted for min length
         trim: true,

         //Display to-go
         displayToGo: {
            //The text displayed.  See displayRemaining
            text: 'Required',
            //Css on the to-go div
            , css: {},
            //If user tries to submit form with an inadequate number of characters,
            //scroll the textarea into view if this is true
            slide: true
         },

         //Placeholder text when supertextarea is empty
         placeholder: {
            //Use this setting
            use: false,
            //The actual placeholder text
            text: '',
            //Css of the supertextarea while placeholder is dislpayed
            css: {'color': 'gray'}
         }
      }
   ;

   function Plugin(textarea, userOptions) {
      this.textarea = textarea;

      defaultOptions.minWidth = textarea.width();
      defaultOptions.minHeight = textarea.height();
      defaultOptions.maxWidth = textarea.parent().width();
      defaultOptions.maxHeight = textarea.parent().height();

      this.options = $.extend({}, defaultOptions, userOptions);
      this._defaultOptions = defaultOptions;
      this._name = pluginName;
   }

   Plugin.prototype[pluginName] = function (options) {
      //The supertextarea
      var area = this;

      /**#@+
       * Create sane minimum and maximum width and height
       */
      if (!options.minHeight) {
         options.minHeight = area.height();
      }
      if (!options.minWidth) {
         options.minWidth = area.width();
      }
      if (options.maxHeight < options.minHeight) {
         options.maxHeight = options.minHeight;
      }
      if (options.maxWidth < options.minWidth) {
         options.maxWidth = options.minWidth;
      }

      if (!options.minHeight) {
         options.minHeight = 0;
      }
      if (!options.maxWidth) {
         options.maxWidth = 0;
      }

      area.css(options.css).height(options.minHeight).width(options.minWidth);
      /**#@-*/

      if (options.tabReplace.use && options.tabReplace.num < 1) {
         options.tabReplace.num = 1;
      }

      var rep_css = [
         'paddingTop',
         'paddingRight',
         'paddingBottom',
         'paddingLeft',
         'fontSize',
         'lineHeight',
         'fontFamily',
         'fontWeight'
      ];

      var idcounter = _counter++;

      //"beholder" shadows the textarea to match size
      var beh = $('<div>').css({'position': 'absolute','display': 'none', 'word-wrap':'break-word'});

      //get the height of the line in pixels, from available source
      var line = parseInt(area.css('line-height')) || parseInt(area.css('font-size'));
      var goalheight = 0;

      //Copy all textarea css that affects width/height to the beholder
      beh.appendTo(area.parent());
      for (var i = 0; i < rep_css.length; i++) {
         beh.css(rep_css[i].toString(), area.css(rep_css[i].toString()));
      }
      beh.css('max-width', options.maxWidth);

      //Update height of supertextarea
      function eval_height(height, overflow) {
         var newHeight = Math.floor(parseInt(height));
         if (area.height() != newHeight) {
            area.css({'height': newHeight + 'px', 'overflow-y': overflow});
         }
      }

      //Update width of supertextarea
      function eval_width(width, overflow) {
         var newWidth = Math.floor(parseInt(width));
         if (area.width() != newWidth) {
            area.css({'width': newWidth + 'px', 'overflow-x': overflow});
         }
      }

      //Update the textarea size and its contents / indicators
      function update(e) {
         if (options.tabReplace.use && e) {
            tab_replace(e);
         }

         //Handle display-remaining
         if (options.displayRemaining.use && options.maxLength) {
            var displayMessage;
            if (!$("#textarea_dsrm" + area.data('displayRemaining')).length) {
               displayMessage = $('<div>');
               displayMessage.attr('id', "textarea_dsrm" + idcounter);
               area.after(displayMessage);
               area.data('displayRemaining', idcounter);
            }
            else {
               displayMessage = $("#textarea_dsrm" + area.data('displayRemaining'));
            }

            var tl = area.data('usingPlaceholder') ? 0 : area.val().length;
            var txt = options.maxLength - tl;
            txt = txt < 0 ? 0 : txt;
            var rem = tl - options.minLength;
            var remtxt;
            var num;
            var msg;

            if (rem < 0 && options.displayToGo.text != undefined) {
               num = Math.abs(rem);
               msg = options.displayToGo.text;
               if (options.displayToGo.css != undefined) {
                  displayMessage.css(options.displayToGo.css);
               }
               else if (options.displayRemaining.css != undefined) {
                  displayMessage.css(options.displayRemaining.css);
               }
            }
            else {
               num = txt;
               msg = options.displayRemaining.text;
               if (options.displayRemaining.css != undefined) {
                  displayMessage.css(options.displayRemaining.css);
               }
            }

            //Replace the dollar sign in the message with the number of remaining characters
            if (msg.match(/\$/)) {
               remtxt = msg.replace('$', ' ' + num + ' ');
            }
            else {
               remtxt = num + ' ' + msg;
            }
            displayMessage.text(remtxt);
         }

         if (options.maxLength && options.maxLength - tl < 0) {
            area.val(area.val().substring(0, options.maxLength));
         }

         //Figure out the textarea content as html to compare with the beholder size
         var ac = area.val().replace(/&/g,'&amp;').replace(/  /g, '&nbsp;&nbsp;').replace(/<|>/g, '&gt;').replace(/\n/g, '<br />');
         var bc = beh.html();

         //Update width/height of textarea when it goes outside of its bounds by enough
         if (ac + '&nbsp;' != bc) {
            beh.html(ac + '&nbsp;&nbsp;');
            if (Math.abs(beh.height() + line - area.height()) > 3
               || Math.abs(beh.width() + line - area.width()) > 3
            ) {
               var nh = beh.height() + line;
               var maxh = options.maxh;
               var minh = options.minh;
               if (nh >= maxh) {
                  eval_height(maxh, 'auto');
               }
               else if (nh <= minh) {
                  eval_height(minh, 'hidden');
               }
               else {
                  eval_height(nh, 'hidden');
               }

               var nw = beh.width() + line;
               var maxw = options.maxw;
               var minw = options.minw;
               if (nw >= maxw) {
                  eval_width(maxw, 'auto');
               }
               else if (nw <= minw) {
                  eval_width(minw, 'hidden');
               }
               else {
                  if (beh.height() + line > maxh) {
                     eval_width(nw + line, 'hidden');
                  }
                  else {
                     eval_width(nw, 'hidden');
                  }
               }
            }
         }
      }

      //Prevent form submission if supertextarea text length is not in the correct limits
      area.closest("form").submit(function (e) {
         var val;
         if (options.trim) {
            val = $.trim(area.val());
         }
         else {
            val = area.val();
         }

         //Minlength requirement not met, so prevent form submission
         if (val.length < options.minLength || options.minLength > 0 && area.data('usingPlaceholder')) {
            if (options.displayToGo.slide) {
               $("html, body").animate({scrollTop: area.offset().top});
            }
            e.preventDefault();
         }
         else if (area.data('usingPlaceholder')) {
            area.val('');
         }
      });

      //Replace tab input with a tab character or the correct number of spaces
      function tab_replace(e) {
         var key = e.which;
         var sp = options.tabReplace.space ? " " : "\t";
         var str = new Array(options.tabr.num + 1).join(sp);

         //the tab key; prevent blurring and replace with either tab character or spaces
         if (key == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            var os = area.scrollTop();
            var ta = area.get(0);
            if (ta.setSelectionRange) {
               var ss = ta.selectionStart;
               var se = ta.selectionEnd;
               area.val(area.val().substring(0, ss) + str + area.val().substr(se));
               ta.setSelectionRange(ss + str.length, se + str.length);
               e.returnValue = false;
            }
            else if (ta.createTextRange) {
               document.selection.createRange().text = str;
               e.returnValue = false;
            }
            //Fallback if we can't correctly create a range.  Just disallow tab replacement.
            else {
               return true;
            }
            area.scrollTop(os);
            e.preventDefault();
            return false;
         }
         return true;
      }

      //Placeholder handling.  Remove on focus, add on blur if supertextarea is empty
      if (options.placholder.use) {
         if (!area.val().length) {
            if (options.placeholder.css != undefined) {
               area.css(options.placeholder.css);
            }
            area.val(options.placeholder.text);
            area.data('usingPlaceholder', true);
         }

         area.focus(function () {
            if (area.data('usingPlaceholder')) {
               area.val('');
               if (options.css != undefined) {
                  area.css(options.css);
               }
               area.data('usingPlaceholder', false);
            }
         });
         area.blur(function () {
            if (!area.val().length) {
               area.data('usingPlaceholder', true);
               if (options.placeholder.css != undefined) {
                  area.css(options.placeholder.css);
               }
               area.val(options.placeholder.text);
            }
         });
      }

      area.css({'overflow':'auto'})
         .keydown(function (e) { update(e); })
         .keyup(function () { update(); })
         .bind('paste', function () { setTimeout(update, 250); });

      update();
   };

   $.fn[pluginName] = function (options) {
      return this.each(function () {
         if (!this.get(0).tagName.toLowerCase() == "textarea") {
            return;
         }
         if (!$.data(this, "plugin_" + pluginName)) {
            var supertextarea = new Plugin(this, options);
            supertextarea[pluginName]();
            $.data(this, "plugin_" + pluginName, supertextarea);
         }
      });
   }
})(jQuery, window, document);
