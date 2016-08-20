CLAZZ("projects.sprite.filters.Perlin", {
    seed: 0,
    contrast: 1,
    iterations: 0,
    greyscale:"Yes",

    meta:{
        seed:{int:{min:0, max:0xFFFFFFFF}},
        contrast:{int:{min:1, max:20}},
        iterations:{dynamic:true},
        greyscale:{select:["Yes", "No"]}
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

        function prand(x, y, t, channel){
            var max = 22381,
                a   = 2665425599,
                b   = 849233383,
                c   = 726169489,
                d   = 3300550843,
                p   = Math.pow(2, t-1),
                r   = Math.sin(this.constants.seed / a),
                x1, x2, y1, y2, r1, r2, r3, r4, fx, fy;


            x = x / p;
            y = y / p;
            a /= c;
            b /= c;
            c /= max;

            x1 = Math.floor( x );
            fx = 1 - (x - x1);
            x2 = x1 + 1;

            y1 = Math.floor( y );
            fy = 1 - (y - y1);
            y2 = y1 + 1;

            t = t + this.constants.seed + channel*this.constants.greyscale*d;

            r1 = ( ( Math.abs( Math.sin( x1*a + y1*b + r ) ) + Math.abs(Math.sin(t*c)) ) * d % max) / max;
            r2 = ( ( Math.abs( Math.sin( x2*a + y1*b + r ) ) + Math.abs(Math.sin(t*c)) ) * d % max) / max;
            r3 = ( ( Math.abs( Math.sin( x1*a + y2*b + r ) ) + Math.abs(Math.sin(t*c)) ) * d % max) / max;
            r4 = ( ( Math.abs( Math.sin( x2*a + y2*b + r ) ) + Math.abs(Math.sin(t*c)) ) * d % max) / max;

            return (r1*fx+r2*(1-fx)) * fy + (r3*fx+r4*(1-fx)) * (1-fy);
        }

        var ret = 1;
        if( channel != 3 ){
            ret = 0;
            for( var i=0; i<this.constants.iterations; i++ )
                ret += prand(x, y, i+1, channel) / Math.pow(2, this.constants.iterations - i);
                // ret = ( ( Math.abs( Math.sin( (x*2665425599 + y*849233383) / 726169489 ) ) + Math.abs(Math.sin(1*726169489)) ) * 3300550843 % 22381) / 22381;
        }

        if( ret > 1 ) ret = 1;
        if( ret < 0.5 ) ret = Math.pow( ret * 2, this.constants.contrast ) / 2;
        else if( ret > 0.5 ) ret = 1 - Math.pow( (1-ret) * 2, this.constants.contrast ) / 2;

        return ret*255;
    }

});
