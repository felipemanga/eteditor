CLAZZ("projects.sprite.filters.Desaturate", {
    run:function( color, x, y, w, h ){
        color.r = color.g = color.b = Math.round( (color.r + color.g + color.b)/3);
    }
});