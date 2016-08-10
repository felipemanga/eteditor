CLAZZ("popups.projectman.ProjectMan", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                frame:false

            }
        })
    },

    DOM:null,

    CONSTRUCTOR:function(){

    },

    $DIALOGUE:{
        load:function(){
            this.DOM = this.dialogue.DOM;
            var area = this.dialogue.getAvailArea();
            this.dialogue.setSize(area.width, area.height);
            this.dialogue.moveTo(0,0);
        }
    }
});
