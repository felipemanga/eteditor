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

function strToBuffer(str){
	var arr = new Uint8ClampedArray(str.length);
	for(i=0; i<str.length; ++i) arr[i] = str.charCodeAt(i);
	return arr;
}

function dir(root, cb, ref){
	var fs = window.fs || require('fs');
	ref = ref || "";
	var stat = fs.statSync(root+ref);
	var ret = cb( ref || (root+ref), stat );
	if( ret === true && stat.isDirectory() ){
		fs.readdirSync(root+ref).forEach(function (file) {
			if( !ref ) dir( root+"/", cb, file );
			else dir( root, cb, ref+"/"+file );
		});
	}
	return ret;
};

function distance( x1, y1, x2, y2 ){
	x1 -= x2;
	y1 -= y2;
	return Math.sqrt( x1*x1+y1*y1 );
}