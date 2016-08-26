CLAZZ("projects.projman.FileListItem", {
    INJECT:{
        parent:     "parent",
        data:       "data",
        source:     "source",
        controller: "context"
    },

    DOM:null,

    CONSTRUCTOR:function(){
        var el = DOC.create("div", this.parent, {
            text:this.data.name,
            className:"FileListItem"
        }, [
            ["button", {
                className:"btnDelete",
                text:"X"
            }]
        ]);

        this.DOM = DOC.index(el, null, this);
    },

    $DIV:{
        click:function(evt){
            if( evt.target !== this.DOM.__ROOT__ ) return;
            this.controller.openFile(this.data);
        }
    },

    $btnDelete:{
        click:function(){
            this.source.splice( this.source.indexOf(this.data), 1 );
            this.parent.update();
        }
    }

});
