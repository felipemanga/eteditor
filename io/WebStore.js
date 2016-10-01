need([{FQCN:"localforage", URL:"js/localforage.nopromises.min.js"}])

CLAZZ("io.WebStore", {
    ready:false,
    tmp:null,

    CONSTRUCTOR:function(){
        this.tmp = {};
        localforage.ready( this.__onReady.bind(this) );
    },
    __onReady:function(){
        if( this.ready ) return;
        this.ready = true;
        for( var k in this.tmp ){
            var d = this.tmp[k];
            localforage.getItem(k, proc.bind(this, k, d));
        }
        this.tmp = {};
        return;

        function proc(path, queue, err, data){
            var write = false;
            queue.forEach((qi)=>{
                if( "write" in qi ){
                    write = true;
                    data = qi.write;
                }
                if( qi.cb ) qi.cb(data);
            });
            if(write){
                localforage.setItem(path, data, function(){
                    console.log("set", path, arguments);
                });
            }
        }
    },

    read:function( name, cb ){
        if( !this.ready ){
            var queue = this.tmp[name];
            if( !queue ) this.tmp[name] = queue = [];
            queue.push({cb:cb});
        }else localforage.getItem( name, cb );
    },

    write:function( name, data, cb ){
        if( !this.ready ){
            var queue = this.tmp[name];
            if( !queue ) this.tmp[name] = queue = [];
            queue.push({write:data, cb:cb});
        }else localforage.setItem( name, data, cb );
    }
});
