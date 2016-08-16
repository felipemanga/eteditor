CLAZZ("projects.projman.ProjManProject", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                frame:false
            }
        })
    },

    DOM:null,
    project:{
        files:[
            "bacon",
            "doritos",
            "dud",
            "pancakes"
        ]
    },

    $DIALOGUE:{
        load:function(){
            this.DOM = this.dialogue.DOM;
            var area = this.dialogue.getAvailArea();
            this.dialogue.setSize(area.width, area.height);
            this.dialogue.moveTo(0,0);
            this.DOM.docSet[0].update({ filter:(e) => e.indexOf("d") == -1 });
        }
    },

    $filter:{
        change:function(e){
            this.project.files.push(e.target.value);
            this.DOM.docSet[0].update({filter:null});
        }
    }
});
