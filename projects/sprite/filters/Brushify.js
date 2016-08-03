CLAZZ("projects.sprite.filters.Brushify", {
    mode:"hard",
    meta:{
        mode:{select:["hard", "soft"]}
    },

    activate:function(){
        this.run = this[ this.mode ];
        return true;
    },

    run:null,

    hard:function( color, x, y, w, h ){
        if( distance( x, y, w*0.5, h*0.5 ) > w*0.5 )
            color.a = 0;
    },

    soft:function( color, x, y, w, h ){
        var d = distance( x+0.5, y+0.5, w*0.5, h*0.5 );
        color.a = Math.max(0, Math.min(255, Math.floor(255*(1-d/(w*0.5)))));
    }
	
});