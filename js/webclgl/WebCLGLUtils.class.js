/** 
* Utilities
* @class
* @constructor
*/
WebCLGLUtils = function() {
    "use strict";

    /** @private  */
    this.isPowerOfTwo = function(x) {
        return (x & (x - 1)) == 0;
    };
    /** @private  */
    this.nextHighestPowerOfTwo = function(x) {
        --x;
        for (var i = 1; i < 32; i <<= 1) {
            x = x | x >> i;
        }
        return x + 1;
    };

    /**
     * @private
     */
    this.loadQuad = function(node, length, height) {
        var l=(length==undefined)?0.5:length;
        var h=(height==undefined)?0.5:height;
        this.vertexArray = [-l, -h, 0.0,
            l, -h, 0.0,
            l,  h, 0.0,
            -l,  h, 0.0];

        this.textureArray = [0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 1.0, 0.0,
            0.0, 1.0, 0.0];

        this.indexArray = [0, 1, 2,      0, 2, 3];

        var meshObject = new Object;
        meshObject.vertexArray = this.vertexArray;
        meshObject.vertexItemSize = this.vertexItemSize;
        meshObject.vertexNumItems = this.vertexNumItems;

        meshObject.textureArray = this.textureArray;
        meshObject.textureItemSize = this.textureItemSize;
        meshObject.textureNumItems = this.textureNumItems;

        meshObject.indexArray = this.indexArray;
        meshObject.indexItemSize = this.indexItemSize;
        meshObject.indexNumItems = this.indexNumItems;

        return meshObject;
    };
    /** @private **/
    this.getWebGLContextFromCanvas = function(canvas, ctxOpt) {
        var gl;
        try {
            if(ctxOpt == undefined) gl = canvas.getContext("webgl2");
            else gl = canvas.getContext("webgl2", ctxOpt);

            console.log((gl == null)?"no webgl2":"using webgl2");
        } catch(e) {
            gl = null;
        }
        if(gl == null) {
            try {
                if(ctxOpt == undefined) gl = canvas.getContext("experimental-webgl2");
                else gl = canvas.getContext("experimental-webgl2", ctxOpt);

                console.log((gl == null)?"no experimental-webgl2":"using experimental-webgl2");
            } catch(e) {
                gl = null;
            }
        }
        if(gl == null) {
            try {
                if(ctxOpt == undefined) gl = canvas.getContext("webgl");
                else gl = canvas.getContext("webgl", ctxOpt);

                console.log((gl == null)?"no webgl":"using webgl");
            } catch(e) {
                gl = null;
            }
        }
        if(gl == null) {
            try {
                if(ctxOpt == undefined) gl = canvas.getContext("experimental-webgl");
                else gl = canvas.getContext("experimental-webgl", ctxOpt);

                console.log((gl == null)?"no experimental-webgl":"using experimental-webgl");
            } catch(e) {
                gl = null;
            }
        }
        if(gl == null) gl = false;
        return gl;
    };
    /**
     * @private
     */
    this.createShader = function(gl, name, sourceVertex, sourceFragment, shaderProgram) {
        var _sv = false, _sf = false;

        var makeDebug = (function(infoLog, shader) {
            console.log(infoLog);

            var arrErrors = [];
            var errors = infoLog.split("\n");
            for(var n = 0, f = errors.length; n < f; n++) {
                if(errors[n].match(/^ERROR/gim) != null) {
                    var expl = errors[n].split(':');
                    var line = parseInt(expl[2]);
                    arrErrors.push([line,errors[n]]);
                }
            }
            var sour = gl.getShaderSource(shader).split("\n");
            sour.unshift("");
            for(var n = 0, f = sour.length; n < f; n++) {
                var lineWithError = false;
                var errorStr = '';
                for(var e = 0, fe = arrErrors.length; e < fe; e++) {
                    if(n == arrErrors[e][0]) {
                        lineWithError = true;
                        errorStr = arrErrors[e][1];
                        break;
                    }
                }
                if(lineWithError == false) {
                    console.log("%c"+n+' %c'+sour[n], "color:black", "color:blue");
                } else {
                    console.log('%c►►%c'+n+' %c'+sour[n]+'\n%c'+errorStr, "color:red", "color:black", "color:blue", "color:red");
                }
            }
        }).bind(this);


        var shaderVertex = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shaderVertex, sourceVertex);
        gl.compileShader(shaderVertex);
        if (!gl.getShaderParameter(shaderVertex, gl.COMPILE_STATUS)) {
            alert(name+' ERROR (vertex program). See console.');

            var infoLog = gl.getShaderInfoLog(shaderVertex);
            console.log("%c"+name+' ERROR (vertex program)', "color:red");

            if(infoLog != undefined)
                makeDebug(infoLog, shaderVertex);
        } else  {
            gl.attachShader(shaderProgram, shaderVertex);
            _sv = true;
        }

        var shaderFragment = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shaderFragment, sourceFragment);
        gl.compileShader(shaderFragment);
        if (!gl.getShaderParameter(shaderFragment, gl.COMPILE_STATUS)) {
            alert(name+' ERROR (fragment program). See console.');

            var infoLog = gl.getShaderInfoLog(shaderFragment);
            console.log("%c"+name+' ERROR (fragment program)', "color:red");

            if(infoLog != undefined)
                makeDebug(infoLog, shaderFragment);
        } else {
            gl.attachShader(shaderProgram, shaderFragment);
            _sf = true;
        }

        if(_sv == true && _sf == true) {
            gl.linkProgram(shaderProgram);
            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Error in shader '+name);
                console.log('Error shader program '+name+':\n ');
                if(gl.getProgramInfoLog(shaderProgram) != undefined) {
                    console.log(gl.getProgramInfoLog(shaderProgram));
                }
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    };


    /**
     * Get Uint8Array from HTMLImageElement
     * @returns {Uint8Array}
     * @param {HTMLImageElement} imageElement
     */
    this.getUint8ArrayFromHTMLImageElement = function(imageElement) {
        var e = document.createElement('canvas');
        e.width = imageElement.width;
        e.height = imageElement.height;
        var ctx2D_tex = e.getContext("2d");
        ctx2D_tex.drawImage(imageElement, 0, 0);
        var arrayTex = ctx2D_tex.getImageData(0, 0, imageElement.width, imageElement.height);

        return arrayTex.data;
    };
    /**
     * Dot product vector4float
     * @private
     */
    this.dot4 = function(vector4A,vector4B) {
        return vector4A[0]*vector4B[0] + vector4A[1]*vector4B[1] + vector4A[2]*vector4B[2] + vector4A[3]*vector4B[3];
    };
    /**
     * Compute the fractional part of the argument. fract(pi)=0.14159265...
     * @private
     */
    this.fract = function(number) {
        return number - Math.floor(number);
    };
    /**
     * Pack 1float (0.0-1.0) to 4float rgba (0.0-1.0, 0.0-1.0, 0.0-1.0, 0.0-1.0)
     * @private
     */
    this.pack = function(v) {
        var bias = [1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0];

        var r = v;
        var g = this.fract(r * 255.0);
        var b = this.fract(g * 255.0);
        var a = this.fract(b * 255.0);
        var colour = [r, g, b, a];

        var dd = [colour[1]*bias[0],colour[2]*bias[1],colour[3]*bias[2],colour[3]*bias[3]];

        return [colour[0]-dd[0],colour[1]-dd[1],colour[2]-dd[2],colour[3]-dd[3] ];
    };
    /**
     * Unpack 4float rgba (0.0-1.0, 0.0-1.0, 0.0-1.0, 0.0-1.0) to 1float (0.0-1.0)
     * @private
     */
    this.unpack = function(colour) {
        var bitShifts = [1.0, 1.0/255.0, 1.0/(255.0*255.0), 1.0/(255.0*255.0*255.0)];
        return this.dot4(colour, bitShifts);
    };
    /**
     * Get pack GLSL function string
     * @returns {String}
     */
    this.packGLSLFunctionString = function() {
        return 'vec4 pack (float depth) {\n'+
            'const vec4 bias = vec4(1.0 / 255.0,\n'+
            '1.0 / 255.0,\n'+
            '1.0 / 255.0,\n'+
            '0.0);\n'+

            'float r = depth;\n'+
            'float g = fract(r * 255.0);\n'+
            'float b = fract(g * 255.0);\n'+
            'float a = fract(b * 255.0);\n'+
            'vec4 colour = vec4(r, g, b, a);\n'+

            'return colour - (colour.yzww * bias);\n'+
            '}\n';
    };
    /**
     * Get unpack GLSL function string
     * @returns {String}
     */
    this.unpackGLSLFunctionString = function() {
        return 'float unpack (vec4 colour) {\n'+
            'const vec4 bitShifts = vec4(1.0,\n'+
            '1.0 / 255.0,\n'+
            '1.0 / (255.0 * 255.0),\n'+
            '1.0 / (255.0 * 255.0 * 255.0));\n'+
            'return dot(colour, bitShifts);\n'+
            '}\n';
    };




    /**
     * getOutputBuffers
     * @param {WebCLGLKernel|WebCLGLVertexFragmentProgram} prog
     * @param {Array<WebCLGLBuffer>} buffers
     * @returns {Array<WebCLGLBuffer>}
     */
    this.getOutputBuffers = function(prog, buffers) {
        var outputBuff = null;
        if(prog.output != undefined) {
            outputBuff = [];
            if(prog.output[0] != null) {
                for(var n=0; n < prog.output.length; n++) {
                    //if(buffers.hasOwnProperty(prog.output[n]) == false && _alerted == false)
                    //    _alerted = true, alert("output argument "+prog.output[n]+" not found in buffers. add desired argument as shared");

                    outputBuff[n] = buffers[prog.output[n]];
                }
            } else
                outputBuff = null;
        }
        return outputBuff;
    };



    /**
     * updateFB
     */
    this.createFBs = function(gl, extDB, maxDrawBuffers, pgr, buffers, width, height) {
        var createWebGLFrameBuffer = (function(webCLGLBuffers, gl, extDB, pgr, width, height) {
            var fBuffer = gl.createFramebuffer();

            if(webCLGLBuffers[0] != null) {
                for(var n=0; n < webCLGLBuffers.length; n++) {
                    var rBuffer = gl.createRenderbuffer();
                    gl.bindRenderbuffer(gl.RENDERBUFFER, rBuffer);
                    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, width, height);
                    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                    gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);
                    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, extDB['COLOR_ATTACHMENT'+n+'_WEBGL'], gl.RENDERBUFFER, rBuffer);
                }
            } else
                pgr.fBufferCount = 0;

            return fBuffer;
        }).bind(this);

        var updateFBnow = (function(webCLGLBuffers, t, fBuffer, gl, extDB, maxDrawBuffers) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fBuffer);

            if(webCLGLBuffers[0] != null) {
                var arrDBuff = [];
                for(var n= 0, fn=webCLGLBuffers.length; n < fn; n++) {
                    var o = (t == true) ? webCLGLBuffers[n].textureDataTemp : webCLGLBuffers[n].textureData;
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, extDB['COLOR_ATTACHMENT'+n+'_WEBGL'], gl.TEXTURE_2D, o, 0);
                    arrDBuff[n] = extDB['COLOR_ATTACHMENT'+n+'_WEBGL']; //gl_FragData[n]
                }
                extDB.drawBuffersWEBGL(arrDBuff);
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }).bind(this);


        var WH = width*height;
        var outputsCount = pgr.output.length;

        if(pgr.fBufferCount != outputsCount || pgr.fBufferLength != WH) {
            pgr.fBufferCount = outputsCount;
            pgr.fBufferLength = WH;

            var webCLGLBuffers = this.getOutputBuffers(pgr, buffers);

            var fBuffer = createWebGLFrameBuffer(webCLGLBuffers, gl, extDB, pgr, width, height);
            if(pgr.fBufferCount > 0) {
                if(webCLGLBuffers.length > maxDrawBuffers)
                    console.log("Exceded maxDrawBuffers of "+maxDrawBuffers);

                var fBufferTemp = createWebGLFrameBuffer(webCLGLBuffers, gl, extDB, pgr, width, height);
                pgr.fBuffer = fBuffer;
                pgr.fBufferTemp = fBufferTemp;

                updateFBnow(webCLGLBuffers, false, pgr.fBuffer, gl, extDB, maxDrawBuffers);
                updateFBnow(webCLGLBuffers, true, pgr.fBufferTemp, gl, extDB, maxDrawBuffers);
            }
        }
    };

    /**
     * checkUpdateFBs
     */
    this.checkUpdateFBs = function(gl, glDrawBuff_ext, maxDrawBuffers, pgr, argument, data, buffers) {
        if(buffers != undefined) {
            if(pgr.output != undefined && pgr.output.indexOf(argument) > -1)
                this.createFBs(gl, glDrawBuff_ext, maxDrawBuffers, pgr, buffers, data.W, data.H);
        }
    };




    /**
     * parseSource
     * @param {String} source
     * @param {Object} values
     * @returns {String}
     */
    this.parseSource = function(source, values) {
        //console.log(source);
        for(var key in values) { // for each in_vertex_values (in argument)
            var regexp = new RegExp(key+"\\[.*?\\]","gm");
            var varMatches = source.match(regexp);// "Search current "argName" in source and store in array varMatches
            //console.log(varMatches);
            if(varMatches != null) {
                for(var nB = 0, fB = varMatches.length; nB < fB; nB++) { // for each varMatches ("A[x]", "A[x]")
                    var regexpNativeGL = new RegExp('```(\s|\t)*gl.*'+varMatches[nB]+'.*```[^```(\s|\t)*gl]',"gm");
                    var regexpNativeGLMatches = source.match(regexpNativeGL);
                    if(regexpNativeGLMatches == null) {
                        var name = varMatches[nB].split('[')[0];
                        var vari = varMatches[nB].split('[')[1].split(']')[0];

                        var map = { 'float4_fromSampler': source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+')'),
                            'float_fromSampler': source.replace(name+"["+vari+"]", 'texture2D('+name+','+vari+').x'),
                            'float4_fromAttr': source.replace(name+"["+vari+"]", name),
                            'float_fromAttr': source.replace(name+"["+vari+"]", name)};
                        source = map[values[key].type];
                    }
                }
            }
        }
        source = source.replace(/```(\s|\t)*gl/gi, "").replace(/```/gi, "").replace(/;/gi, ";\n").replace(/}/gi, "}\n").replace(/{/gi, "{\n");
        //console.log('%c translated source:'+source, "background-color:#000;color:#FFF");
        return source;
    };


    /**
     * lines_vertex_attrs
     * @param {Object} values
     */
    this.lines_vertex_attrs = function(values) {
        var str = '';
        for(var key in values) {
            str += {'float4_fromSampler': 'uniform sampler2D '+key+';',
                    'float_fromSampler': 'uniform sampler2D '+key+';',
                    'float4_fromAttr': 'attribute vec4 '+key+';',
                    'float_fromAttr': 'attribute float '+key+';',
                    'float': 'uniform float '+key+';',
                    'float4': 'uniform vec4 '+key+';',
                    'mat4': 'uniform mat4 '+key+';'}[values[key].type]+'\n';
        }
        return str;
    };
    /**
     * lines_fragment_attrs
     * @param {Object} values
     */
    this.lines_fragment_attrs = function(values) {
        var str = '';
        for(var key in values) {
            str += {'float4_fromSampler': 'uniform sampler2D '+key+';',
                    'float_fromSampler': 'uniform sampler2D '+key+';',
                    'float': 'uniform float '+key+';',
                    'float4': 'uniform vec4 '+key+';',
                    'mat4': 'uniform mat4 '+key+';'}[values[key].type]+'\n';
        }
        return str;
    };


    /**
     * lines_drawBuffersInit
     * @param {Int} maxDrawBuffers
     */
    this.lines_drawBuffersInit = function(maxDrawBuffers) {
        var str = '';
        for(var n= 0, fn=maxDrawBuffers; n < fn; n++) {
            str += ''+
            'float out'+n+'_float = -999.99989;\n'+
            'vec4 out'+n+'_float4;\n';
        }
        return str;
    };
    /**
     * lines_drawBuffersWrite
     * @param {Int} maxDrawBuffers
     */
    this.lines_drawBuffersWrite = function(maxDrawBuffers) {
        var str = '';
        for(var n= 0, fn=maxDrawBuffers; n < fn; n++) {
            str += ''+
            'if(out'+n+'_float != -999.99989) gl_FragData['+n+'] = vec4(out'+n+'_float,0.0,0.0,1.0);\n'+
            ' else gl_FragData['+n+'] = out'+n+'_float4;\n';
        }
        return str;
    };


    /**
     * checkArgNameInitialization
     * @param {Object} inValues
     * @param {String} argName
     * @private
     */
    this.checkArgNameInitialization = function(inValues, argName) {
        if(inValues.hasOwnProperty(argName) == false) {
            var inValue = { "type": null, //
                "expectedMode": null, // "ATTRIBUTE", "SAMPLER", "UNIFORM"
                "value": null, // Float|Int|Array<Float4>|Array<Mat4>|WebCLGLBuffer
                "location": null};
            inValues[argName] = inValue;
        }
    };


    /**
     * get_global_id3_GLSLFunctionString
     */
    this.get_global_id3_GLSLFunctionString = function() {
        return ''+
        'vec2 get_global_id(float id, float bufferWidth, float geometryLength) {\n'+
            'float num = (id*geometryLength);'+
            'float column = mod(num,bufferWidth);'+
            'float row = num/bufferWidth;'+

            'float ts = 1.0/bufferWidth;'+

            'return vec2(column*ts, row*ts);'+
        '}\n';
    };
    /**
     * get_global_id2_GLSLFunctionString
     */
    this.get_global_id2_GLSLFunctionString = function() {
        return ''+
        'vec2 get_global_id(vec2 id, float bufferWidth) {\n'+
            'float column = id.x;'+
            'float row = id.y;'+

            'float ts = 1.0/bufferWidth;'+

            'return vec2(column*ts, row*ts);'+
        '}\n';
    };
};