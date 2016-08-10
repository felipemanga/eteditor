CLAZZ("popups.openfile.OpenFileDialogue", {
    PROVIDES:{
        "popups.openfile.IOpenFileDialogue":"singleton"
    },

    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                hide_only:true,
                show:false,
                position: "center",
                width: 276,
                height: 177
            }
        }),

        settings:"settings",
        fileReader:"io.FileReader",
        app:"app"
    },

    op:"Open",

    CONSTRUCTOR:function(){
        this.app.add(this);
    },

    loadPlugins:function(){
        this.checkReqs();
        var DOM = this.dialogue.DOM;
        DOC.removeChildren(DOM.projectTypeList);

        if( !self.projects ) return;


        for( var id in projects ){
            var desc = projects[id];
            if( !desc ) continue;
            if( !desc.title ){
                var invalid = true;
                for( var k in desc ){
                    if( /Project$/.test(k) ){
                        id += "." + k;
                        desc = DOC.resolve( id, projects );
                        invalid = false;
                        break;
                    }
                }
                if( invalid ) continue;
            }

            var el = DOM.create( "div", {
                text:DOC.TEXT(desc.title || id),
                id:"projects." + id,
                className:"project"
            }, DOM.projectTypeList );

            DOM.index( el, null, this );

            if( this.settings.lastProjectType == id ){
                el.className += " selected";
                this.selected = id;
            }

            DOM[id] = el;
        }

        if( this.op == "New" )
            DOM.savePath.style.display = "none";

        this.checkReqs();
    },

    $DIALOGUE:{
        load:function(){
            this.loadPlugins();
        }
    },

    show:function(op){
        this.op = op;
        this.loadPlugins();
        this.dialogue.show();
    },

    selected:null,

    checkReqs:function(){
        var DOM = this.dialogue.DOM;
        if( this.selected && (this.op == "New" || DOM.savePath.files.length == 1) ){
            DOM.btnStart.removeAttribute("disabled");
            return true;
        }else{
            DOM.btnStart.setAttribute("disabled", true);
            return false;
        }
    },

    start:function(){
        if( !this.checkReqs() ) return;
        var DOM = this.dialogue.DOM;
        this.dialogue.hide();
        this.settings.lastProjectType = this.selected;
        if( !this.settings.recentProjects ) this.settings.recentProjects = [];
        if( DOM.savePath.value ) this.settings.recentProjects.unshift( DOM.savePath.value );
        if( this.settings.recentProjects.length > 10 ) this.settings.recentProjects.pop();

        var desc = {
            path: DOM.savePath.value,
            settings: this.settings[ this.selected ]
        };

        if( this.op == "New" ){
            CLAZZ.get( this.selected, desc );
        }else{
            this.fileReader.readAsArrayBuffer(DOM.savePath.files[0], (data) => {
                desc.data = data;
                CLAZZ.get( this.selected, desc );
            });
        }

    },

    $btnStart:{
        click:function(){ this.start(); }
    },

    $savePath:{
        change:function(evt){
            this.checkReqs();
        }
    },

    $project:{
        click:function(evt){
            var DOM = this.dialogue.DOM;
            if( this.selected )
                DOM[ this.selected ].className = "project";

            evt.target.className = "project selected";

            this.selected = evt.target.id;
            DOM[ this.selected ] = evt.target;

            this.checkReqs();
        }
    }
});
