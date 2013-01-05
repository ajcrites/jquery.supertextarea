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
                css: {},
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

    Plugin = function (textarea, userOptions) {
        this.textarea = textarea;

        defaultOptions.minWidth = textarea.width();
        defaultOptions.minHeight = textarea.height();

        parentWidth = textarea.parent().width();
        defaultOptions.maxWidth = parentWidth > defaultOptions.minWidth ? parentWidth : defaultOptions.minWidth;

        parentHeight = textarea.parent().height();
        defaultOptions.maxHeight = parentHeight > defaultOptions.minHeight ? parentHeight : defaultOptions.minHeight;

        this.options = $.extend({}, defaultOptions, userOptions);
        this._defaultOptions = defaultOptions;
        this._name = pluginName;

        //"beholder" shadows the textarea to match size
        this.beholder = $('<div>').css({'position': 'absolute','display': 'none', 'word-wrap':'break-word'});
    };

    Plugin.prototype.init = function () {
        /**#@+
         * Create sane minimum and maximum width and height
         */
        if (!this.options.minHeight) {
            this.options.minHeight = this.textarea.height();
        }
        if (!this.options.minWidth) {
            this.options.minWidth = this.textarea.width();
        }
        if (this.options.maxHeight < this.options.minHeight) {
            this.options.maxHeight = this.options.minHeight;
        }
        if (this.options.maxWidth < this.options.minWidth) {
            this.options.maxWidth = this.options.minWidth;
        }

        if (!this.options.minHeight) {
            this.options.minHeight = 0;
        }
        if (!this.options.maxWidth) {
            this.options.maxWidth = 0;
        }

        this.textarea
            .css(this.options.css)
            .height(this.options.minHeight)
            .width(this.options.minWidth)
        ;
        /**#@-*/

        //At least one character has to be used to replace tabs
        if (this.options.tabReplace.use && this.options.tabReplace.num < 1) {
            this.options.tabReplace.num = 1;
        }

        //each of these styles affects width/height, so the placeholder div used to calculate
        //necessary changes to width/height needs to mimic the textarea styles
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

        //Copy all textarea css that affects width/height to the beholder
        this.beholder.appendTo(this.textarea.parent());
        for (var i = 0; i < rep_css.length; i++) {
            this.beholder.css(rep_css[i].toString(), this.textarea.css(rep_css[i].toString()));
        }
        this.beholder.css('max-width', this.options.maxWidth);

        //Prevent form submission if supertextarea text length is not in the correct limits
        this.textarea.closest("form").submit($.proxy(function (e) {
            var val = this.textarea.val();
            if (this.options.trim) {
                val = $.trim(val);
            }

            //Minlength requirement not met, so prevent form submission
            if (val.length < this.options.minLength || this.options.minLength > 0 && this.textarea.data('usingPlaceholder')) {
                if (this.options.displayToGo.slide) {
                    $("html, body").animate({scrollTop: this.textarea.offset().top});
                }
                e.preventDefault();
                e.stopImmediatePropagation();
            }
            else if (this.textarea.data('usingPlaceholder')) {
                this.textarea.val('');
            }
        }, this));

        //Placeholder handling.  Remove on focus, add on blur if supertextarea is empty
        if (this.options.placeholder.use) {
            if (!this.textarea.val().length) {
                if (this.options.placeholder.css != undefined) {
                    this.textarea.css(this.options.placeholder.css);
                }
                this.textarea.val(this.options.placeholder.text);
                this.textarea.data('usingPlaceholder', true);
            }

            this.textarea.focus($.proxy(function () {
                if (this.textarea.data('usingPlaceholder')) {
                    this.textarea.val('');
                    if (this.options.css != undefined) {
                        this.textarea.css(this.options.css);
                    }
                    this.textarea.data('usingPlaceholder', false);
                }
            }, this));

            this.textarea.blur($.proxy(function () {
                if (!this.textarea.val().length) {
                    this.textarea.data('usingPlaceholder', true);
                    if (this.options.placeholder.css != undefined) {
                        this.textarea.css(this.options.placeholder.css);
                    }
                    this.textarea.val(this.options.placeholder.text);
                }
            }, this));
        }

        this.textarea.css({'overflow':'auto'})
            .keydown($.proxy(function (e) { this.update(e); }, this))
            .keyup($.proxy(function () { this.update(); }, this))
            .bind('paste', $.proxy(function () { setTimeout(this.update, 250); }), this)
        ;

        this.update();
    };

    //Update height of supertextarea
    Plugin.prototype.eval_height = function (height, overflow) {
        var newHeight = Math.floor(parseInt(height));
        if (this.textarea.height() != newHeight) {
            this.textarea.css({'height': newHeight + 'px', 'overflow-y': overflow});
        }
    };

    //Update width of supertextarea
    Plugin.prototype.eval_width = function (width, overflow) {
        var newWidth = Math.floor(parseInt(width));
        if (this.textarea.width() != newWidth) {
            this.textarea.css({'width': newWidth + 'px', 'overflow-x': overflow});
        }
    };

        //Update the textarea size and its contents / indicators
    Plugin.prototype.update = function (e) {
        if (this.options.tabReplace.use && e) {
            this.tab_replace(e);
        }

        //Handle display-remaining
        if (this.options.displayRemaining.use && this.options.maxLength) {
            var displayRemaining;
            if (!this.textarea.data('displayMessage')) {
                displayMessage = $("<div>");
                this.textarea.data('displayMessage', displayMessage).after(displayMessage);
            }
            else {
                displayMessage = this.textarea.data('displayMessage');
            }

            //text length
            var tl = this.textarea.data('usingPlaceholder') ? 0 : (this.options.trim ? $.trim(this.textarea.val()).length : this.textarea().val().length);
            var txt = this.options.maxLength - tl;
            txt = txt < 0 ? 0 : txt;
            var rem = tl - this.options.minLength;
            var remtxt;
            var num;
            var msg;

            if (rem < 0 && this.options.displayToGo.text != undefined) {
                num = Math.abs(rem);
                msg = this.options.displayToGo.text;
                if (this.options.displayToGo.css != undefined) {
                    displayMessage.css(this.options.displayToGo.css);
                }
                else if (this.options.displayRemaining.css != undefined) {
                    displayMessage.css(this.options.displayRemaining.css);
                }
            }
            else {
                num = txt;
                msg = this.options.displayRemaining.text;
                if (this.options.displayRemaining.css != undefined) {
                    displayMessage.css(this.options.displayRemaining.css);
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

        if (this.options.maxLength && this.options.maxLength - tl < 0) {
            this.textarea.val(this.textarea.val().substring(0, this.options.maxLength));
        }

        //Figure out the textarea content as html to compare with the beholder size
        var ac = this.textarea.val().replace(/&/g,'&amp;').replace(/  /g, '&nbsp;&nbsp;').replace(/<|>/g, '&gt;').replace(/\n/g, '<br />');
        var bc = this.beholder.html();

        //get the height of the line in pixels, from available source
        var line = parseInt(this.textarea.css('line-height')) || parseInt(this.textarea.css('font-size'));

        //Update width/height of textarea when it goes outside of its bounds by enough
        if (ac + '&nbsp;' != bc) {
            this.beholder.html(ac + '&nbsp;&nbsp;');
            if (Math.abs(this.beholder.height() + line - this.textarea.height()) > 3
                || Math.abs(this.beholder.width() + line - this.textarea.width()) > 3
            ) {
                var nh = this.beholder.height() + line;
                var maxh = this.options.maxHeight;
                var minh = this.options.minHeight;
                if (nh >= maxh) {
                    this.eval_height(maxh, 'auto');
                }
                else if (nh <= minh) {
                    this.eval_height(minh, 'hidden');
                }
                else {
                    this.eval_height(nh, 'hidden');
                }

                var nw = this.beholder.width() + line;
                var maxw = this.options.maxWidth;
                var minw = this.options.minWidth;
                if (nw >= maxw) {
                    this.eval_width(maxw, 'auto');
                }
                else if (nw <= minw) {
                    this.eval_width(minw, 'hidden');
                }
                else {
                    if (this.beholder.height() + line > maxh) {
                        this.eval_width(nw + line, 'hidden');
                    }
                    else {
                        this.eval_width(nw, 'hidden');
                    }
                }
            }
        }
    };

        //Replace tab input with a tab character or the correct number of spaces
    Plugin.prototype.tab_replace = function (e) {
        var key = e.which;
        var sp = this.options.tabReplace.space ? " " : "\t";
        var str = new Array(this.options.tabReplace.num + 1).join(sp);

        //the tab key; prevent blurring and replace with either tab character or spaces
        if (key == 9 && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            var os = this.textarea.scrollTop();
            var ta = this.textarea.get(0);
            if (ta.setSelectionRange) {
                var ss = ta.selectionStart;
                var se = ta.selectionEnd;
                this.textarea.val(this.textarea.val().substring(0, ss) + str + this.textarea.val().substr(se));
                ta.setSelectionRange(ss + str.length, se + str.length);
            }
            else if (ta.createTextRange) {
                document.selection.createRange().text = str;
            }
            //Fallback if we can't correctly create a range.  Just disallow tab replacement.
            else {
                return;
            }
            this.textarea.scrollTop(os);
            e.preventDefault();
        }
    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!this.tagName.toLowerCase() === "textarea") {
                return;
            }
            if (!$.data(this, pluginName)) {
                var supertextarea = new Plugin($(this), options);
                supertextarea.init();
                $.data(this, pluginName, supertextarea);
            }
        });
    }
})(jQuery, window, document);

