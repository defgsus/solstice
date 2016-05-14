

function calcNormals(vertices, indices)
{
	/** @TODO */
	return vertices;
}



function Model()
{
	this.init = function()
	{
		this.projectMatrix = mat4.create();
		this.modelMatrix = mat4.create();
		
		
	}
	
	this.initShaders = function(id)
	{
		// get shader source
		var fragmentShader = getShader(gl, id + "-fs");
		var vertexShader = getShader(gl, "shader-vs");

		// compile and link
		this.shaderProgram = gl.createProgram();
		gl.attachShader(this.shaderProgram, vertexShader);
		gl.attachShader(this.shaderProgram, fragmentShader);
		gl.linkProgram(this.shaderProgram);

		// check for success
		if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) 
		{
			alert("Could not initialize shaders");
		}

		// bind shader
		gl.useProgram(this.shaderProgram);
		
		// bind attributes
		this.a_position = gl.getAttribLocation(this.shaderProgram, "a_position");
		gl.enableVertexAttribArray(this.shaderProgram.a_position);
		this.a_texCoord = gl.getAttribLocation(this.shaderProgram, "a_texCoord");
		if (this.a_texCoord >= 0)
			gl.enableVertexAttribArray(this.shaderProgram.a_texCoord);

		// bind uniforms
		this.u_projection = gl.getUniformLocation(this.shaderProgram, "u_projection");
		this.u_modelView = gl.getUniformLocation(this.shaderProgram, "u_modelView");
		this.u_time = gl.getUniformLocation(this.shaderProgram, "u_time");
		this.u_timezone = gl.getUniformLocation(this.shaderProgram, "u_timezone");
		this.u_selPoint = gl.getUniformLocation(this.shaderProgram, "u_selPoint");
		tex = gl.getUniformLocation(this.shaderProgram, "u_earth_tex");
		gl.uniform1i(tex, 0);
		tex = gl.getUniformLocation(this.shaderProgram, "u_timezones_tex");
		gl.uniform1i(tex, 1);
	}
	
	this.initBuffers = function(vertices, indices, texCoords)
	{
		// ---- position ----
		// create buffer space
		this.vb_pos = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vb_pos);
		// upload data
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		// remember size
		this.vb_pos.itemSize = 3;
		this.vb_pos.numItems = vertices.length / 3;
		/*
		// ---- normals ----
		normals = calcNormals(vertices, indices);
		this.vb_norm = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vb_norm);
		// upload data
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
		*/
		// ---- texCoords ----
		if (texCoords != null)
		{
			this.vb_texCoord = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vb_texCoord);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
			this.vb_texCoord.itemSize = 2;
			this.vb_texCoord.numItems = texCoords.length / 2;
		}
		
		// ---- indices ----
		this.vb_index = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vb_index);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.vb_index.itemSize = 1;
		this.vb_index.numItems = indices.length;
	}
	
	this.draw = function()
	{
		// bind buffers
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vb_pos);
		gl.vertexAttribPointer(this.a_position, this.vb_pos.itemSize, gl.FLOAT, false, 0, 0);
		if (this.a_texCoord >= 0)
		{
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vb_texCoord);
			gl.vertexAttribPointer(this.a_texCoord, this.vb_texCoord.itemSize, gl.FLOAT, false, 0, 0);
		}
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vb_index);

		// bind shader
		gl.useProgram(this.shaderProgram);
		
		// send uniforms
		gl.uniformMatrix4fv(this.u_projection, false, this.projectMatrix);
		gl.uniformMatrix4fv(this.u_modelView, false, this.modelMatrix);
		//date = new Date();
		//gl.uniform1f(this.u_time, date.getMinutes()*60 + date.getSeconds());
		gl.uniform1f(this.u_time, (Date.now()-1462700000000)/1000.);
		if (this.timezone) gl.uniform1f(this.u_timezone, this.timezone);
		if (this.selPoint) gl.uniform3f(this.u_selPoint, this.selPoint[0], this.selPoint[1], this.selPoint[2]);

		// draw
		gl.drawElements(gl.TRIANGLES, this.vb_index.numItems, gl.UNSIGNED_SHORT, 0);
	}
}
