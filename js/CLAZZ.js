
var CLAZZ, SUPER, slice = Array.prototype.slice;
(function(){
    var nextUID=1, unserializing = false;
    CLAZZ = function( name, clazz ){
    	"use strict";
    	if( typeof name == "object" )
    	{
    		clazz = name;
    		name = null;
    	}

    	if( !clazz ) return null;
    	var ctor = clazz["CONSTRUCTOR"], desc = {
    	    __uid : {
				value:0,
				enumerable: false,
				writable: false
			}
    	};
    	var injects = {}, provides = {};
    	var metas = {}, methods = {}, props = {}, opFunc = null;

        var ret = function(){
			if( opFunc && typeof this !== "function" ){
				var fwd = function(){ return opFunc.apply(fwd, slice.call(arguments, 0)); };
				ret.apply(fwd, slice.call(arguments,0));
				return fwd;
			}

            if( this == self )
                return new (ret.bind.apply(ret, [null].concat( slice.call(arguments, 0) )));

/* INJECTION */
            if( nextInstanceName && nextInstanceClazz === ret ){
                ret.singletons[nextInstanceName] = this;
                nextInstanceName = null;
                nextInstanceClazz = null;
            }
/* */
    		var isLast = !this.__uid;
    		if( isLast )
    		{
    		    desc.__uid.value = nextUID++;
    			Object.defineProperties(this, desc);
/* INJECTION */
				if( !unserializing )
	    			doInjections(this, injects, name);
/* */
    		}

    		if( ctor )
    		{
    			var superBackup = SUPER;
    			SUPER = (ctor.SUPER && ctor.SUPER.bind(this));
				if( !unserializing ) ctor.apply( this, slice.call(arguments, 0) );
				else if(SUPER) ctor.SUPER.call(this);
    			SUPER = superBackup;
    		}

    		/* */
    		if( isLast && !clazz.DYNAMIC )
    			Object.seal(this);
    		/* */
    	};

    	ret.properties = props;
    	ret.methods = methods;
    	ret.descriptor = desc;

    	/* FUNCTION SUPER */

    	function getWrapper( func ){
    		return function(){
    			var superBackup = (self||{}).SUPER;
    			var s = func.SUPER;
    			if( s.SUPER ) s = getWrapper(s);
    			SUPER = s.bind(this);
    			var ret = func.apply( this, slice.call(arguments, 0) );
    			SUPER = superBackup;
    			return ret;
    		};
    	}
    	/* */

    	function addMerge(dest, src){
    	    for( var sk in src )
    	        if( !(sk in dest) )
    	            dest[sk] = src[sk];
    	}

    	var cclazz = clazz, sk;
    	while( cclazz ){
    		var base = cclazz["EXTENDS"];
    		if( typeof base == "string" ) base = resolve(base);

    		for( var k in cclazz )
    		{
    			if(
    				k == "EXTENDS" ||
    				k == "ENUMERABLE" ||
    				k in desc
    			) continue;

    			var v = cclazz[k];
			    /* INJECTION */
    			if( k == "INJECT" ){
    			    if( Array.isArray(v) ){
        			    for( sk=0; sk<v.length; ++sk ){
        					if( !(v[sk] in injects) )
            			        injects[v[sk]] = v[sk]
        			    }
    			    }else addMerge(injects, v);
    				continue;
    			}
    			if( k == "PROVIDES" ){
    			    addMerge(provides, v);
    				continue;
    			}
			    /* */
    			if( k == "MIXIN" ){
    			    for( sk=0; sk<v.length; ++sk ){
    			        var mix = v[sk];
    			        if( typeof mix == "string" ) mix = resolve(v[sk]);
    			        if(mix.descriptor)
    			            addMerge(desc, mix.descriptor);
    			    }
    			    continue;
    			}
    			if( k == "STATIC" ){
    			    addMerge(ret, v);
    				continue;
    			}

    			var obj = {};
    			if( typeof v == "function" )
    			{
					if( k == "CONSTRUCTOR" )
					{
						v.SUPER = cclazz["EXTENDS"];
						if( typeof v.SUPER == "string" )
							v.SUPER = resolve( v.SUPER );
						continue;
				    }
					if( k == "FUNCTION" ){
						opFunc = v;
						continue;
					}
				    /* FUNCTION SUPER */
    				if( cclazz["EXTENDS"] )
    				{
						var cbase = base;
						while( cbase && cbase.CLAZZ && !cbase.CLAZZ[k] )
						{
							cbase = cbase.CLAZZ["EXTENDS"];
							if( typeof cbase == "string" )
								cbase = resolve(cbase);
						}

						if( cbase && cbase.CLAZZ && cbase.CLAZZ[k] ){
							v.SUPER = cbase.CLAZZ[k];
							v = getWrapper(v);
						}
    				}
    				/* */

    				obj.writable = clazz["DYNAMIC"] == true;
    				methods[k] = v;
    			}
    			/* META */else if( k.charAt(0) == "@" )
    			{
    				metas[k.substr(1, k.length)] = v;
    				continue;
    			} /* */
    			else
    			{
					obj.writable = true;
					props[k] = v;
    			}
				obj.value = v;
    			desc[k] = obj;
    		}

    		/* ENUMERABLE */
    		if( cclazz["ENUMERABLE"] ){
    			for( var i=0, k; k=cclazz["ENUMERABLE"][i]; ++i )
    				desc[k].enumerable = true;
    		}
    		/* */

    		cclazz = base && base.CLAZZ;
    	}

        /* META, INJECTION, NON-CLOSURE */
    	ret.meta = metas;
    	Object.seal(metas);

        ret.instance = null;
    	ret.fullName = name;
    	if( !name ) name = "$Anon" + (nextUID++);
        ret.toString = function(){ return "[CLAZZ " + name + "]"; };
    	ret.NAME = name.split(".").pop();
    	/* */
    	ret.CLAZZ = clazz;

    	if( clazz["EXTENDS"] )
    	{
    		base = clazz["EXTENDS"];
    		if( typeof base == "string" ) base = resolve(base);
    		if( !base ){
    			console.warn(name, " could not inherit from ", clazz["EXTENDS"] );
    		}
    		ret.prototype = Object.create(base.prototype);
    		ctor = clazz["CONSTRUCTOR"] || base;
    		Object.defineProperty(ret.prototype, "constructor", {
    			value: ret
    		});
    	}

    	setupProvides(ret, provides);


    	return ret;
    }

    /* NO INJECTION * /

    function setupProvides(ret, provides){}

    /*/ // INJECTION
    var dibindings = [{}], nextInstanceName, nextInstanceClazz;

    function resolve( strpath, write, ctx ){
        var path = strpath.split(".");
        var i = 0;
        if( !ctx || path[0] != "this" ) ctx = self;
        if( path[0] == "this" ) i++;

        if( write === undefined ){
            for( ; ctx && i<path.length; ++i )
    			ctx=ctx[path[i]];
            return ctx;
        }else{
            for( ; i<path.length-1; ++i )
    			ctx=ctx[path[i]] || (ctx[path[i]] = {});
            ctx[path[i]] = write;
        }
    }

    function doInjections(obj, injects, name){
    	try{
            for( var k in injects )
                obj[k] = CLAZZ.get( injects[k], null, obj, obj[k] );
    	}catch(ex){
    	    if( ex instanceof BindingError )
    	        throw new BindingError(ex.message + " instancing clazz " + name);
    	    throw(ex);
		}
    }

    function setupProvides(ret, provides){
    	var bindctx = dibindings[dibindings.length-1], name = ret.fullName;

    	ret.NEW = function(){
    		var args = slice.call(arguments);
    		args.unshift(null);
    		return new (ret.bind.apply(ret, args));
    	};

    	for( var k in provides ){
    		if( !bindctx[k] || provides[k] == "multi" ){
                CLAZZ[ provides[k] ]( k, ret );
                resolve(k, CLAZZ.get.bind(CLAZZ, k));
            }
    	}

    	if( name ){
    		resolve(name, ret);
    		if( !bindctx[name] ) CLAZZ.implements( name, ret );
    	}
    }

    function Injection(resolve, name, context){
        this.resolve = resolve || name == "this";
    	this.name = name;
    	this.context = context;
    }

    CLAZZ.makeInjection = function( resolve, name, context ){
    	return new Injection(resolve, name, context);
    };

    self.INJECT = CLAZZ.makeInjection.bind(null, false);
    self.RESOLVE = CLAZZ.makeInjection.bind(null, true);

    CLAZZ.withContext = function( context, cb, THIS ){
    	var ret;

    	if( context ){
    		dibindings.push({});
    		for( var k in context ){
    			var v = context[k];
    			if( v && v instanceof Injection ){
    			    if( v.debugger ) debugger;
    				if( v.resolve ) CLAZZ.set(k, resolve(v.name, undefined, THIS));
    				else CLAZZ.set( k, CLAZZ.get(v) );
    			}else CLAZZ.set(k, v);
    		}

    		ret = cb();

    		if( dibindings.length == 1 ) throw "Can't pop last context.";
    		dibindings.pop();
    	}else ret = cb();

    	return ret;
    };

    CLAZZ.factory = function( name, clazz ){
    	if( typeof clazz == "string" ) clazz = resolve(clazz);
    	dibindings[dibindings.length-1][ name ] = () => (
    		(context) => CLAZZ.withContext( context, () => new clazz(), self )
    	);
    	return CLAZZ.factory;
    };

    CLAZZ.singleton = function( name, clazz ){
    	if( typeof clazz == "string" ) clazz = resolve(clazz);
        if( !clazz.singletons ) clazz.singletons = {};

        dibindings[dibindings.length-1][ name ] = () => {
            var inst = clazz.singletons[name];
            if( inst ) return inst;
            nextInstanceName = name;
            nextInstanceClazz = clazz;
            return clazz.singletons[name] = new clazz();
        };

    	return CLAZZ.singleton;
    };

    CLAZZ.implements = function( name, clazz ){
    	if( typeof clazz == "string" ) clazz = resolve(clazz);
    	dibindings[dibindings.length-1][ name ] = () => new clazz();
    	return CLAZZ.implements;
    };

    CLAZZ.set = function( name, value ){
    	dibindings[dibindings.length-1][ name ] = () => value;
    	return CLAZZ.set;
    };

	CLAZZ.multi = function( name, clazz ){
		var value = dibindings[dibindings.length-1][ name ];
		if( !value ){
			value = dibindings[dibindings.length-1][ name ] = ret;
			value.multi = [];
		}

		value.multi.push(clazz);

		return CLAZZ.multi;

		function ret(){ return ret.multi; }
	};

    function BindingError(msg){
        Error.call(this, msg);
        this.message = msg;
    }

    BindingError.prototype = Object.create(Error.prototype);

    CLAZZ.get = function( m, context, THIS, def ){
    	var name;
    	if( typeof m == "string" ) name = m;
    	else if( m instanceof Injection ){
    		name = m.name;
    		context = m.context;
    		if( context && context.debugger ) debugger;
    		if( m.resolve ){
    		    var value = resolve(name, undefined, THIS);
    		    if( value === undefined ){
    		        if( def === undefined ) throw("Resolve not found: " + name);
    		        return def;
    		    }
    		    return value;
    		}
    	}

    	var bind, ctxId = dibindings.length-1;
    	do{
    		bind = dibindings[ctxId][name];
    	}while( !bind && --ctxId>-1 );

    	if( !bind ){
    		if( def === undefined )
    			throw new BindingError("Binding not found: " + name);
    		else return def;
    	}

    	return CLAZZ.withContext(context, bind, THIS);
    };

    /* */

	CLAZZ.serialize = function( value, out ){
		var final = !out;
		if( final ) out = [null, {}, {nid:0, nest:0}];

		var keymap = out[2];
		var valuemap = out[1];
		
		keymap.nest++;
		out[0] = S(value);
		
		if( final ){
			out.pop();
			return valuemap;
		}

		return out[0];

		function S( v ){
			var id = v;
			var typeofv = typeof v;
			if( v === null ) typeofv = "null";
			if( typeofv == "object" ){
				if( v.constructor.CLAZZ ){
					if( CLAZZ.serialize.encoder[v.constructor.fullName] )
						typeofv = v.constructor.fullName;
					else
						typeofv = "ci";
				}else{
					typeofv = v.constructor.name;
					if( !v.__uid )
						Object.defineProperty(v, "__uid", {value:CLAZZ.getUID()} );
				}
				id = v.__uid;
			}

			if( !(id in keymap) )
				keymap[id] = [];
			
			var keyset = keymap[id];
			for( var i=0; i<keyset.length; ++i ){
				if( keyset[i].value == v )
					return keyset[i].id;
			}

			var desc = {
				id:++keymap.nid,
				value:v,
				encoder:typeofv
			};

			keyset[keyset.length] = desc;

			var encoder = CLAZZ.serialize.encoder[ typeofv ];
			if( !encoder ) throw new Error("Can't encode " + typeofv + " " + v);

			var call = valuemap[ desc.id ] = [ typeofv, 0 ];
			call[ 1 ] = encoder(v, call, out);

			return desc.id;
		}
	};

	CLAZZ.serialize.encoder = {
		number:function(value, desc, out){ return value; },
		Float32Array:function(value, desc, out){ return value; },
		SharedArrayBuffer:function(value, desc, out){ return value; },
		boolean:function(value, desc, out){ return value; },
		string:function(value, desc, out){ return value; },
		"null":function(value, desc, out){ return value; },
		"undefined":function(value, desc, out){ return value; },

		"function":function(value, desc, out){ return value.toString() },

		Object:function(value, desc, out){
			var flat = {};
			var pn = Object.getOwnPropertyNames(value);
			for( var i=0, l=pn.length; i<l; ++i ){
				flat[pn[i]] = CLAZZ.serialize( value[pn[i]], out );
			}
			return flat;
		},

		ci:function(value, desc, out){
			desc.push(value.constructor.fullName);
			var flat = {};
			var meta = value.constructor.meta;
			for( var k in value.constructor.properties ){
				if( meta[k] && !meta[k].serialize ) continue;
				flat[k] = CLAZZ.serialize( value[k], out );
			}
			return flat;
		},

		Array:function(value, desc, out){
			var flat = [];
			for( var i=0, l=value.length; i<l; ++i ){
				flat[i] = CLAZZ.serialize( value[i], out );
			}
			return flat;
		}
	};

	CLAZZ.unserialize = function( inp, key ){
		var end = key == undefined;
		if( end ){
			inp = [1, inp];
			key = 1;
			unserializing = true;
		}

		var ret;
		try{
			ret = D( inp[1][key], inp );
		}catch(ex){
			throw ex;
		}finally{
			if( end )
				unserializing = false;
		}

		return ret;

		function D( src, inp ){
			var k = src[0];
			src[0] = inp;
			var dec = CLAZZ.unserialize.decoder[ k ];
			if( !dec ) throw ("No decoder for " + k);
			var ret = dec.apply( src[1], src );
			src[0] = k;
			return ret;
		}
	};

	CLAZZ.unserialize.decoder = {
		number:function(inp, value){ return value; },
		Float32Array:function(inp, value){ 
			if( value instanceof Float32Array ) return value; 
			return Float32Array.from(value); 
		},
		SharedArrayBuffer:function(inp, value){ return value; },
		boolean:function(inp, value){ return value; },
		string:function(inp, value){ return value; },
		"null":function(inp){ return null; },
		"undefined":function(){ return undefined; },
		"function":function(inp, value){ return eval("(" + value + ")"); },
		ci:function( inp, value, clazz ){
			value = CLAZZ.get(clazz);
			for( var k in this ) value[k] = CLAZZ.unserialize( inp, this[k] );
			return value;
		},
		Array:function( inp ){
			var out = [];
			for( var i=0, l=this.length; i<l; ++i ) out[i] = CLAZZ.unserialize( inp, this[i] );
			return out;
		},
		Object:function( inp ){
			var value = {};
			for( var k in this ) value[k] = CLAZZ.unserialize( inp, this[k] );
			return value;
		}
	};

    CLAZZ.getUID = function(){ return nextUID++; };

})();
