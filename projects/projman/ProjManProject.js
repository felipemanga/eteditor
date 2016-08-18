CLAZZ("projects.projman.ProjManProject", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                frame:false
            }
        })
    },

    proportion:0.5,
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
        },

        resize:function(){
            var fixed = Math.min(this.DOM.fileSection[0].getBoundingClientRect().right, 173);

            var width = this.dialogue.width - fixed;
            var height = this.dialogue.height;
            var prop = this.proportion * width;
            this.DOM.codeSection.forEach((cs) => {
                cs.style.width = prop + "px";
            });

            prop = (width - prop) + "px";
            this.DOM.previewSection.forEach((ps) => {
                ps.style.width = prop;
            });
        }
    },

    $filter:{
        change:function(e){
            this.project.files.push(e.target.value);
            this.DOM.docSet[0].update({filter:null});
        }
    }
});
