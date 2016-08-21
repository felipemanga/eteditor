CLAZZ("projects.sprite.tools.Eraser", {
    INJECT:{
        core:"core",
        pool:"Pool",
        main:"main",
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
            int:{ min:0, max:1000 }
        }
    },

    ppmul:255,
    bscale:100,

	priority:-1,

	brush:null,

    lastPixelX:-1,
    lastPixelY:-1,

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
    	if( !this.brush ){
			redraw = y>=0 && y<layer.height && x>=0 && x<layer.width;
        	if( redraw )
				layer.data[ (y*layer.width+x)*4+3 ] = 0;
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
    		if( z == 0 ) return;
            z = Math.min(1, Math.max(0, z * this.ppmul / 255));
            
			var wy = y*lw, wby = by*bw, wty = ty*lw;
			redraw = wy<wty && x<tx;

    		for( ; wy<wty; wy += lw, wby += bw ){
    			for( var ix=x, ibx=bx; ix<tx; ++ix, ++ibx ){
    				var bi = (wby+ibx)*4;
					var fa = bd[bi+3]/255*z, i = (wy+ix)*4;
					ld[ i+3 ] = ld[ i+3 ] * (1-fa);
					if( fa==1 ){
						ld[i] = ld[i+1] = ld[i+2] = 0;
					}
   					// this.core.color.write( layer, ix, y, L );
    			}
    		}
    	}
		return redraw;
    },

    line:function( layer, x1, y1, x2, y2, z ){
		var dx = x2 - x1;
		var dy = y2 - y1;
		var pixel = this.pixel.bind(this, layer), redraw = false;

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
            else redraw = this.pixel( layer, x, y, z );

        }
		this.lastPixelX = x;
		this.lastPixelY = y;

        return redraw;
    },

    down:function(layer, x, y, z){
        return this.goTo(layer, x, y, z);
    },

    move:function(layer, x, y, z){
        return this.goTo(layer, x, y, z);
    },

    up:function(layer, x, y, z){
        this.core.push();
        this.lastPixelX = -1;
        this.lastPixelY = -1;
        return true;
    }
});
