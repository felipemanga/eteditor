CLAZZ("projects.sprite.tools.Dropper", {
    INJECT:{
        color:"PrimaryColor"
    },

    down:function(layer, x, y, z){
        this.color.fromData( layer, x, y );
    },

    move:function(layer, x, y, z){
    },

    up:function(layer, x, y, z){
    }
});
