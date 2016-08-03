CLAZZ("projects.sprite.tools.Dropper", {
    app:null,

    down:function(layer, x, y, z){
        this.app.color.fromData( layer, x, y );
    },

    move:function(layer, x, y, z){
    },

    up:function(layer, x, y, z){
    }
});