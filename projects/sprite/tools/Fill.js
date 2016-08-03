CLAZZ("projects.sprite.tools.Fill", {
    app:null,

    pixel:function( layer, x, y, z ){
        this.app.color.write( layer, x, y, z );
    },

    read:function( layer, x, y ){
        var m = layer.data, i = (y*layer.width+x)|0;
        if( x<0 || x>=layer.width || y<0 || y>=layer.height ) return;
        var out = (m[ i*4   ] << 24) + (m[ i*4+1 ] << 16) + (m[ i*4+2 ] << 8) + m[ i*4+3 ];
        return out;
    },

    check:function( layer, x, y, queue, visit, target ){
        var m = layer.data, i = (y*layer.width+x)|0;
        if( x<0 || x>=layer.width || y<0 || y>=layer.height || visit[i] ) return;

        visit[i] = true;
        var out = (m[ i*4   ] << 24) + (m[ i*4+1 ] << 16) + (m[ i*4+2 ] << 8) + m[ i*4+3 ];

        if( out == target ) queue.push( x, y );
        return true;
    },

    up:function(layer, x, y, z){
        if( x<0 || x>=layer.width || y<0 || y>=layer.height ) return;

        var color = this.app.color;
        var w = layer.width, h = layer.height, i, i4, out, w4 = w*4;
        var m = layer.data, m4 = new Int32Array( layer.data.buffer );
		
		var mask;
		if( this.app.selection && this.app.selection.enabled ){
			mask = this.app.selection.data.data;
		}

        target = m4[ y*w+x ];
        if( target == undefined || ( mask && !mask[(y*w+x)*4+3]) ) return;

        m[ (y*w+x)*4   ] = color.r;
        m[ (y*w+x)*4+1 ] = color.g;
        m[ (y*w+x)*4+2 ] = color.b;
        m[ (y*w+x)*4+3 ] = color.a;
        var write = m4[ y*w+x ];

        var visit = new Int32Array(w*h), queue = new Int32Array(w*h); // [x, y];
        queue[0] = x;
        queue[1] = y;

        var length = 2;
        while(length){
            var cy = queue[ --length ];
            var cx = queue[ --length ];
            var ci = (cy*w+cx)|0;
			
			if( mask && !mask[ci*4+3] ) continue;
            /* * /
            color.write( layer, x, y, z );
            /*/
            m4[ci] = write;
            /* */

            x = cx+1; y = cy; i=ci+1;
            if( !(x<0 || x>=w || y<0 || y>=h || visit[i]) ){
                visit[i] = 1;
                out = m4[i];
                if( out == target ){
                    queue[ length++ ] = x;
                    queue[ length++ ] = y;
                }
            }

            x = cx-1; y = cy; i=ci-1;
            if( !(x<0 || x>=w || y<0 || y>=h || visit[i]) ){
                visit[i] = 1;
                out = m4[i];
                if( out == target ){
                    queue[ length++ ] = x;
                    queue[ length++ ] = y;
                }
            }

            x = cx; y = cy+1; i=ci+w;
            if( !(x<0 || x>=w || y<0 || y>=h || visit[i]) ){
                visit[i] = 1;
                out = m4[i];
                if( out == target ){
                    queue[ length++ ] = x;
                    queue[ length++ ] = y;
                }
            }

            x = cx; y = cy-1; i=ci-w;
            if( !(x<0 || x>=w || y<0 || y>=h || visit[i]) ){
                visit[i] = 1;
                out = m4[i];
                if( out == target ){
                    queue[ length++ ] = x;
                    queue[ length++ ] = y;
                }
            }
        }
        
        this.app.push();
        return true;
    }
});