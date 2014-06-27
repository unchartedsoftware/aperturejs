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
package oculus.aperture.icons.batik;

import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;

import oculus.aperture.icons.IconData;
import oculus.aperture.spi.palette.ImageProcessingException;
import oculus.aperture.spi.palette.ImageService.ImageType;

import org.apache.batik.dom.svg.SAXSVGDocumentFactory;
import org.apache.batik.dom.util.DOMUtilities;
import org.apache.batik.transcoder.TranscoderException;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.ImageTranscoder;
import org.apache.batik.transcoder.image.JPEGTranscoder;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.apache.batik.util.XMLResourceDescriptor;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

/**
 * @author djonker
 *
 */
public class IconDataEncoder {

	
	/**
	 * Encodes the svg source from stream to IconData and closes the stream.
	 */
	public static IconData encode(InputStream svg, ImageType mediaType, int width, int height) throws ImageProcessingException {

		IconData result = null;

		try {
			switch( mediaType ) {
			case SVG:
				result = encodeSVG(svg, width, height);
				break;
				
			case JPEG:
				JPEGTranscoder jpeg = new JPEGTranscoder();
				jpeg.addTranscodingHint(JPEGTranscoder.KEY_QUALITY, new Float(1));
				
				result = encodeImage(svg, jpeg, ImageType.JPEG.getMimeType(), width, height);
				break;
				
			case PNG:
				result = encodeImage(svg, new PNGTranscoder(), ImageType.PNG.getMimeType(), width, height);
				break;
				
			default:
				throw new ImageProcessingException("Unsupported media type: "+ mediaType);
			}
			
		} catch (ImageProcessingException ipe) {
			closeQuietly(svg);
			throw ipe;
			
		} catch (RuntimeException re) {
			closeQuietly(svg);
			throw re;
		}
		
		closeQuietly(svg);
		
		return result;
		
	}
	
	/**
	 * Encodes the svg resource as is.
	 */
	private static IconData encodeSVG(InputStream svg, int width, int height) throws ImageProcessingException {
		
		try {
			String parser = XMLResourceDescriptor.getXMLParserClassName();
		    SAXSVGDocumentFactory factory = new SAXSVGDocumentFactory(parser);
		    Document doc = factory.createDocument(null, svg);
		    
		    // Get the root element (the 'svg' element).
		    Element svgRoot = doc.getDocumentElement();

		    // The view area in the units of the geometry space.
		    String viewbox = svgRoot.getAttribute("viewBox");

		    // should never be null.
		    if (viewbox != null) {
		    	try {
		    		
		    		// get previous width and height for aspects.
		    		String sw = svgRoot.getAttribute("width");
		    		String sh = svgRoot.getAttribute("height");
		    		
		    		// number parts
	    			sw = sw.split("[^\\.-9]")[0].trim();
	    			sh = sh.split("[^\\.-9]")[0].trim();
	    			
	    			// now parse as numbers
		    		double w = Double.parseDouble(sw);
		    		double h = Double.parseDouble(sh);

		    		// compare aspect ratios.
		    		double srcAspectRatio = w / h;
		    		
		    		// if width is not specified...
		    		if (width <= 0) {
		    			
		    			// and height is, then convert width to aspect (else leave size as is)
		    			if (height > 0) {
		    				width = (int)((double)height * srcAspectRatio);
		    			}

		    		// if height is not specified, convert height to aspect
		    		} else if (height <= 0) {
	    				height = (int)((double)width / srcAspectRatio);
	    				
	    			// else fit to max bounds by changing the view box (need to allocate xtra space)
		    		} else {
			    		double desAspectRatio = width / height;

					    if (desAspectRatio != srcAspectRatio) {
						    String vbNums[] = viewbox.split("[\\s,]");

						    double vx = Double.parseDouble(vbNums[0]);
						    double vy = Double.parseDouble(vbNums[1]);
						    double vw = Double.parseDouble(vbNums[2]);
						    double vh = Double.parseDouble(vbNums[3]);
						    
						    // extra width to fill?
						    if (desAspectRatio > srcAspectRatio) {
						    	double halfDif = vh * (desAspectRatio - srcAspectRatio) * .5;

						    	vx -= halfDif;
						    	vw  = vh * desAspectRatio;
						    	
					    	// or extra height to fill
						    } else {
						    	double halfDif = vw / (srcAspectRatio - desAspectRatio) * .5;

						    	vy -= halfDif;
						    	vh  = vw / desAspectRatio;
						    }
						    
						    viewbox = vx + " " + vy + " " + vw + " " + vh;

						    // set new value.
						    svgRoot.setAttribute("viewBox", viewbox);
					    }
		    		}
		    		
				    
		    	} catch(Exception x) {
		    		// TODO: no big deal but should log warning.
		    	}
		    }
		    
		    // set size.
		    if (width > 0) {
			    svgRoot.setAttribute("width", String.valueOf(width) + "px");
		    } 
		    if (height > 0) {
			    svgRoot.setAttribute("height", String.valueOf(height) + "px");
		    }

		    
		    // now write it out.
			final ByteArrayOutputStream buffer = new ByteArrayOutputStream();
			final BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(buffer));
			DOMUtilities.writeDocument(doc, writer);
			
			// make sure everything is written.
			writer.flush();
			
			// return the result.
			return new IconData( buffer.toByteArray(), ImageType.SVG.getMimeType());
			
		} catch (Exception e) {
			throw new ImageProcessingException("Exception loading SVG: " + e.getMessage(), e);
		}
	}
	
	/**
	 * Encodes the svg to an image
	 */
	private static IconData encodeImage(InputStream svg, ImageTranscoder transcoder, String mediaType, int width, int height) 
		throws ImageProcessingException {
		
		ByteArrayOutputStream buffer = new ByteArrayOutputStream();

		try {
			TranscoderInput input= new TranscoderInput(svg);
			TranscoderOutput output= new TranscoderOutput(buffer);

			// hints
			if (width > 0)
				transcoder.addTranscodingHint(ImageTranscoder.KEY_WIDTH, new Float(width));
			if (height > 0)
				transcoder.addTranscodingHint(ImageTranscoder.KEY_HEIGHT, new Float(height));
			
			// do the transcoding
			transcoder.transcode(input, output);
			
			// and get the result as a byte array.
			return new IconData(buffer.toByteArray(), mediaType);
		}
		catch (TranscoderException e) {
			throw new ImageProcessingException("Exception transcoding SVG to " + mediaType 
					+ ": "+ e.getMessage(), e);
		}
	}
	
	/**
	 * Close stream without complaint.
	 */
	private static void closeQuietly(InputStream stream) {
		try {
			stream.close();
		} catch (Exception e) {
		}
	}
	
}
