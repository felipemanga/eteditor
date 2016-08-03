CLAZZ("projects.sprite.tools.Move", {
    app:null,
	refX:0,
	refY:0,
	
    down:function(layer, x, y, z){
		if( this.app.selection && this.app.selection.enabled ){
			this.app.addLayer(true, true);
			this.app.selection.enabled = false;
			var mask = this.app.selection.data.data;
			var out = this.app.activeLayer.data.data;
			var l = this.app.width*this.app.height*4;
			for( var i=0; i<l; i+=4 ){
				var v = mask[i+3], iv;
				if( !v ){
					out[i  ] = 0;
					out[i+1] = 0;
					out[i+2] = 0;
					out[i+3] = 0;
				}else{
					v /= 255;
					out[i+3] = out[i+3] * v;
				}
			}
			this.app.activeLayer.redraw();
		}
		this.refX = x;
		this.refY = y;
    },

    move:function(layer, x, y, z){
		layer = this.app.activeLayer;
		layer.canvas.style.top = this.app.app.zoom * (y - this.refY) + "px";
		layer.canvas.style.left = this.app.app.zoom * (x - this.refX) + "px";
    },

    up:function(layer, x, y, z){
		layer = this.app.activeLayer;
		layer.canvas.style.top = 0;
		layer.canvas.style.left = 0;
		var refX = this.refX - x;
		var refY = this.refY - y;
		layer.context.clearRect(0, 0, this.app.width, this.app.height );
		layer.context.putImageData( layer.data, -refX, -refY );
		layer.read();
		this.app.push();
    }
});