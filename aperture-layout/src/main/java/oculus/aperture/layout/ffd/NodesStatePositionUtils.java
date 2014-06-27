/**
 * Copyright (c) 2013-2014 Oculus Info Inc.
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
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package oculus.aperture.layout.ffd;

import java.awt.geom.Point2D;
import java.awt.geom.Rectangle2D;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;

public class NodesStatePositionUtils {

	public static Map<NodesPositionState, Point2D> computeNPSOffsets(Collection<NodesPositionState> npss) {
		Map<NodesPositionState, Point2D> results =
			new HashMap<NodesPositionState, Point2D>();
		
		
		LinkedList<NodesPositionState> notOrderedByHeight = new LinkedList<NodesPositionState>();
		
		
		double totalArea = 0;
		
		for (NodesPositionState nps : npss) {
			Rectangle2D bb = nps.getBoundingBox();
			double curArea = bb.getWidth()*bb.getHeight();
			if (curArea == 0) {
				curArea = 0.1*(double)nps.getNodeIds().size();
			}
			totalArea+=curArea;
			
			//Just stick them in any order
			notOrderedByHeight.add(nps);
			
		}
		
		//Suggested maximum height of the layout of the bounding boxes
		double maxHeight = Math.sqrt(totalArea)*0.9;
		double buffer = maxHeight*0.03;
		
		double xoffset = 0;
		double yoffset = 0;
		double maxXOffsetRow = 0;
		
		for (NodesPositionState nps : notOrderedByHeight) {
			Rectangle2D bb = nps.getBoundingBox();			
			//Set the offsets for this nps in the results table.
			results.put(nps, new Point2D.Double(xoffset,yoffset));
		
			//First, check to see if the width of this nps is larger than the maxXOffsetRow
			//(This is used to determine how far the xoffset needs to change when moving to the
			//next column)
			if (bb.getWidth() >= maxXOffsetRow) {
				maxXOffsetRow = bb.getWidth()+buffer;
			}
			
			//Increment the yoffset by the height of this bounding box, then see if it goes over the
			//maxHeight limit
			yoffset += bb.getHeight()+buffer;
			if (yoffset > maxHeight) {
				//Need to adjust the x offset and reset the max offset for the new column
				xoffset+=maxXOffsetRow+buffer;
				maxXOffsetRow=0;
				yoffset=0;
			}
			
		}
		
		return results;
	}
	
}
