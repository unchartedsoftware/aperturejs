/**
 * Copyright (C) 2013 Oculus Info Inc.
 * http://www.oculusinfo.com/
 * 
 * Released under the MIT License.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

aperture.tooltip = (function(ns) {

	var tooltipExists = false;
	var tooltipDiv = null;
	var tooltipInnerDiv = null;
	var tooltipID = "apertureTooltip";
	var tooltipTimer = null;
	var tooltipPending = false;
	var tooltipVisible = false;
	
	var overridingMouseMove = false;
	var oldMouseMove = null;
	
	var assertTooltip = function() {
		if (!tooltipExists) {
			tooltipDiv = document.createElement("div");
			tooltipDiv.style.zIndex = '999999999';
			tooltipDiv.style.position = 'absolute';
			tooltipDiv.id = tooltipID;
			tooltipDiv.style.display = "none";
			
			tooltipInnerDiv = document.createElement("div");
			tooltipInnerDiv.setAttribute("class", "apertureTooltip");

			tooltipDiv.appendChild(tooltipInnerDiv);
			
			window.document.body.appendChild(tooltipDiv);
			tooltipExists = true;
		}
	};
	
	var positionTooltip = function(posx,posy) {
		var w = $(window).width();
		var h = $(window).height();
		var ew = 'E';
		var ns = 'S';
		if (posx<w/2) {
			tooltipDiv.style.left = (posx+2) + "px";
			tooltipDiv.style.right = '';
			ew = 'E';
		} else {
			posx = w-posx;
			tooltipDiv.style.left = '';
			tooltipDiv.style.right = (posx+2) + "px";
			ew = 'W';
		}
		if (posy>h/2) {
			posy = h-posy;
			tooltipDiv.style.top = "";
			tooltipDiv.style.bottom = (posy+2) + "px";
			ns = 'N';
		} else {
			tooltipDiv.style.top = (posy+2) + "px";
			tooltipDiv.style.bottom = "";
			ns = 'S';
		}
		tooltipInnerDiv.setAttribute("class", "apertureTooltip"+ns+ew);
	};
	
	var setTooltipVisible = function(spec, posx, posy) {
		positionTooltip(posx, posy);
		tooltipDiv.style.display = "";
		tooltipPending = false;
		tooltipVisible = true;
	};
	
	var getEventXY = function(e) {
		var posx=0, posy=0;
		if (e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		} else if (e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft
				+ document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop
				+ document.documentElement.scrollTop;
		}
		return [posx,posy];
	};
	
	var overrideMouseMove = function(target) {
		if (!overridingMouseMove) {
			oldMouseMove = document.onmousemove;
			document.onmousemove = function(event) {
				var pos = getEventXY(event);
				positionTooltip(pos[0], pos[1]);
				return true;
			};
			overridingMouseMove = true;
		}
	};

	var cancelMouseMoveOverride = function() {
		if (overridingMouseMove) {
			document.onmousemove = oldMouseMove;
			overridingMouseMove = false;
		}
	};
	
	var cancelTooltip = function() {
		if (tooltipPending) {
			clearTimeout(tooltipTimer);
			tooltipPending = false;
		}
		tooltipDiv.style.display = "none";
		tooltipVisible = false;
		cancelMouseMoveOverride();
	};

	ns.showTooltip = function(spec) {
		var pos = getEventXY(spec.event.source);
		
		assertTooltip();
		if (tooltipVisible) {
			if (tooltipInnerDiv.innerHTML==spec.html) {
				return;
			}
		}
		cancelTooltip();
		tooltipInnerDiv.innerHTML = spec.html;
		if (spec.delay) {
			tooltipPending = true;
			tooltipTimer = setTimeout(function(){setTooltipVisible(spec, pos[0], pos[1]);}, spec.delay);
		} else {
			setTooltipVisible(spec, pos[0], pos[1]);
		}
		overrideMouseMove(spec.event.source.target);
	};
	
	ns.hideTooltip = function() {
		assertTooltip();
		cancelTooltip();
	};
	
	return ns;
	
}(aperture.tooltip || {}));