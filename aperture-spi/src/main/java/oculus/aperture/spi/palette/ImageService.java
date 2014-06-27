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
package oculus.aperture.spi.palette;

/**
 * An abstract interface specialized by specific image services such as the IconService
 * and ImageRenderService.
 * 
 * @author djonker
 */
public interface ImageService {

	public enum ImageType {
		
		JPEG(".jpg", "image/jpeg"),
		PNG(".png",  "image/png"),
		SVG(".svg",  "image/svg+xml");
		
		private final String extension;
		private final String mimeType;

		/**
		 * Handles constructors above.
		 */
		private ImageType(String extension, String mimeType) {
			this.extension = extension;
			this.mimeType = mimeType;
		}

		/**
		 * Gets the file extension for this type.
		 */
		public String getExtension() {
			return extension;
		}

		/**
		 * Gets the mime type for this type.
		 */
		public String getMimeType() {
			return mimeType;
		}

		/* (non-Javadoc)
		 * @see java.lang.Enum#toString()
		 */
		@Override
		public String toString() {
			return mimeType;
		}
	}


	/**
	 * The image data resulting from an inline image capture
	 */
	public interface ImageData {
		/**
		 * Returns the raw byte data of the image
		 */
		public byte[] getData();

		/**
		 * Returns the image mime type
		 */
		public String getMediaType();
	}
	
}
