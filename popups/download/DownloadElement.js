CLAZZ("popups.download.DownloadElement", {
    INJECT:{
        parent:"parent",
        data:"data",
        source:"source"
    },

    CONSTRUCTOR:function(){
        DOC.index(
            DOC.create("div", {
                text: this.data.name + " - " + this.size(this.data.data.size),
                className:"file"
                },
                this.parent
            ),
            null,
            this
        );
    },

    size:function(i){
        if( i < 1024 ) return i + " Bytes";
        i /= 1024;
        if( i < 1024 ) return Math.round(i*100)/100 + " KB";
        i /= 1024;
        if( i < 1024 ) return Math.round(i*100)/100 + " MB";
        i /= 1024;
        if( i < 1024 ) return Math.round(i*100)/100 + " GB";
    },

    $DIV:{
        click:function(){
            this.source.splice( this.source.indexOf( this.data ), 1 );
            this.parent.update();
            saveAs( this.data.data, this.data.name );
        }
    }
});
