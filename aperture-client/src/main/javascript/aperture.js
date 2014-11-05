;(function() {
	// Scripts to load, in order
	var scripts = [
		'base.js',
		'util.js',
		'core-classes/Class.js',
		'core-packages/config.js',
		'core-packages/log.js',
		'core-packages/canvas.js',
		'core-classes/Format.js',
		'core-classes/Transition.js',
		'core-classes/Layer.js',
		'core-classes/Color.js',
		'core-classes/Date.js',
		'core-classes/IconLayer.js',
		'core-classes/LabelLayer.js',
		'core-classes/NodeSet.js',
		'core-classes/MapKey.js',
		'core-classes/Mapping.js',
		'core-classes/RadialLayer.js',
		'core-classes/BarLayer.js',
		'core-classes/Range.js',
		'core-classes/Set.js',
		'core-packages/filter.js',
		'core-packages/io.js',
		'core-packages/palette.js',
		'core-packages/vizlet.js',
		'packages/log/AjaxAppender.js',
		'packages/log/AlertBoxAppender.js',
		'packages/log/BufferingAppender.js',
		'packages/log/ConsoleAppender.js',
		'packages/log/DOMAppender.js',
		'packages/capture.js',
		'packages/layout.js',
		'packages/pubsub.js',
		'packages/store.js',
		'packages/geo/openLayers2.js',
		'packages/geo/openLayers3.js',
		'packages/geo/legacyMap.js',
		'packages/chart/AxisLayer.js',
		'packages/chart/BarSeriesLayer.js',
		'packages/chart/ChartLayer.js',
		'packages/chart/RuleLayer.js',
		'packages/chart/LineSeriesLayer.js',
		'packages/canvas/RaphaelCanvas.js',
		'core-classes/NodeLayer.js',
		'core-classes/LinkLayer.js',
		'core-classes/SankeyPathLayer.js'
	];

	// Find current file's location
	var rootPath = (function() {
		var srcMatch = /(^.*\/)aperture\.js(\?|$)/gi,
			scriptTags = document.getElementsByTagName('script'),
			i, len, src, match;

		for (i=0, len=scriptTags.length; i<len; i++) {
			src = scriptTags[i].getAttribute('src');
			if(match = srcMatch.exec(src)) {
				return match[1];
			}
		}
		return '';
	}());

	// Prime global
	window.aperture = {};

	// Inject scripts
	var tags = [];
	for (var i=0, len=scripts.length; i<len; i++) {
		tags.push('<script src="' + rootPath + scripts[i] + '"></script>');
	}
	document.write(tags.join(''));
}());