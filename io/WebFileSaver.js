need([
    {FQCN:"JSZip", URL:"js/jszip.min.js"}
], function(){

CLAZZ("io.WebFileSaver", {
    saveFile:function( file ){
        if( !file ) return;
        console.log(file);
    }
});

});
