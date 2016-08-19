need([
    {FQCN:"firebase", URL:"https://www.gstatic.com/firebasejs/3.3.0/firebase.js"}
]);

CLAZZ("io.OnlineStorage", {
    storage:null,
    database:null,

    CONSTRUCTOR:function(){
        firebase.initializeApp({
            apiKey: "AIzaSyDIRJa2HJWW29aiqqCTxkelC90Y963hPJ4",
            authDomain: "eteditor-8b8b7.firebaseapp.com",
            databaseURL: "https://eteditor-8b8b7.firebaseio.com",
            storageBucket: "eteditor-8b8b7.appspot.com",
        });

        // this.storage = firebase.storage();
        this.database = firebase.database();
    },

    readShare:function( project, id, cb ){
        var url = "share/" + project + "/" + id;
        var ref = this.database.ref( url );
        ref.once("value", function(ss){
            cb( ss.val() );
        })
    },

    share:function( project, data ){
        var id = "";
        for( var i=0; i<5; ++i )
            id += Math.floor( Math.random() * 0x7FFFFFFF ).toString(36);
            
        var url = "share/" + project + "/" + id;
        var ref = this.database.ref( url );
        ref.set(data);
        return id;
    }

});