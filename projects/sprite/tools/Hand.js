CLAZZ("projects.sprite.tools.Hand", {
    INJECT:{
        main:"main"
    },

    activate:function(){
        this.main.DOM.stack.style.cursor = "-webkit-grab";
    },

    deactivate:function(){
        this.main.DOM.stack.style.cursor = "initial";
    },

    down:function(layer, x, y, z, e){
        this.main.DOM.stack.style.cursor = "-webkit-grabbing";
        this.main.dragging = this.main.DOM.stack;
    },

    move:function(layer, x, y, z){
    },

    up:function(layer, x, y, z){
        this.main.DOM.stack.style.cursor = "-webkit-grab";
    }
});
