CLAZZ("projects.projman.FileListItem", {
    INJECT:{
        parent:     "parent",
        data:       "data",
        source:     "source"
    },

    DOM:null,

    CONSTRUCTOR:function(){
        var el = DOC.create("div", this.parent, {
            text:this.data
        });

        this.DOM = DOC.index(el, null, this);
    },

    $DIV:{
        click:function(){
            this.source.splice( this.source.indexOf(this.data), 1 );
            this.parent.update();
        }
    }

});
