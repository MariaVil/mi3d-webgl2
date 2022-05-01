//Import libraries
import * as dat from './libs/dat.gui.module.js'
import './libs/gl-matrix-min.js'
const mat4 = window.glMatrix.mat4
const vec3 = window.glMatrix.vec3

//Import utility functions
import * as glutils from './glutils.js'
import { imgload } from './imgload.js';


const vsSource = await (await fetch('vs.fx')).text();
const mipFsSource = await (await fetch('mipfs.fx')).text();
const alphaFsSource = await (await fetch('alphafs.fx')).text();

//Image load
const image = await imgload('HEAD_BRAIN_20101020_001_004_T2__Ax_T2_Flair_Ax.img')

//setup control object
var minValue = 0;// Math.min(...image.pixelData)
var maxValue = 1000; //Math.max(...image.pixelData)
const settings = {
    black: minValue, white: maxValue, zoom: 1,
    rotX: 0, rotY: 0, rotZ: 0, 
    distance: 2000,
    visualization: "alpha"
};
//create control interface
const gui = new dat.GUI();
gui.add(settings, 'black', minValue, maxValue);
gui.add(settings, 'white', minValue, maxValue);
gui.add(settings, 'distance', 100, 1000, 1);
gui.add(settings, 'zoom', 0.5, 2, .1);

gui.add(settings, 'rotX', 0, 360, 1);
gui.add(settings, 'rotY', 0, 360, 1);
gui.add(settings, 'rotZ', 0, 360, 1);
gui.add(settings, 'visualization', {MIP: 'MIP', alpha: 'alpha'});

const {gl, pr, pr1, vao, bwLocation, texLocation, lutLocation, wvpLocation, eyePosLocation, bwLocation1, texLocation1, lutLocation1, wvpLocation1, eyePosLocation1} = init()
render()

function init() {
    //get canvas ui element and set its internal resolution to align with its actual screen resolution
    const c = document.getElementById("canvas");
    c.width = c.clientWidth;
    c.height = c.clientHeight;

    //get WebGL2 darwing context and exit if not found
    const gl = c.getContext("webgl2")
    if(gl == null) {
        alert("Context not found");
        throw "Context not found";
    }
    var ext = gl.getExtension('OES_texture_float_linear');

    //-compile source code into shaders
    var vs = glutils.createShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = glutils.createShader(gl, gl.FRAGMENT_SHADER, alphaFsSource);
    var fs1 = glutils.createShader(gl, gl.FRAGMENT_SHADER, mipFsSource);
    //-assemble shaders into program (pipeline)
    var pr = glutils.createProgram(gl, vs, fs);
    var pr1 = glutils.createProgram(gl, vs, fs1);

    var positionAttributeLocation = gl.getAttribLocation(pr, "a_position");
    var texLocation = gl.getUniformLocation(pr, "u_texture");
    var lutLocation = gl.getUniformLocation(pr, "u_lut");
    var bwLocation = gl.getUniformLocation(pr, "bw");
    var wvpLocation = gl.getUniformLocation(pr, "worldViewProjection");
    var eyePosLocation = gl.getUniformLocation(pr, "eyePos");

    var positionAttributeLocation1 = gl.getAttribLocation(pr1, "a_position");
    var texLocation1 = gl.getUniformLocation(pr1, "u_texture");
    var lutLocation1 = gl.getUniformLocation(pr1, "u_lut");
    var bwLocation1 = gl.getUniformLocation(pr1, "bw");
    var wvpLocation1 = gl.getUniformLocation(pr1, "worldViewProjection");
    var eyePosLocation1 = gl.getUniformLocation(pr1, "eyePos");


    //Init texture
    //-init texture object and fill with data
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R32F, image.columns, image.rows, image.slices, 0, gl.RED, gl.FLOAT, image.pixelData);

    //-setup texture interpolation and wrapping modes
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

    var lut = gl.createTexture();
    var lutimage = new Image();
    lutimage.src = 'lut/lut.png'
    lutimage.onload = function() {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, lut);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lutimage);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    const geometry = [
		0, 1, 0,
        1, 1, 0,
        0, 0, 0,
        1, 0, 0,
        0, 1, 1,
        1, 1, 1,
        0, 0, 1,
        1, 0, 1,
    ]

    const triangles = [
		0, 1, 2,
        1, 2, 3,
        2, 3, 6,
        3, 6, 7,
        6, 7, 4,
        7, 4, 5,
        4, 5, 0,
        5, 0, 1,
        1, 3, 5,
        3, 5, 7,
        0, 4, 2,
        4, 2, 6
    ]

    //-create vertex array to store geometry data
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    //-init position buffer and fill with data
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
    //-assign buffer to position attribute
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(positionAttributeLocation1);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(positionAttributeLocation1, 3, gl.FLOAT, false, 0, 0);
    //-init index buffer and fill with data
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);

    //-setup additional pipeline parameters (enable depth filtering)
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    //enable scsissor to prevent clearing of other viewports
    gl.enable(gl.SCISSOR_TEST);

    return {gl, pr, pr1, vao, bwLocation, texLocation, lutLocation, wvpLocation, eyePosLocation, bwLocation1, texLocation1, lutLocation1, wvpLocation1, eyePosLocation1}
}

