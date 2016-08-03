CLAZZ("projects.sprite.Layer", {
	app:null,
	
    canvas:null,
    context:null,
    data:null,
    enabled:true,
	alpha:1,
	blend:"normal",

    id:0,
    name:"",

    CONSTRUCTOR:function(sp, hidden){
		this.app = sp;

        this.canvas = MAR.create("canvas", sp.DOM.stack, {
            position: "absolute",
            left: 0,
            top: 0,
            width: sp.width,
            height: sp.height
        });
		
		if( hidden ) MAR.remove(this.canvas);

        this.id = sp.layers.length+1;
        this.name = "Layer " + this.id;
        this.context = this.canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;
        this.invalidate();
    },

    read:function(){
        this.data.data.set( this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data );
    },

    redraw:function(){
        this.context.putImageData( this.data, 0, 0 );
    },

    invalidate:function(){
        this.data = new ImageData( new Uint8ClampedArray(this.canvas.width*this.canvas.height*4), this.canvas.width, this.canvas.height );
    },
	
	clone:function(){
		var clone = new projects.sprite.Layer(this.app);
		clone.name = this.name;
		clone.enabled = this.enabled;
		clone.canvas.style.mixBlendMode = this.canvas.style.mixBlendMode;
		clone.canvas.style.opacity = this.canvas.style.opacity;
		clone.context.drawImage( this.canvas, 0, 0 );
		clone.read();
		return ret;
	},
	
	pixelResize:function(){
		var src = this.data;
		this.invalidate();
		var data = this.data;
		var fy = src.height / data.height, fx = src.width / data.width;
		var read = src.data, write = data.data;
		
		for( var dy = 0; dy < data.height; dy++ ){
			for( var dx = 0; dx < data.width; dx++ ){
				var di = (dy*data.width+dx)*4|0, si = (Math.floor(dy*fy)*src.width+Math.floor(dx*fx) )*4;
				write[di++] = read[si++]; 
				write[di++] = read[si++]; 
				write[di++] = read[si++]; 
				write[di++] = read[si++]; 
			}
		}
		this.redraw();
	}
});