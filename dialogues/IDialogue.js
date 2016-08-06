CLAZZ("dialogues.IDialogue", {
	INJECT:{
		mainmenu:"mainmenu",
		app:"app",
		controller:"controller",
		cfg:"cfg",
		parent:"parent"
	},

	cfg:{},

	STATIC:{
		dialoguePaths:"",
		focusTarget:null,
		focusRoot:null,
		instances:[]
	},

	DOM:null,
    isVisible:false,
	__onLoadQueued:false,
    __loadedChildrenCount:0,
    children:null,
    parent:null,
	enabled:true,
	width:0,
	height:0,
	window:null,

	CONSTRUCTOR:function(){
		this.children = [];
		this.app.add(this);
		this.app.add(this.controller);

		dialogues.IDialogue.instances.push(this);

		if( this.parent ) this.parent.children.push(this);
		if( !this.cfg ) debugger;

		if( "enabled" in this.cfg ) this.enabled = this.cfg.enabled;

		setTimeout(
			this.loadLayout.bind(
				this,
				dialogues.IDialogue.dialoguePaths + (this.layout || this.controller.constructor.fullName || this.controller.constructor.name).replace(/\./g, '/') + ".html"
			), 5
		);
	},

	loadLayout:null,

	__onDOMReady:function( root ){
		try{
			if( this.children.length == this.__loadedChildrenCount )
				this.onLoad();
			else this.__onLoadQueued = true;
		}catch(ex){
			alert(ex + "\n" + ex.stack);
			throw(ex);
		}
		try{
			var parent = this.parent;
			if( parent ){
				parent.__loadedChildrenCount++;
				// alert( parent.__loadedChildrenCount + " = " + parent.children.length + " && " + parent.__onLoadQueued ) ;
				if( parent.__loadedChildrenCount == parent.children.length && parent.__onLoadQueued ){
					parent.__onLoadQueued = false;
					parent.onLoad();
				}
			}else this.__onFocus();
		}catch(ex){
			alert(ex + "\n" + ex.stack);
			throw(ex);
		}
	},

    enable:function(){
    	this.enabled = true;
    	this.onToggleMenu( this.mainmenu.toggle );
	},

	disable:function(){
    	this.enabled = false;
    	this.onToggleMenu( this.mainmenu.toggle );
	},

	toggleEnabled:function(){
		this.enabled = !this.enabled;
		this.onToggleMenu(this.mainmenu.toggle);
	},

    onToggleMenu:function(visible){
		this.raise("DIALOGUE", "toggleMenu", visible);
        if( !this.parent ) return;
        if( visible && this.enabled ) this.show();
        else this.hide();
    },

	show:function(){
		this.enabled = true;
		if( this.isVisible ) return;
        this.isVisible = true;
        this.__show();
	},

	hide:function(){
		if( !this.isVisible ) return;
        this.isVisible = false;
        this.__hide();
	},

	__show:null,
	__hide:null,
	__close:null,

	__onBlur:function(evt){
		this.raise("DIALOGUE", "blur");
	},

	__onFocus:function(){
		if( !this.isVisible || dialogues.IDialogue.focusTarget == this )
			return;

		dialogues.IDialogue.focusTarget = this;

		var menuTarget = this;
		while( menuTarget && !(menuTarget.cfg && menuTarget.cfg.menu) )
			menuTarget = menuTarget.parent;

		if( this.app ){
			if( menuTarget && menuTarget.cfg.menu )
				this.app.call("renderMenu", menuTarget.cfg.menu, this );
			else
				this.app.call( "renderMenu", null, this );
		}

		this.raise( "DIALOGUE", "focus" );
	},

	raise:function(scope, event){
		scope = DOC.attachPrefix + scope;
		var func = this.controller &&
		this.controller[scope] &&
		this.controller[scope][event] &&
		this.controller[scope][event];

		if( func ) return func.apply(
			this.controller,
			Array.prototype.splice.call(arguments, 2, arguments.length-2)
		);

		if( this.controller.pool )
			return this.controller.pool.call.apply(
				this.controller.pool,
				[event].concat( Array.prototype.splice.call(arguments, 2, arguments.length-2) )
			);
	},

	onLoad:function(){
		this.__onLoadQueued = false;
		this.raise("DIALOGUE", "load")
	},

	canClose:function(){
		return true;
	},

	onClose:function(){
		if( this.parent || this.cfg.hide_only ){
			this.enabled = false;
			this.hide();
		}else this.close();
	},

	close:function(){
		if( this.raise("DIALOGUE", "close") === false )
			return;

		if( this.parent ){
			i = this.parent.children.indexOf(this);
			if( i ==  this.parent.children.length-1 ) this.parent.children.pop();
			else if( i>=0 ) this.parent.children[i] = this.parent.children.pop();
			this.parent = null;
		}

		i = dialogues.IDialogue.instances.indexOf(this);
		if( i == dialogues.IDialogue.instances.length-1 ) dialogues.IDialogue.instances.pop();
		else if( i>=0 ) dialogues.IDialogue.instances[i] = dialogues.IDialogue.instances.pop();

		while( this.children.length )
			this.children[ this.children.length-1 ].close();

		this.app.remove(this.controller);
		this.app.remove(this);
		this.__close();
	}
});
