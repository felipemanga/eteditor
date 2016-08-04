CLAZZ("dialogues.IDialogue", {
	INJECT:{
		app:"app",
		controller:"controller",
		cfg:"cfg"
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
	enabled:false,
	width:0,
	height:0,

	CONSTRUCTOR:function(opt){
		this.children = [];

		this.parent = this.cfg.parent;

		this.app.add(this);
		this.app.add(this.controller);

		dialogues.IDialogue.instances.push(this);

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
		}
	},

    enable:function(){
    	this.enabled = true;
    	this.onToggleMenu( main.toggle );
	},

	disable:function(){
    	this.enabled = false;
    	this.onToggleMenu( main.toggle );
	},

	toggleEnabled:function(){
		this.enabled = !this.enabled;
		this.onToggleMenu(main.toggle);
	},

    onToggleMenu:function(visible){
        if( !this.parent ) return;
        if( visible && this.enabled ) this.__show();
        else this.__hide();
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
		return this.controller &&
		this.controller[scope] &&
		this.controller[scope][event] &&
		this.controller[scope][event].apply(
			this.controller,
			Array.prototype.splice.call(arguments, 2, arguments.length-2)
		);
	},

	onLoad:function(){
		this.__onLoadQueued = false;
		this.raise("DIALOGUE", "load", 1)
	},

	canClose:function(){
		return true;
	},

	onClose:function(){
		if( this.parent || this.cfg.hide_only ) this.hide();
		else this.close();
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
