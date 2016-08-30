function forEach(al, cb){
	if( al )
		for( var i=0, l=al.length; i<l; i++ ) cb(al[i], i, al);
}

function intToSTR4B(i){
	i=i|0;
	var r = String.fromCharCode((i>>24)&0xFF) +
		String.fromCharCode((i>>16)&0xFF) +
		String.fromCharCode((i>> 8)&0xFF) +
		String.fromCharCode( i     &0xFF);
	return r;
}

function intToBuffer(i){
	return Uint8ClampedArray.from([
		(i>>24)&0xFF,
		(i>>16)&0xFF,
		(i>> 8)&0xFF,
		 i     &0xFF
	]);
}

function atoURL(str, mime){
	str=atob(str);
	var arr = new Uint8ClampedArray(str.length), obj = {};
	for(var i=0, l=str.length; i<l; ++i) arr[i] = str.charCodeAt(i) & 0xFF;
	if( mime ) obj.type = mime;
	return URL.createObjectURL(new Blob([arr], obj));
}

function btoURL(str, mime){
	var arr = new Uint8ClampedArray(str.length), obj = {};
	for(var j=0, i=0, l=str.length; i<l; ++i){
		var c = str.charCodeAt(i);
		if(c == 0xFF) c = 0x7F;
		else if(c == 0xFE) c = 220;
		else if(c == 0xFD) c = 162;
		else if(c == 0x7F) c = str.charCodeAt(++i) | 0x80;
		arr[j++] = c;
	}
	if( mime ) obj.type = mime;
	return URL.createObjectURL(new Blob([arr], obj));
}

function addslashes(b){
	var acc = "";

	function pad(n){
		var r = "\\";
		n=n.toString(8);
		if(i<l-1){
			var nc = b.charCodeAt(i+1);
			if( nc>=0x30 && nc<=0x37 ){
				while(n.length<3) n = "0" + n;
			}
		}
		r += n;
		return r;
	}

	for( var i=0, l=b.length; i<l; ++i ){
		var c=b.charCodeAt(i) & 0xFF, t = b[i];

		if(c==0){
			acc += pad(0);
			continue;
		}
		if(t=='"' || t=='\\'){
			acc += "\\" + t;
			continue;
		}
		if(c==13){
			acc += '\\r';
			continue;
		}
		if(c==10){
			acc += '\\n';
			continue;
		}
		if(c<0x7F){
			acc += t;
			continue;
		}
		if(c==0x7F){
			acc += "\\xFF";
			continue;
		}
		if(c>0x7F){
			c = c & 0x7F;
			if( c == 10 ){
				t="\x7F\\n";
			}else if( c == 13 ){
				t="\x7F\\r";
			}else if( c == 0 ){
				t="\x7F"+pad(0);
			}else if(c == 92){
				t="\\xFE";
			}else if(c == 34){
				t="\\xFD";
			}else{
				t = "\x7F" + String.fromCharCode(c);
			}
			acc += t;
			continue;
		}

		debugger;


		if( c<0x7F && c>=32 && t != '\\' && t != '"' ) t = t;
		else{
			t = c.toString(8);
			while(t.length<3) t = "0" + t;
			t = '\\' + t;
		}
		acc += t;

		/*
		else if(c==0x7F) t = "\\uC282";
		else t = "\x7F" + String.fromCharCode(c&0x7F);

		acc += {
			"\0":'\\0',
			"\\":'\\\\',
			"\"":'\\"',
			"\x0A":'\\n',
			"\x0D":"\\r",
			"\x7F\x00":"\\x80",
			"\x7F\x0A":"\\x8A",
			"\x7F\x0D":"\\x8D",
			"\x7F\x22":"\\xA2",
			"\x7F\x5C":"\x7F\\\\"
		}[t] || t;
		*/

		// if( acc.length % 1024 == 0 ) acc += "\"\n + \"";
	}

	return acc;
}


function strToBuffer(str){
	var arr = new Uint8ClampedArray(str.length);
	for(var i=0, l=str.length; i<l; ++i) arr[i] = str.charCodeAt(i);
	return arr;
}

function bufferToStr(buf, encoding){
	var dataView = new DataView(buf);
	var decoder = new TextDecoder(encoding || "utf-8");
	return decoder.decode(dataView);
}

(function(){
	var map = {};

	self.arrayToBlobURL = function arrayToBlobURL( array, name, cfg ){
		if( map[name] )
			URL.revokeObjectURL( map[name] );

		if( typeof array == "string" )
			array = strToBuffer(array);

		if( array == null )
			return map[name] = null;

		return map[name] = URL.createObjectURL( new Blob([array], cfg||{}) );
	}
})();

function base64toBlob(base64Data, contentType, sliceSize) {

    var byteCharacters,
        byteArray,
        byteNumbers,
        blobData,
        blob;

    contentType = contentType || '';

    byteCharacters = atob(base64Data);

    // Get blob data sliced or not
    blobData = sliceSize ? getBlobDataSliced() : getBlobDataAtOnce();

    blob = new Blob(blobData, { type: contentType });

    return blob;


    /*
     * Get blob data in one slice.
     * => Fast in IE on new Blob(...)
     */
    function getBlobDataAtOnce() {
        byteNumbers = new Array(byteCharacters.length);

        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        byteArray = new Uint8Array(byteNumbers);

        return [byteArray];
    }

    /*
     * Get blob data in multiple slices.
     * => Slow in IE on new Blob(...)
     */
    function getBlobDataSliced() {

        var slice,
            byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            slice = byteCharacters.slice(offset, offset + sliceSize);

            byteNumbers = new Array(slice.length);

            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            byteArray = new Uint8Array(byteNumbers);

            // Add slice
            byteArrays.push(byteArray);
        }

        return byteArrays;
    }
}

function distance( x1, y1, x2, y2 ){
	x1 -= x2;
	y1 -= y2;
	return Math.sqrt( x1*x1+y1*y1 );
}
