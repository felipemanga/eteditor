need("popups.download.DownloadElement");

CLAZZ("popups.download.Download", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                width:350,
                height:350,
                position:"center",
                show:false,
                hide_only:true,
                title:"Downloads"
            }
        })
    },

    list:null,

    CONSTRUCTOR:function() {
        this.list = [];
    },

    add:function( file ){
        this.list.unshift( file );
        this.dialogue.DOM.list.update();
        this.dialogue.show();
    }
})
