CLAZZ("projects.projman.FileListItem", {
    INJECT:{
        fileReader:"io.FileReader",
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
            ["img", {
                src:"img/loading.gif",
                style:{ mixBlendMode:"screen" }
            }],
            ["button", {
                className:"btnDelete",
                text:"X",
                style:{
                    display:"initial"
                }
            }]
        ]);

        this.DOM = DOC.index(el, null, this);

        this.setupData();
    },

    setupData:function(){
        if( !this.data.raw ){
            var raw = null;
            this.cacheURL = null;

            this.data.raw = function(){
                return raw;
            };

            this.data.reload = function(cb){
                if( !this.data.match(/^https?:\/\/[a-z0-9]+.*$/i) ){
                    raw = this.data;
                    if(cb) cb(this);
                    return;
                }

                this.cacheURL = true;
                DOC.getURL(this.data, (s) => {
                    raw = s;
                    this.cacheURL = arrayToBlobURL( s, this.data );
                    if( cb ) cb(this);
                }, {binary:true});
            }
        }

        this.data.reload(() => {
            this.DOM.BUTTON.style.display = "initial";
            this.DOM.IMG.style.display = "none";
        });
    },

    update:function(){
        if( this.data.name == "rename.me" )
            this.rename();

        if( this.data.name == "upload.me" ){
            this.DOM.INPUT.setAttribute("type", "file");
            this.DOM.INPUT.removeAttribute("disabled");
            this.DOM.INPUT.focus();
            return;
        }else if( this.DOM.INPUT.getAttribute("type") == "file" )
            this.DOM.INPUT.removeAttribute("type");

        this.DOM.INPUT.value = this.data.name;
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
            if( this.DOM.INPUT.getAttribute("type") == "file" ){
                if( this.DOM.INPUT.files.length != 1 ) return;
                this.data.name = this.DOM.INPUT.files[0].name;
                this.fileReader.readAsArrayBuffer( this.DOM.INPUT.files[0], (data, err) => {
                    if( err ) return;
                    var editor = this.controller.chooseEditor( this.data );
                    if( editor == "codeComponent" ) this.data.data = bufferToStr(data);
                    else{
                        this.data.data = data;
                        CLAZZ.get("onlineStorage").upload( this.data, (url) => {
                            this.data.cacheURL = arrayToBlobURL( this.data.data, url );
                            this.data.data = url;
                            this.setupData();
                            this.controller.dirty = true;
                        });
                    }
                });
            }
            else this.data.name = this.DOM.INPUT.value.trim();
            this.controller.updateFileList();
        },
        blur:function(evt){
            this.DOM.INPUT.setAttribute("disabled", true);
        }
    },

    $btnDelete:{
        click:function(){
            this.source.splice( this.source.indexOf(this.data), 1 );
            this.controller.dirty = true;
            this.controller.updateFileList();
        }
    }

});
