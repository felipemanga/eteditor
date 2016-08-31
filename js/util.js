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
	var arr = decbin(str), obj = {};
	if( mime ) obj.type = mime;
	return URL.createObjectURL(new Blob([arr], obj));
}

function decbin(str){
	var start = performance.now();
	var arr = new Uint8ClampedArray(str.length);
	var ofbc=0, buf = [], c;
	for(var j=0, i=0, l=str.length; i<l; ++i, ++ofbc){
		buf[ofbc] = str.charCodeAt(i);
		if(buf[ofbc] == 65533) buf[ofbc] = 0;
		if(ofbc == 6){
			var bm = str.charCodeAt(++i);
			if(bm==65533) bm = 0;
			for( var k=0; k<7; ++k ){
				c = buf[k];
				if(bm & (1<<k)) c |= 0x80;
				arr[j++] = c;
			}
			ofbc = -1;
		}
	}
	var timeDelta = performance.now() - start;
	console.log("decode time:", timeDelta);
	return arr;
}

(function(){
	var LUT = [], i;
	for(i=0;i<=0x7F;++i)
		LUT[i] = String.fromCharCode(i);
	LUT[10] = "\\n";
	LUT[13] = "\\r";
	LUT[34] = '\\"';
	LUT[92] = "\\\\";
	self.__STRLUT = LUT;
})();

function encbin(b){
	"use strict";
	var start = performance.now();

	var LUT = __STRLUT, acc = "", i=0, l=b.length, c;
	var ofbc=7, ofbacc=0;

	while( i<l ){
		c=b.charCodeAt(i++);
		ofbacc |= (((c&0x80)>>7)<<(7-ofbc));
		acc += LUT[c&0x7F];
		if(--ofbc) continue;
		ofbc=7;
		acc += LUT[ofbacc];
		ofbacc = 0;
	}

	while(ofbc--)
		acc += "\0";
	acc += LUT[ofbacc];

	var timeDelta = performance.now() - start;
	console.log("addslashes: final size:", acc.length, " input size:", l, "("+ Math.floor(acc.length / l * 100) + "%)", " time:", timeDelta);

	// start = performance.now();
	// var b64 = btoa(b);
	// timeDelta = performance.now() - start;
	// console.log("base64:", b64.length, " addslashes:", Math.floor(acc.length / b64.length * 100) + "%", "time:", timeDelta);

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
