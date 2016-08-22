need([
	{FQCN:"saveAs", URL:"js/FileSaver.js"},
	"popups.download.Download"
], function(){

CLAZZ("io.WebFileSaver", {
    INJECT:{
        zip:"io.compressors.IZIPCompressor",

        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
				width: 350,
				height: 350,
				position:"center",
                show:false,
                hide_only: true,
                title:"Format"
            }
        }),

		download:"popups.download.Download"
    },

    saveFile:function( file ){
        if( !file ) return;
        if( Array.isArray(file) ){
            file.forEach( (file) => this.zip.addFile(file.name, file.data) );
            this.zip.compress( file.name || "files.zip",
                (file) => this.saveFile(file)
            );
            return;
        }

		if( file.data && !(file.data instanceof Blob) ){
			if( typeof file.data == "string" ){
				if( file.data.match(/^data:[a-zA-Z0-9\/]+;base64,/) )
					file.data = base64toBlob( file.data.replace(/^data:[a-zA-Z0-9\/]+;base64,/, "") );
				else file.data = new Blob( [strToBuffer(file.data).buffer] );
			}
		}

		this.download.add(file);
    },

    requestFormat:function( options, cb ){
        this.callback = cb;
		var DOM = this.dialogue.DOM;
        var list = this.dialogue.DOM.extensionList;
		DOC.removeChildren(list);
		options.forEach((obj) => {
			var ext, name;
			if( typeof obj == "string" ){
				ext = obj;
				name = DOC.TEXT("filetype:"+obj);
			}else{
				ext = obj.ext;
				name = DOC.TEXT(obj.name);
			}

			DOM.create("div", { onclick:() => {
				this.dialogue.hide(); cb(obj);
			} },[
				["h1", {text:ext}],
				["h2", {text:name}]
			], list);
		});

        this.dialogue.show();
    }
});

});
