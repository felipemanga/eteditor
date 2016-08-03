CLAZZ("io.compressors.PNCCompressor", {
    PROVIDES:{
        "io.compressors.IPNCCompressor":"implements"
    },

    files:null,
    fileData:null,

    CONSTRUCTOR:function(){
        this.files = [];
    },

    dataSize:0,
    getTotalSize:function(){
		var acc = 4;
		this.dataSize = 0;
		for (var i = 0, f; f = this.files[i]; i++){
			acc += 8;
			acc += f.name.length;
			acc += f.data.length;
			this.dataSize += f.data.length;
		}
		return acc;
    },

    addFile:function(name, data){
        this.files.push({name: name, data:data})
    },

    compress:function( path, cb ){
        var dim = Math.ceil( Math.sqrt( this.getTotalSize() ) );
		var dest = new Uint8Array( dim*dim*4 );
		var skip=4, off = 0;

		function copy( src ){
			var fileSize = src.length;
			for( var fileOff=0; fileOff<fileSize; ){
				var v = src[ fileOff++ ];
				dest[ off++ ] = v;
				dest[ off++ ] = v;
				dest[ off++ ] = v;
				dest[ off++ ] = 0xFF;
			}
		}

		copy( intToBuffer(this.files.length) );
		for (var i = 0, f; f = this.files[i]; i++){
			copy( intToBuffer(f.name.length) );
			copy( strToBuffer(f.name) );
			copy( intToBuffer(f.data.length) );
			copy( f.data );
		}

		var enc = new CanvasTool.PngEncoder( dest, {
			width: dim,
			height: dim,
			colourType: CanvasTool.PngEncoder.ColourType.GRAYSCALE
		});

        var codecSrc = "(" + this.codec.toString().replace("__DECODE__", path.replace(/.*[\/\\]/g, '') ) + ")();";

		cb( [
            {name:path, data:enc.convert()},
            {name:path + ".js", data:codecSrc }
        ] );
    },

    codec: function(){function c(){return k[g+=4]}function l(){var b=c()<<24,b=b+(c()<<16),b=b+(c()<<8);return b+=c()}function m(){for(var b="",d=l(),n=0;n<d;++n)b+=String.fromCharCode(c());return b}var g=-4,k,h=document,f=h.createElement("img");f.onload=function(){try{var b=h.createElement("canvas"),d=b.height=b.width=f.width,c=b.getContext("2d");c.drawImage(f,0,0);k=c.getImageData(0,0,d,d).data;var g=l(),b="",e;window.a=window.a||{};for(d=0;d<g;++d){var p=m();e=window.a[p]=m();/\.js$/i.test(p)&&(b+=e)}b.length&&(e=h.createElement("script"),e.textContent=b,document.head.appendChild(e))}catch(q){console.error(q)}};f.src="__DECODE__"},
	__codec:function(){
		var off = -4, src;

		function POP(){
			return src[off += 4];
		}

		function INT(){
			var ret = POP()<<24;
			ret += POP()<<16;
			ret += POP()<<8;
			ret += POP();
			return ret;
		}

		function STR(){
			var acc = "", len=INT();
			for(var i=0; i<len; ++i )
				acc += String.fromCharCode( POP() );
			return acc;
		}


		var d = document;
		var img = d.createElement("img");
		img.onload = function(){
			try{
				var canvas = d.createElement("canvas");
				var dim = canvas.height = canvas.width = img.width;
				var ctx = canvas.getContext('2d');
				ctx.drawImage( img, 0, 0 );
				src = ctx.getImageData(0, 0, dim, dim).data;
				var fileCount = INT();
				var js = "", tmp;
				window.resources = window.resources || {};

				for( var i=0; i<fileCount; ++i ){
					var name=STR();
					tmp = window.resources[name] = STR();
					if( /\.js$/i.test(name) ) js += tmp;
				}

				if(js.length){
					tmp = d.createElement("script");
					tmp.textContent = js;
					document.head.appendChild(tmp);
				}
			}catch(ex){
				console.error(ex);
			}
		};
		img.src = "__DECODE__";
	}

});
