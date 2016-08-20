CLAZZ("projects.sprite.filters.Perlin", {
    seed: 0,
    contrast: 1,
    iterations: 0,
    greyscale:"Yes",
    mode:"gpu",

    meta:{
        seed : { int:{ min:0, max:0xFFFFFFFF} },
        contrast : { int:{ min:1, max:20 } },
        iterations : { dynamic:true },
        greyscale : { select:["Yes", "No"] },
        mode : { select:["cpu", "gpu"] }
    },

    activate:function( layer ){
        this.iterations = Math.floor(Math.log2( layer.data.width ));
        return true;
    },

    kernel:function(d){
        var x = this.thread.x%this.constants.stride;
        var y = Math.floor(this.thread.x/this.constants.stride);
        var channel = x % 4;
        x = Math.floor(x/4);

        function noise(x, y, s){
            var f = Math.floor(s);
            f = s - f;
            f = f*f*(3.0-2.0*f);
            var n = x + y*57.0 + 113.0*f;
            s = Math.abs( (Math.sin(n)*43758.5453) );
            f = Math.floor(s);
            return s - f;
        }

        function prand(x, y, t, channel, seed, greyscale ){
            var p   = Math.pow(2, t-1), d = 3300550843,
                x1, x2, y1, y2, r1, r2, r3, r4, fx, fy;

            x = x / p;
            y = y / p;

            x1 = Math.floor( x );
            fx = 1 - (x - x1);
            x2 = x1 + 1;

            y1 = Math.floor( y );
            fy = 1 - (y - y1);
            y2 = y1 + 1;

            t = noise(t/2665425599, (t*d) / seed, d / (22381+((channel+1)*greyscale)) );

            r1 = noise(x1, y1, t);
            r2 = noise(x2, y1, t);
            r3 = noise(x1, y2, t);
            r4 = noise(x2, y2, t);

            return (r1*fx+r2*(1-fx)) * fy + (r3*fx+r4*(1-fx)) * (1-fy);
        }

        var ret = 1;
        if( channel != 3 ){
            ret = 0;
            for( var i=0; i<this.constants.iterations; i++ )
                ret += prand(x, y, i+1, channel, this.constants.seed, this.constants.greyscale ) / Math.pow(2, this.constants.iterations - i);
                // ret = ( ( Math.abs( Math.sin( (x*2665425599 + y*849233383) / 726169489 ) ) + Math.abs(Math.sin(1*726169489)) ) * 3300550843 % 22381) / 22381;
        }

        if( ret > 1 ) ret = 1;
        if( ret < 0.5 ) ret = Math.pow( ret * 2, this.constants.contrast ) / 2;
        else if( ret > 0.5 ) ret = 1 - Math.pow( (1-ret) * 2, this.constants.contrast ) / 2;

        return ret*255;
    }

});
