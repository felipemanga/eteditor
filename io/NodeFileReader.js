CLAZZ("io.NodeFileReader", {
    onDropForEach:function(evt, cb){
        files = evt.dataTransfer.files; // FileList object.
        for (var i = 0, f; f = files[i]; i++){
            var parts = f.path.match(/(^.*?)([^\/\\]+)$/);
            this.__nodeForEach(parts[1], parts[2], cb);
        }
    },

    __nodeForEach:function(root, ref, cb){
    	var THIS = this;
		if( !fs.statSync(root+ref).isDirectory() ){
            cb( root+ref, root+ref, cb );
		}else{
			fs.readdir(root+ref, function (err, list) {
				if (err) return;
				list.forEach(function (file) {
					THIS.nodeAdd(root, ref+"/"+file, cb);
				});
			});
		}
    },

    readAsArrayBuffer:function( path, cb ){
        // do stuff
    }
})
