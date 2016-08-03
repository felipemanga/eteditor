CLAZZ("projects.sprite.tools.Pencil", {
    app:null,
	
	"@win":{dialogue:"dialogues.BrushPicker"},
	win:null,
	
	priority:-2,

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
        this.app.app.DOM.stack.style.cursor = "crosshair";
    },

    deactivate:function(){
    	this.win.disable();
        this.app.app.DOM.stack.style.cursor = "initial";
    },

    pixel:function( layer, x, y, z ){
		var redraw;

		x = x & this.xMask;
		y = y & this.yMask;
		
		this.blueIt++;

		if( this.step && (this.it++)%this.step ) return false;
		
		var mask = this.app.mask.bind( this.app );

    	if( !this.brush ){
			redraw = mask(x, y);
        	if( redraw )
				this.app.color.write( layer, x, y, z*redraw*255 );
    	}else{
    		var brush = this.brush, hh = Math.round(brush.height/2), hw = Math.round(brush.width/2);
    		var bw = brush.width, bd = brush.data, lw = layer.width, ld = layer.data;
    		var bx=0, by=0, tx=x+(brush.width-hw), ty=y+(brush.height-hh);
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
			var wy = y*lw, wby = by*bw, wty = ty*lw;

			var color = this.app.color;
			var r=color.r, g=color.g, b=color.b, a=color.a, blueIt = this.blueIt&0xFF;

			redraw = wy<wty && x<tx;

    		for( ; wy<wty; y++, wy += lw, wby += bw ){
    			for( var ix=x, ibx=bx; ix<tx; ++ix, ++ibx ){
    				var bi = (wby+ibx)*4;
    				var blue = bd[bi+2];
    				if( blue && blue != blueIt ) continue;
					var fa = a/255.0 * bd[bi+3]/255*z*mask(ix,y), i = (wy+ix)*4;
					ld[ i   ] = r *fa + ld[ i   ] * (1-fa);
					ld[ i+1 ] = g *fa + ld[ i+1 ] * (1-fa);
					ld[ i+2 ] = b *fa + ld[ i+2 ] * (1-fa);
					ld[ i+3 ] = a *fa + ld[ i+3 ] * (1-fa);
   					// this.app.color.write( layer, ix, y, L );
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
        if( this.app.color ){

            if( this.lastPixelX != -1 ) redraw = this.line( layer, this.lastPixelX, this.lastPixelY, x, y, z );
            else  redraw = this.pixel( layer, x, y, z );

        }
		this.lastPixelX = x;
		this.lastPixelY = y;
        return redraw;
    },

    down:function(layer, x, y, z){
		if( !main.keys[16] ){
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
        this.app.push();
        return true;
    }
});
