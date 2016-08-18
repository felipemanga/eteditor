/**
* WebCLGLWork Object
* @class
* @constructor
*/
WebCLGLWork = function(webCLGL, offset) {
    "use strict";

	this.webCLGL = webCLGL;
	this.offset = (offset != undefined) ? offset : 100.0;

	this.kernels = {};
	this.vertexFragmentPrograms = {};
	this.buffers = {};
    this.calledArgs = {};

	var kernelPr;
	var vPr;
	var fPr;
	var type; // FLOAT or FLOAT4
	var isBuffer;
	var usedInVertex;
	var usedInFragment;

    var _alerted = false;

    /** @private */
    var defineOutputTempModes = (function(output, args) {
        var searchInArgs = function(outputName, args) {
            var found = false;
            for(var key in args) {
                if(key != "indices") {
                    var expl = key.split(" ");
                    if(expl.length > 0) {
                        var argName = expl[1];
                        if(argName == outputName) {
                            found = true;
                            break;
                        }
                    }
                }
            }
            return found;
        };

        var outputTempModes = [];
        for(var n=0; n < output.length; n++)
            outputTempModes[n] = (output[n] != null) ? searchInArgs(output[n], args) : false;

        return outputTempModes;
    }).bind(this);

    /**
     * Add one WebCLGLKernel to the work
     * @param {WebCLGLKernel} kernel
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     * @param {Object} args
     */
    this.addKernel = function(kernel, output, args) {
        kernel.output = output;
        kernel.outputTempModes = defineOutputTempModes(output, args);

        var name = Object.keys(this.kernels).length.toString();

        this.kernels[name] = kernel;
        this.kernels[name].enabled = true;
    };

    /**
     * onPreProcessKernel
     * @param {String} kernelName
     * @param {Callback} fn
     */
    this.onPreProcessKernel = function(kernelName, fn) {
        this.kernels[kernelName].onpre = fn;
    };

    /**
     * onPostProcessKernel
     * @param {String} kernelName
     * @param {Callback} fn
     */
    this.onPostProcessKernel = function(kernelName, fn) {
        this.kernels[kernelName].onpost = fn;
    };

    /**
     * enableKernel
     * @param {String} kernelName
     */
    this.enableKernel = function(kernelName) {
        this.kernels[kernelName].enabled = true;
    };

    /**
     * disableKernel
     * @param {String} kernelName
     */
    this.disableKernel = function(kernelName) {
        this.kernels[kernelName].enabled = false;
    };

    /**
     * Get one added WebCLGLKernel
     * @param {String} name Get assigned kernel for this argument
     */
    this.getKernel = function(name) {
        for(var key in this.kernels) {
            if(key == name) {
                return this.kernels[key];
            }
        }
    };

    /**
     * Add one WebCLGLVertexFragmentProgram to the work
     * @param {WebCLGLVertexFragmentProgram} vertexFragmentProgram
     * @param {String|Array<String>} output - Used for to write and update ARG name with the result in out_float4/out_float
     * @param {Object} args
     */
    this.addVertexFragmentProgram = function(vertexFragmentProgram, output, args) {
        vertexFragmentProgram.output = output;
        vertexFragmentProgram.outputTempModes = defineOutputTempModes(output, args);

        var name = Object.keys(this.vertexFragmentPrograms).length.toString();

        this.vertexFragmentPrograms[name] = vertexFragmentProgram;
        this.vertexFragmentPrograms[name].enabled = true;
    };

    /**
     * onPreProcessVertexFragmentProgram
     * @param {String} vfpName
     * @param {Callback} fn
     */
    this.onPreProcessVertexFragmentProgram = function(vfpName, fn) {
        this.vertexFragmentPrograms[vfpName].onpre = fn;
    };

    /**
     * onPostProcessVertexFragmentProgram
     * @param {String} vfpName
     * @param {Callback} fn
     */
    this.onPostProcessVertexFragmentProgram = function(vfpName, fn) {
        this.vertexFragmentPrograms[vfpName].onpost = fn;
    };

    /**
     * enableVertexFragmentProgram
     * @param {String} vfpName
     */
    this.enableVertexFragmentProgram = function(vfpName) {
        this.vertexFragmentPrograms[vfpName].enabled = true;
    };

    /**
     * disableVertexFragmentProgram
     * @param {String} vfpName
     */
    this.disableVertexFragmentProgram = function(vfpName) {
        this.vertexFragmentPrograms[vfpName].enabled = false;
    };

    /** @private  */
    var checkArg = (function(argument, value) {
        kernelPr = [];
        vPr = [];
        fPr = [];
        isBuffer = false;
        usedInVertex = false;
        usedInFragment = false;

        for(var key in this.kernels) {
            for(var keyB in this.kernels[key].in_values) {
                var inValues = this.kernels[key].in_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    kernelPr.push(this.kernels[key]);
                    break;
                }
            }

        }


        for(var key in this.vertexFragmentPrograms) {
            for(var keyB in this.vertexFragmentPrograms[key].in_vertex_values) {
                var inValues = this.vertexFragmentPrograms[key].in_vertex_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler" || inValues.type == "float4_fromAttr") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler" || inValues.type == "float_fromAttr") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    vPr.push(this.vertexFragmentPrograms[key]);
                    usedInVertex = true;
                    break;
                }
            }

            for(var keyB in this.vertexFragmentPrograms[key].in_fragment_values) {
                var inValues = this.vertexFragmentPrograms[key].in_fragment_values[keyB];
                if(keyB == argument) {
                    if(inValues.type == "float4_fromSampler") {
                        type = "FLOAT4";
                        isBuffer = true;
                    } else if(inValues.type == "float_fromSampler") {
                        type = "FLOAT";
                        isBuffer = true;
                    }

                    fPr.push(this.vertexFragmentPrograms[key]);
                    usedInFragment = true;
                    break;
                }
            }
        }

        if(kernelPr.length == 0 && usedInVertex == false && usedInFragment == false &&
            (value instanceof Array || value instanceof Float32Array || value instanceof Uint8Array || value instanceof HTMLImageElement))
            isBuffer = true;
    }).bind(this);

    /**
     * Assign value of a argument for all added Kernels and vertexFragmentPrograms
     * @param {String} argument Argument to set
     * @param {Float|Array<Float>|Float32Array|Uint8Array|WebGLTexture|HTMLImageElement} value
     * @param {Array<Float2>} [overrideDimensions=new Array(){Math.sqrt(value.length), Math.sqrt(value.length)}]
     * @param {String} [overrideType="FLOAT4"] - force "FLOAT4" or "FLOAT" (for no graphic program)
     * @returns {WebCLGLBuffer}
     */
    this.setArg = function(argument, value, overrideDimensions, overrideType) {
        if(argument == "indices") {
            this.setIndices(value);
        } else {
            checkArg(argument, value);

            if(overrideType != undefined)
                type = overrideType;

            if(isBuffer == true) {
                var mode = "SAMPLER"; // "ATTRIBUTE", "SAMPLER", "UNIFORM"
                if(usedInVertex == true) {
                    if(kernelPr.length == 0 && usedInFragment == false) {
                        mode = "ATTRIBUTE";
                    }
                }

                if(value != undefined && value != null) {
                    if(this.buffers.hasOwnProperty(argument) == false ||
                        (this.buffers.hasOwnProperty(argument) == true && this.buffers[argument] == null)) {
                        this.buffers[argument] = this.webCLGL.createBuffer(type, this.offset, false, mode);
                    }
                    this.buffers[argument].writeBuffer(value, false, overrideDimensions);

                    for(var n=0; n < kernelPr.length; n++)
                        kernelPr[n].setKernelArg(argument, this.buffers[argument], this.buffers);

                    for(var n=0; n < vPr.length; n++)
                        vPr[n].setVertexArg(argument, this.buffers[argument], this.buffers);

                    for(var n=0; n < fPr.length; n++)
                        fPr[n].setFragmentArg(argument, this.buffers[argument], this.buffers);
                } else {
                    this.buffers[argument] = null;

                    for(var n=0; n < kernelPr.length; n++)
                        kernelPr[n].setKernelArg(argument, null);

                    for(var n=0; n < vPr.length; n++)
                        vPr[n].setVertexArg(argument, null);

                    for(var n=0; n < fPr.length; n++)
                        fPr[n].setFragmentArg(argument, null);
                }
            } else {
                for(var n=0; n < kernelPr.length; n++)
                    kernelPr[n].setKernelArg(argument, value);

                for(var n=0; n < vPr.length; n++)
                    vPr[n].setVertexArg(argument, value);

                for(var n=0; n < fPr.length; n++)
                    fPr[n].setFragmentArg(argument, value);

                return value;
            }
        }

        if(this.calledArgs.hasOwnProperty(argument) == true) {
            for(var n=0; n < this.calledArgs[argument].length; n++) {
                var work = this.calledArgs[argument][n];
                work.getWorkBufferArg(argument, this, false);
            }
        }
    };

    /**
     * Get argument from other work
     * @param {String} argument Argument to set
     * @param {WebCLGLWork} clglWork
     * @param {Bool} [makeAdd=true]
     */
    this.getWorkBufferArg = function(argument, clglWork, makeAdd) {
        checkArg(argument);

        this.buffers[argument] = clglWork.buffers[argument];

        for(var n=0; n < kernelPr.length; n++)
            kernelPr[n].setKernelArg(argument, this.buffers[argument], this.buffers);

        for(var n=0; n < vPr.length; n++)
            vPr[n].setVertexArg(argument, this.buffers[argument], this.buffers);

        for(var n=0; n < fPr.length; n++)
            fPr[n].setFragmentArg(argument, this.buffers[argument], this.buffers);

        if(clglWork.calledArgs.hasOwnProperty(argument) == false)
            clglWork.calledArgs[argument] = [];

        if(makeAdd == undefined || makeAdd == true)
            clglWork.calledArgs[argument].push(this);
    };

    /**
     * fillPointerArg
     * @param {String} argName
     * @param {Array<Float>} clearColor
     */
    this.fillPointerArg = function(argName, clearColor) {
        if(this.buffers.hasOwnProperty(argName) == true) {
            for(var n=0; n < kernelPr.length; n++)
                kernelPr[n].clearArg(this.webCLGL, this.buffers[argName], clearColor, this.buffers);

            for(var n=0; n < vPr.length; n++)
                vPr[n].clearArg(this.webCLGL, this.buffers[argName], clearColor, this.buffers);

            for(var n=0; n < fPr.length; n++)
                fPr[n].clearArg(this.webCLGL, this.buffers[argName], clearColor, this.buffers);
        }
    };

    /**
     * Get all arguments existing in passed kernels & vertexFragmentPrograms
     * @returns {Object}
     */
    this.getAllArgs = function() {
        var args = {};
        for(var key in this.kernels) {
            for(var keyB in this.kernels[key].in_values) {
                var inValues = this.kernels[key].in_values[keyB];
                args[keyB] = inValues;
            }
        }


        for(var key in this.vertexFragmentPrograms) {
            for(var keyB in this.vertexFragmentPrograms[key].in_vertex_values) {
                var inValues = this.vertexFragmentPrograms[key].in_vertex_values[keyB];
                args[keyB] = inValues;
            }

            for(var keyB in this.vertexFragmentPrograms[key].in_fragment_values) {
                var inValues = this.vertexFragmentPrograms[key].in_fragment_values[keyB];
                args[keyB] = inValues;
            }
        }

        return args;
    };

    /**
     * Set indices for the geometry passed in vertexFragmentProgram
     * @param {Array<Float>} array
     */
    this.setIndices = function(arr) {
        this.CLGL_bufferIndices = this.webCLGL.createBuffer("FLOAT", this.offset, false, "VERTEX_INDEX");
        this.CLGL_bufferIndices.writeBuffer(arr);
    };

    /**
     * Process kernels
     * @param {Bool} outputToTemp - (when no graphic mode)
     */
    this.enqueueNDRangeKernel = function(outputToTemp) {
        var arrMakeCopy = [];
        for(var key in this.kernels) {
            var kernel = this.kernels[key];

            if(kernel.enabled == true) {
                if(kernel.onpre != undefined)
                    kernel.onpre();

                if(outputToTemp == undefined || outputToTemp == true) {
                    var tempsFound = false;
                    for(var n=0; n < kernel.output.length; n++) {
                        if(kernel.output[n] != null && kernel.outputTempModes[n] == true) {
                            tempsFound = true;
                            break;
                        }
                    }

                    if(tempsFound == true) {
                        this.webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this.buffers), true);
                        arrMakeCopy.push(kernel);
                    } else {
                        this.webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this.buffers), false);
                    }
                } else
                    this.webCLGL.enqueueNDRangeKernel(kernel, new WebCLGLUtils().getOutputBuffers(kernel, this.buffers), false);

                if(kernel.onpost != undefined)
                    kernel.onpost();
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            this.webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this.buffers));
    };

    /**
     * Process VertexFragmentProgram
     * @param {String} [argumentInd=undefined] Argument for vertices count or undefined if indices exist
     * @param {Int} drawMode 0=POINTS, 3=LINE_STRIP, 2=LINE_LOOP, 1=LINES, 5=TRIANGLE_STRIP, 6=TRIANGLE_FAN and 4=TRIANGLES
     */
    this.enqueueVertexFragmentProgram = function(argumentInd, drawMode) {
        var arrMakeCopy = [];
        for(var key in this.vertexFragmentPrograms) {
            var vfp = this.vertexFragmentPrograms[key];

            if(vfp.enabled == true) {
                var buff = (this.CLGL_bufferIndices != undefined) ? this.CLGL_bufferIndices : this.buffers[argumentInd];

                if(buff != undefined && buff.length > 0) {
                    if(vfp.onpre != undefined)
                        vfp.onpre();

                    var tempsFound = false;
                    for(var n=0; n < vfp.output.length; n++) {
                        if(vfp.output[n] != null && vfp.outputTempModes[n] == true) {
                            tempsFound = true;
                            break;
                        }
                    }

                    if(tempsFound == true) {
                        this.webCLGL.enqueueVertexFragmentProgram(vfp, buff, drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this.buffers), true);
                        arrMakeCopy.push(vfp);
                    } else {
                        this.webCLGL.enqueueVertexFragmentProgram(vfp, buff, drawMode, new WebCLGLUtils().getOutputBuffers(vfp, this.buffers), false);
                    }

                    if(vfp.onpost != undefined)
                        vfp.onpost();
                }
            }
        }

        for(var n=0; n < arrMakeCopy.length; n++)
            this.webCLGL.copy(arrMakeCopy[n], new WebCLGLUtils().getOutputBuffers(arrMakeCopy[n], this.buffers));
    };
};


