
var earthInstance;

function EarthCanvas()
{
	this.earthModel = new Model();
	this.waterModel = new Model();
	this.starModel = new Model();
	this.timezoneTexture;
	this.earthTexture;

	this.zNear = 0.1;
	this.zFar = 500.;
	this.rotY = 0.0;
	this.rotX = 0.0;
	this.rotXs = 0.0;
	this.rotYs = 0.0;
	this.zoom = 0.0;
	this.zooms = 0.0;
	this.selectedTimezone = 0.;

	this.mouseDown = false;
	this.lastMouseX = 0;
	this.lastMouseY = 0;
	this.mouseDownTime;
	
	this.timePerZone = [-12.0, -11.0, -10.0, -9.5, -9.0, -8.0, -7.0, -6.0, -5.0, -4.5, -4.0, -3.5, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 5.75, 6.0, 6.5, 7.0, 8.0, 8.75, 9.0, 9.5, 10.0, 10.5, 11.0, 11.5, 12.0, 12.75, 13.0, 14.0];

	// ---- website interface ----
	
	this.setTimezone = function(tz_index)
	{
		var e = earthInstance;
		e.selectedTimezone = tz_index;
		time = this.timePerZone[tz_index];
		e.rotY = (-time/12.-.5) * 3.1415;
	};



	// ----- implementation ------
	
	this.debug = function(n)
	{
		document.getElementById("debug").innerHTML = n;
	};
	this.debugMatrix = function(m)
	{
		s = "";
		for (var j=0; j<4; ++j)
		{
			for (var i=0; i<4; ++i)
				s += m[i*4+j] + " ";
			s += "<br\>";
		}
		document.getElementById("debug").innerHTML = s;
	};
	
	this.debugVector = function(v)
	{
		s = "";
		for (var i=0; i<v.length; ++i)
				s += v[i] + " ";
		document.getElementById("debug").innerHTML = s;
	};

	/* returns x,y members [0,canvasSize] */
	this.getCanvasPos = function(event)
	{
		var canvas = document.getElementById("earth_canvas");
		var canvasRect = canvas.getBoundingClientRect();
		var v = new Object();
		v.x = event.clientX - canvasRect.left;
		v.y = event.clientY - canvasRect.top;
		return v;
	};

	/* Returns normalized ray vectors (vec3) for pixel coordinate [0,canvasSize] */
	this.getCameraRay = function(pixelScr, ro, rd)
	{
		var x = -1. + 2. * pixelScr.x / gl.viewportWidth;
		var y =  1. - 2. * pixelScr.y / gl.viewportHeight;
		
		var iproj = mat4.create();
		var imodel = mat4.create();
		mat4.invert(iproj, this.earthModel.projectMatrix);
		mat4.invert(imodel, this.earthModel.modelMatrix);
		
		var pos = vec4.fromValues(x, y, -this.zNear, 1);
		var dir = vec4.fromValues(x, y, -this.zFar, 1);
		
		vec4.transformMat4(pos, pos, iproj);	
		vec4.transformMat4(dir, dir, iproj);	

		pos[0] /= pos[3]; pos[1] /= pos[3]; pos[2] /= pos[3]; pos[3] = 1.;
		dirn = vec4.fromValues(dir[0] / dir[3], dir[1] / dir[3], dir[2] / dir[3], 0.);

		vec4.normalize(dir, dirn);
		
		vec4.transformMat4(pos, pos, imodel);
		vec4.transformMat4(dir, dir, imodel);//earthModel.modelMatrix);
		
		ro[0] = pos[0]; ro[1] = pos[1]; ro[2] = pos[2];
		rd[0] = dir[0]; rd[1] = dir[1]; rd[2] = dir[2];
	};

	// from http://povray.org source
	this.intersectSphere = function(ray_origin, ray_direction, sphere_center, sphere_radius, hitPoint)
	{
		var origin_to_center = vec3.create();
		vec3.sub(origin_to_center, sphere_center, ray_origin);

		var oc_squared = vec3.dot(origin_to_center, origin_to_center);
		var closest = vec3.dot(origin_to_center, ray_direction);
		var radius2 = sphere_radius * sphere_radius;

		if (oc_squared >= radius2 && closest < 0.0001)
			return false;

		var half_chord2 = radius2 - oc_squared + closest * closest;

		if (half_chord2 > 0.0001)
		{
			half_chord = Math.sqrt(half_chord2);

			var depth = Math.min(closest + half_chord, closest - half_chord);
			
			if (hitPoint)
			{
				hitPoint[0] = ray_origin[0] + depth * ray_direction[0];
				hitPoint[1] = ray_origin[1] + depth * ray_direction[1];
				hitPoint[2] = ray_origin[2] + depth * ray_direction[2];
			}
			return true;
		}

		return false;
	};

	this.handleMouseDown = function(event)
	{
		var e = earthInstance;
		
		e.mouseDownTime = Date.now();
		e.mouseDown = true;
		pos = e.getCanvasPos(event);
		e.lastMouseX = pos.x;
		e.lastMouseY = pos.y;
		
		ro = vec3.create();
		rd = vec3.create();
		e.getCameraRay(pos, ro, rd);	
		/*
		earthModel.ro = ro;
		earthModel.rd = rd;
		*/
		var hitPoint = vec3.create();
		if (e.intersectSphere(ro, rd, vec3.fromValues(0,0,0), 10., hitPoint))
		{
			e.earthModel.selPoint = hitPoint;
			//e.debugVector(hitPoint);
		}
		
	//	debug(vec3.str(ro) + " " + vec3.str(rd));
	};

	this.handleMouseUp = function(event)
	{
		var e = earthInstance;
		e.mouseDown = false;
	};

	this.handleMouseMove = function(event)
	{
		var e = earthInstance;
		var pos = e.getCanvasPos(event);

		var deltaX = e.lastMouseX - pos.x;
		var deltaY = e.lastMouseY - pos.y;
		
		if (e.mouseDown)
		{
			var fac = 0.007 / (1. + .3*e.zoom);
			e.rotX -= deltaY * fac;
			e.rotY -= deltaX * fac;
		}
		
		e.lastMouseX = pos.x;
		e.lastMouseY = pos.y;
		/*
		ro = vec3.create();
		rd = vec3.create();
		getCameraRay(pos, ro, rd);
		earthModel.ro = ro;
		earthModel.rd = rd;
		*/
	};

	this.drawScene = function()
	{
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		// setup projection
		mat4.perspective(this.earthModel.projectMatrix, 1.1, gl.viewportWidth / gl.viewportHeight, this.zNear, this.zFar);
		// setup modelview
		mat4.identity(this.earthModel.modelMatrix);
		mat4.translate(this.earthModel.modelMatrix, this.earthModel.modelMatrix, vec3.fromValues(0.0, 0.0, -22.0+this.zooms));
		mat4.rotateX(this.earthModel.modelMatrix, this.earthModel.modelMatrix, this.rotXs);
		mat4.rotateY(this.earthModel.modelMatrix, this.earthModel.modelMatrix, this.rotYs);
		
		this.waterModel.projectMatrix = this.earthModel.projectMatrix;
		this.waterModel.modelMatrix = this.earthModel.modelMatrix;
		this.starModel.projectMatrix = this.earthModel.projectMatrix;
		this.starModel.modelMatrix = this.earthModel.modelMatrix;

		if (this.mouseDown && this.mouseDownTime + 1000 < Date.now())
			this.zoom += .1 * (10 - this.zoom);
		else
			this.zoom -= .05 * this.zoom;

		this.rotY -= 0.0001;
		// smoothify
		this.rotXs += (this.rotX - this.rotXs) / 30.;
		this.rotYs += (this.rotY - this.rotYs) / 30.;
		this.zooms += (this.zoom - this.zooms) / 30.;
		
		// copy specific values
		this.waterModel.ro = this.earthModel.ro;
		this.waterModel.rd = this.earthModel.rd;
		this.waterModel.selPoint = this.earthModel.selPoint;
		this.earthModel.timezone = this.selectedTimezone;
		this.waterModel.timezone = this.selectedTimezone;
		
		// bind textures
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.earthTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.timezoneTexture);

		// render
		
		this.earthModel.draw();
		this.waterModel.draw();
		this.starModel.draw();
	};

	this.tick = function() { 
		requestAnimFrame(earthInstance.tick); earthInstance.drawScene(); };


	this.webGlStart = function()
	{
		earthInstance = this;
		
		this.canvas = document.getElementById("earth_canvas");
		initGL(this.canvas);
		
		gl.clearColor(0.0, 0.0, 0.0, 0.0);
		gl.enable(gl.DEPTH_TEST);
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

		this.initTextures();

		this.initWaterModel();
		this.initLandmassModel();
		this.initStarModel();
		
		this.canvas.onmousedown = this.handleMouseDown;
		document.onmouseup = this.handleMouseUp;
		document.onmousemove = this.handleMouseMove;
		
		this.tick();
	};

	this.initLandmassModel = function()
	{
		this.earthModel.init();
		this.earthModel.initShaders("earthshader"); 
		this.earthModel.initBuffers(earth_vertices, earth_indices, earth_texCoords);	
		
		// XXX not used a.t.m
		this.earthModel.ro = vec3.create();
		this.earthModel.rd = vec3.create();
	};

	this.initWaterModel = function()
	{
		this.waterModel.init();
		this.waterModel.initShaders("watershader");
		this.waterModel.initBuffers(water_vertices, water_indices);	
	};

	this.initStarModel = function()
	{
		this.starModel.init();
		this.starModel.initShaders("starshader");
		this.starModel.initBuffers(star_vertices, star_indices);	
	};

	this.initTextures = function() 
	{
		this.earthTexture = loadTexture("naturalearth_color.jpg", true);
		this.timezoneTexture = loadTexture("timezones_grad.png", false);
	};
}

function initializeEarth()
{
	this.instance = new EarthCanvas();
	this.instance.webGlStart();
}

