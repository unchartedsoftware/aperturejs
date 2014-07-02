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
package oculus.aperture.common.rest;

import java.io.IOException;
import java.io.OutputStream;

import org.restlet.data.CharacterSet;
import org.restlet.data.MediaType;
import org.restlet.representation.OutputRepresentation;

/**
 * A generic output representation useful for returning binary data.  Must be
 * given a MediaType and may optionally include a CharacterSet for text.
 *
 * @author rharper
 *
 */
public class BlobRepresentation extends OutputRepresentation {

	private final byte[] data;

	public BlobRepresentation(MediaType mediaType, byte[] data) {
		super(mediaType, data.length);
		this.data = data;
	}

	public BlobRepresentation(MediaType mediaType, CharacterSet charSet, byte[] data) {
		super(mediaType, data.length);
		this.data = data;
		setCharacterSet(charSet);
	}

	@Override
	public void write(OutputStream outputStream) throws IOException {
		outputStream.write(data);
	}
}