function render() {
    let aspect = initViewport({x: 0, y: 0, width: gl.canvas.width, height: gl.canvas.height}, gl)
    renderWithParameters(worldMatrix(), viewMatrix(), projectionMatrix(aspect))
    requestAnimationFrame(render)
}

function initViewport(region, gl) {
    //setup drawing area
    gl.viewport(region.x, region.y, region.width, region.height);
    //
    gl.scissor(region.x, region.y, region.width, region.height);
    //set clear color
    gl.clearColor(.1, .1, .1, 1);
    //set clear mode (clear color & depth)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    return region.width / region.height;
}

function renderWithParameters(world, view, proj){
    let wvp = mat4.create()
    mat4.mul(wvp, wvp, proj);
    mat4.mul(wvp, wvp, view);
    mat4.mul(wvp, wvp, world);
    let iv = mat4.invert(mat4.create(), view)
    let iw = mat4.invert(mat4.create(), world)
    var m = mat4.mul(mat4.create(), iw, iv);

    let eye = vec3.transformMat4(vec3.create(), [0, 0, 0], m);

    //use graphic pipeline defined by shader program *pr*
    if (settings.visualization === "alpha") {
        gl.useProgram(pr);
        gl.uniform2fv(bwLocation, [settings.black, settings.white]);
        gl.uniform3fv(eyePosLocation, eye);
        gl.uniform1i(texLocation, 0);
        gl.uniform1i(lutLocation, 1);
        gl.uniformMatrix4fv(wvpLocation, false, wvp);
    } else {
        gl.useProgram(pr1)
        gl.uniform2fv(bwLocation1, [settings.black, settings.white]);
        gl.uniform3fv(eyePosLocation1, eye);
        gl.uniform1i(texLocation1, 0);
        gl.uniform1i(lutLocation1, 1);
        gl.uniformMatrix4fv(wvpLocation1, false, wvp);
    }
    //set geometry to draw
    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function worldMatrix() {
    let world = mat4.create()
    mat4.set(world, ...image.xort, 0, ...image.yort, 0, ...image.zort, 0, 0, 0, 0, 1);

    var imgSize = [
        image.columns * image.pixelSpacingX, 
        image.rows * image.pixelSpacingY, 
        image.slices * image.pixelSpacingZ]
    
    mat4.scale(world, world, imgSize);
    mat4.translate(world, world, [-.5, -.5, -.5])
    return world
}

function viewMatrix() {
    let view = mat4.lookAt(mat4.create(), [settings.distance, settings.distance, settings.distance], [0, 0, 0], [0, 0, 1]);
    mat4.rotateX(view, view, settings.rotX / 180 * Math.PI)
    mat4.rotateY(view, view, settings.rotY / 180 * Math.PI)
    mat4.rotateZ(view, view, settings.rotZ / 180 * Math.PI)
    return view
}

function projectionMatrix(aspect) {
    return mat4.perspective(mat4.create(), 0.5, aspect, 0.1, 10000)
}
