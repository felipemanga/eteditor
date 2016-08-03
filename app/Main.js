var fs = require('fs');

CLAZZ("Main", {
	win:null,
	pending:1,

	settings:{
		shortcuts:{
			"new":[17, "N"],
			save:[17, "S"],
			saveAs:[17, 16, "S"],
			open:[17, "O"],
			exit:[17, -81],
			toggleVisibility:[9]
		}
	},

	toggle:true,
	isFocussed:false,
	screenWidth:0,
	screenHeight:0,
	__screenAnchorY:false,

	keys:null,
	keyCount:0,

    CONSTRUCTOR:function(){
    	window.main = this;
    	Dialogue.dialoguePaths = "app/include/";

    	this.keys = [];

        window.DOM = MAR.index(document.body, null, this);
		DOM.menu.style.display = "none";
		DOM.loading.style.display = "block";

		this.win = nw.Window.get();
		this.win.on('close', this.onClose.bind(this) );

		MAR.attach( window, this.WINDOW, this );
		MAR.attach( screen.orientation, this.ORIENTATION, this );
		this.toggleVisibility();
		setInterval( this.onResize.bind(this), 1000 );

		var THIS = this;

		dir("app/include", function( path, stat ){
			if( /.+\.js$/i.test(path) ){
				MAR.index( MAR.create("script", {src:"include/"+path}, document.head), null, THIS );
				THIS.pending++;
				DOM.totalAmount.textContent = THIS.pending;
			}
			return true;
		});

		if( fs.existsSync("settings.json") )
			this.settings = MAR.mergeTo( this.settings, JSON.parse( fs.readFileSync("settings.json", "utf-8") ) );

		this.SCRIPT.onload.call(this);
	},

	onDoneLoading:function(){
		DOM.menu.style.display = "block";
		DOM.loading.style.display = "none";
	},

	toggleVisibility:function( toggle ){
		if( toggle == undefined )
			toggle = (this.toggle = !this.toggle);
		else this.toggle = toggle;
		var str = toggle ? "initial" : "none";
		DOM.menuToggle.forEach(function(item){
			item.style.display = str;
		});


		var focus = Dialogue.focus;

		Dialogue.instances.forEach(function(dialogue){
			dialogue.onToggleMenu( toggle );
		});

		if( focus ){
			setTimeout(function(){
				if( focus.isVisible && !focus.isFocussed )
					focus.win.focus();
			}, 20);
		}

		this.onResize();
	},

	quickMenuTarget:null,
	showQuickMenu:function( menu, obj ){
		console.log("focus: ", obj && obj.constructor.NAME );
		if( !obj ){
			obj = Dialogue.focus;
			if(obj) menu = obj.menu;
		}

		if( obj == this.quickMenuTarget ) return;
		this.quickMenuTarget = obj;
		MAR.removeChildren( DOM.quickMenu );

		if( menu ){
			menu.forEach(function(item){
				MAR.create("div", DOM.quickMenu, {
					className:"btn",
					text: MAR.TEXT(item),
					onclick: obj[item] && obj[item].bind(obj)
				});
			});
		}else if( !this.isFocussed ){
			this.win.focus();
		}
		this.onResize();
		setTimeout( this.onResize.bind(this), 20 );
	},

	menu:{
		click:function(){
			this.toggleVisibility();
		}
	},

	"new":function(){
		new dialogues.NewProjectDialogue(true);
	},

	btnNew:{
		click:function(){
			new dialogues.NewProjectDialogue(true);
			this.toggleVisibility();
		}
	},

	open:function(){
		new dialogues.NewProjectDialogue(false);
		this.toggleVisibility();
	},

	save:function(){
		if( this.quickMenuTarget )
			this.quickMenuTarget.save();
	},

	saveAs:function(){
		if( this.quickMenuTarget )
			this.quickMenuTarget.save( true );
	},

	btnSave:{
		click:function(){
			this.save();
			this.toggleVisibility();
		}
	},

	btnSaveAs:{
		click:function(){
			this.saveAs();
			this.toggleVisibility();
		}
	},

	btnOpen:{
		click:function(){
			new dialogues.NewProjectDialogue(false);
			this.toggleVisibility();
		}
	},

	saveSettings:function(){
		fs.writeFileSync( "settings.json", JSON.stringify( this.settings ) );
	},

	onClose:function(){
		this.saveSettings();
	},

	exit:function(){
		this.saveSettings();

		var abort=false;
		Dialogue.instances.forEach(function(instance){
			if( abort ) return;
			if( !instance.canClose() ) abort = true;
		});

		if( !abort ){
			while( Dialogue.instances.length )
				Dialogue.instances[0].close();

			this.win.close(true);
		}
	},

	btnExit:{
		click:function(){
			this.exit();
		}
	},

	onResize:function(){
		this.screenWidth = this.win.window.screen.availWidth;
		this.screenHeight = this.win.window.screen.availHeight;

		var height = Math.max( 40, DOM.BODY.clientHeight ), width = Math.min( 126, DOM.BODY.clientWidth );
		if( this.__screenAnchorY === false )
			this.__screenAnchorY = this.screenHeight*0.5 - height;

		if( this.__screenAnchorY + height > this.screenHeight )
			this.__screenAnchorY -= this.__screenAnchorY + height - this.screenHeight;

		this.win.moveTo( 0, Math.round( this.__screenAnchorY )|0 );
		if( this.win.height != height )
			this.win.appWindow.innerBounds.height = height;
	},

    dragging:null,
    dragOffsetX:0,
    dragOffsetY:0,

    startDrag:function(evt){
        this.dragging = DOM.BODY;
        this.dragOffsetX = evt.pageX;
        this.dragOffsetY = evt.pageY;
    },

    drag:function(evt){
        if( evt.buttons == 0 )
            return this.dragging = null;

        var x = (evt.screenX - this.dragOffsetX)||0, y = (evt.screenY - this.dragOffsetY)||0;
        if( this.dragging == DOM.BODY && evt.screenY ){
        	this.__screenAnchorY = Math.max(0, y);
            this.onResize();
        }
    },

    clearKeysHandle:0,
	__onKey:function(evt){
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

		function checkShortcuts(target){
			if( target && target.parent )
				checkShortcuts(target.parent);

			if( !target || !target.settings || !target.settings.shortcuts )
				return;

			var cuts = target.settings.shortcuts; // see what I did there?

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
					if( typeof target[k] == "function" ) target[k]();
					else if( target.pool ) target.pool.call(k);
					prevent = true;
				}
			}
		}

		checkShortcuts(this);
		checkShortcuts(this.quickMenuTarget);
		if( prevent ) evt.preventDefault();
	},

	ORIENTATION:{
		change:function(){
			this.onResize();
		}
	},

	SCRIPT:{
		onload:function(){
			this.pending--;
			if( this.pending <= 0 ){
				DOM.loading.style.display = "none";
				this.onDoneLoading();
			}else{
				DOM.loadingAmount.textContent = parseInt(DOM.totalAmount.textContent) - this.pending;
			}
		}
	},

	WINDOW:{
		focus:function(){
			this.isFocussed = true;
		},
		blur:function(){
			this.isFocussed = false;
		},
		keydown:function(evt){
			this.__onKey(evt);
		},
		keyup:function(evt){
			this.__onKey(evt);
		},
    	mousedown:function(evt){
    		this.startDrag(evt);
    	},
    	mousemove:function(evt){
    		this.drag(evt);
    	},
    	mouseup:function(){
    		this.dragging = null;
    	}
	},

    BODY:{
        dragover:function( evt ){
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },

        drop:function( evt ){
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();

			DOM.lblDrop.style.display = "none";

            var files = evt.dataTransfer.files; // FileList object.
            for (var i = 0, f; f = files[i]; i++){
				console.log( f.path );
            }
        }
    },

});
