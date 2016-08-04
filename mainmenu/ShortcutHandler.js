CLAZZ("mainmenu.ShortcutHandler", {
    INJECT:{
        app:"app",
        main:"main",
        settings:RESOLVE("settings.global.shortcuts")
    },

    settings:null,
    main:null,
    menu:null,
    menuTarget:null,

    CONSTRUCTOR:function(){
        this.app.add(this);
    },

    onOpenOSWindow:function(window){
        window.onkeydown = this.__onKey.bind(this);
        window.onkeyup = this.__onKey.bind(this);
    },

    renderMenu:function( menu, obj ){
		this.menu = {};
		this.menuTarget = obj;
		for( var k in menu ){
			if( menu[k] && menu[k].shortcut )
				this.menu[k] = menu[k].shortcut;
		}
    },

    keys:null,
	keyCount:0,
    clearKeysHandle:0,
	__onKey:function(evt){
		if( !this.keys ) this.keys = [];
		
		var down = evt.type == "keydown";
		var keyCode = evt.keyCode || evt.which;

		this.keys[ keyCode ] = down;

		if( evt.target.tagName == "TEXTAREA" ){
			if( keyCode==9 && down ){
				evt.preventDefault();
				var s = evt.target.selectionStart;
				evt.target.value = evt.target.value.substring(0,evt.target.selectionStart) + "    " + evt.target.value.substring(evt.target.selectionEnd);
				evt.target.selectionEnd = s+4;
			}
			return;
		}

		if( evt.target.tagName == "INPUT" )
			return;

		if( this.clearKeysHandle )
			clearTimeout( this.clearKeysHandle );

		var THIS = this;
		this.clearKeysHandle = setTimeout(function(){
			THIS.keys = [];
			THIS.clearKeysHandle = 0;
		}, 3000);

		if( !evt.repeat ) console.log( keyCode );
		var keys = this.keys, keyCount = this.keys.reduce( (a, b) => a+b )|0;
		var prevent = false;

		function checkShortcuts(target, cuts){
			if( !target || !cuts )
				return;

			for( var k in cuts ){
				var ks = cuts[k];
				if( !ks ) continue;
				for( i=0; i<ks.length; ++i ){
					var code = ks[i];

					if( typeof code == "string" )
						code = code.toUpperCase().charCodeAt(0);

					var state = code > 0;
					if( code < 0 ){
						if( keyCode != -code ) break;
						else code = -code;
					}

					if( (keys[ code ]||false) != state )
						break;
				}

				if( i == ks.length && i >= keyCount ){
					target.raise("MENU", k);
					prevent = true;
				}
			}
		}

		checkShortcuts(this.main.dialogue, this.settings);
		checkShortcuts(this.menuTarget, this.menu);
		if( prevent ) evt.preventDefault();
	},

});
