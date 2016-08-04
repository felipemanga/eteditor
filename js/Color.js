CLAZZ("js.Color", {
    r:0,
    g:0,
    b:0,
    a:0,

    CONSTRUCTOR:function(r,g,b,a){
        this.r = r|0;
        this.g = g|0;
        this.b = b|0;
        this.a = a|0;
    },

    toHex:function(){
        var s = ((this.r<<16)|(this.g<<8)|(this.b)).toString(16).toUpperCase();
        while( s.length < 6 ) s = "0"+s;
        return s;
    },

    toArray:function(){
        return [
            this.r,
            this.g,
            this.b,
            this.a
        ];
    },

    fromHSV:function( h, s, v ){
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        this.r = Math.round(r*255);
        this.g = Math.round(g*255);
        this.b = Math.round(b*255);
    },

    fromData:function( d, x, y ){
        var i = (y*d.width+x)*4;
        this.r = d.data[ i   ]|0;
        this.g = d.data[ i+1 ]|0;
        this.b = d.data[ i+2 ]|0;
        this.a = d.data[ i+3 ]|0;
    },

    write:function( d, x, y, z ){
        var a = this.a/255.0, i = (y*d.width+x)*4;
        if( z!==undefined ) a *= z/255.0;

        d.data[ i   ] = this.r * a + d.data[ i   ] * (1-a);
        d.data[ i+1 ] = this.g * a + d.data[ i+1 ] * (1-a);
        d.data[ i+2 ] = this.b * a + d.data[ i+2 ] * (1-a);
        d.data[ i+3 ] = this.a * a + d.data[ i+3 ] * (1-a);
    }
});
