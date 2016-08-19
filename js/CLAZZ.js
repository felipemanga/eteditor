(function(){

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

    var dibindings = [{}], nextUID=1, nextInstanceName, nextInstanceClazz;

    var CLAZZ = self.CLAZZ = function CLAZZ( name, clazz ){
    	"use strict";
    	if( typeof name == "object" )
    	{
    		clazz = name;
    		name = null;
    	}

    	if( !clazz ) return null;
    	var desc = {};
    	var injects = {}, provides = {};
    	var metas = {};
    	var methods = {};
    	var props = {};

        var ret = function(){
            if( this == self )
                return new (ret.bind.apply(ret, [null].concat( Array.prototype.slice.call(arguments) )));

            if( nextInstanceName && nextInstanceClazz === ret ){
                ret.singletons[nextInstanceName] = this;
                nextInstanceName = null;
                nextInstanceClazz = null;
            }

    		var isLast = !this.hasOwnProperty('__uid');
    		if( isLast )
    		{
    			Object.defineProperties(this, {
    			'__uid':{
    				value:nextUID++,
    				enumerable: false,
    				writable: false
    			}});
    			Object.defineProperties(this, desc);

    			try{
                    for( var k in injects )
                        this[k] = CLAZZ.get( injects[k], null, this, this[k] );
    			}catch(ex){
    			    if( ex instanceof BindingError )
    			        throw new BindingError(ex.message + " instancing clazz " + name);
    			    throw(ex);
    			}
    		}

    		if( clazz.CONSTRUCTOR )
    		{
    			var superBackup = self.SUPER;
    			if( clazz.CONSTRUCTOR.SUPER ) self.SUPER = clazz.CONSTRUCTOR.SUPER.bind(this);
                else self.SUPER = null;
    			clazz.CONSTRUCTOR.apply( this, Array.prototype.slice.call(arguments, 0) );
    			window.SUPER = superBackup;
    		}

    		if( isLast && !clazz.DYNAMIC )
    			Object.seal(this);
    	};

        var statics = ret;
    	statics.properties = props;
    	statics.methods = methods;

    	function getWrapper( func ){
    		return function(){
    			var superBackup = (self||{}).SUPER;
    			var s = func.SUPER;
    			if( s.SUPER ) s = getWrapper(s);
    			SUPER = s.bind(this);
    			var ret = func.apply( this, Array.prototype.slice.call(arguments, 0) );
    			SUPER = superBackup;
    			return ret;
    		};
    	}

    	var cclazz = clazz, sk;
    	while( cclazz ){
    		var base = cclazz.EXTENDS;
    		if( typeof base == "string" ) base = resolve(base);

    		for( var k in cclazz )
    		{
    			if(
    				k == "ABSTRACT" ||
    				k == "EXTENDS" ||
    				k == "ENUMERABLE" ||
    				k in desc
    			) continue;

    			var v = cclazz[k];
    			if( k == "INJECT" ){
    				for( sk in v )
    				{
    					if( !(sk in injects) )
    						injects[sk] = v[sk];
    				}
    				continue;
    			}
    			if( k == "PROVIDES" ){
    				for( sk in v )
    				{
    					if( !(sk in provides) )
    						provides[sk] = v[sk];
    				}
    				continue;
    			}
    			if( k == "STATIC" ){
    				for( sk in v )
    				{
    					if( !(sk in statics) )
    						statics[sk] = v[sk];
    				}
    				continue;
    			}
    			var obj = {configurable:false};
    			if( typeof v == "function" )
    			{
    				if( cclazz.EXTENDS )
    				{
    					if( k == "CONSTRUCTOR" )
    					{
    						v.SUPER = cclazz.EXTENDS;
    						if( typeof v.SUPER == "string" )
    							v.SUPER = resolve( v.SUPER );
    						continue;
    					}
    					else
    					{
    						var cbase = base;
    						while( cbase && cbase.CLAZZ && !cbase.CLAZZ[k] )
    						{
    							cbase = cbase.CLAZZ.EXTENDS;
    							if( typeof cbase == "string" )
    								cbase = resolve(cbase);
    						}

    						if( cbase && cbase.CLAZZ && cbase.CLAZZ[k] )
    							v.SUPER = cbase.CLAZZ[k];
    					}
    				}else if( k == "CONSTRUCTOR" ) continue;

    				if( v.SUPER )
    					v = getWrapper(v);
    				obj.value = v;
    				obj.enumerable = false;
    				obj.writable = clazz.DYNAMIC == true;
    				methods[k] = v;
    			}
    			else if( k.charAt(0) == "@" )
    			{
    				metas[k.substr(1, k.length)] = v;
    				continue;
    			}
    			else
    			{
    				var setter = cclazz["set_" + k];
    				var getter = cclazz["get_" + k];

    				(function(k){
    					props[k] = v;
    					if( typeof setter == "function" )
    					{
    						if( !getter )
    							obj.get = function(){ return props[k]; };

    						obj.set = function(val){
    							val = setter.call(this, val);
    							props[k] = val;
    							return val;
    						};
    					}
    					if( typeof getter == "function" )
    					{
    						obj.get = function(){
    							return getter.call(this, props[k]);
    						};
    					}
    				})(k);

    				if( !getter && !setter ){
    					obj.value = v;
    					obj.enumerable = false;
    					obj.configurable = false;
    					obj.writable = true;
    				}
    			}
    			desc[k] = obj;
    		}

    		if( cclazz.ENUMERABLE ){
    			for( var i=0, k; k=cclazz.ENUMERABLE[i]; ++i )
    				desc[k].enumerable = true;
    		}

    		cclazz = base && base.CLAZZ;
    	}

    	ret.meta = metas;
    	Object.seal(metas);

        ret.instance = null;
    	ret.fullName = name;
    	if( !name ) name = "$Anon" + (nextUID++);
    	var shortName = name.split(".").pop();
        ret.toString = function(){ return "[CLAZZ " + name + "]"; };
    	ret.NAME = shortName;
    	ret.CLAZZ = clazz;
    	ret.NEW = function(){
    		var args = Array.prototype.slice.call(arguments);
    		args.unshift(null);
    		return new (ret.bind.apply(ret, args));
    	};

    	if( clazz.EXTENDS )
    	{
    		var base = clazz.EXTENDS;
    		if( typeof base == "string" ) base = resolve(base);
    		if( !base ){
    			console.warn(name, " could not inherit from ", clazz.EXTENDS );
    		}
    		ret.prototype = Object.create(base.prototype);
    		clazz.CONSTRUCTOR = clazz.CONSTRUCTOR || base;
    		Object.defineProperty(ret.prototype, "constructor", {
    			value: ret,
    			enumerable: false,
    			writable: false
    		});
    	}

    	var bindctx = dibindings[dibindings.length-1];

    	for( var k in provides ){
    		if( !bindctx[k] )
    			CLAZZ[ provides[k] ]( k, ret );
    	}

    	if( name ){
    		resolve(name, ret);
    		if( !bindctx[name] ) CLAZZ.implements( name, ret );
    	}

    	return ret;
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

    CLAZZ.getUID = function(){ return nextUID++; };

})();
