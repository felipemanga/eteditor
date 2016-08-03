CLAZZ("mainmenu.MainMenu", {
    PROVIDES:{
        "QuickMenu":"singleton"
    },

    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:INJECT("mainmenuCfg")
        }),

        openFile:"popups.openfile.IOpenFileDialogue",

        app:"app"
    },

    $DIALOGUE:{
    	load:function(){
    		this.onResize();
    	}
    },

    __screenAnchorY:false,
    onResize:function(){
        var area = this.dialogue.getAvailArea(), DOM = this.dialogue.DOM;
        var height = Math.max( 40, DOM.BODY.clientHeight );
		if( this.__screenAnchorY === false )
			this.__screenAnchorY = 0;

		if( this.__screenAnchorY + height > this.screenHeight )
			this.__screenAnchorY -= this.__screenAnchorY + height - area.height;

		this.dialogue.moveTo( 0, Math.round( this.__screenAnchorY )|0 );

		this.dialogue.setHeight( height );
    },

	toggle:true,
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
	render:function( menu, obj ){
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
				this.menuElements.push( DOC.create("div", DOM.quickMenu, {
					className:"btn",
					text: DOC.TEXT(label),
                    onclick: obj.raise.bind(obj, "MENU", label)
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

	"new":function(){
		this.openFile.show("New");
	},

	$btnNew:{
		click:function(){
            this.openFile.show("New");
			this.toggleVisibility();
		}
	},

	open:function(){
        this.openFile.show("Open");
	},

	save:function(){
		if( this.quickMenuTarget )
			this.quickMenuTarget.save();
	},

	saveAs:function(){
		if( this.quickMenuTarget )
			this.quickMenuTarget.save( true );
	},

	$btnSave:{
		click:function(){
			this.save();
			this.toggleVisibility();
		}
	},

	$btnSaveAs:{
		click:function(){
			this.saveAs();
			this.toggleVisibility();
		}
	},

	$btnOpen:{
		click:function(){
            this.open();
    		this.toggleVisibility();
		}
	}
});
