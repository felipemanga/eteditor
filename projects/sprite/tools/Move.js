CLAZZ("projects.sprite.tools.Move", {
    INJECT:{
        core:"core",
        main:"main"
    },

		refX:0,
		refY:0,

    down:function(layer, x, y, z){
			if( this.core.selection && this.core.selection.enabled ){
				srcLayer = this.core.activeLayer;
				this.core.addLayer(true, true);
				this.core.extract(srcLayer, this.core.activeLayer);
				this.core.clearLayer(srcLayer);
				srcLayer.redraw();
				this.core.selection.enabled = false;
				// var mask = this.core.selection.data.data;
				// var out = this.core.activeLayer.data.data;
				// var l = this.core.width*this.core.height*4;
				// for( var i=0; i<l; i+=4 ){
				// 	var v = mask[i+3], iv;
				// 	if( !v ){
				// 		out[i  ] = 0;
				// 		out[i+1] = 0;
				// 		out[i+2] = 0;
				// 		out[i+3] = 0;
				// 	}else{
				// 		v /= 255;
				// 		out[i+3] = out[i+3] * v;
				// 	}
				// }
				// this.core.activeLayer.redraw();
			}
			this.refX = x;
			this.refY = y;
    },

    move:function(layer, x, y, z){
			layer = this.core.activeLayer;
			layer.canvas.style.top = this.main.zoom * (y - this.refY) + "px";
			layer.canvas.style.left = this.main.zoom * (x - this.refX) + "px";
    },

    up:function(layer, x, y, z){
			layer = this.core.activeLayer;
			layer.canvas.style.top = 0;
			layer.canvas.style.left = 0;
			var refX = this.refX - x;
			var refY = this.refY - y;
			layer.context.clearRect(0, 0, this.core.width, this.core.height );
			layer.context.putImageData( layer.data, -refX, -refY );
			layer.read();
			this.core.push();
    }
});
