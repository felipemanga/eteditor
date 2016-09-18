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

function decbin(a){var d={65533:0},b;for(b=0;128>b;)d[b]=b++;[10,13,39,92].forEach((c,e)=>{b=a.charCodeAt(e);d[b]=c;d[c]=b});a=a.substr(4);for(var f=new Uint8ClampedArray(a.length/8*7),c=0,g=d[a.charCodeAt(7)],h=0,e=0,k=a.length;e<k;++h,++c)bm=d[a.charCodeAt(e++)],f[h]=bm|(g>>c&1)<<7,6==c&&(e++,g=d[a.charCodeAt(e+7)],c=-1);return f};

function __decbin(str){
	var start = performance.now();
	var map={65533:0}, t;
	for(t=0; t<128;) map[t]=t++;
	[10,13,39,92].forEach((code, pos)=>{
		t=str.charCodeAt(pos);
		map[t]  = code;
		map[code] = t;
	});

	str = str.substr(4);

	var arr = new Uint8ClampedArray(str.length/8*7);
	var ofbc=0, buf = [], c;
	var mask = map[str.charCodeAt(7)];

	for(var j=0, i=0, l=str.length; i<l; ++j, ++ofbc){
		bm = map[str.charCodeAt(i++)];

		arr[j] = bm | (((mask>>ofbc)&1)<<7);

		if(ofbc != 6) continue;
		i++;
		mask = map[str.charCodeAt(i + 7)];
		ofbc = -1;
	}
	var timeDelta = performance.now() - start;
	console.log("decode time:", timeDelta);
	return arr;
}

(function(){
	var STRLUT = [], i, freq = new Uint32Array(127);

self.encbin = function encbin(b){
	"use strict";
	var start = performance.now();

	var LUT = STRLUT, acc = "'", i=0, l=b.length, c;
	var ofbc=7, ofbacc=0, map={65533:0};

	for(i=0;i<=0x7F;++i)
		STRLUT[i] = String.fromCharCode(i);
	STRLUT[10] = "\\n";
	STRLUT[13] = "\\r";
	STRLUT[39] = "\\'";
	STRLUT[92] = "\\\\";

	freq.fill(0);
	while( i < l ){
		c = b.charCodeAt(i++);
		ofbacc |= (((c&0x80)>>7)<<(7-ofbc));
		freq[c&0x7F]++;

		if(--ofbc) continue;
		ofbc=7;
		c = ofbacc;
		freq[c]++;
		ofbacc = 0;
	}

	ofbacc = 0;
	ofbc = 7;

	var lf=[freq[0]], lfp=[0];
	for(i=1; i < 127; ++i ){
		var freqi = freq[i];
		for(var j=0; j<4; ++j ){
			if( !(freqi >= lf[j]) && STRLUT[i].length==1 ){
				for(var k=3; k>j; --k){
					lf[k]=lf[k-1];
					lfp[k]=lfp[k-1];
				}
				lf[j]=freqi;
				lfp[j]=i;
				break;
			}
		}
	}

	var specials = [10, 13, 39, 92];
	specials.sort(
		(a,b) => freq[a] - freq[b]
	).forEach((k,i) => {
		var t = LUT[k];
		LUT[k] = LUT[lfp[i]];
		LUT[lfp[i]] = t;
	});
	// console.log("LF / LFP:", lf, lfp, specials, specials.map(k => freq[k]));

	acc += LUT[10] + LUT[13] + LUT[39] + LUT[92];

	i=0;
	while( i < l ){
		c = b.charCodeAt(i++);
		ofbacc |= (((c&0x80)>>7)<<(7-ofbc));
		acc += LUT[c&0x7F];
		if(--ofbc) continue;
		ofbc=7;
		acc += LUT[ofbacc];
		ofbacc = 0;
	}

	while(ofbc--)
		acc += "\0";
	acc += LUT[ofbacc] + "'";

	var timeDelta = performance.now() - start;
	console.log("encbin: final size:", acc.length, " input size:", l, "("+ Math.floor(acc.length / l * 100) + "%)", " time:", timeDelta);

	// start = performance.now();
	// var b64 = btoa(b);
	// timeDelta = performance.now() - start;
	// console.log("base64:", b64.length, " addslashes:", Math.floor(acc.length / b64.length * 100) + "%", "time:", timeDelta);

	return acc;
}
})();


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
