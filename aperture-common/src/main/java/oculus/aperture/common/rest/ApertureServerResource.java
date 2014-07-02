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

import java.util.Map;

import org.restlet.data.Status;
import org.restlet.ext.json.JsonRepresentation;
import org.restlet.resource.ResourceException;
import org.restlet.resource.ServerResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.collect.Maps;

/**
 * Extends the basic restlet server resource to handle, log and return
 * errors in a way that aperture (or other) clients can relay
 * such information to a user.
 * 
 * @author djonker
 */
public class ApertureServerResource extends ServerResource {

	final private Logger logger = LoggerFactory.getLogger(getClass());

	/**
	 * Returns the Aperture server log interface.
	 * @return
	 */
	protected Logger getApertureLogger() {
		return logger;
	}

	/* (non-Javadoc)
	 * @see org.restlet.resource.UniformResource#doCatch(java.lang.Throwable)
	 */
	@Override
	protected void doCatch(Throwable throwable) {
        Status status = null;

        if(throwable instanceof ResourceException) {
            ResourceException re = (ResourceException)throwable;
            if(re.getCause() != null) {
                throwable = re.getCause();
                status = getStatusService().getStatus(throwable, this);

            } else {
                status = re.getStatus();
            }

        } else {
            status = getStatusService().getStatus(throwable, this);
        }

        // log the message
        getApertureLogger().error("Exception or error caught in ApertureServerResource", throwable);

        if(getResponse() != null) {
            getResponse().setStatus(status);
            getResponse().setEntity(new JsonRepresentation(getErrorObject(throwable)));
        }
	}

	/**
	 * Creates a JSON-encoded error response with an optional message
	 * @param message a message to include in the error response, if null no message is included
	 * @return a JSONRepresentation object
	 */
	private Map<String,Object> getErrorObject(Throwable e) {
		Map<String,Object> content = Maps.newHashMap();
		content.put("ok", false);
		content.put("message", e.toString());

		return content;
	}

}
