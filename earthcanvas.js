
var earthModel = new Model();
var waterModel = new Model();
var starModel = new Model();
var timezoneTexture;
var earthTexture;

var zNear = 0.1;
var zFar = 500.;
var rotY = 0.0;
var rotX = 0.0;
var rotXs = 0.0;
var rotYs = 0.0;
var zoom = 0.0;
var zooms = 0.0;

var mouseDown = false;
var lastMouseX = 0;
var lastMouseY = 0;
var mouseDownTime;

function debug(n)
{
	document.getElementById("debug").innerHTML = n;
}
function debugMatrix(m)
{
	s = "";
	for (var j=0; j<4; ++j)
	{
		for (var i=0; i<4; ++i)
			s += m[i*4+j] + " ";
		s += "<br\>";
	}
	document.getElementById("debug").innerHTML = s;
}
function debugVector(v)
{
	s = "";
	for (var i=0; i<v.length; ++i)
			s += v[i] + " ";
	document.getElementById("debug").innerHTML = s;
}

/* returns x,y members [0,canvasSize] */
function getCanvasPos(event)
{
	var canvas = document.getElementById("earth_canvas");
	var canvasRect = canvas.getBoundingClientRect();
	var v = new Object();
	v.x = event.clientX - canvasRect.left;
	v.y = event.clientY - canvasRect.top;
	return v;
}

/* Returns normalized ray vectors (vec3) for pixel coordinate [0,canvasSize] */
function getCameraRay(pixelScr, ro, rd)
{
	var x = -1. + 2. * pixelScr.x / gl.viewportWidth;
	var y =  1. - 2. * pixelScr.y / gl.viewportHeight;
	
	var iproj = mat4.create();
	var imodel = mat4.create();
	mat4.invert(iproj, earthModel.projectMatrix);
	mat4.invert(imodel, earthModel.modelMatrix);
	
	pos = vec4.fromValues(x, y, -zNear, 1);
	dir = vec4.fromValues(x, y, -zFar, 1);
	
	vec4.transformMat4(pos, pos, iproj);	
	vec4.transformMat4(dir, dir, iproj);	

	pos[0] /= pos[3]; pos[1] /= pos[3]; pos[2] /= pos[3]; pos[3] = 1.;
	dirn = vec4.fromValues(dir[0] / dir[3], dir[1] / dir[3], dir[2] / dir[3], 0.);

    vec4.normalize(dir, dirn);
	
	vec4.transformMat4(pos, pos, imodel);
	vec4.transformMat4(dir, dir, imodel);//earthModel.modelMatrix);
	
	ro[0] = pos[0]; ro[1] = pos[1]; ro[2] = pos[2];
	rd[0] = dir[0]; rd[1] = dir[1]; rd[2] = dir[2];
}

function intersectSphere(ray_origin, ray_direction, sphere_center, sphere_radius, hitPoint)
{
	origin_to_center = vec3.create();
	vec3.sub(origin_to_center, sphere_center, ray_origin);

    oc_squared = vec3.dot(origin_to_center, origin_to_center);
    closest = vec3.dot(origin_to_center, ray_direction);
    radius2 = sphere_radius * sphere_radius;

    if (oc_squared >= radius2 && closest < 0.0001)
        return false;

    half_chord2 = radius2 - oc_squared + closest * closest;

    if (half_chord2 > 0.0001)
    {
        half_chord = Math.sqrt(half_chord2);

        depth = Math.min(closest + half_chord, closest - half_chord);
		
		if (hitPoint)
		{
			hitPoint[0] = ray_origin[0] + depth * ray_direction[0];
			hitPoint[1] = ray_origin[1] + depth * ray_direction[1];
			hitPoint[2] = ray_origin[2] + depth * ray_direction[2];
		}
        return true;
    }

    return false;
}

