(function(){
Utils = {
    toInt:function( bytes ) {
        var x = 0, numOfBytes = bytes.length;

        if (numOfBytes > 4)
            numOfBytes = 4; // Can't consider more than 4 bytes

        for (var i = 0; i < numOfBytes; i++) {
            x = (x << 8) | (0xFF & bytes[numOfBytes - 1 - i]);
        }

        return x;
    }
};

var InputStream = CLAZZ({
    position:0,
    source:null,
    CONSTRUCTOR:function(src){
        this.source = src;
    },
    read:function(out){
        var src = this.source;
        if( !out )
            return src[this.position++];
        
        for( var i=0, l=out.length; i<l; ++i )
            out[i] = src[this.position++];
        return out;
    },
    skip:function(amount){
        this.position += amount;
    }
});

var Node = CLAZZ({
    ROOT: 1,

	/**
	 * Node order index
	 */
	index:0,
	linenumber:0,
	name:"",
	namespacePrefix:"",
	namespaceURI:"",
	namespaceLineNumber:0,
	attrs:null,

    CONSTRUCTOR:function(){
        this.attrs = [];
    }
});

var RES_NULL_TYPE = 0x0000,
    RES_STRING_POOL_TYPE = 0x0001,
    RES_TABLE_TYPE = 0x0002,
    RES_XML_TYPE = 0x0003,
    
    // Chunk types in RES_XML_TYPE
    RES_XML_FIRST_CHUNK_TYPE = 0x0100,
    RES_XML_START_NAMESPACE_TYPE = 0x0100,
    RES_XML_END_NAMESPACE_TYPE = 0x0101,
    RES_XML_START_ELEMENT_TYPE = 0x0102,
    RES_XML_END_ELEMENT_TYPE = 0x0103,
    RES_XML_CDATA_TYPE = 0x0104,
    RES_XML_LAST_CHUNK_TYPE = 0x017f,
    
    // This contains a uint32_t array mapping strings in the string
    // pool back to resource identifiers. It is optional.
    RES_XML_RESOURCE_MAP_TYPE = 0x0180,

    // Chunk types in RES_TABLE_TYPE
    RES_TABLE_PACKAGE_TYPE = 0x0200, 
    RES_TABLE_TYPE_TYPE = 0x0201,
    RES_TABLE_TYPE_SPEC_TYPE = 0x0202;


CLAZZ("js.android.ABXParse", {

    toXMLString:null,
    
    CONSTRUCTOR:function( bxFile, resFile ){
        var chunk_type_buf = [0,0],
            header_size_buf = [0,0],
            chunk_size_buf = [0,0,0,0],
            header_size,
            chunk_size,
            package_count,

            tag = "BACON ",
            
            buf_2 = [0,0],
            buf_4 = [0,0,0,0],

            stringPool = [],
            resStringPool = [],
            resMap = [],
            
            ns_prefix_index = -1,
            ns_uri_index = -1,
            ns_linenumber = 0,
        
            nodeIndex = -1,
            listener = null;

            this.toXMLString = toXMLString;
        return;

        function toXMLString(){
            var acc = "";
            var stack = [];
            var rtsp = parseResourceTable(resFile);
            var uris = [];

            function atval(attr){
                var val = attr.value, type=attr.type;

                if( type >= 0x6 && type != 0x12 ) type = 0x10;

                switch(type){
                case 0x12: val = val == 0 ? '"false"' : '"true"'; break;
                case 0x10: // some sort of int
                case 16: val = '"' + val + '"'; break;
                case 1:
                    if( typeof val == "number" ){
                        type = ((val >> 16) & 0xFF)-1;
                        type = {3:"string", 1:"drawable"}[type] || type;
                        val = "@" + type + "/" + rtsp[ val & 0xFFFF ];
                    }
                default: val = '"' + val + '"'; break;
                }
                return '=' + val;
            }

            listener = (part) => {
                if( part === undefined ){
                    if( stack.length )
                        acc += "\t".repeat(stack.length-1) + "</" + stack.pop() + ">\n";
                }else if( typeof part == "string" ){
                    acc += part + "\n";
                }else{
                    acc += "\t".repeat(stack.length) + "<" + part.name;

                    if( part.namespaceURI && uris.indexOf(part.namespaceURI) == -1 ){
                        acc += " xmlns:" + part.namespacePrefix + '="' + part.namespaceURI + '"';
                        uris.push(part.namespaceURI);
                    };

                    part.attrs.forEach(
                        att => acc += " " +
                            (part.name.toLowerCase()!="manifest" || att.name != "package" ? part.namespacePrefix + ":" : "") +
                            att.name +
                            atval(att)
                    );
                    acc += ">\n";
                    stack.push(part.name);
                }
            };

            parse();

            return acc;
        }

	/**
	 * Parse XML resourcs...
	 * 
	 * [String Pool]
	 * [Resource Map]
	 * [Namespace Start]
	 * [XML Start]
	 * [XML End]
	 * [XML Start]
	 * [XML End]
	 * .....
	 * [Namespace End]
	 *  * [Namespace Start]
	 * [XML Start]
	 * [XML End]
	 * [XML Start]
	 * [XML End]
	 * .....
	 * [Namespace End]
	 * ....
	 * # There can be multiple Namespace and within one Name space multiple XML nodes.
	 * 
	 * @param bxFile
	 * @throws Exception
	 */
	function parse(){
        stringPool=[];

		var IN = new InputStream(bxFile),
		    header_size,
		    chunk_size;
		
		// Is it an valid BXML ?
		/*
		 * Chunk header meta size - 8 bytes
		 * [Chunk Type] - 2 bytes
		 * [Chunk Header Size] - 2 bytes
		 * [Chunk Size] - 4 bytes
		 */
		IN.read(chunk_type_buf);
		
		if(Utils.toInt(chunk_type_buf, false) != RES_XML_TYPE){
			throw new Error("Invalid BXML file");
		}
		
		if(listener != null)
			listener('<?xml version="1.0" encoding="utf-8"?>');
		
		IN.read(header_size_buf);
		header_size = Utils.toInt(header_size_buf, false);
		
		IN.read(chunk_size_buf);
		chunk_size = Utils.toInt(chunk_size_buf, false);
		
		// console.log(tag, "Header Size: "+ header_size +" Chunk size: "+ chunk_size);
		
		IN.read(chunk_type_buf);
		
		if(Utils.toInt(chunk_type_buf, false) == RES_STRING_POOL_TYPE)
		{
			// String Pool/Tokens
			// console.log(tag, "String Pool...");
			IN.read(header_size_buf);
			header_size = Utils.toInt(header_size_buf, false);
			
			IN.read(chunk_size_buf);
			chunk_size = Utils.toInt(chunk_size_buf, false);
			
			// console.log(tag, "String Pool...Header Size: "+ header_size +" Chunk Size: "+ chunk_size);
			
			var spBuf = new Array(chunk_size - 8);
			IN.read(spBuf);
			
			// Parse String pool
			parseStringPool(spBuf, header_size, chunk_size);
			
			// Get the next Chunk
			IN.read(chunk_type_buf);
		}
		
		// Resource Mapping- Optional Content
		if(Utils.toInt(chunk_type_buf, false) == RES_XML_RESOURCE_MAP_TYPE)
		{
			IN.read(header_size_buf);
			header_size = Utils.toInt(header_size_buf, false);
			
			IN.read(chunk_size_buf);
			chunk_size = Utils.toInt(chunk_size_buf, false);
			
			var rmBuf = new Array( chunk_size - 8 ); 
			IN.read(rmBuf);
			
			// Parse Resource Mapping
			parseResMapping(rmBuf, header_size, chunk_size);
			
			// Get the next Chunk
			IN.read(chunk_type_buf);
		}
		
		/*
		 * There can be multiple Name space and XML node sections
		 * [XML_NameSpace_Start]
		 * 	[XML_Start]
		 *  	[XML_Start]
		 * 		[XML_End]
		 *  [XML_END]
		 * [XML_NameSpace_End]
		 * [XML_NameSpace_Start]
		 * 	[XML_Start]
		 * 	[XML_End]
		 * [XML_NameSpace_End]
		 */
		
		// Name space Start
        
		if(Utils.toInt(chunk_type_buf, false) == RES_XML_START_NAMESPACE_TYPE)
		{
			IN.read(header_size_buf);
			header_size = Utils.toInt(header_size_buf, false);
			
			IN.read(chunk_size_buf);
			chunk_size = Utils.toInt(chunk_size_buf, false);
			
			var nsStartBuf = new Array(chunk_size - 8); 
			IN.read(nsStartBuf);
			
			// Parse Start of Name space
			parseStartNameSpace(nsStartBuf, header_size, chunk_size);
		}
		
		// Handle multiple XML Elements
		IN.read(chunk_type_buf);
		var chunk_type = Utils.toInt(chunk_type_buf, false);

		while(chunk_type !=  RES_XML_END_NAMESPACE_TYPE)
		{
			// console.log(tag, "Parsing XML node...Chunk_Type "+ chunk_type);
			/*
			 * XML_Start
			 * 	XML_Start
			 *  XML_End
			 * XML_End
			 * .......
			 */
			IN.read(header_size_buf);
			header_size = Utils.toInt(header_size_buf, false);
			
			IN.read(chunk_size_buf);
			chunk_size = Utils.toInt(chunk_size_buf, false);
			
			var elementBuf = new Array(chunk_size - 8);
			IN.read(elementBuf);
			
			if(chunk_type == RES_XML_START_ELEMENT_TYPE)
			{
				// Start of XML Node
				parseXMLStart(elementBuf, header_size, chunk_size);
			}
			else if(chunk_type == RES_XML_END_ELEMENT_TYPE)
			{
				// End of XML Node
				parseXMLEnd(elementBuf, header_size, chunk_size);
			}
			
			// TODO: CDATA
			
			// Next Chunk type
			IN.read(chunk_type_buf);
			chunk_type = Utils.toInt(chunk_type_buf, false);
		}
		
		// End of Name space
		if(chunk_type == RES_XML_END_NAMESPACE_TYPE)
		{
			IN.read(header_size_buf);
			header_size = Utils.toInt(header_size_buf, false);
			
			IN.read(chunk_size_buf);
			chunk_size = Utils.toInt(chunk_size_buf, false);
			
			var nsEndBuf = new Array(chunk_size - 8); 
			IN.read(nsEndBuf);
			
			// Parse End of Name space
			parseEndNameSpace(nsEndBuf, header_size, chunk_size);
		}
		
		if(listener != null)
			listener();
		
		// That's it. TODO: Handle multiple Name spaces
	}

	/**
	 * String pool Header
	 * Chunk Header - 8 bytes
	 * String count - init32
	 * Style count - init32
	 * Flag (1/8) - init32
	 * 	1 - Is it sorted
	 * 	8 - Is it UTF-8 encoded
	 * String start - init32
	 * Style start - init32
	 * 
	 * String pool Data
	 * [SP indices (init32) for each String.] [Style indices (init32) for each style]
	 * [String Len][String][0x0000]
	 * ......
	 * [Style span data] - TODO.
	 * 
	 * @param spBuf - byte array of StringPool
	 */
	function parseStringPool( spBuf, header_size, chunk_size) {
		var IN = new InputStream(spBuf);
		
		// String pool header
		var int_buf = new Array(4);
		IN.read(int_buf);
		
		var string_count = Utils.toInt(int_buf, false);
		IN.read(int_buf);
		var style_count = Utils.toInt(int_buf, false);
		IN.read(int_buf);
		var flag = Utils.toInt(int_buf, false);
		IN.read(int_buf);
		var string_start = Utils.toInt(int_buf, false);
		IN.read(int_buf);
		var style_start = Utils.toInt(int_buf, false);
				
		console.log("String Count: "+ string_count +" Style Count: "+ style_count +" Flag: "+ flag +" String Start: "+ string_start +" Style Start: "+ style_start);
		
		// String pool data
		// Read index location of each String
		var string_indices = new Array(string_count);
		if(string_count > 0){
			for(var i=0; i<string_count; i++){
				IN.read(int_buf);
				string_indices[i] = Utils.toInt(int_buf, false);
			}
		}
		
		if(style_count > 0){
			// Skip Style
			IN.skip(style_count * 4);
		}
		
		// Read Strings
		for(var i=0; i<string_count; i++){
			var string_len = 0;
			if(i == string_count - 1){
				if(style_start == 0)// There is no Style span
				{
					// Length of the last string. Chunk Size - Start position of this String - Header - Len of Indices
					string_len = chunk_size - string_indices[i] - header_size - 4 * string_count;
					// console.log(tag, "Last String size: "+ string_len +" Chunk_Size: "+ chunk_size +" Index: "+ string_indices[i]);
				}
				else
					string_len = style_start - string_indices[i];
			}
			else
				string_len = string_indices[i+1] - string_indices[i];
			
			/*
			 * Each String entry contains Length header (2 bytes to 4 bytes) + Actual String + [0x00]
			 * Length header sometime contaIN duplicate values e.g. 20 20
			 * Actual string sometime contains 00, which need to be ignored
			 * Ending zero might be  2 byte or 4 byte
			 * 
			 * TODO: Consider both Length bytes and String length > 32767 characters 
			 */
			var short_buf = new Array(2);
			IN.read(short_buf);
			var actual_str_len = 0;
			if(short_buf[0] == short_buf[1]) // Its repeating, happens for Non-Manifest file. e.g. 20 20
				actual_str_len = short_buf[0];
			else
				actual_str_len = Utils.toInt(short_buf, false);
			
			var str_buf = "";
			var buf = new Array(string_len - 2); // Skip 2 Length bytes, already read.
			IN.read(buf);
			var j = 0;
			for(var k=0; k<buf.length; k++){
				if(buf[k]) str_buf += String.fromCharCode(buf[k]);
			}
			
			stringPool.push(str_buf);
		}
		
		// console.log(tag, "[String Pool] Size: "+ stringPool.length);
		console.log(tag, "[String Pool] "+ stringPool);
	}
	
	/**
	 * Resource IDs of Attributes
	 * Each ID of int32
	 * TODO: Use this information for XML generation.
	 * 
	 * @param rmBuf
	 * @param header_size
	 * @param chunk_size
	 * @throws Exception
	 */
	function parseResMapping( rmBuf, header_size, chunk_size) {
		var IN = new InputStream(rmBuf);
		// Each ID of 4 bytes
		var num_of_res_ids = rmBuf.length/4;
		
		var int_buf = new Array(4);
		for(var i=0; i<num_of_res_ids; i++){
			IN.read(int_buf);
			resMap.push(Utils.toInt(int_buf, false));
		}
		console.log("[Res Mapping] Resource Mapping "+ resMap.map(x=>x.toString(16)) );
	}

	/**
	 * One namespace includes multiple XML elements
	 * [Chunk_type] [Header_Size]
	 * [Chunk Size]
	 * <-- Chunk Body -->
	 * [Line Number] - Line number where to place this
	 * [Comment] - TODO: Skip it for the time being
	 * [Prefix] - String pool index
	 * [URI] - String Pool index
	 *  
	 * @param nsStartBuf
	 * @param header_size
	 * @param chunk_size
	 * @throws Exception
	 */
	function parseStartNameSpace( nsStartBuf, header_size, chunk_size) 
	{
		nodeIndex = 0;
		
		var IN = new InputStream(nsStartBuf);
		
		var int_buf = new Array(4);
		IN.read(int_buf);
		ns_linenumber = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var comment = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		ns_prefix_index = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		ns_uri_index = Utils.toInt(int_buf, false);
		
		// console.log(tag, "[Namespace Start]Line Number: "+ ns_linenumber +" Prefix: "+ stringPool[ns_prefix_index] + " URI: "+ stringPool[ns_uri_index]);
	}
	
	/**
	 * XML_Start_Node Chunk Body-
	 * line number- init32
	 * comment- init32
	 * ns - int32
	 * name - int32
	 * attributeStart- int16
	 * attributeSize- int16
	 * attributeCount - int16
	 * id_index - int16
	 * class_index - int16
	 * style_index - int16
	 * 
	 * [Attributes]
	 * 	ns- int32
	 *  name- int32
	 *  rawValue- init32
	 *  typedValue- 
	 *  	size- init16
	 *  	res- init8
	 *  	dataType- init8
	 *  	data- init32
	 *  
	 *  TODO: Retrieve Attribute data from resources.arsc
	 *  
	 * @param xmlStartBuf
	 * @param header_size
	 * @param chunk_size
	 * @throws Exception
	 */
	function parseXMLStart( xmlStartBuf, header_size, chunk_size) 
	{
		nodeIndex++;
		var node = new Node();
		node.index = nodeIndex;
		
		var IN = new InputStream(xmlStartBuf);
		
		var int_buf = new Array(4);
		
		IN.read(int_buf);
		var lineNumber = Utils.toInt(int_buf, false);
		node.linenumber = lineNumber;
		
		IN.read(int_buf);
		var comment = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var ns_index = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var name_index = Utils.toInt(int_buf, false);
		
		var short_buf = new Array(2);
		
		IN.read(short_buf);
		var attributeStart = Utils.toInt(short_buf, false);
		
		IN.read(short_buf);
		var attributeSize = Utils.toInt(short_buf, false);
		
		IN.read(short_buf);
		var attributeCount = Utils.toInt(short_buf, false);
		
		// Skip ID, Class and Style index
		IN.skip(6);
		
		// console.log(tag, "[XML Node] Name: "+ (name_index == -1 ? "-1" : stringPool[name_index]) +" Attr count: "+ attributeCount);
		
		if(name_index != -1){
			node.name = stringPool[name_index];
			
			if(ns_prefix_index != -1 && ns_uri_index != -1)
			{
				node.namespacePrefix = stringPool[ns_prefix_index];
				node.namespaceURI = stringPool[ns_uri_index];
			}
		}
		
		if(attributeCount == 0){
			// No Attributes defined
			if(listener != null)
				listener(node);
			return;
		}

		for(var i=0; i<attributeCount; i++)
		{
			var attr = {};
			
			// attr ns
			IN.read(int_buf);
			var attr_ns_index = Utils.toInt(int_buf, false);
			
			// attr name
			IN.read(int_buf);
			var attr_name_index = Utils.toInt(int_buf, false);
			
			// Raw value. If user has directly mentioned value e.g. android:value="1". Reference to String Pool
			IN.read(int_buf);
			var attr_raw_value =  Utils.toInt(int_buf, false);
			
			var attr_value = "";
			
			if(attr_raw_value == -1){
				// No Raw value defined.
				// Read Typed Value. Reference to Resource table e.g. String.xml, Drawable etc.
				/*
				 * Size of Types value- init16
				 * Res- init8 (Always 0)
				 * Data Type- init8
				 * Data- init32. Interpreted according to dataType
				 */
				IN.read(short_buf);
				var data_size = Utils.toInt(short_buf, false);
				
				// Skip res value- Always 0
				IN.skip(1);
				
				// TODO: Retrieve data based on Data_Type. Read Resource table.
				var data_type = IN.read();
				
				IN.read(int_buf);
				var data = Utils.toInt(int_buf, false); // Refer to Resource Table
				attr_value = data;
				//// console.log(tag, "[Attribute] Value: "+ data);
			}
			else{
				attr_value = stringPool[attr_raw_value];
				//// console.log(tag, "[Attribute] Value: "+ attr_value);
				// Skip Typed value bytes
				IN.skip(8);
			}
			
			if(attr_name_index != -1)
			{
				attr.name = stringPool[attr_name_index];
				attr.value = attr_value;
                attr.type = data_type;
				node.attrs.push(attr);
			}
			
//			// console.log(tag, "[Attribute] NameSpace: "+ (attr_ns_index == -1 ? "-1": stringPool[attr_ns_index]) +
//								" Name: "+ (attr_name_index == -1 ? "-1" : stringPool[attr_name_index]));
		}
		
		if(listener != null){
			listener(node);
		}
			
	}
	
	/**
	 * XML_END Node Chunk Body-
	 * [Line Number]
	 * [Comment]
	 * [Name space] - Name space. Ref to String pool, unless -1.
	 * [Name] - Ref to String pool
	 * 
	 * @param xmlEndBuf
	 * @param header_size
	 * @param chunk_size
	 * @throws Exception
	 */
	function parseXMLEnd( xmlEndBuf, header_size, chunk_size) 
	{
		var IN = new InputStream(xmlEndBuf);
		
		var int_buf = new Array(4);
		IN.read(int_buf);
		var lineNumber = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var comment = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var ns_index = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var name_index = Utils.toInt(int_buf, false);
		
		// console.log(tag, "[XML_END] Line Number: "+ lineNumber +" Namespace: "+ ns_index + " Name: "+ (name_index == -1 ? "-1" : stringPool[name_index]));
		
		if(name_index != -1){
			var node = new Node();
			node.name = stringPool[name_index];
			node.linenumber = lineNumber;
			node.namespacePrefix = stringPool[ns_prefix_index];
			node.namespaceURI = stringPool[ns_uri_index];
			
			if(listener != null)
				listener();
		}
	}
	
	/**
	 * End of Name space. Chunk structure same as Start of Name space
	 * 
	 * @param nsStartBuf
	 * @param header_size
	 * @param chunk_size
	 * @throws Exception
	 */
	function parseEndNameSpace( nsStartBuf, header_size, chunk_size) 
	{
		var IN = new InputStream(nsStartBuf);
		
		var int_buf = new Array(4);
		IN.read(int_buf);
		var lineNumber = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var comment = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var prefix_index = Utils.toInt(int_buf, false);
		
		IN.read(int_buf);
		var uri_index = Utils.toInt(int_buf, false);
		
		// console.log(tag, "[Namespace END]Line Number: "+ lineNumber + " Prefix: "+ prefix_index +" URI: "+ uri_index);
	}
	
	/**
	 * Parse resources.arsc (Resource Table).
	 * StringPool and Resource data collected from this File will be used for 
	 * Binary XML layout files.
	 * 
	 * ## Ref
	 * http://justanapplication.wordpress.com/category/android/android-resources/
	 * 
	 * @param arscFile
	 * @throws Exception
	 */
	function parseResourceTable(arscFile) {
		// 1. Parse Resource header
		// 2. Parse Resource string pool
		// 3. Parse Resource packages.
		
		// Clear
		stringPool=[];
		
		// console.log(tag, "[Res_Table] File: "+ arscFile);
	
		
		var IN = new InputStream(arscFile);
		
		// Is it an valid BXML ?
		/*
		 * Chunk header meta size - 8 bytes
		 * [Chunk Type] - 2 bytes
		 * [Chunk Header Size] - 2 bytes
		 * [Chunk Size] - 4 bytes
		 */
		
		// Chunk type- 2 bytes
		IN.read(buf_2);
		// console.log(tag, "[Res_Table] Chunk type: "+ Utils.toInt(buf_2, false));
		
		if(Utils.toInt(buf_2, false) != RES_TABLE_TYPE){
			// console.log(tag, "It's an invalid Resources.arsc file. Exiting!");
			return;
		}
		
		// Header size- 2 bytes
		IN.read(buf_2);
		header_size = Utils.toInt(buf_2, false);
		
		// Chunk size- 4 bytes
		IN.read(buf_4);
		chunk_size = Utils.toInt(buf_4, false);
		
		// Package count- 4 bytes
		IN.read(buf_4);
		package_count = Utils.toInt(buf_4, false);
		
		console.log("[Res_Table] Header Size: "+ header_size +" Chunk size: "+ chunk_size +" Package_count: "+ package_count);
		
		/*
		 * String Pool
		 */
		// Read next chunk- 2 bytes
		IN.read(buf_2);
		
		// console.log("[Res_Table] Chunk type: "+ Utils.toInt(buf_2, false) +" -->"+ buf_2[0] +" "+ buf_2[1]);
		
		if(Utils.toInt(buf_2, false) == RES_STRING_POOL_TYPE) // String Pool 
		{
			// String Pool/Tokens
			// console.log(tag, "String Pool...");
			IN.read(buf_2);
			header_size = Utils.toInt(buf_2, false);
						
			IN.read(buf_4);
			chunk_size = Utils.toInt(buf_4, false);
						
			// console.log(tag, "String Pool...Header Size: "+ header_size +" Chunk Size: "+ chunk_size);
						
			var spBuf = new Array(chunk_size - 8);
			IN.read(spBuf);
						
			// Parse String pool
			parseStringPool(spBuf, header_size, chunk_size);
						
			// Get the next Chunk
			IN.read(buf_2);
		}

        debugger;
		
		// TODO: Parse Resource package
		// console.log(tag, "[Res_Table] Chunk type: "+ Utils.toInt(buf_2, false));
		
		if(Utils.toInt(buf_2, false) == RES_TABLE_PACKAGE_TYPE) // RES_Table_Package
		{
			// Parse Resource package stream
			parseResPackage(IN);
		}
		
		// console.log(tag, "Resource.arsc parsing done!!");

        return stringPool;
	}
	
	/**
	 * Resource Package chunk contains-
	 * Package Header
	 * Type String Pool
	 * Key String pool
	 * Type1 typespec chunk
	 * Type1 type chunk
	 * ....
	 * ....
	 * TypeN type spec chunk
	 * TypeN type chunk
	 * 
	 * @param resPackageBuf
	 * @throws Exception
	 */
	function parseResPackage(IN) 
	{
		// Header size- 2 bytes
		IN.read(buf_2);
		header_size = Utils.toInt(buf_2, false);

		// Chunk size- 4 bytes
		IN.read(buf_4);
		chunk_size = Utils.toInt(buf_4, false);

		IN.read(buf_4);
		var packg_id = Utils.toInt(buf_4, false);

		// console.log(tag, "String Pool...Header Size: " + header_size + " Chunk Size: " + chunk_size + " Packg_ID: " + packg_id);

		// 128 Characters (16-bit Char)
		var packg_name_buf = new Array(256);
		IN.read(packg_name_buf);

		var packg_name = Utils.toString(packg_name_buf, false);
		// console.log(tag, "Package Name: " + new String(packg_name));

		// typeStrings- init32
		// Index/Offset position of Type String Pool
		IN.read(buf_4);
		var typeStrings = Utils.toInt(buf_4, false);

		// Last public type
		// Index (from end) or Count of Types defined IN Type String Pool (last lastPublicType entries)
		IN.read(buf_4);
		var lastPublicType = Utils.toInt(buf_4, false);

		// Key String
		// Index/Offset position of Key String Pool
		IN.read(buf_4);
		var keyString = Utils.toInt(buf_4, false);

		// Last index into Key string
		// Index (from end) or Count of Keys defined IN Key String Pool (last lastPublicKey entries)
		IN.read(buf_4);
		var lastPublicKey = Utils.toInt(buf_4, false);

		// console.log(tag, "[Res_Table] typeStrings=" + typeStrings + " lastPublicType=" + lastPublicType + " keyString=" + keyString + " lastPublicKey=" + lastPublicKey);
		
		// Parse "Type String Pool"
		IN.read(buf_2);
		if (Utils.toInt(buf_2, false) == RES_STRING_POOL_TYPE) 
		{
			// String Pool/Tokens
			// console.log(tag, "String Pool...");
			IN.read(buf_2);
			header_size = Utils.toInt(buf_2, false);

			IN.read(buf_4);
			chunk_size = Utils.toInt(buf_4, false);

			// console.log(tag, "String Pool...Header Size: " + header_size + " Chunk Size: " + chunk_size);

			var spBuf = new Array(chunk_size - 8);
			IN.read(spBuf);

			// Parse String pool
			parseStringPool(spBuf, header_size, chunk_size);

            console.log("stringPool1:", stringPool);

			// Get the next Chunk
			IN.read(buf_2);
		}
		
		// Parse "Key String Pool"
		if(Utils.toInt(buf_2, false) == RES_STRING_POOL_TYPE)
		{
			// String Pool/Tokens
			// console.log(tag, "String Pool...");
			IN.read(buf_2);
			header_size = Utils.toInt(buf_2, false);

			IN.read(buf_4);
			chunk_size = Utils.toInt(buf_4, false);

			// console.log(tag, "String Pool...Header Size: " + header_size + " Chunk Size: " + chunk_size);

			var spBuf = new Array(chunk_size - 8);
			IN.read(spBuf);

			// Parse String pool
			parseStringPool(spBuf, header_size, chunk_size);
            console.log("stringPool2:", stringPool);

			// Get the next Chunk
			IN.read(buf_2);
		}
		
		// TODO: Res_Type, Res_Type_Spec
	}
	
	/**
	 * ResTable_type
	 */
	function parseResType(){
		
	}
	
	/**
	 * ResTable_typeSpec
	 */
	function parseResTypeSpec(){
		
	}

    }

});

})();
