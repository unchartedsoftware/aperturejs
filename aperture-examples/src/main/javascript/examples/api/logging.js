define(function() { return function() { //START-EXAMPLE
/*
 * Add a DOM appender bound to the id="log" DIV
 * Limit to WARN messages or higher
 */
aperture.log.addDomAppender( {
	container : $('#log'),
	level : aperture.log.LEVEL.WARN
} );

/* Added by the configuration block in wmsconfig.js
aperture.log.addConsoleAppender();
*/

/*
 * Add buffering appender
 */
var buffer = aperture.log.addBufferingAppender();


var count = 0;

// On click, log an error, a warn, and an info
$("#doLog").click( function() {
	count += 1;

	// Log an error string with simple variable replacement
	aperture.log.error("{0} errors", count);
	// Log two objects
	aperture.log.warn({warning:true}, count);
	// Log an info containing a string with two variable replacements
	aperture.log.info("Today is {0}.  You've pressed the button {1} times.", new Date(), count);

	// Update buffer length display
	$('#bufferLength').html( buffer.getBuffer(true).length );
});

// On click, clear the buffer
$("#clear").click( function() {
	// Get and clear the buffer
	buffer.getBuffer(false);
	// Update display
	$('#bufferLength').html( buffer.getBuffer(true).length );
});

//END-EXAMPLE
};});