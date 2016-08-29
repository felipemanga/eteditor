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
	var arr = new Uint8ClampedArray(str.length), obj = {};
	for(var i=0, l=str.length; i!=l; ++i) arr[i] = str.charCodeAt(i);
	if( mime ) obj.type = mime;
	return URL.createObjectURL(new Blob([arr], obj));
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
