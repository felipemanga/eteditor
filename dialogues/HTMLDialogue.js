need("dialogues.IDialogue", function(){
"use strict";

CLAZZ("dialogues.HTMLDialogue", {
    EXTENDS:"dialogues.IDialogue",

    STATIC:{
        nextPrefixId:0,
        focusZ:0,
        map:{}
    },

    CONSTRUCTOR:function(opt){
        SUPER(opt);
        dialogues.HTMLDialogue.focusZ++;
    },

    $windowframeheader_btnCloseWindow:{
        click:function(){
            this.onClose();
        }
    },

    bringToTop:function(){
        this.DOM.__ROOT__.style.zIndex = dialogues.HTMLDialogue.focusZ++;
    },

    $windowframe:{
        mousedown:function(evt){
            this.bringToTop();
            this.__onFocus();
        }
    },

	isMoving:false,
    isResizing:false,
	moveRefX:0,
	moveRefY:0,
	$windowframeheader:{
		mousedown:function( evt ){
			if( evt.target != this.DOM.windowframeheader[0] || evt.buttons != 1 )
				return;
			this.isMoving = true;
			this.moveRefX = evt.screenX;
			this.moveRefY = evt.screenY;
		},

		touchstart:function(evt){
			this.isMoving = true;
			this.moveRefX = evt.screenX;
			this.moveRefY = evt.screenY;
		}
	},

    __startResize:function(type, point){
        this.isResizing = type;
        this.moveRefX = point.screenX;
        this.moveRefY = point.screenY;
    },

    $windowframe_hresize:{
        mousedown:function(evt){
            this.__startResize("H", evt);
        },
        touchstart:function(evt){
            this.__startResize("H", evt.touches[0]);
        }
    },

    $windowframe_vresize:{
        mousedown:function(evt){
            this.__startResize("V", evt);
        },
        touchstart:function(evt){
            this.__startResize("V", evt.touches[0]);
        }
    },

    $windowframe_vhresize:{
        mousedown:function(evt){
            this.__startResize("VH", evt);
        },
        touchstart:function(evt){
            this.__startResize("VH", evt.touches[0]);
        }
    },

	__moveWindow:function( point ){
        var dy = point.screenY - this.moveRefY;
        var dx = point.screenX - this.moveRefX;

		if( this.isMoving ){
			this.DOM.__ROOT__.style.top = ((parseInt(this.DOM.__ROOT__.style.top) || 0) + dy) + "px";
			this.DOM.__ROOT__.style.left = ((parseInt(this.DOM.__ROOT__.style.left) || 0) + dx) + "px";
        }

        if( this.isResizing ){
            if( this.isResizing.indexOf("V") != -1 )
                this.setHeight( this.DOM.windowframecontents[0].clientHeight + dy );

            if( this.isResizing.indexOf("H") != -1 )
                this.setWidth( this.DOM.windowframecontents[0].clientWidth + dx );
        }

        this.moveRefY = point.screenY;
        this.moveRefX = point.screenX;
	},

	$BODY:{
		mousemove:function( evt ){
			if( evt.buttons != 1 ) this.isMoving = this.isResizing = false;
			else{
				this.__moveWindow( evt );
				evt.preventDefault();
			}
		},

		touchend:function(){
			this.isMoving = false;
            this.isResizing = false;
		},

		touchmove:function(evt){
			if( this.isMoving || this.isResizing ){
				this.__moveWindow( evt.touches[0] );
				evt.preventDefault();
			}
		}
	},

    getAvailArea:function(){
        return {
            width: document.body.clientWidth,
            height: document.body.clientHeight
        };
    },

    __show:function(){
        this.DOM.__ROOT__.style.display = "initial";
    },

    __hide:function(){
        this.DOM.__ROOT__.style.display = "none";
    },

    __close:function(){
        DOC.remove( this.DOM.__ROOT__ );
    },

    setHeight:function(height){
        this.DOM.windowframecontents[0].style.height = height + "px";
    },

    setWidth:function(width){
        this.DOM.windowframecontents[0].style.width = width + "px";
    },

    setSize:function(width, height){
        this.DOM.windowframecontents[0].style.height = height + "px";
        this.DOM.windowframecontents[0].style.width = width + "px";
    },

    moveTo:function(x, y){
        this.DOM.__ROOT__.style.left = x + "px";
        this.DOM.__ROOT__.style.top = y + "px";
    },

    documentRoot:"",
    loadLayout:function(path){
        var documentRoot = this.documentRoot = path.replace(/\/[^\/]*$/, "/");
        DOC.getURL(path, (src) =>
        {
            var html = parseHTML( src );
			var opt = this.cfg;

			var frame = opt.frame === undefined ? true : opt.frame;
			var resizable = opt.resizable == undefined ? true : opt.resizable;
			var always_on_top = opt.always_on_top == undefined ? false : opt.always_on_top;
			var show = this.isVisible = (opt.show == undefined ? true : opt.show);
			var width = opt.width || 400, height = opt.height || 300;

            var el = DOC.create("div", document.body, {
				className:"windowframe",
				style:{
					borderStyle: (frame?"solid":"none"),
					borderWidth: (frame?"1px":"0"),
                    display: (show?"initial":"none")
				}
			}, [
                ["div", {
                    className:"windowframeheader",
                    text:this.cfg.title || DOC.TEXT("window:"+(this.controller.constructor.NAME || this.controller.constructor.name))
                }, [
                    !frame?null:[ "div", {id:"windowframeheader_btnCloseWindow", text:"X"} ]
                ]],
                ["div",{
                    className:"windowframecontents " + html.classes,
                    style:{
                        width:  width + "px",
                        height: height + "px",
    					resize: resizable?"both":"none"
                    }
                }, [
                	["div", {id:"BODY"}, html.children]
                ]],
                (!frame||!resizable)?null:["div", {className:"windowframe_vresize"}],
                (!frame||!resizable)?null:["div", {className:"windowframe_hresize"}],
                (!frame||!resizable)?null:["div", {className:"windowframe_vhresize"}]
            ]);

            this.DOM = DOC.index( el, null, this.controller );
            if( opt.position == "center" ){
                var area = this.getAvailArea();
                this.moveTo(
                    area.width*0.5 - width*0.5,
                    area.height*0.5 - height*0.5
                );
            }
            this.bringToTop();

            this.__onDOMReady( el );
			DOC.attach( document.body, this[DOC.attachPrefix+"BODY"], this );
            DOC.attach( this.DOM.__ROOT__, this.controller[DOC.attachPrefix+"WINDOW"], this.controller );
			this.DOM.attach(this);
        });

        function parseHTML( src ){
            var parsed = (new DOMParser()).parseFromString( src, "text/html" );
            var children = Array.prototype.slice.call(parsed.body.children, 0);
            DOC.removeChildren( parsed.body );

            var classes = [];

            var styles = parsed.getElementsByTagName("style");
            Array.prototype.forEach.call(styles, (style) => {
                var prefix;
                var text = style.textContent.trim();
                if( text ){
                    if( text in dialogues.HTMLDialogue.map )
                        prefix = dialogues.HTMLDialogue.map[text];
                    else{
                        prefix = "EMBEDDED_CSS_" + (dialogues.HTMLDialogue.nextPrefixId++) + " ";
                        processStyle( "." + prefix, text );
                        dialogues.HTMLDialogue.map[text] = prefix;
                    }
                    classes.push(prefix);
                }
            });

            var links = parsed.getElementsByTagName("link");

            Array.prototype.forEach.call(links, (link) => {
                var prefix;
                var href = link.getAttribute("href");
                if( href ){
                    if( href in dialogues.HTMLDialogue.map )
                        prefix = dialogues.HTMLDialogue.map[href];
                    else{
                        prefix = "EMBEDDED_CSS_" + (dialogues.HTMLDialogue.nextPrefixId++) + " ";

                        if( !href.match(/^[^:\/]+:\/\/.*/) )
                            href = documentRoot + href;

                        DOC.getURL( href, processStyle.bind(null, "." + prefix) );
                        dialogues.HTMLDialogue.map[href] = prefix;
                    }
                    classes.push(prefix);
                }
            });

            classes = classes.join(" ");

            return {
                classes,
                children
            };
        }

        function processStyle( prefix, text ){
            var rules = text.split("}");
            for(var i=0, l=rules.length-1; i<l; ++i ){
                var match = rules[i].match(/^\s*([^{]*)(\{[\s\S]*)/);
                if( !match ){
                    console.warn("CSS Parse Error:", rules[i]);
                    continue;
                }

                var selectors = match[1].split(",");
                for( var s=0, sl=selectors.length; s<sl; s++ )
                    selectors[s] = prefix + selectors[s].replace(/^\s*body/i, "#BODY").replace(/^\s*html/i, "#HTML");

                rules[i] = selectors.join(",") + match[2];
            }

            text = rules.join("}\n");

            DOC.create("style", document.head, {text:text});
        }

    }
});

});
