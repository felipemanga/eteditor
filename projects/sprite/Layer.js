CLAZZ("projects.sprite.Layer", {
	INJECT:{
		core:"core"
	},

    canvas:null,
    context:null,
    data:null,
    enabled:true,
	alpha:1,
	blend:"normal",

    id:0,
    name:"",

    CONSTRUCTOR:function(){
        this.canvas = DOC.create("canvas", this.core.DOM.stack, {
            position: "absolute",
            left: 0,
            top: 0,
            width: this.core.width,
            height: this.core.height
        });

        this.id = this.core.layers.length+1;
        this.name = "Layer " + this.id;
        this.context = this.canvas.getContext("2d");
        this.context.imageSmoothingEnabled = false;
		this.context.msImageSmoothingEnabled = false;
        this.invalidate();
    },

	hide:function(){
		DOC.remove(this.canvas)
	},

    read:function(){
        this.data.data.set( this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data );
    },

    redraw:function(){
        this.context.putImageData( this.data, 0, 0 );
    },

    invalidate:function(){
		try{
        	this.data = new ImageData( new Uint8ClampedArray(this.canvas.width*this.canvas.height*4), this.canvas.width, this.canvas.height );
		}catch(e){
			this.data = this.context.createImageData(this.canvas.width, this.canvas.height);
		}
    },

	clear:function(){
		if( this.canvas.width != this.width || this.canvas.height != this.height ){
			this.canvas.width = this.core.width;
			this.canvas.height = this.core.height;
			this.invalidate();
		}else{
			this.context.clearRect(0,0,this.core.width,this.core.height);
			this.data.data.fill(0);
		}
	},

	clone:function(){
		var clone = CLAZZ.get("projects.sprite.Layer", {core:this.core});
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
