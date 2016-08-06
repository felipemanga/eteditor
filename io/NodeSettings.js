CLAZZ("io.NodeSettings", {
    save:function(settings){
        fs.writeFileSync( "settings.json", JSON.stringify( settings ) );
    }
})
