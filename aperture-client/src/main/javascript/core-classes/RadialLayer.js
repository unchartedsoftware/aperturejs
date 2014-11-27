/**
 * Source: RadialLayer.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview The Radial Layer Implementation
 */

/**
 * @namespace
 * @ignore
 * Ensure namespace exists
 */
aperture = (
/** @private */
function(namespace) {

	// precalculate a few factors for speed.
	var degreesToRadians = Math.PI / 180,
		petalArcRadial = Math.SQRT2 - 1,
		petalTanFactor = 1 / Math.tan( degreesToRadians * 45 ),
		petalStemFactor = Math.SQRT1_2,

		/**
		 * @private
		 */
		rotateProto = function ( xy ) {
			var x= xy.x,
				y= xy.y;

			xy.x = x*this.cos - y*this.sin;
			xy.y = x*this.sin + y*this.cos;
		},

		/**
		 * @private
		 */
		noop = function () {
		},

		/**
		 * @private
		 * Creates a rotation element for efficient
		 * repeated calls to rotate.
		 */
		rotation = function ( angle ) {
			if (!angle) {
				return { angle: 0, rotate : noop };
			}
			var rad= degreesToRadians * angle;

			return {
				angle: angle,
				cos: Math.cos( rad ),
				sin: Math.sin( rad ),
				rotate : rotateProto
			};
		},

		/**
		 * @private
		 */
		arcFns = {
	
			/**
			 * @private
			 * Returns vertices and properties for a petal arc.
			 * Method signature is intentionally the same as for pies.
			 *
			 * @param spread
			 *  spread of the petal as an angle in degrees (will cap at 90)
			 *  
			 * @param length
			 *  the radial length
			 *  
			 * @param rotation
			 *  an optional rotation
			 */
			bloom : function ( length, spread, rotation ) {

					// y arc radial
				var ry = length * petalArcRadial,

					// x arc radial
					rx = ry * (spread < 90? Math.tan( degreesToRadians * 0.5 * spread )
											* petalTanFactor : 1),

					// proto point offsets
					px = rx * petalStemFactor,
					py = ry * petalStemFactor,

					// create the return object.
					arc = {
						rx : rx,
						ry : ry,
						rotation : rotation.angle,
						largeArcFlag : 1,

						// pre-rotation
						points : [{ x : -px, y : -py },
											{ x :  px, y : -py }]
					};

				// apply rotation
				rotation.rotate( arc.points[0] );
				rotation.rotate( arc.points[1] );

				return arc;
			},

			/**
			 * @private
			 * Returns vertices and properties for a wedge.
			 * Method signature is intentionally the same as for petals.
			 *
			 * @param spread
			 *  spread of the wedge as an angle
			 *  
			 * @param length
			 *  the radial length
			 *  
			 * @param rotation0
			 *  the rotation of the first arm of the sector
			 *  
			 * @param rotation1
			 *  the rotation of the second arm of the sector
			 */
			pie : function ( length, spread, rotation0, rotation1 ) {

				// create the return object.
				var arc = {
					rx : length,
					ry : length,
					rotation : 0,
					largeArcFlag : (spread > 180? 1 : 0),

					// start with identity points, then rotate them below.
					points : [{ x : 0, y : -length },
										{ x : 0, y : -length }]
				};

				// apply rotations
				rotation0.rotate( arc.points[0] );
				rotation1.rotate( arc.points[1] );

				return arc;
			}
		},

		/**
		 * @private
		 * Creates a forward or backward path from an arc definition.
		 *
		 * @param arc
		 *  the arc object as created by one of the arc functions (bloom, pie)
		 *
		 * @param prefix
		 *  the move to (M,m) or line to (L,l) prefix, depending on whether this is the beginning
		 *  or middle of a path.
		 *
		 * @param sweep-flag
		 *  the sweep flag value, 0 or 1.
		 */
		arcPath = function ( arc, prefix, sweepFlag ) {
			var i1 = sweepFlag,
				i0 = sweepFlag? 0:1;

			return prefix + ' '
				+ arc.points[i0].x + ','
				+ arc.points[i0].y + ' A'
				+ arc.rx + ','
				+ arc.ry + ' '
				+ arc.rotation + ' '
				+ arc.largeArcFlag + ','
				+ sweepFlag + ' '
				+ arc.points[i1].x + ','
				+ arc.points[i1].y;
		},

		/**
		 * @private
		 * Creates the path for a circle given the radius and the stroke direction
		 * @param radius
		 * @param sweep direction (alternate for inner vs. outer arcs)
		 */
		circlePath = function( radius, direction ) {
			var pt1 = -radius + ',0',
				pt2 = radius + ',0',
				radiusSpec = radius+','+radius;

			return 'M'+pt1+' A'+radiusSpec+' 0,0,'+direction+' '+
					pt2+' A'+radiusSpec+' 0,0,'+direction+' '+pt1+' z';
		},

		/**
		 * @private
		 * Series sorter.
		 */
		sortByRadialLength = function( a, b ) {
			return a.radius - b.radius;
		},

		none = 'none',

		// property defaults
		defaults = {
			'sector-count' : undefined,
			'start-angle' : 0,
			'form' : 'pie',
			'base-radius': 0,
			'outline': null,
			'outline-width': 3,
            'axis-stroke-width': 0,
            'axis-stroke': '#000',
            'axis-stroke-dasharray': '',
            'axis-length': 0
		},
		seriesDefaults = {
			'radius' : 20,
			'fill' : none,
			'opacity' : 1,
			'stroke' : none,
			'stroke-width' : 1
		},


		// assumes pre-existence of layer.
		RadialLayer = aperture.Layer.extend( 'aperture.RadialLayer',

		/** @lends aperture.RadialLayer# */
		{
			/**
			 * @class
			 * Represents a layer of point located radial indicators.
			 * Radial layers are capable of representing simple circles, but may also
			 * be subdivided in the form of pies, donuts, or bloom indicators with discrete
			 * petals. They may also represent concentric series, which is particularly
			 * good at showing change or difference. A pie form with series creates
			 * a polar area diagram (also known as a coxcomb or rose), the most
			 * historically famous of which may be Florence Nightingale's visualization of
			 * mortality causes in the Crimean War.<br><br>
			 *
			 * If the sector-count property is mapped, each item in the first order data array
			 * represents a subdivision into discrete wedges or petals (sectors), whereas the second
			 * order represents concentric series for each. If left unmapped, the series is assumed
			 * to be the first order in the data.
			 * Series data will always be drawn concentrically from inside to outside with intersections
			 * removed, no matter what the order of size in the data.
			 * 
			 * @mapping {Number=0} x
			 *  The horizontal offset from the origin the layer will be drawn, as a value from 0 to 1. This value
			 *  is normalized against the width of the layer.
			 *  <i>Evaluated for each radial node.</i>
			 *
			 * @mapping {Number=0} y
			 *  The vertical offset from the origin the layer will be drawn, as a value from 0 to 1. This value
			 *  is normalized against the height of the layer.
			 *  <i>Evaluated for each radial node.</i>
			 *
			 * @mapping {'pie'|'bloom'|'radar'} form
			 *  The form of layer elements. A
			 *  <span class="fixedFont">'pie'</span>
			 *  form can be used for pie, donut, or coxcomb indicators,
			 *  suitable for partitioned data, whereas a
			 *  <span class="fixedFont">'bloom'</span>
			 *  form can be used for discrete multi-variate data, similar to a radar chart.
             *  <span class="fixedFont">'radar'</span>
             *  form can be used for single or multi-variate data.
			 *  If a single data element is provided, a circle is produced and this property
			 *  will have no effect.
			 *  <i>Evaluated for each radial node.</i>
			 *
			 * @mapping {Number=0} start-angle
			 *  The start angle of the first sector, in degrees. <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=0} base-radius
			 *  The inner radius from which to start drawing. All other
			 *  radius values are relative to this value. This value is ignored for bloom forms.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=1} sector-count
			 *  The number of sectors into which the layer element is subdivided. Note that for
			 *  convenience, if this value is left unmapped, the data will be assumed to NOT be
			 *  indexed by sectors, meaning that series may be indexed in data without having to
			 *  parent them with a single 'fake' sector.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {String='none'} outline
			 *  The color of an optional outline drawn behind the full perimeter of each layer element, separate from the stroke
			 *  properties of each segment.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=3} outline-width
			 *  The width of the outline, if an outline is not 'none'.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number=1} outline-opacity
			 *  The opacity of the outline, if an outline is not 'none'.
			 *  <i>Evaluated for each radial node.</i>
			 * 
			 * @mapping {Number} sector-angle
			 *  The spread of the element, as an angle in degrees. If unset this value is
			 *  calculated automatically to be an equal fraction of 360 degrees for each sector.
			 *  <i>Evaluated for each sector of each radial node.</i>
			 * 
			 * @mapping {Number=1} series-count
			 *  The number of series for each sector.
			 *  <i>Evaluated for each sector of each radial node.</i>
			 * 
			 * @mapping {Number=20} radius
			 *  The radial length of the wedge or petal.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 * 
			 * @mapping {String='none'} fill
			 *  The fill color.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 *
			 * @mapping {String='none'} stroke
			 *  The outline stroke color.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 *
			 * @mapping {Number=1} stroke-width
			 *  The outline stroke width.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 * 
			 * @mapping {Number=1} opacity
			 *  The opacity as a value from 0 to 1.
			 *  <i>Evaluated for each series of each sector of each radial node.</i>
			 *
             * @mapping {Number=0} axis-stroke-width
             *  The stroke width of the axis lines.  Will not draw if 0.
             *  <i>Evaluated for each radial node.</i>
             *
             * @mapping {String='#000'} axis-stroke
             *  The stroke color of the axis lines.
             *  <i>Evaluated for each radial node.</i>
             *
             * @mapping {String=''} axis-stroke-dasharray
             *  The stroke line style of the axis lines.  Use RaphaelJs styles.
             *  <i>Evaluated for each radial node.</i>
             *
             * @mapping {Number=0} axis-length
             *  The length of axis lines.  Will use the max distance from the node if set to 0.
             *  <i>Evaluated for each radial node.</i>
             *
			 * @constructs
			 * @factoryMade
			 * @extends aperture.Layer
			 * @requires a vector canvas
			 */
			init : function( spec, mappings ) {
				aperture.Layer.prototype.init.call(this, spec, mappings );
			},

			// type flag
			canvasType : aperture.canvas.VECTOR_CANVAS,

            /**
             * @private
             * Render a node to a set of graphics
             */
            renderNode : function( node, data, p, transition, independent ) {

                var i, iSegment, iSeries, node, visuals, graphics;

                var numSegments = p['sector-count'],
                    segmented = 0,
                    rotation0 = rotation(p['start-angle']),
                    innerRadius = p['base-radius'],
                    outlineWidth = p['outline-width'],
                    outline = outlineWidth && p.outline !== 'none' && p.outline,
                    outlinePath = '',
                    maxRadius = 0,
                    arc = arcFns.pie,
                    strokes = [],
                    shapes = [],
                    dimSkip = false,
                    path,
                    j,
                    axisWidth = p['axis-stroke-width'],
                    axisColor = p['axis-stroke'],
                    axisDashStyle = p['axis-stroke-dasharray'],
                    axisLength = p['axis-length'],
                    rotations = [],
                    out;


                if (numSegments == undefined) {
                    numSegments = 1;
                    dimSkip = true;
                }
                // use a different arc function for blooms,
                // and we don't currently support the inner radius so reset it to zero.
                if (p.form === 'bloom') {
                    innerRadius = 0;
                    arc = arcFns.bloom;
                }

                var defSpread = 360 / numSegments;

                // Check for single segment
                for( iSegment = 0; iSegment < numSegments; iSegment++ ) {
                    if (this.valueFor( 'sector-angle', data, defSpread, iSegment ) && ++segmented === 2) {
                        break;
                    }
                }

                segmented = segmented > 1;

                //build radial data for all segments
                var segmentRadialData = [], radialData;
                var seriesIndex;

                for( iSegment = 0; iSegment < numSegments; iSegment++ ) {

                    var numSeries = this.valueFor( 'series-count', data, 1, iSegment );
                    radialData = [];

                    // Collect all series data for sorting
                    for( iSeries = 0; iSeries < numSeries; iSeries++ ) {
                        seriesIndex = dimSkip? [iSeries] : [iSegment, iSeries];
                        radialData.push(this.valuesFor(seriesDefaults, data, seriesIndex));
                    }

                    // Sort by increasing radial length
                    radialData.sort( sortByRadialLength );

                    segmentRadialData.push(radialData);
                }

                //build the paths

                if(independent) {
                    out = this.buildNodeSeriesIndependentPaths(numSeries, numSegments, innerRadius, segmented, segmentRadialData, rotation0, shapes, outline, data, defSpread, rotations);

                    outlinePath = out.outlinePath;
                    maxRadius = out.maxRadius;

                } else {
                    out = this.buildNodeSeriesJoinedPaths(numSeries, numSegments, innerRadius, segmented, segmentRadialData, rotation0, shapes, outline, data, defSpread, arc, rotations);

                    outlinePath = out.outlinePath;
                    maxRadius = out.maxRadius;
                }


                //draw the radial axis markers
                if(segmented && axisWidth) {

                    var axisPath = 'M 0,0';

                    if(!axisLength) {
                        axisLength = maxRadius;
                    }

                    for(i = 0; i < rotations.length; i++) {
                        var rot = rotations[i];

                        var axisPt = { x : 0, y : -(innerRadius + axisLength) };
                        rot.rotate(axisPt);


                        axisPath +=  ' L' + ' '
                            + axisPt.x + ','
                            + axisPt.y + ' M 0,0';




                    }

                    shapes.unshift({
                        graphic: {
                            // arc plus a tapered point to 0,0
                            'path': axisPath,
                            'fill': none,
                            'opacity': 1,
                            'stroke-width': axisWidth,
                            'stroke': axisColor,
                            'stroke-dasharray': axisDashStyle
                        }
                    });
                }


                    // NOW PROCESS ALL SHAPES INTO GRAPHICS.
                // There is one node per radial visual.
                var xCoord = node.position[0]+ (this.valueFor('x', node.data, 0))*node.width,
                    yCoord = node.position[1]+ ((this.valueFor('y', node.data, 0)))*node.height,
                    ud = node.userData;

                visuals = ud.visuals;
                graphics  = node.graphics;

                var nShapes = shapes.length,
                    transform = 't' + xCoord + ',' + yCoord;

                // insert perimeter outline?
                if (outline) {

                    // Create the inner path of the ring
                    if (innerRadius) {
                        outlinePath += ' ' + circlePath( innerRadius, 0 );
                    }
                    outlinePath += ' Z';

                    var attrs = {
                        'fill': none,
                        'stroke' : outline,
                        'stroke-width' : outlineWidth,
                        'opacity' : this.valueFor('outline-opacity', node.data, 1),
                        'transform' : transform
                    };

                    path = ud.outline;

                    if (path) {
                        attrs.path = outlinePath;
                        graphics.attr(path, attrs, transition);
                    } else {
//								console.log(outlinePath);

                        path = ud.outline = graphics.path(outlinePath);
                        graphics.toBack(path);
                        graphics.attr(path, attrs);
                    }
                } else if (ud.outline) {
                    graphics.remove(ud.outline);
                    ud.outline = null;
                }

                // get visuals, create storage if not already there
                if (!visuals) {
                    visuals = ud.visuals = [];
                }

                // sync our set of path visuals.
                if (visuals.length > nShapes) {
                    graphics.removeAll(visuals.splice(nShapes, visuals.length - nShapes));
                } else {
                    while (visuals.length < nShapes) {
                        path = graphics.path();
                        visuals.push(path);
                    }
                }

                // Turn it into graphics.
                for (j = 0; j < shapes.length; j++) {

                    // add transform attribute as well.
                    shapes[j].graphic.transform = transform;

                    // apply all attributes.
                    graphics.attr(visuals[j], shapes[j].graphic, transition);

                    // Set the data associated with this visual element
                    graphics.data( visuals[j], data, [shapes[j].segment, shapes[j].series] );
                }

            },

            /**
             * @private
             * Build paths for a joined series node implementation  (bloom and pie)
             */
            buildNodeSeriesIndependentPaths : function(numSeries, numSegments, innerRadius, segmented, segmentRadialData, rotation0, shapes, outline, data, defSpread, rotations) {
                //build each series
                var iSeries, iSegment, radialData, path, outlinePath, maxRadius, i;


                radialData = segmentRadialData[0];
                maxRadius = 0;

                for( iSeries = 0; iSeries < numSeries; iSeries++ ) {
                    var innerArc = innerRadius,
                        singleSeries = numSeries === 1,
                        outerArc,
                        nextRadialData;

                    var stroke = radialData[iSeries].stroke,
                        strokeWidth = radialData[iSeries]['stroke-width'],
                        fill   = radialData[iSeries].fill,
                        outlineSeries = outline && iSeries == numSeries-1;


                    if(segmented) {

                        path = undefined;

                        for( iSegment = 0; iSegment < numSegments; iSegment++ ) {

                            radialData = segmentRadialData[iSegment];

                            var  spread = this.valueFor( 'sector-angle', data, defSpread, iSegment ),
                                radius = radialData[iSeries].radius,
                                rotation1 = rotation( rotation0.angle + spread );

                            if(rotations.length != numSegments) {
                                rotations.push(rotation0);
                            }

                            if (!spread || radius <= 0) {
                                rotation0 = rotation1;
                                continue;
                            }

                            maxRadius = Math.max( maxRadius, radius );



                            outerArc = { x : 0, y : -(innerRadius + radius) };
                            rotation0.rotate(outerArc);


                            if(!path) {
                                path =  'M' + ' '
                                    + outerArc.x + ','
                                    + outerArc.y ;
                            }

                            path +=  'L' + ' '
                                + outerArc.x + ','
                                + outerArc.y ;


                            rotation0 = rotation1;
                        }

                        path += ' Z';

                        if (outlineSeries) {
                            outlinePath = path;
                        }

                    }  else {
                        // outerArc is the outer radius
                        outerArc = innerRadius + radius;

                        // start with the outer circle.
                        path = circlePath( outerArc, 1 );

                        // then if there is a cutout, add that.
                        if( innerArc ) {

                            // Create the inner path of the ring using the innerArc (radius)
                            path += circlePath( innerArc, 0 );
                        }

                        // form the outline.
                        if (outlineSeries) {
                            outlinePath = path;
                        }
                    }


                    if(fill) {
                        shapes.push({
                            graphic: {
                                'path': path,
                                'fill': fill,
                                'opacity': radialData[iSeries].opacity,
                                'stroke-width': 0,
                                'stroke': none
                            },
                            series: iSeries
                        });
                    }

                    if (stroke !== none) {
                        shapes.push({
                            graphic: {
                                // arc plus a tapered point to 0,0
                                'path': path,
                                'fill': none,
                                'opacity': 1,
                                'stroke-width': strokeWidth,
                                'stroke': stroke
                            },
                            series: iSeries
                        });
                    }
                }

                return {outlinePath:outlinePath, maxRadius:maxRadius};
            },

            /**
             * @private
             * Build paths for an independent series node implementation  (radar)
             */
            buildNodeSeriesJoinedPaths : function(numSeries, numSegments, innerRadius, segmented, segmentRadialData, rotation0, shapes, outline, data, defSpread, arc, rotations) {

                var iSeries, iSegment, radialData, path, outlinePath, j, maxRadius = 0;
                var strokes = [];

                // For each radial, build
                for( iSegment = 0; iSegment < numSegments; iSegment++ ) {

                    var numSeries = this.valueFor( 'series-count', data, 1, iSegment ),
                        spread = this.valueFor( 'sector-angle', data, defSpread, iSegment ),
                        rotation1 = rotation( rotation0.angle + spread ),
                        innerArc = innerRadius,
                        singleSeries = numSeries === 1,
                        outerArc,
                        outerPath;

                    if(rotations.length != numSegments) {
                        rotations.push(rotation0);
                    }

                    if (!spread) {
                        continue;
                    }

                    radialData = segmentRadialData[iSegment];

                    // start somewhere?
                    if ( innerRadius && segmented ) {
                        innerArc = arc( innerRadius, spread, rotation0, rotation1 );
                    }

                    // Iterate from inner to outer-most series
                    for( iSeries = 0; iSeries < numSeries; iSeries++ ) {

                        var radius = radialData[iSeries].radius,
                            stroke = radialData[iSeries].stroke,
                            strokeWidth = radialData[iSeries]['stroke-width'],
                            fill   = radialData[iSeries].fill,
                            outlineSeries = outline && iSeries == numSeries-1;

                        // skip items with no radius.
                        if ( radius <= 0 ) {
                            continue;
                        }

                        maxRadius = Math.max( maxRadius, radius );

                        // has radial segments?
                        if( segmented ) {

                            // Create radial petal
                            outerArc = arc( innerRadius + radius, spread, rotation0, rotation1 );

                            // form the arc to begin the path.
                            path = outerPath = arcPath( outerArc, 'M', 1 );

                            // append to the outline.
                            if (outlineSeries) {
                                if (outlinePath) {
                                    outlinePath += arcPath( outerArc, ' L', 1 );
                                } else {
                                    outlinePath = outerPath;
                                }
                            }

                            // the complete shape, tapered to point 0,0 (strokes use this as well)
                            outerPath += ' L0,0 Z';

                            if( innerArc ) {
                                // outer arc plus inner arc reversed, then closed
                                path += arcPath( innerArc, 'L', 0 ) + ' Z';

                            } else {
                                path = outerPath;
                            }


                        } else {    // else create a circle.

                            // outerArc is the outer radius
                            outerArc = innerRadius + radius;

                            // start with the outer circle.
                            path = outerPath = circlePath( outerArc, 1 );

                            // then if there is a cutout, add that.
                            if( innerArc ) {

                                // Create the inner path of the ring using the innerArc (radius)
                                path += circlePath( innerArc, 0 );
                            }

                            // form the outline.
                            if (outlineSeries) {
                                outlinePath = outerPath;
                            }
                        }

                        // add the filled part, if there is something visible here.
                        if (fill || (singleSeries && stroke)) {
                            shapes.push({
                                graphic: {
                                    'path': path,
                                    'fill': fill,
                                    'opacity': radialData[iSeries].opacity,
                                    'stroke-width': singleSeries ? strokeWidth : 0,
                                    'stroke': singleSeries ? stroke : none
                                },
                                series: iSeries,
                                segment: iSegment
                            });
                        }

                        // have to draw the stroke separately in all
                        // multi-series cases because:
                        // a) it needs to define the outer edge only and
                        // b) it needs to sit on top.
                        if (!singleSeries && stroke !== none) {
                            strokes.push({
                                graphic: {
                                    // arc plus a tapered point to 0,0
                                    'path': outerPath,
                                    'fill': none,
                                    'opacity': 1,
                                    'stroke-width': strokeWidth,
                                    'stroke': stroke
                                },
                                series: iSeries,
                                segment: iSegment
                            });
                        }


                        // This one's outer becomes the next one's inner
                        innerArc = outerArc;
                    }

                    // increment angle.
                    rotation0 = rotation1;
                }

                // add the strokes in reverse order.
                for ( j = strokes.length; j-- > 0; ) {
                    shapes.push(strokes[j]);
                }

                return {outlinePath:outlinePath, maxRadius:maxRadius};
            },

             /**
			 * @private
			 * Render implementation
			 */
			render : function( changeSet ) {

				// FOR NOW - process all changes INEFFICIENTLY as total rebuilds.
				var toProcess = changeSet.updates, transition = changeSet.transition;
                var node, data, i, p;

				// Handle adds
				for( i=toProcess.length-1; i>=0; i-- ) {
					node = toProcess[i];
                    data = node.data;
                    p = this.valuesFor(defaults, data);

                    if (p.form === 'bloom' || p.form === 'pie') {
                        this.renderNode( node, data, p, transition, false );
                    } else if(p.form === 'radar') {
                        this.renderNode( node, data, p, transition, true );
                    }

				}

			}
		}
	);

	// expose item
	namespace.RadialLayer = RadialLayer;

	return namespace;

}(aperture || {}));

