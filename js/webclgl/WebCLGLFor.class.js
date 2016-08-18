/**
 * gpufor
 * @class
 * @constructor
 */
var gpufor = function() {
    var _webCLGL;
    var _clglWork;
    var _args;

    /** @private  */
    var ini = (function() {
        var arguments = arguments[0];
        var args;
        var idx;
        var typOut;
        var code;
        if(arguments.length > 3) {
            args = arguments[0];
            idx = arguments[1];
            typOut = arguments[2];
            code = arguments[3];
        } else {
            args = arguments[0];
            idx = arguments[1];
            typOut = "FLOAT";
            code = arguments[2];
        }

        var strArgs = "", sep="";
        for(var key in args)
            strArgs += sep+key, sep=",";

        var ksrc =   'void main('+strArgs+') {'+
                'vec2 '+idx+' = get_global_id();'+
                code.replace("return", ((typOut=="FLOAT")?"out0_float":"out0_float4")+" = ")+
            '}';
        var kernel = _webCLGL.createKernel();
        kernel.setKernelSource(ksrc);
        _clglWork.addKernel(kernel, ["result"]);


        var buffLength = 0;
        for(var key in args) {
            var argVal = args[key];

            _clglWork.setArg(key.split(" ")[1], argVal);

            if(buffLength == 0 &&
                (argVal instanceof Array || argVal instanceof Float32Array || argVal instanceof Uint8Array || argVal instanceof HTMLImageElement))
                buffLength = argVal.length;
        }

        _clglWork.setArg("result", new Float32Array(buffLength), null, typOut);


        //_clglWork.enqueueNDRangeKernel("result", _clglWork.buffers_TEMP["result"]);
        //_webCLGL.copy(_clglWork.buffers_TEMP["result"], _clglWork.buffers["result"]);

        var fbs = new WebCLGLUtils().createFBs(_webCLGL.getContext(), _webCLGL.getDrawBufferExt(), _webCLGL.getMaxDrawBuffers(), _clglWork.getKernel("0"), _clglWork.buffers, _clglWork.buffers[Object.keys(_clglWork.buffers)[0]].W, _clglWork.buffers[Object.keys(_clglWork.buffers)[0]].H);

        _clglWork.enqueueNDRangeKernel(false);

        if(typOut=="FLOAT")
            return _webCLGL.enqueueReadBuffer_Float(_clglWork.buffers["result"]);
        else
            return _webCLGL.enqueueReadBuffer_Float4(_clglWork.buffers["result"]);
    }).bind(this);

    /** @private  */
    var iniG = (function() {
        var prepareReturnCode = (function(source, outArg) {
            var objOutStr = [];
            var retCode = source.match(new RegExp(/return.*$/gm));
            retCode = retCode[0].replace("return ", ""); // now "varx" or "[varx1,varx2,..]"
            var isArr = retCode.match(new RegExp(/\[/gm));
            if(isArr != null && isArr.length >= 1) { // type outputs array
                retCode = retCode.split("[")[1].split("]")[0];
                var itemStr = "", openParenth = 0;
                for(var n=0; n < retCode.length; n++) {
                    if(retCode[n] == "," && openParenth == 0) {
                        objOutStr.push(itemStr);
                        itemStr = "";
                    } else
                        itemStr += retCode[n];

                    if(retCode[n] == "(")
                        openParenth++;
                    if(retCode[n] == ")")
                        openParenth--;
                }
                objOutStr.push(itemStr); // and the last
            } else  // type one output
                objOutStr.push(retCode.replace(/;$/gm, ""));


            var returnCode = "";
            for(var n = 0; n < outArg.length; n++) {
                // set output type float|float4
                var found = false;
                for(var key in _args) {
                    if(key != "indices") {
                        var expl = key.split(" ");

                        if(expl[1] == outArg[n]) {
                            var mt = expl[0].match(new RegExp("float4", "gm"));
                            returnCode += (mt != null && mt.length > 0) ? "out"+n+"_float4 = "+objOutStr[n]+";\n" : "out"+n+"_float = "+objOutStr[n]+";\n";

                            found = true;
                            break;
                        }
                    }
                }
                if(found == false)
                    returnCode += "out"+n+"_float4 = "+objOutStr[n]+";\n";
            }
            return returnCode;
        }).bind(this);


        var arguments = arguments[0]; // override
        _args = arguments[1]; // first is context or canvas

        for(var i = 2; i < arguments.length; i++) {
            if(arguments[i].type == "KERNEL") {
                var conf = arguments[i].config;
                var idx = conf[0];
                var outArg = (conf[1] instanceof Array) ? conf[1] : [conf[1]];
                var kH = conf[2];
                var kS = conf[3];

                var argsInThisKernel = [];



                for(var key in _args) {
                    var expl = key.split(" ");
                    var argName = expl[1];

                    // search arguments in use
                    var matches = (kH+kS).match(new RegExp(argName, "gm"));
                    if(key != "indices" && matches != null && matches.length > 0)
                        argsInThisKernel.push(key.replace("*attr ", "* ")); // make replace for ensure no *attr in KERNEL
                }


                var strArgs = "", sep="";
                for(var n=0; n < argsInThisKernel.length; n++)
                    strArgs += sep+argsInThisKernel[n], sep=",";


                kS = 'void main('+strArgs+') {'+
                    'vec2 '+idx+' = get_global_id();'+
                    kS.replace(/return.*$/gm, prepareReturnCode(kS, outArg))+
                    '}';
                var kernel = _webCLGL.createKernel();
                kernel.setKernelSource(kS, kH);
                _clglWork.addKernel(kernel, outArg, _args);

            } else if(arguments[i].type == "GRAPHIC") { // VFP
                var conf = arguments[i].config;
                var outArg = [null];
                var VFP_vertexH;
                var VFP_vertexS;
                var VFP_fragmentH;
                var VFP_fragmentS;
                if(conf.length == 5) {
                    outArg = (conf[0] instanceof Array) ? conf[0] : [conf[0]];
                    VFP_vertexH = conf[1];
                    VFP_vertexS = conf[2];
                    VFP_fragmentH = conf[3];
                    VFP_fragmentS = conf[4];
                } else {
                    VFP_vertexH = conf[0];
                    VFP_vertexS = conf[1];
                    VFP_fragmentH = conf[2];
                    VFP_fragmentS = conf[3];
                }


                var argsInThisVFP_v = [];
                var strArgs_v = "", sep="";
                for(var key in _args) {
                    // search arguments in use
                    var matches = (VFP_vertexH+VFP_vertexS).match(new RegExp(key.split(" ")[1], "gm"));
                    if(key != "indices" && matches != null && matches.length > 0)
                        argsInThisVFP_v.push(key);
                }
                for(var n=0; n < argsInThisVFP_v.length; n++)
                    strArgs_v += sep+argsInThisVFP_v[n], sep=",";


                var argsInThisVFP_f = [];
                var strArgs_f = "", sep="";
                for(var key in _args) {
                    // search arguments in use
                    matches = (VFP_fragmentH+VFP_fragmentS).match(new RegExp(key.split(" ")[1], "gm"));
                    if(key != "indices" && matches != null && matches.length > 0)
                        argsInThisVFP_f.push(key);
                }
                for(var n=0; n < argsInThisVFP_f.length; n++)
                    strArgs_f += sep+argsInThisVFP_f[n], sep=",";


                VFP_vertexS = 'void main('+strArgs_v+') {'+
                    VFP_vertexS+
                    '}';
                VFP_fragmentS = 'void main('+strArgs_f+') {'+
                    VFP_fragmentS.replace(/return.*$/gm, prepareReturnCode(VFP_fragmentS, outArg))+
                    '}';
                var vfprogram = _webCLGL.createVertexFragmentProgram();
                vfprogram.setVertexSource(VFP_vertexS, VFP_vertexH);
                vfprogram.setFragmentSource(VFP_fragmentS, VFP_fragmentH);
                _clglWork.addVertexFragmentProgram(vfprogram, outArg, _args);
            }
        }

        // args
        for(var key in _args) {
            var argVal = _args[key];

            if(key == "indices") {
                if(argVal != null)
                    _clglWork.setIndices(argVal);
            } else
                _clglWork.setArg(key.split(" ")[1], argVal);
        }
    }).bind(this);
    if(arguments[0] instanceof HTMLCanvasElement) {
        var _gl = new WebCLGLUtils().getWebGLContextFromCanvas(arguments[0]);
        _webCLGL = new WebCLGL(_gl);
        _clglWork = _webCLGL.createWork(window.gpufor_precision|1000);
        iniG(arguments);
    } else if(arguments[0] instanceof WebGLRenderingContext) {
        var _gl = arguments[0];
        _webCLGL = new WebCLGL(_gl);
        _clglWork = _webCLGL.createWork(window.gpufor_precision|1000);
        iniG(arguments);
    } else {
        _webCLGL = new WebCLGL();
        _clglWork = _webCLGL.createWork(window.gpufor_precision|0);
        return ini(arguments);
    }

    /**
     * getCtx
     */
    this.getCtx = function() {
        return _gl;
    };

    /**
     * getWebCLGL
     */
    this.getWebCLGL = function() {
        return _webCLGL;
    };

    /**
     * getWork
     */
    this.getWork = function() {
        return _clglWork;
    };

    /**
     * processKernels
     */
    this.processKernels = function() {
        _clglWork.enqueueNDRangeKernel();
    };

    /**
     * onPreProcessKernel
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(_clglWork.kernels)[0] : Object.keys(_clglWork.kernels)[kernelNum];
        _clglWork.onPreProcessKernel(kernelName, fnc);
    };

    /**
     * onPostProcessKernel
     * @param {Int} [kernelNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessKernel = function(kernelNum, fn) {
        var fnc = (kernelNum instanceof Function) ? kernelNum : fn;
        var kernelName = (kernelNum instanceof Function) ? Object.keys(_clglWork.kernels)[0] : Object.keys(_clglWork.kernels)[kernelNum];
        if(kernelNum instanceof Function) {
            fnc = kernelNum;
            kernelName = Object.keys(_clglWork.kernels)[0];
        } else {
            fnc = fn;
            kernelName = Object.keys(_clglWork.kernels)[kernelNum];
        }
        _clglWork.onPostProcessKernel(kernelName, fnc);
    };

    /**
     * enableKernel
     * @param {Int} [kernelNum=0]
     */
    this.enableKernel = function(kernelNum) {
        _clglWork.enableKernel(kernelNum.toString()|"0");
    };

    /**
     * disableKernel
     * @param {Int} [kernelNum=0]
     */
    this.disableKernel = function(kernelNum) {
        _clglWork.disableKernel(kernelNum.toString()|"0");
    };

    /**
     * processGraphic
     * @param {String} [argumentInd=undefined] Argument for vertices count or undefined if argument "indices" exist
     * @param {Int} [drawMode=0] 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     **/
    this.processGraphic = function(argumentInd, drawMode) {
        var dmode = (drawMode != undefined) ? drawMode : 0;

        _clglWork.enqueueVertexFragmentProgram(argumentInd, dmode);
    };

    /**
     * onPreProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPreProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        _clglWork.onPreProcessVertexFragmentProgram(vfpName, fnc);
    };

    /**
     * onPostProcessGraphic
     * @param {Int} [graphicNum=0]
     * @param {Callback} fn
     */
    this.onPostProcessGraphic = function(graphicNum, fn) {
        var fnc = (graphicNum instanceof Function) ? graphicNum : fn;
        var vfpName = (graphicNum instanceof Function) ? "0" : graphicNum.toString();
        _clglWork.onPostProcessVertexFragmentProgram(vfpName, fnc);
    };

    /**
     * enableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.enableGraphic = function(graphicNum) {
        _clglWork.enableVertexFragmentProgram(graphicNum.toString()|"0");
    };

    /**
     * disableGraphic
     * @param {Int} [graphicNum=0]
     */
    this.disableGraphic = function(graphicNum) {
        _clglWork.disableVertexFragmentProgram(graphicNum.toString()|"0");
    };

    /**
     * setArg
     * @param {String} argName
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     */
    this.setArg = function(argName, value) {
        return _clglWork.setArg(argName, value);
    };

    /**
     * fillPointerArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.fillPointerArg = function(argName, clearColor) {
        return _clglWork.fillPointerArg(argName, clearColor);
    };

    /**
     * Get argument from other gpufor
     * @param {String} argument Argument to set
     * @param {gpufor} gpufor
     */
    this.getGPUForPointerArg = function(argument, gpufor) {
        _clglWork.getWorkBufferArg(argument, gpufor.getWork());
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        return _clglWork.getAllArgs();
    };

};

