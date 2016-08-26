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
            className:"FileListItem"
        }, [
            ["input", {
                value:this.data.name,
                disabled:true
            }],
            ["button", {
                className:"btnDelete",
                text:"X"
            }]
        ]);

        this.DOM = DOC.index(el, null, this);
    },

    update:function(){
        this.DOM.INPUT.value = this.data.name;
        if( this.data.name == "rename.me" )
            this.rename();
    },

    rename:function(){
        this.DOM.INPUT.removeAttribute("disabled");
        this.DOM.INPUT.focus();
    },

    $DIV:{
        click:function(evt){
            if( evt.target !== this.DOM.INPUT ) return;
            this.controller.openFile(this.data);
        },

        dblclick:function(evt){
            this.rename();
        }
    },

    $INPUT:{
        change:function(evt){
            this.data.name = this.DOM.INPUT.value.trim();
            this.controller.updateFileList();
        },
        blur:function(evt){
            this.DOM.INPUT.setAttribute("disabled", true);
        }
    },

    $btnDelete:{
        click:function(){
            this.source.splice( this.source.indexOf(this.data), 1 );
            this.controller.updateFileList();
        }
    }

});
