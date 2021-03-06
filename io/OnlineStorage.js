need([
    {
        FQCN:"firebase", 
        URL:"js/firebase.js"
        // URL:"https://www.gstatic.com/firebasejs/3.3.0/firebase.js"
    }
], function(){

var storage = null,
    database = null,
    auth = null,
    user = "init";

CLAZZ("io.OnlineStorage", {
    INJECT:{
        local:"io.WebStore"
    },

    CONSTRUCTOR:function(){
        if(storage) throw "Already Initialized";
        firebase.initializeApp({
            apiKey: "AIzaSyDIRJa2HJWW29aiqqCTxkelC90Y963hPJ4",
            authDomain: "eteditor-8b8b7.firebaseapp.com",
            databaseURL: "https://eteditor-8b8b7.firebaseio.com",
            storageBucket: "eteditor-8b8b7.appspot.com",
        });

        storage = firebase.storage();
        database = firebase.database();
        auth = firebase.auth();
        auth.onAuthStateChanged((newUser) => user = newUser);
    },

    upload:function(file, cb){
        if( user == "init" )
            return setTimeout(()=>this.upload(file,cb), 500);

        if(!user){
            CLAZZ.get("popups.signin.SignIn", { parent:null, callback:(success) => success && this.upload(file, cb) });
            return;
        }

        var folder = "user/" + user.uid + "/";
        this.save(  {name:folder + UUID() + file.name.replace(/[^a-z0-9_.]/gi, "_"), data:file.data}, cb );
    },

    save:function( file, cb){
        if( user == "init" )
            return setTimeout(()=>this.save(file,cb), 500);

        if(!user){
            CLAZZ.get("popups.signin.SignIn", { parent:null, callback:(success) => success && this.save(file, cb) });
            return;
        }

        this.local.write(file.name, file.data, (r)=>{
            console.log("local write:", arguments);
        });

        var ref = storage.ref( file.name );
        ref.put( file.data ).then( (ss) => cb && cb( ss.downloadURL.replace(/&token=[^&]+/, "") ) );
    },

    download:function(url, cb, flags){
        flags = flags || {};
        var anystate = flags.anystate || false;
        var nocache  = flags.nocache || false;

        if( !nocache ){
            this.local.read(url, (data) => {
                debugger;
                if( data ) return cb(data);
                this.download(url, (data)=>{
                    this.local.write(url, data, ()=>{ 
                        console.log("cached"); 
                    });
                    cb(data);
                }, {nocache:true});
            });
            return;
        }

        storage.ref(url).getDownloadURL().then((ss) => {
            DOC.getURL( ss, cb, {binary:true} );
        }).catch((ex)=>{
            debugger;
            if(anystate)
                cb(null);
        });
    },

    readShare:function( project, id, cb ){
        var url = "share/" + project + "/" + id;
        var ref = database.ref( url );
        ref.once("value", function(ss){
            cb( ss.val() );
        })
    },

    share:function( project, data ){
        var id = UUID();
        var url = "share/" + project + "/" + id;
        var ref = database.ref( url );
        ref.set(data);
        return id;
    },

    signIn:function(cb) {
        var provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        firebase.auth().signInWithPopup(provider).then(function(result) {
            var token = result.credential.accessToken;
            user = result.user;
            if(cb) setTimeout(()=> cb(true), 20);
        }).catch(function(error) {
            if(cb) cb(false);
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
            if (errorCode === 'auth/account-exists-with-different-credential') {
                alert('You have already signed up with a different auth provider for that email.');
                // If you are using multiple auth providers on your app you should handle linking
                // the user's accounts here.
            } else {
                console.error(error);
            }
        });
    },

    signOut:function() {
        firebase.auth().signOut();
    }
});

});
