need([
    {FQCN:"JSZip", URL:"js/jszip.min.js"}
], function(){

CLAZZ("io.compressors.ZIPCompressor", {
    PROVIDES:{
        "io.compressors.IZIPCompressor":"implements"
    },

    zip:null,
    CONSTRUCTOR:function(){
        this.zip = new JSZip();
    },

    addFile:function(name, contents){
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
