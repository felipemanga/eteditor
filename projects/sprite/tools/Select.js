CLAZZ("projects.sprite.tools.Select", {
    INJECT:{
        core:"core",
        pool:"Pool",
        main:"main",
        shortcutHandler:"shortcutHandler"
    },

    selection:null,
	startX:0,
	startY:0,

	CONSTRUCTOR:function(){
		this.pool.add(this);
		console.log(this.pool);
	},

    onLoadTools:function(){
        this.selection = CLAZZ.get("projects.sprite.selectionLayer", {
			core:this.core
		});
        this.selection.hide();
        this.selection.enabled = false;
        this.selection.canvas.style.opacity = 0.5;
        this.core.selection = this.selection;
    },

	selectAll:function(){
		var selection = this.selection;
		selection.enabled = true;
		if( !selection.canvas.parent )
			this.main.DOM.stack.appendChild( selection.canvas );
		selection.context.fillStyle = "#FF44AA";
		selection.context.fillRect( 0, 0, this.core.width, this.core.height );
		selection.read();
        this.pool.call("onSelectRect", 0, 0, this.core.width, this.core.height );
	},

	selectNone:function(){
		this.selection.context.clearRect( 0, 0, this.core.width, this.core.height );
        this.pool.call("onSelectRect", 0, 0, 0, 0 );
	},

    down:function(layer, x, y, z){
    	var selection = this.selection;
		selection.enabled = true;

		if( !selection.canvas.parent )
			this.main.DOM.stack.appendChild( selection.canvas );

		if( !this.shortcutHandler.keys[16] ) this.selectNone();

		this.startX = x;
		this.startY = y;
	},

    // move:function(layer, x, y, z){},

    up:function(layer, x, y, z){
		var endX = x, endY = y;
		if( endX < this.startX ){
			endX = this.startX;
			this.startX = x;
		}
		if( endY < this.endY ){
			endY = this.startY;
			this.startY = y;
		}

		var selection = this.selection;

		if( endX == this.startX || endY == this.startY ){
			selection.enabled = false;
            this.pool.call("onSelectRect", 0, 0, 0, 0 );
		}else{
			selection.context.fillStyle = "#FF44AA";
			selection.context.fillRect( this.startX, this.startY, endX - this.startX, endY - this.startY );
			selection.read();
            this.pool.call("onSelectRect", this.startX, this.startY, endX - this.startX, endY - this.startY );
		}
	}
});
