CLAZZ("projects.projman.HTMLListItem", {
    INJECT:{
        parent:     "parent",
        data:       "data"
    },

    el:null,

    CONSTRUCTOR:function(){
        this.el = DOC.create("option", this.parent, { text:this.data.name });
    },

    update:function(){
        this.el.textContent = this.data.name;
    }

});
