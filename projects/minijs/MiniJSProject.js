need([
    "dialogues.IDialogue",
    {FQCN:"CanvasTool.PngEncoder", URL:"js/CanvasTool.js"}
], function(){

var FileEntry = CLAZZ({
    name:null,
    el:null,
    data:null,

    CONSTRUCTOR:function(name, DOM){
        this.el = DOM.index( DOM.create("div", DOM.files, { id:"box" }, [
            ["div", { text: "Loading", id:"status"}],
            ["div", { text: name, id:"fileName" }]
        ]), null, this );
		this.name = name;
    },
    setData:function(data){
        this.data = new Uint8Array( data );
        this.el.status.textContent = Math.ceil(this.data.length / 1024) + "Kb";
    }
});


CLAZZ("projects.minijs.MiniJSProject", {
    files:null,
    running:false,
	path:null,

	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
            	position:"center",
                menu:{
                    save:{
                        priority:5
                    }
                }
            }
        }),

        fileReader:"io.FileReader",
        fileSaver:"io.FileSaver",
        compressor:"io.compressors.IPNCCompressor",
        app:"app"
    },

    CONSTRUCTOR:function(){
        this.app.add(this);
        this.files = [];
    },

	STATIC:{
		title:"MiniJS"
	},

	onLoad:function(){
		this.files = [];
	},

    $BODY:{
        dragover:function( evt ){
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },

        drop:function( evt ){
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();

			this.dialogue.DOM.lblDrop.style.display = "none";

            this.fileReader.onDropForEach(evt, (path, file, isDirectory) => {
                if( isDirectory )
                    return;
                var fe = new FileEntry( path, this.dialogue.DOM );
                this.files.push( fe );
                this.fileReader.readAsArrayBuffer( file, fe.setData.bind(fe) );
            });
        }
    },

    $MENU:{
        save:function(){
            this.onSave()
        }
    },

	onSave:function(){
        this.path = this.path || "mini.bin"
        var ext = this.path.match(/\.([a-z]+)$/i);
        if( !ext || ext[1].toLowerCase() != "bin" ) this.path += ".bin";

        this.files.forEach((file) =>
            this.compressor.addFile(file.name, file.data)
        );
        this.compressor.compress( this.path, this.fileSaver.saveFile.bind(this.fileSaver) );

		this.dialogue.DOM.stats.textContent = DOC.TEXT("Total uncompressed size: ") + Math.ceil(this.compressor.dataSize/1024) + "Kb";
	}

});

});
