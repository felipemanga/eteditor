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
        this.selection = CLAZZ.get("projects.sprite.Layer", {
			core:this.core
		});
        this.selection.hide();
        this.selection.enabled = false;
        this.selection.canvas.style.opacity = 0.5;
        this.core.selection = this.selection;
		this.core.overlays.push( this.selection );
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
        this.selection.enabled = false;
	},

    down:function(layer, x, y, z){
    	var selection = this.selection;

		if( !selection.canvas.parent )
			this.main.DOM.stack.appendChild( selection.canvas );

		if( !this.shortcutHandler.keys[16] ) this.selectNone();

		selection.enabled = true;
		this.startX = x;
		this.startY = y;

        var to = this.core.toolOverlay;
        if( to ) to.context.clearRect(0,0,to.canvas.width,to.canvas.height);
	},

    move:function(layer, x, y, z){
        var to = this.core.toolOverlay;
        if( !to ) return;
        to.context.clearRect(0,0,to.canvas.width,to.canvas.height);
        to.context.strokeRect( this.startX, this.startY, x-this.startX, y-this.startY );
    },

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

        var to = this.core.toolOverlay;
        if( to ) to.context.clearRect(0,0,to.canvas.width,to.canvas.height);
	}
});
