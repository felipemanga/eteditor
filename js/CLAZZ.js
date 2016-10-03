var CLAZZ, SUPER, slice = Array.prototype.slice;
(function(){
    var nextUID=1;
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
    	var metas = {};
    	var methods = {};
    	var props = {};

        var ret = function(){
/* INJECTION */
            if( this == self )
                return new (ret.bind.apply(ret, [null].concat( slice.call(arguments) )));

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
    			doInjections(this, injects, name);
/* */
    		}

    		if( ctor )
    		{
    			var superBackup = SUPER;
    			SUPER = (ctor.SUPER && ctor.SUPER.bind(this));
    			ctor.apply( this, slice.call(arguments, 0) );
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
    			/* META * /else if( k.charAt(0) == "@" )
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
    		if( !bindctx[k] ){
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

    CLAZZ.getUID = function(){ return nextUID++; };

})();
