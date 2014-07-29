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
package oculus.aperture.capture.phantom.impl;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.util.Map;

import oculus.aperture.capture.phantom.RenderExecutor;
import oculus.aperture.common.rest.ApertureServerResource;

import org.json.JSONObject;
import org.restlet.data.CacheDirective;
import org.restlet.data.MediaType;
import org.restlet.representation.OutputRepresentation;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.Get;

import com.google.common.collect.ImmutableList;
import com.google.inject.Inject;

/**
 * @author djonker
 *
 */
public class PhantomTaskResource extends ApertureServerResource {

	private static final String RECONNECT_RESPONSE = "{RECONNECT}";
	private static final String SHUTDOWN_RESPONSE = "{SHUTDOWN}";
	
	private RenderExecutor context;
	
	
	
	
	@Inject
	public PhantomTaskResource(RenderExecutor context) {
		this.context = context;
	}
	
	
	
	
	/**
	 * Writable character stream.
	 * @author djonker
	 */
	private class StreamStringRepresentation extends OutputRepresentation {
		private PhantomRenderer owner;
		
		public StreamStringRepresentation(PhantomRenderer owner) {
			super(MediaType.TEXT_PLAIN);
			
			this.owner = owner;
		}




		@Override
		public void write(OutputStream outputStream) throws IOException {
			Writer writer = new OutputStreamWriter(outputStream, "UTF-8");
			int timeout = 12;
			
			while (true) {
				// get the next task. this will block for a period of time waiting to
				// keep phantom.js from having to ask too often.
				Map<String, Object> task = owner.nextTask(timeout);

				try {
					// return the task as JSON
					if (task != null && 
						(task.get("reconnect") == null || !(Boolean)task.get("reconnect"))
					) {
						getApertureLogger().debug("Task Retrieved for source: " + task.get("source"));

						// flush this task.
						writer.write(new JSONObject(task).toString());
						writer.flush();
						timeout = 0;
							
					} else {
						writer.write(RECONNECT_RESPONSE);
						writer.flush();
						
						return;
					}
					
				// indicates that this client has left us before we handed off the task. make it available again.
				} catch (IOException e) {
					owner.reofferCurrent();
					return;
				}
			}
		}
	}
	
	
	
	
	@Get
	public Representation getTask() {
		final String workerId = (String)this.getRequestAttributes().get("workerId");

		// should never happen.
		if (workerId == null) {
			throw new IllegalArgumentException("workerId may not be null");
		}

		// get the matching renderer. since this rest resource class handles all task 
		// requests we need to match it up with the worker that is requesting it.
		PhantomRenderer renderer =
			((PhantomRendererPool)this.context).getRenderer(workerId);

		// just in case a phantom process is still hanging around, orphaned from a
		// previous instance of us, handle this by issuing a shutdown notice.
		if (renderer == null) {
			getApertureLogger().warn("Received task request for non-existent worker. Issuing shutdown notice.");

			return new StringRepresentation(SHUTDOWN_RESPONSE);
			
		} 

		// never cache this response (in case you were thinking of it)
		getResponse().setCacheDirectives(ImmutableList.of(CacheDirective.noCache()));
	
		return new StreamStringRepresentation(renderer);
	}
}
