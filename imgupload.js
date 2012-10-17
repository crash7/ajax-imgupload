/**
 * Image upload widget
 * 
 * @dependences
 * 	jQuery 1.8+
 * 
 * @version 0.1A
 *
 * @author Christian Musa
 */
;(function($, document) {
	var widgetscache = [],
			widget,
			settings,
			util;
	
	settings = {
		resize: true,
		width: 200,
		height: 200,
		extensions: ['jpeg', 'jpg', 'png', 'gif'],
		name: 'Filedata',
		url: '/',
		oncomplete: function() {},
		onerror: function() {},
		onselect: function() {},
		onwrongext: function() {}
	};
		
	// General util helpers
	util = {
		/**
		 * @param cwidth
		 * @param cheight
		 * @param mwidth
		 * @param mheight
		 * @return {Object} width, height
		 */
		calculateSize: function(cwidth, cheight, mwidth, mheight) {
			if(cwidth > cheight) {
				if(cwidth > mwidth) {
					cheight *= mwidth / cwidth;
					cwidth = mwidth;
					
				}
				
			} else {
				if(cheight > mheight) {
					cwidth *= mheight / cheight;
					cheight = mheight;
					
				}
				
			}
			return { width: cwidth, height: cheight };
			
		},
		/**
		 * @param {File} file
		 * @param {Number} maxwidth
		 * @param {Number} maxheight
		 * @param {Callback} callback
		 */
		resize: function(dataurl, file, maxwidth, maxheight, callback) {
			var img = document.createElement('img'),
					canvas = document.createElement('canvas'),
					ctx2d,
					blob;
			
			img.onload = function() {
				var size = util.calculateSize(img.width, img.height, maxwidth, maxheight);
				
				canvas.width = size.width;
				canvas.height = size.height;
				
				// get canvas 2d context and draw image
				ctx2d = canvas.getContext('2d');
				ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height);

				// Mozilla not complaint hack using a non-standard function
				if(canvas.mozGetAsFile) {
					blob = canvas.mozGetAsFile(file.name, file.type);
					
				} else {
					blob = new Blob([canvas.toDataURL(file.type)], {type: file.type});
					
				}
				callback(img, blob);
				
			};

			img.src = dataurl;

		}
	};
		
	// Prototype
	widget = function(container, options) {
		var inputfile,
				upload,
				lastimg = null,
				progressbar, 
				jcontainer = $(container);
		
		options = $.extend(settings, options || {});
		
		/**
		 * @see util.calculateSize
		 */
		this.calculateSize = util.calculateSize;
		
		/**
		 * @return {DOMElement-Img}
		 */
		this.getImg = function() {
			return lastimg;
			
		};
				
		// Init
		jcontainer.addClass('widget-imgupload');
		
		// Upload
		upload = function(filename, file) {
			var formdata = new FormData(),
					xhr = new XMLHttpRequest();
	
			formdata.append(options.name, file, filename);
			
			xhr.addEventListener('load', options.oncomplete, false);
			xhr.addEventListener('error', options.onerror, false);
			//xhr.addEventListener('abort', options.onerror, false);
			
			// Chrome vs Mozilla progress bar update
			progressbar.value = 0;
			xhr.upload.onprogress = function(e) {
				if(e.lengthComputable) {
					progressbar.value = (e.loaded / e.total) * 100;
					
				}
								
			};
			// Mozilla strikes again
			xhr.addEventListener('progress', xhr.upload.onprogress, false);
			
			xhr.open('POST', options.url, true);
			xhr.send(formdata);
			
		};
		
		
		// Create input file - view task
		inputfile = $('<input type="file" name="imgupload" style="display:none;" />')
			// Triggered after the file is selected
			.on('change', null, null, function(e) {
				var file,
						reader;
				
				if(e && e.target && e.target.files && e.target.files) {
					file = e.target.files[0];
					
					// GofH
					if(options.extensions.indexOf(file.name.replace(/.*?\.(jpe?g|png|gif)$/i, '$1')) == -1) {
						options.onwrongext && options.onwrongext(options.extensions);
						return;
						
					}
					
					reader = new FileReader();
					reader.onload = function(readere) {
						if(options.resize) {
							util.resize(readere.target.result, file, options.width, options.height, function(img, resizedfile) {
								lastimg = img;
								options.onselect && options.onselect(lastimg);
								upload(file.name, resizedfile);
								
							});
														
						} else {
							lastimg = document.createElement('img');
							lastimg.onload = function() {
								options.onselect && options.onselect(this); 
								
							};
							lastimg.src = readere.target.result;
							upload(file.name, file);
							
						}
												
					};
					reader.readAsDataURL(file);
					
				}
				
			})
			.appendTo(jcontainer);
				
		// Triggered file selector
		jcontainer.children('.upload-button')
			.on('click', null, null, function() {
				inputfile.trigger('click');
				progressbar.value = 0;
				
			});
		
		progressbar = jcontainer.children('progress')[0];
			
	};
	
	/**
	 * @param {DOMElement} domelement
	 * @return {Widget}
	 */
	$.imgupload = function(domelement, options) {
		var wid;
		
		if(domelement) {
			wid = widgetscache.length;
			widgetscache[wid] = new widget(domelement, options);
			return widgetscache[wid];
			
		}
		return null;
	};
	
})(jQuery, document);