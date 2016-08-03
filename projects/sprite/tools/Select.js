CLAZZ("projects.sprite.tools.Select", {
    app:null,
	selection:null,
	
	startX:0,
	startY:0,
	
	CONSTRUCTOR:function( app ){
		if( !app.selection ){
			app.selection = app.createLayer(true);
			app.selection.enabled = false;
			app.selection.canvas.style.opacity = 0.5;
		}
		app.pool.add(this);
		this.selection = app.selection;
	},
	
	selectAll:function(){
		this.selection.enabled = true;
		if( !this.selection.canvas.parent )
			this.app.app.DOM.stack.appendChild( this.selection.canvas );
		this.selection.context.fillStyle = "#FF44AA";
		this.selection.context.fillRect( 0, 0, this.app.width, this.app.height );
		this.selection.read();
	},
	
	selectNone:function(){
		this.selection.context.clearRect( 0, 0, this.app.width, this.app.height );
	},

    down:function(layer, x, y, z){
		this.selection.enabled = true;
		
		if( !this.selection.canvas.parent )
			this.app.app.DOM.stack.appendChild( this.selection.canvas );
		
		if( !main.keys[16] ) this.selectNone();
		
		this.startX = x;
		this.startY = y;
	},

    move:function(layer, x, y, z){
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
		
		if( endX == this.startX || endY == this.startY ){
			this.selection.enabled = false;
		}else{		
			this.selection.context.fillStyle = "#FF44AA";
			this.selection.context.fillRect( this.startX, this.startY, endX - this.startX, endY - this.startY );
			this.selection.read();
		}
	}
});