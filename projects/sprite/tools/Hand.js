CLAZZ("projects.sprite.tools.Hand", {
    app:null,

    activate:function(){
        this.app.app.DOM.stack.style.cursor = "-webkit-grab";
    },

    deactivate:function(){
        this.app.app.DOM.stack.style.cursor = "initial";
    },

    down:function(layer, x, y, z, e){
        this.app.app.DOM.stack.style.cursor = "-webkit-grabbing";
        this.app.app.dragging = this.app.app.DOM.stack;
    },

    move:function(layer, x, y, z){
    },

    up:function(layer, x, y, z){
        this.app.app.DOM.stack.style.cursor = "-webkit-grab";
    }
});