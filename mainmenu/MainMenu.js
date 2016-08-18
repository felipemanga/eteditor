need("mainmenu.ShortcutHandler", function(){

CLAZZ("mainmenu.MainMenu", {
    PROVIDES:{
        "QuickMenu":"singleton"
    },

    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:RESOLVE("this"),
            cfg:INJECT("mainmenuCfg")
        }),

        shortcutHandler:INJECT("shortcutHandler", {
        	"main":RESOLVE("this")
        }),

        openFile:"popups.openfile.IOpenFileDialogue",
        app:"app",
        persist:"io.Settings",
        onlineStorage:"onlineStorage",
        settings:"settings"
    },

    $DIALOGUE:{
    	load:function(){
            this.persist.read(this.settings);
            this.dialogue.moveTo(0, 28);
            if( DOC.GET.p){
                this.toggleVisibility();
                this.toggleVisibility();

                if( DOC.GET.u )
                    DOC.getURL( DOC.GET.u, (d) => this.openFile.autoOpen( DOC.GET.p, d ), {binary:true} );
                else if( DOC.GET.os )
                    this.onlineStorage.readShare( DOC.GET.p, DOC.GET.os, (d) => this.openFile.autoOpen( DOC.GET.p, d ) )
                else
                    this.openFile.autoOpen( DOC.GET.p, DOC.GET.d || "" );
            }
    	}
    },

    saveSettings:function(){
        this.persist.save(this.settings);
    },

    __screenAnchorY:false,
    onResize:function(){
        var area = this.dialogue.getAvailArea(), DOM = this.dialogue.DOM;
        var height = Math.max( 40, DOM.BODY.clientHeight );
		if( this.__screenAnchorY === false )
			this.__screenAnchorY = 28;

		if( this.__screenAnchorY + height > this.screenHeight )
			this.__screenAnchorY -= this.__screenAnchorY + height - area.height;

		this.dialogue.moveTo( 0, Math.round( this.__screenAnchorY )|0 );

		this.dialogue.setHeight( height );
    },

	toggle:false,
    toggleVisibility:function( toggle ){
        var DOM = this.dialogue.DOM;

		if( toggle == undefined )
			toggle = (this.toggle = !this.toggle);
		else this.toggle = toggle;

		var str = toggle ? "initial" : "none";
        DOM.menuToggle.forEach(function(item){
			item.style.display = str;
		});


		var focus = dialogues.IDialogue.focus;

		dialogues.IDialogue.instances.forEach(function(dialogue){
			dialogue.onToggleMenu( toggle );
		});

		this.onResize();
	},

	quickMenuTarget:null,
    menuElements:null,
	renderMenu:function( menu, obj ){
        if( obj == this.dialogue )
            return;

        var DOM = this.dialogue.DOM;

		if( obj == this.quickMenuTarget ) return;
		this.quickMenuTarget = obj;

        if( !this.menuElements ) this.menuElements = [];
        DOC.remove(this.menuElements);

		if( menu ){
            Object.sort(menu).forEach((label) => {
                var item = menu[label];
                if( !item.hidden ) this.menuElements.push( DOC.create("div", item.toggle ? DOM.menuOptions : DOM.quickMenu, {
					className:"btn",
					text: DOC.TEXT(label),
                    onclick: () => obj.raise("MENU", label)
				}) );
			});
		}

		this.onResize();
	},

	$menu:{
		click:function(){
			this.toggleVisibility();
		}
 	},

	$MENU:{
		"new":function(){
            this.openFile.show("New");
			this.toggleVisibility(false);
		},
		open:function(){
	        this.openFile.show("Open");
			this.toggleVisibility(false);
		},
        toggleVisibility:function(){
            this.toggleVisibility();
        }
	},

	$btnNew:{
		click:function(){
            this.openFile.show("New");
			this.toggleVisibility(false);
		}
	},

	$btnOpen:{
		click:function(){
	        this.openFile.show("Open");
			this.toggleVisibility(false);
		}
	}
});

});
