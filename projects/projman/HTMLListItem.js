CLAZZ("projects.projman.HTMLListItem", {
    INJECT:{
        parent:     "parent",
        data:       "data"
    },

    CONSTRUCTOR:function(){
        DOC.create("option", this.parent, { text:this.data.name });
    }
});
