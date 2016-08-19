#include "js/gpu.js"

CLAZZ("projects.sprite.filters.Blur", {
    mode:"gaussian",
    amount:5,

    meta:{
        mode:{select:["gaussian", "box", "gaussian-gpu"]},
        amount:{int:{min:0, max:100}}
    },

    kernelA:null,
    kernelB:null,
    kernelW:0,
    kernelH:0,

    run:null,
    weights:null,
    buffer:null,
    activate:function(layer){
        this.buffer = new Uint8ClampedArray( layer.data.data );
        this.run = this[ this.mode ];
        if( this.mode == "gaussian" ){
            var w = [], amount=this.amount;
            for( var y=0; y<amount*2+1; ++y ){
                w[y]=[];
                for( var x=0; x<amount*2+1; ++x ){
                    w[y][x] = Math.max(0, 1-distance(x, y, amount, amount )/amount );
                }
            }
            this.weights = w;
        }

        if( this.mode == "gaussian-gpu" ){
            this.initGaussianGPUKernel( layer.data, this.amount );

        	var ret, tmp = [], array = layer.data.data, height = layer.data.height, width = layer.data.width;
        	var part = width * 4;
        	for(var i = 0; i < array.length; i += part)
        		tmp.push(Array.prototype.slice.call(array, i, i + part));

        	do{
        	    console.log("running");
            	ret = this.kernelA( tmp );
            	ret = this.kernelB( ret );
            	tmp = ret;
        	}while( this.repeat-- > 0 )

        	var acc = 0;
        	for( i=0; i<height; ++i ){
        	    for( var j=0; j<part; ++j )
        	        array[ acc++ ] = ret[i][j];
        	}
        }
        return true;
    },

    repeat:0,
    initGaussianGPUKernel:function( layerData, amount ){

        this.repeat = Math.floor((amount-1) / 32);
        if( amount > 32 ) amount = 32;

        var gpu = new GPU();
        this.kernelA = gpu.createKernel(function(src){
            var a = 0, samples = 0;

            for( var y=-this.constants.amount; y<this.constants.amount; y++ ){
                var w = 1-Math.abs(y)/this.constants.amount; // Math.abs( Math.cos(y/this.constants.amount*3.14159265*0.5) );
                a += src[this.thread.y + y][this.thread.x] * w;
                samples += w;
            }

            return a / samples;
        })
        .constants({amount:amount})
        .dimensions([ layerData.width * 4, layerData.height ])
        .outputToTexture(true)
        ;

        this.kernelB = gpu.createKernel(function(src){
            var a = 0, samples = 0;

            for( var x=-this.constants.amount; x<this.constants.amount; x++ ){
                var w = 1-Math.abs(x)/this.constants.amount; // Math.abs( Math.cos(x/this.constants.amount*3.14159265*0.5) );
                a += src[this.thread.y][this.thread.x + x*4] * w;
                samples += w;
            }

            return a / samples;
        })
        .constants({amount:amount})
        .dimensions([ layerData.width * 4, layerData.height ])
        ;
        this.kernelB.canvas = this.kernelA.canvas;
    },

    box:function( color, x, y, w, h ){
        var amount=this.amount, sy=y-amount, sx=x-amount, ey=y+amount, ex=x+amount;
        if(sy < 0) sy=0;
        if(sx < 0) sx=0;
        if(ey >= h ) ey=h-1;
        if(ex >= w ) ex=w-1;
        var acc = (ey-sy)*(ex-sx), r=0, g=0, b=0, a=0, buffer = this.buffer;

        for( y=sy; y<ey; y++ ){
            for( x=sx; x<ex; x++ ){
                i=(y*w+x)*4;
                r += buffer[i  ];
                g += buffer[i+1];
                b += buffer[i+2];
                a += buffer[i+3];
            }
        }
        color.r = Math.round(r/acc);
        color.g = Math.round(g/acc);
        color.b = Math.round(b/acc);
        color.a = Math.round(a/acc);
    },

    gaussian:function( color, x, y, w, h ){
        var amount=this.amount, sy=y-amount, sx=x-amount, ey=y+amount, ex=x+amount;
        var swx=0, wy=0, i;
        if(sy < 0){ wy=-sy; sy=0; }
        if(sx < 0){ swx=-sx; sx=0; }
        if(ey >= h ) ey=h-1;
        if(ex >= w ) ex=w-1;
        var acc = 0, r=0, g=0, b=0, a=0, buffer = this.buffer, weights=this.weights;

        for( y=sy; y<ey; y++, wy++ ){
            for( x=sx, wx=swx; x<ex; x++, wx++ ){
                i=(y*w+x)*4;
                var W = weights[wy][wx];
                acc += W;
                r += buffer[i  ] * W;
                g += buffer[i+1] * W;
                b += buffer[i+2] * W;
                a += buffer[i+3] * W;
            }
        }
        color.r = Math.round(r/acc);
        color.g = Math.round(g/acc);
        color.b = Math.round(b/acc);
        color.a = Math.round(a/acc);
    }
});
