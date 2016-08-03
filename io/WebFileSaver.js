
CLAZZ("io.WebFileSaver", {
    INJECT:{
        zip:"io.compressors.IZIPCompressor"
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

        DOC.create("div", {
            text:"Click To Download: " + file.name,
            onclick:() => open('data:application/zip,' + escape(file.data) ),
            style:{
                position:"absolute",
                bottom:0,
                left:0
            }
        }, document.body)
    }

});
