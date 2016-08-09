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
            if( d.write ) localforage.setItem(k, d.value, d.cb );
            else localforage.getItem(k, d.cb);
        }
        this.tmp = {};
    },

    read:function( name, cb ){
        if( !ready ){
            tmp[name] = {
                write:false,
                value:null,
                cb:cb
            }
        }else localforage.getItem( name, cb );
    },

    write:function( name, data, cb ){
        if( !ready ){
            tmp[name] = {
                write:true,
                value:data,
                cb:cb
            }
        }else localforage.setItem( name, value, cb );
    }
});
