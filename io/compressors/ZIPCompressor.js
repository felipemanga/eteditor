need([
    {FQCN:"JSZip", URL:"js/jszip.min.js"}
], function(){

CLAZZ("io.compressors.ZIPCompressor", {
    PROVIDES:{
        "io.compressors.IZIPCompressor":"implements"
    },

    zip:null,
    CONSTRUCTOR:function(){
        this.clear();
    },

    clear:function(){
        this.zip = new JSZip();
    },

    addFile:function(name, contents){
        if( typeof contents == "string" ) contents = strToBuffer(contents).buffer;
        if( contents.buffer ) contents = contents.buffer;
        if( !(contents instanceof Blob) ) contents = new Blob( [contents] );        
        this.zip.file(name, contents, {binary:true});
    },

    compress:function( path, cb ){
        this.zip.generateAsync({type:"binarystring"}).then(
            (data) => cb({
                name:path,
                data:data
            })
        ).catch(err => console.log(err));
    }
});

});
