needs("dialogues.IDialogue", {

CLAZZ("dialogues.NWDialogue", {
    EXTENDS:"dialogues.IDialogue"
    win:null,

    CONSTRUCTOR:function(opt){
        SUPER(opt);
    },

    save:function( saveAs ){
    	if( !this.onSave ){
    		if( this.parent )
    			this.parent.save(saveAs);
    		return;
    	}

        if( saveAs || !this.path ){
        	var THIS=this;
        	DOC.create("input", {type:"file", attr:{nwsaveas:this.path||"image.png"}, onchange:function(evt){
				THIS.path = evt.target.files[0].path;
				THIS.save();
        	}}).click();
        	return;
        }

        var THIS = this;

		function cb(data){
			if( data && typeof data == "string" && /data:[a-z\/]+;base64,/i.test(data) )
				fs.writeFileSync( THIS.path, data.replace(/^[^,]+,/, ""), {encoding:"base64"} );
			else if( data )
				fs.writeFileSync( THIS.path, data, {encoding:"binary"} );
		}

		this.onSave( cb );
    },


    __show:function(){
        if( this.win )
            this.win.show();
    },
	__hide:function(){
        if( this.win )
            this.win.hide();
    },

    getAvailArea:function(){
        return {
            width: this.win.window.screen.availWidth,
            height: this.win.window.screen.availHeight
        };
    },


    loadLayout:function(layout){
        var THIS=this, opt = this.cfg;
		nw.Window.open ( layout, {
			"title" : opt.title || THIS.constructor.NAME || THIS.constructor.name,
			"frame" : opt.frame == undefined ? true : opt.frame,
			"resizable" : opt.resizable == undefined ? true : opt.resizable,
			"always_on_top": opt.always_on_top == undefined ? false : opt.always_on_top,
			"position" : opt.position || "center",
			"transparent" : opt.transparent || false,
			"show" : THIS.isVisible = (opt.show == undefined ? true : opt.show),
			"new_instance" : false,
			"width": opt.width || 400,
			"height": opt.height || 300
		},
		function(win) {
			if( !win ){
				console.error("Could not open dialogue:", layout);
				return;
			}
			THIS.win = win;
			win.on( 'loaded', function(){
				// alert("loaded " + THIS.constructor.NAME );
				var w = win.window;
				w.addEventListener( 'focus', THIS.__onFocus.bind(THIS) );
				w.addEventListener( 'blur', THIS.__onBlur.bind(THIS) );
				w.addEventListener( 'keydown', main.__onKey.bind(main) );
				w.addEventListener( 'keyup', main.__onKey.bind(main) );
				w.onerror = main.win.window.onerror;

                THIS.__onDOMReady( win.window.document.body );
			});

			win.on( 'close', THIS.onClose.bind(THIS) );
		});
    }
});

});
