/*	Boilerplate code based on this tutorial http://learningwebgl.com/blog/?p=28
	And other sources..
	
	(c) 2015, Stefan Berke (cymatrix.org/modular-audio-graphics.com)
 */ 

var gl;

function initGL(canvas) 
{
	try 
	{
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;	
	} 
	catch(e) 
	{
	}
	if (!gl) 
	{
		alert("Could not initialize WebGL");
	}
}

function getShader(gl, id) 
{
	var shaderScript = document.getElementById(id);
	if (!shaderScript)
	  return null;

	var str = "";
	var k = shaderScript.firstChild;
	while (k) 
	{
		if (k.nodeType == 3)
			str += k.textContent;
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment")
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	else if (shaderScript.type == "x-shader/x-vertex")
		shader = gl.createShader(gl.VERTEX_SHADER);
	else
		return null;

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		alert(gl.getShaderInfoLog(shader));
		return null;
	}

	return shader;
}

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
           window.setTimeout(callback, 1000/60);
         };
})();


function loadTexture(url, doInterpol)
{
	var tex = gl.createTexture();
	var img = new Image();
	img.onload = function() { handleTextureLoaded(img, tex, doInterpol); }
	img.src = url;
	return tex;
}

function handleTextureLoaded(image, texture, doInterp) 
{
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, doInterp ? gl.LINEAR : gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, doInterp ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST);
	if (doInterp) {
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	gl.bindTexture(gl.TEXTURE_2D, null);
}


