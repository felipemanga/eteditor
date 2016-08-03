need("dialogues.IDialogue", function(){

var FileEntry = CLAZZ({
    file:null,
    el:null,
    data:null,

    CONSTRUCTOR:function(name, DOM){
        this.el = DOM.index( DOM.create("div", DOM.files, { id:"box" }, [
            ["div", { text: "Loading", id:"status"}],
            ["div", { text: name, id:"fileName" }]
        ]), null, this );
		this.file = name;
    },
    setData:function(data){
        this.data = new Uint8Array( data );
        this.el.status.textContent = Math.ceil(this.data.length / 1024) + "Kb";
    }
});


CLAZZ("projects.minijs.MiniJSProject", {
    files:null,
    running:false,
	path:null,

	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
            	position:"center",
                menu:{
                    save:{
                        priority:5
                    }
                }
            }
        }),

        fileReader:"io.FileReader",

        app:"app"
    },

    CONSTRUCTOR:function(){
        this.app.add(this);
        this.files = [];
    },

	STATIC:{
		title:"MiniJS"
	},

	onLoad:function(){
		this.files = [];
	},

    add:function(path, data){
        this.files.push(  );
    },

    $BODY:{
        dragover:function( evt ){
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },

        drop:function( evt ){
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();

			this.dialogue.DOM.lblDrop.style.display = "none";

            this.fileReader.onDropForEach(evt, (path, file, isDirectory) => {
                if( isDirectory )
                    return;
                var fe = new FileEntry( path, this.dialogue.DOM );
                this.fileReader.readAsArrayBuffer( file, fe.setData.bind(fe) );
            });
        }
    },

	dataSize:0,
    getTotalSize:function(){
		var acc = 4;
		this.dataSize = 0;
		for (var i = 0, f; f = this.files[i]; i++){
			if( f.status == "Loading" ) return;
			acc += 8;
			acc += f.file.length;
			acc += f.data.length;
			this.dataSize += f.data.length;
		}
		return acc;
    },

	fileData:null,
	onSave:function( cb ){
        var ext = this.path.match(/\.([a-z]+)$/i);
        if( !ext || ext[1].toLowerCase() != "png" ) this.path += ".png";

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
			copy( intToBuffer(f.file.length) );
			copy( strToBuffer(f.file) );
			copy( intToBuffer(f.data.length) );
			copy( f.data );
		}

		var enc = new CanvasTool.PngEncoder( dest, {
			width: dim,
			height: dim,
			colourType: CanvasTool.PngEncoder.ColourType.GRAYSCALE
		});


		fs.writeFileSync( this.path + ".js", "(" + this.codec.toString().replace("__DECODE__", this.path.replace(/.*[\/\\]/g, '') ) + ")();" );

		cb( enc.convert() );
		this.dialogue.DOM.stats.textContent = Math.ceil(this.dataSize/1024) + "Kb => "
								+ Math.ceil(fs.lstatSync( this.path ).size/1024) + "Kb";
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

});
