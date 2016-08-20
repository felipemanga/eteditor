CLAZZ("projects.sprite.filters.Desaturate", {
    rw:255,
    gw:255,
    bw:255,
    meta:{
        rw:{ int:{ min:0, max:1000 }, label:"Red" },
        gw:{ int:{ min:0, max:1000 }, label:"Green" },
        bw:{ int:{ min:0, max:1000 }, label:"Blue" }
    },
    run:function( color, x, y, w, h ){
        color.r = color.g = color.b = Math.round( (color.r * this.rw + color.g * this.gw + color.b * this.bw)/( this.rw + this.gw + this.bw ));
    }
});
