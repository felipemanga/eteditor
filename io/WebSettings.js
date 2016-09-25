CLAZZ("io.WebSettings", {
    save:function(settings){
        localStorage.setItem( "settings", JSON.stringify(settings) );
    },
    
    read:function(defaults){
        var settings = localStorage.getItem("settings");
        if( !settings ) return defaults;
        try{
            settings = JSON.parse(settings);
            DOC.mergeToDeep(defaults, settings);
        }catch(e){
            console.warn(e);
            return defaults;
        }
        return settings;
    }
})
