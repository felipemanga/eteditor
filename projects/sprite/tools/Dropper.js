CLAZZ("projects.sprite.tools.Dropper", {
    INJECT:{
        color:"PrimaryColor",
        picker:"popups.colorpicker.IColorPicker"
    },

    down:function(layer, x, y, z){
        this.color.fromData( layer, x, y );
        this.picker.setColor( this.color );

    },

    move:function(layer, x, y, z){
    },

    up:function(layer, x, y, z){
    }
});
