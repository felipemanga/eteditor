CLAZZ("io.HTMLFileReader", {
	onDropForEach:function(evt, cb){
		if( evt.dataTransfer.getFilesAndDirectories ){
			evt.dataTransfer.getFilesAndDirectories().then((files) =>{
				for( var i=0, l=files.length; i<l; ++i )
					this.__mozForEach(files[i]);
			});
		}else if( evt.dataTransfer.items ){
			files = evt.dataTransfer.items;
			for (var i=0; i<files.length; i++) {
				var item = files[i].webkitGetAsEntry();
				if (item) this.__webkitForEach(item, "", cb);
			}
		}else{
			files = evt.dataTransfer.files;
			for (var i=0, l=files.length; i < l; i++)
				cb( files[i].name, files[i], false );
		}
	},

	__mozForEach:function(file){
		console.log("MozAdd", file);
		debugger;
	},

	__webkitForEach:function(item, path, cb){
		if (item.isFile) {
			item.file((file) => {
				cb( path+file.name, file, false );
			});
		} else if (item.isDirectory) {
			var dirReader = item.createReader();
			dirReader.readEntries((entries) => {
				for (var i=0; i<entries.length; i++) {
					this.__webkitForEach(entries[i], path + item.name + "/", cb);
				}
			});
		}
  	},

	readAsArrayBuffer:function(file, cb){
		if( !(file instanceof self.File) )
			return;
		var fr = new FileReader();
		fr.onload = (evt) => {
			if( fr.readyState == 2 )
				cb(fr.result);
			if( fr.error )
				cb(undefined, fr.error);
		};
		fr.readAsArrayBuffer(file);
		return true;
	}
});
