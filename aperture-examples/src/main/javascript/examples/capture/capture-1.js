define(
	function() { 
		return function() {
	
			var settings = {
				format : 'PNG',
				captureWidth : 400,
				captureHeight : 400,
				cache : false
			};
			var authenticationSettings = {
				username : "",
				password : ""
			};
			var captureSrc;
			
			// Initialize the textboxes with a default values
			captureSrc = $('#htmlSource').val('http://raphaeljs.com/polar-clock.html');
			settings.captureHeight = $('#height').val('400');
			settings.captureWidth = $('#width').val('400');
			settings.format = $("input[name='format']:checked").val();
			authenticationSettings.username = $('#username').val('');
			authenticationSettings.password = $('#password').val('');
			
			aperture.capture.initialize();

			
			
			/*
			 * Add a DOM appender bound to the id="log" DIV
			 */	
			aperture.log.addDomAppender(
				{
					container : $('#log')
				}
			);
			
			
			
			
			$('#storedRenderBtn').click(
				function() {
					captureSrc = $('#htmlSource').val();
					settings.captureHeight = $('#height').val();
					settings.captureWidth = $('#width').val();
					settings.format = $("input[name='format']:checked").val();
					
					var useAuth = false;
					if ($('#username').val() && $('#password').val()) {
						authenticationSettings.username = $('#username').val();
						authenticationSettings.password = $('#password').val();
						useAuth = true;
					}
					
					aperture.log.info('Source: ' + captureSrc);
					aperture.log.info('Performing capture task...');
					
					aperture.capture.store(
						captureSrc,
						settings,
						(useAuth ? authenticationSettings : null),
						function(response) {
							
							if (response != null) {
								
								var imgSrc = aperture.store.url(response);
								aperture.log.info('***Done! Rendered to: ' + imgSrc);
								
								if (!!$('#captureImg').length){
									$('#captureImg').attr('src', imgSrc);
								} else {
									$('#result').append('<img id="captureImg" src="' + imgSrc + '"/>');
								}
							
							} else {
								aperture.log.error('Error: Unable to capture from source.');
							}
						}
					);
				}
			);
			
			
			
			
			$('#inlineRenderBtn').click(
				function() {
					captureSrc = $('#htmlSource').val();
					settings.captureHeight = $('#height').val();
					settings.captureWidth = $('#width').val();
					settings.format = $("input[name='format']:checked").val();
					
					var useAuth = false;
					if ($('#username').val() && $('#password').val()) {
						authenticationSettings.username = $('#username').val();
						authenticationSettings.password = $('#password').val();
						useAuth = true;
					}
					
					aperture.log.info('Source: ' + captureSrc);
					aperture.log.info('Performing quick capture...');
					
					//create rest url	
					var restUrl = aperture.capture.inline(
						captureSrc,
						settings,
						(useAuth ? authenticationSettings : null)
					);
					
					if (!!$('#captureImg').length){
						$('#captureImg').attr('src', restUrl);
					} else {
						$('#result').append('<img id="captureImg" src="' + restUrl + '"/>');
					}
				}
			);
		};
	}
);
