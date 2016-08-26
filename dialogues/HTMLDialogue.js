need("dialogues.IDialogue", function(){
"use strict";

CLAZZ("dialogues.HTMLDialogue", {
    EXTENDS:"dialogues.IDialogue",

    INJECT:{
        embedify:"embedify"
    },

    STATIC:{
        nextPrefixId:0,
        focusZ:0,
        map:{}
    },

    zIndex:0,
    maximized:false,

    CONSTRUCTOR:function(opt){
        SUPER(opt);
        dialogues.HTMLDialogue.focusZ++;
        this.window = window;
    },

    prevHeight:0,
    prevWidth:0,
    toggleMaximized:function( maximized ){
        this.maximized = maximized === undefined ? !this.maximized : maximized;
        var sizestyle = this.DOM.windowframecontents[0].style;
        var posstyle = this.DOM.__ROOT__.style;
        if( this.maximized ){
            this.x = parseInt(posstyle.left);
            this.y = parseInt(posstyle.top);
            this.prevHeight = this.height;
            this.prevWidth = this.width;
            var area = this.getAvailArea();
            this.width = area.width;
            this.height = area.height;
            sizestyle.width = this.width+"px";
            sizestyle.height = this.height+"px";
            posstyle.left = "-1px";
            posstyle.top = "-1px";
            if( this.DOM.windowframeheader )
            	this.DOM.windowframeheader[0].className = "windowframeheader maximized";
        }else{
            this.width = this.prevWidth;
            this.height = this.prevHeight;
            sizestyle.width = this.prevWidth+"px";
            sizestyle.height = this.prevHeight+"px";
            posstyle.left = this.x + "px";
            posstyle.top = this.y + "px";
            if( this.DOM.windowframeheader )
            	this.DOM.windowframeheader[0].className = "windowframeheader";
        }
        this.raise("DIALOGUE", "resize");
    },

    $windowframeheader_btnMaxWindow:{
        click:function(){
            this.toggleMaximized();
        },
        touchstart:function(){
            this.toggleMaximized();
        }
    },

    $windowframeheader_btnCloseWindow:{
        click:function(){
            this.onClose();
        },
        touchstart:function(){
            this.onClose();
        }
    },

    bringToTop:function(){
        this.zIndex = dialogues.HTMLDialogue.focusZ++;
        var instances = dialogues.IDialogue.instances;
        instances.sort((a, b) =>{
            if( !!a.cfg.always_on_top == !!b.cfg.always_on_top ){
                return a.zIndex - b.zIndex;
            }
            if( a.cfg.always_on_top ) return 1;
            return -1;
        });
        instances.forEach((dialogue, i) => {
            if( dialogue.DOM && dialogue.DOM.__ROOT__ )
            	dialogue.DOM.__ROOT__.style.zIndex = i
        });
    },

    $windowframe:{
        mousedown:function(evt){
			if( window.PointerEvent ) return;
            this.bringToTop();
            this.__onFocus();
        },
        touchstart:function(evt){
			if( window.PointerEvent ) return;
            this.bringToTop();
            this.__onFocus();
        },
		pointerdown:function(evt){
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
            evt.preventDefault();
        },
        touchstart:function(evt){
            this.__startResize("H", evt.touches[0]);
            evt.preventDefault();
        }
    },

    $windowframe_vresize:{
        mousedown:function(evt){
            this.__startResize("V", evt);
            evt.preventDefault();
        },
        touchstart:function(evt){
            this.__startResize("V", evt.touches[0]);
            evt.preventDefault();
        }
    },

    $windowframe_vhresize:{
        mousedown:function(evt){
            this.__startResize("VH", evt);
            evt.preventDefault();
        },
        touchstart:function(evt){
            this.__startResize("VH", evt.touches[0]);
            evt.preventDefault();
        }
    },

	__moveWindow:function( point ){
        if( (this.isResizing || this.isMoving) && this.maximized ) this.toggleMaximized(false);

        var dy = point.screenY - this.moveRefY;
        var dx = point.screenX - this.moveRefX;

		if( this.isMoving ){
			this.DOM.__ROOT__.style.top = ((parseInt(this.DOM.__ROOT__.style.top) || 0) + dy) + "px";
			this.DOM.__ROOT__.style.left = ((parseInt(this.DOM.__ROOT__.style.left) || 0) + dx) + "px";
        }

        if( this.isResizing ){
            if( this.isResizing.indexOf("V") != -1 )
                this.setHeight( this.DOM.windowframecontents[0].offsetHeight + dy );

            if( this.isResizing.indexOf("H") != -1 )
                this.setWidth( this.DOM.windowframecontents[0].offsetWidth + dx );
        }

        this.moveRefY = point.screenY;
        this.moveRefX = point.screenX;
	},

	$__BODY:{
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

    show:function(bringToTop){
        SUPER();
        if(bringToTop !== false) this.bringToTop();
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
        height = height|0;
        if( this.height == height ) return;
        this.height = height || 0;
        this.DOM.windowframecontents[0].style.height = this.height + "px";
        this.raise("DIALOGUE", "resize");
    },

    setWidth:function(width){
        width = width|0;
        if( width == this.width ) return;
        this.width = width || 0;
        this.DOM.windowframecontents[0].style.width = this.width + "px";
        this.raise("DIALOGUE", "resize");
    },

    setSize:function(width, height){
        width = width|0;
        height = height|0;
        if( this.width == width && this.height == height ) return;
        this.height = height || 0;
        this.width = width || 0;
        this.DOM.windowframecontents[0].style.height = this.height + "px";
        this.DOM.windowframecontents[0].style.width = this.width + "px";
        this.raise("DIALOGUE", "resize");
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
            var html = this.embedify( src, documentRoot );
			var opt = this.cfg;

			var frame = opt.frame === undefined ? true : opt.frame;
			var resizable = opt.resizable == undefined ? true : opt.resizable;
			var always_on_top = opt.always_on_top == undefined ? false : opt.always_on_top;
			var show = this.isVisible = (opt.show == undefined ? true : opt.show);
			var width = opt.width || 400, height = opt.height || 300;
            this.width = width;
            this.height = height;

            var el = DOC.create("div", document.body, {
				className:"windowframe " + (frame?"":"noframe"),
				style:{
                    display: (show?"initial":"none")
				}
			}, [
                ["div", {
                    className:"windowframeheader"
                }, [
                    ["span", {
                        id:"windowframeheader_title",
                        text:this.cfg.title || DOC.TEXT("window:"+(this.controller.constructor.NAME || this.controller.constructor.name))
                    }],
                    !frame?null:[ "div", {id:"windowframeheader_btnCloseWindow", text:"X"} ],
                    (!frame||!resizable)?null:["div", {id:"windowframeheader_btnMaxWindow", text:"Δ"}]
                ]],
                ["div",{
                    className:"windowframecontents " + html.classes,
                    style:{
                        width:  width + "px",
                        height: height + "px"
                    }
                }, [
                    ["embed-html", [
                        ["embed-body", {
                            id:html.body.id,
                            className:html.body.className
                            }, html.children
                        ]
                    ]]
                ]],
                (!frame||!resizable)?undefined:["div", {className:"windowframe_vresize"}],
                (!frame||!resizable)?undefined:["div", {className:"windowframe_hresize"}],
                (!frame||!resizable)?undefined:["div", {className:"windowframe_vhresize"}]
            ]);

            this.DOM = DOC.index( el, null, this.controller );
            this.DOM.BODY = this.DOM["EMBED-BODY"];

            if( opt.position == "center" ){
                var area = this.getAvailArea();
                this.moveTo(
                    area.width*0.5 - width*0.5,
                    area.height*0.5 - height*0.5
                );
            }
            this.bringToTop();

            if( opt.forceOpenOSWindow )
                this.app.call("onOpenOSWindow", window);

            this.__onDOMReady( el );
			DOC.attach( document.body, this[DOC.attachPrefix+"__BODY"], this );

            DOC.attach( this.DOM.embedBody, this.controller[DOC.attachPrefix+"BODY"], this.controller );
            DOC.attach( this.DOM.__ROOT__, this.controller[DOC.attachPrefix+"WINDOW"], this.controller );
			this.DOM.attach(this);
        });
    }
});

});
