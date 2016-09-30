CLAZZ("projects.sprite.tools.Pencil", {
    INJECT:{
        core:"core",
        pool:"Pool",
        main:"main",
        shortcutHandler:"shortcutHandler",
        win:INJECT("popups.brushpicker.BrushPicker", {
            tool:INJECT("this")
        })
    },

    meta:{
        ppmul:{
            label:"Pressure Multiplier",
            int:{ min:0, max:512 }
        },
        bscale:{
            label:"Brush Scale",
            int:{ min:0, max:1000, nonlinear:true }
        },
        step:{
        	label:"Step",
        	int:{ min:0, max:100 }
        }
    },

    ppmul:255,
    bscale:100,

	priority:-2,
    shortcutHandler:null,
	brush:null,

	xMask:0xFFFFFFFF,
	yMask:0xFFFFFFFF,

    lastPixelX:-1,
    lastPixelY:-1,

    it:0,
	blueIt:0,
    step:0,

    activate:function(){
    	this.win.enable();
        this.main.DOM.stack.style.cursor = "crosshair";
    },

    deactivate:function(){
    	this.win.disable();
        this.main.DOM.stack.style.cursor = "initial";
    },

    pixel:function( layer, x, y, z ){
		var redraw;

		x = x & this.xMask;
		y = y & this.yMask;

		this.blueIt++;

		if( this.step && (this.it++)%(this.step * Math.round(this.brush && this.brush.width/5 || 1)) ) return false;

		var mask = this.core.mask.bind( this.core );

    	if( !this.brush ){
			redraw = mask(x, y);
        	if( redraw )
				this.core.color.write( layer, x, y, z*redraw*255 );
    	}else{
    		var brush = this.brush, hh = Math.floor(brush.height/2), hw = Math.floor(brush.width/2);
    		var bw = brush.width, bd = brush.data, lw = layer.width, ld = layer.data;
    		var bx=0, by=0, tx=Math.round(x+(brush.width-hw)), ty=Math.round(y+(brush.height-hh));
    		x=x-hw;
    		y=y-hh;
    		if( x<0 ){
    			bx = -x;
    			x = 0;
    		}
    		if( y<0 ){
    			by = -y;
    			y = 0;
    		}
    		if( tx > layer.width ) tx = layer.width;
    		if( ty > layer.height ) ty = layer.height;
    		if( z == undefined ) z = 1;
    		if( z == 0 ) return false;
            z = Math.min(1, Math.max(0, z * this.ppmul / 255));

			var wy = y*lw, wby = by*bw, wty = ty*lw;

			var color = this.core.color;
			var r=color.r, g=color.g, b=color.b, a=color.a, blueIt = this.blueIt&0xFF;

			redraw = wy < wty && x < tx;

    		for( ; wy<wty; y++, wy += lw, wby += bw ){
    			for( var ix=x, ibx=bx; ix<tx; ++ix, ++ibx ){
    				var bi = (wby+ibx)*4;
    				var blue = bd[bi+2];
    				if( blue && blue != blueIt ) continue;
					var fa = a/255 * bd[bi+3]/255*z*mask(ix,y), i = (wy+ix)*4;
					var oa = 1-(1-fa)*(1-ld[i+3]/255);
					fa = fa/oa;
					var fb = 1-fa;

					ld[ i   ] = r * fa + ld[ i   ] * fb;
					ld[ i+1 ] = g * fa + ld[ i+1 ] * fb;
					ld[ i+2 ] = b * fa + ld[ i+2 ] * fb;
					ld[ i+3 ] = a * fa + ld[ i+3 ] * fb;
   					// this.core.color.write( layer, ix, y, L );
    			}
    		}
    	}
		return redraw;
    },

    line:function( layer, x1, y1, x2, y2, z ){
		var dx = x2 - x1;
		var dy = y2 - y1;
		var pixel = this.pixel.bind(this, layer);
		var redraw = false;
		var ix = (dx > 0) - (dx < 0);
		var iy = (dy > 0) - (dy < 0);
		dx = Math.abs(dx) << 1;
		dy = Math.abs(dy) << 1;

		redraw = pixel(x1, y1, z) || redraw;

		if( dx >= dy )
		{
			var error = dy - (dx >> 1);

			while( x1 != x2 )
			{
				if ((error >= 0) && (error || (ix > 0)))
				{
					error -= dx;
					y1 += iy;
				}

				error += dy;
				x1 += ix;

				redraw = pixel(x1, y1, z) || redraw;
			}
		}
		else
		{
			var error = dx - (dy >> 1);

			while (y1 != y2)
			{
				if ((error >= 0) && (error || (iy > 0)))
				{
					error -= dy;
					x1 += ix;
				}

				error += dx;
				y1 += iy;

				redraw = pixel(x1, y1, z) || redraw;
			}
		}
		return redraw;
    },

    goTo:function( layer, x, y, z ){
		var redraw;
        if( this.core.color ){

            if( this.lastPixelX != -1 ) redraw = this.line( layer, this.lastPixelX, this.lastPixelY, x, y, z );
            else  redraw = this.pixel( layer, x, y, z );

        }
		this.lastPixelX = x;
		this.lastPixelY = y;
        return redraw;
    },

    down:function(layer, x, y, z){
		if( this.shortcutHandler && !this.shortcutHandler.keys[16] ){
			this.lastPixelX = -1;
			this.lastPixelY = -1;
		}
        this.blueIt = this.it = 0;
        return this.goTo(layer, x, y, z);
    },

    move:function(layer, x, y, z){
        return this.goTo(layer, x, y, z);
    },

    up:function(layer, x, y, z){
        this.core.push();
        return true;
    },

    over:function(layer, x, y, z){
        if( !this.brush || !this.core.toolOverlay )
            return;

        var to = this.core.toolOverlay;
        to.context.clearRect(0,0,to.canvas.width,to.canvas.height);
        to.context.putImageData(this.brush, Math.ceil(x-this.brush.width/2), Math.ceil(y-this.brush.height/2));
    },

    out:function(layer, x, y, z){
        var to = this.core.toolOverlay;
        if( !to ) return;
        to.context.clearRect(0,0,to.canvas.width,to.canvas.height);
    }
});