function handleMouseDown(event)
{
	mouseDownTime = Date.now();
	mouseDown = true;
	pos = getCanvasPos(event);
	lastMouseX = pos.x;
	lastMouseY = pos.y;

	ro = vec3.create();
	rd = vec3.create();
	getCameraRay(pos, ro, rd);	
	earthModel.ro = ro;
	earthModel.rd = rd;
	
	hitPoint = vec3.create();
	if (intersectSphere(ro, rd, vec3.fromValues(0,0,0), 10., hitPoint))
	{
		earthModel.selPoint = hitPoint;
		//debugVector(hitPoint);
	}
	
//	debug(vec3.str(ro) + " " + vec3.str(rd));
}

function handleMouseUp(event)
{
	mouseDown = false;
}

function handleMouseMove(event)
{
	pos = getCanvasPos(event);

	var deltaX = lastMouseX - pos.x;
	var deltaY = lastMouseY - pos.y;
	
	if (mouseDown)
	{
		var fac = 0.007 / (1. + .3*zoom);
		rotX -= deltaY * fac;
		rotY -= deltaX * fac;
	}
	
	lastMouseX = pos.x;
	lastMouseY = pos.y;
	/*
	ro = vec3.create();
	rd = vec3.create();
	getCameraRay(pos, ro, rd);	
	earthModel.ro = ro;
	earthModel.rd = rd;
	*/
}

function drawScene()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// setup projection
	mat4.perspective(earthModel.projectMatrix, 1.1, gl.viewportWidth / gl.viewportHeight, zNear, zFar);
	// setup modelview
	mat4.identity(earthModel.modelMatrix);
	mat4.translate(earthModel.modelMatrix, earthModel.modelMatrix, vec3.fromValues(0.0, 0.0, -22.0+zooms));
	mat4.rotateX(earthModel.modelMatrix, earthModel.modelMatrix, rotXs);
	mat4.rotateY(earthModel.modelMatrix, earthModel.modelMatrix, rotYs);
	
	waterModel.projectMatrix = earthModel.projectMatrix;
	waterModel.modelMatrix = earthModel.modelMatrix;
	starModel.projectMatrix = earthModel.projectMatrix;
	starModel.modelMatrix = earthModel.modelMatrix;

	if (mouseDown && mouseDownTime + 1000 < Date.now())
		zoom += .1 * (10 - zoom);
	else
		zoom -= .05 * zoom;

	rotY -= 0.002;
	// smoothify
	rotXs += (rotX - rotXs) / 30.;
	rotYs += (rotY - rotYs) / 30.;
	zooms += (zoom - zooms) / 30.;
	
	// copy specific values
	waterModel.ro = earthModel.ro;
	waterModel.rd = earthModel.rd;
	waterModel.selPoint = earthModel.selPoint;
	
	// bind textures
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, earthTexture);
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, timezoneTexture);

	// render
	
	earthModel.draw();
	waterModel.draw();
	starModel.draw();
}

function tick() { requestAnimFrame(tick); drawScene(); }


function webGlStart()
{
	var canvas = document.getElementById("earth_canvas");
	initGL(canvas);
	
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.enable(gl.DEPTH_TEST);
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

	initTextures();

	initWaterModel();
	initLandmassModel();
	initStarModel();
	
	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	
	tick();
}

function initLandmassModel()
{
	earthModel.init();
	earthModel.initShaders("earthshader"); 
	earthModel.initBuffers(earth_vertices, earth_indices, earth_texCoords);	
	
	earthModel.ro = vec3.create();
	earthModel.rd = vec3.create();
}

function initWaterModel()
{
	waterModel.init();
	waterModel.initShaders("watershader");
	waterModel.initBuffers(water_vertices, water_indices);	
}

function initStarModel()
{
	starModel.init();
	starModel.initShaders("starshader");
	starModel.initBuffers(star_vertices, star_indices);	
}

function initTextures() 
{
	earthTexture = loadTexture("naturalearth_color.jpg", true);
	timezoneTexture = loadTexture("timezones_grad.png", false);
}

