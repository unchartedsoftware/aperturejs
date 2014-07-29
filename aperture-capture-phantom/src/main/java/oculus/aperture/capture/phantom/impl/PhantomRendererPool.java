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

import java.io.File;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

import oculus.aperture.capture.phantom.RenderExecutor;
import oculus.aperture.capture.phantom.impl.PhantomCommandLineCapture.ShutdownEvent;
import oculus.aperture.capture.phantom.impl.PhantomCommandLineCapture.ShutdownListener;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Manages a pool of renderers
 * 
 * @author djonker
 */
public class PhantomRendererPool implements RenderExecutor {

	final Logger logger = LoggerFactory.getLogger(getClass());

	// A queue of actors ready to service our requests
	private BlockingQueue<PhantomRenderer> available;
	private Map<String, PhantomRenderer> lookup;

	private ContentService contentService;
	private String requestEndpoint;
	
	// default config is empty.
	private Properties config;
	
	
	/**
	 * Creates a pool of the specified size (injected).
	 * 
	 * @param poolSize
	 * 		The count of render executors.
	 */
	public PhantomRendererPool(
			ContentService contentService,
			String requestEndpoint,
			Properties config
			) {
		this.contentService = contentService;
		this.requestEndpoint = requestEndpoint;
		this.config = config;
		
		lookup = Collections.synchronizedMap(new HashMap<String, PhantomRenderer>());
	}

	
	/* (non-Javadoc)
	 * @see oculus.aperture.phantom.RenderExecutor#init(java.lang.String)
	 */
	@Override
	public void init(String rootRef) {
		if (lookup.isEmpty()) {

			final String platformDefault = "bin/"+ (System.getProperty("os.name").startsWith("Windows")? 
					"phantomjs.exe" : "phantomjs");
			
			final int poolSize = config.getInteger("aperture.imagecapture.phantomjs.poolsize", 3);
			final String exePath = config.getString("aperture.imagecapture.phantomjs.exepath", platformDefault);
			final String sslCertificatePath = config.getString("aperture.imagecapture.phantomjs.ssl-certificates-path", null);
			final String sslIgnoreErrors = config.getString("aperture.imagecapture.phantomjs.ssl-ignore-errors", null);
			String baseUrlOverride = config.getString("aperture.imagecapture.phantomjs.base-url", null);

			logger.debug("Creating " + poolSize + " phantom renderers");
			
			available = new ArrayBlockingQueue<PhantomRenderer>(poolSize);
			
			if(sslCertificatePath != null && !(new File(sslCertificatePath)).exists()) {
				logger.warn("Specified a non-existent SSL certificate path: {}", sslCertificatePath);
			}

			if(sslIgnoreErrors != null && !sslIgnoreErrors.toLowerCase().matches("true|false|yes|no")) {
				logger.warn("Specified an invalid value for ssl-ignore-errors, must be true, false, yes or no: {}", sslIgnoreErrors);
			}
			
			if (baseUrlOverride != null) {
				
				rootRef = rootRef.replaceFirst("^.+?[^\\/:](?=[?\\/]|$)", baseUrlOverride);
				logger.info("Replacing url with " + rootRef);
			}			
			
			// fill the pool for the kiddies
			for( int i=0; i<poolSize; i++ ) {
				final String uid = UUID.randomUUID().toString();

				final String taskPageUrl = 
					rootRef + requestEndpoint.replace("{workerId}", uid);
				
				final PhantomRenderer renderer = new PhantomRenderer(
					contentService,
					exePath,
					taskPageUrl,
					uid,
					sslCertificatePath,
					sslIgnoreErrors
				);
				
				renderer.addListener(new ShutdownListener() {
					
					@Override
					public void fireShutdownEvent(ShutdownEvent e) {
						available.remove(renderer);
						lookup.remove(uid);
					}
				});

				available.add(renderer);
				lookup.put(uid, renderer);
			}
		}
	}
	
	
	
	
	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.ImageRenderService#cachedImageRender(java.util.Map)
	 */
	@Override
	public DocumentDescriptor storedImageRender(Map<String, Object> params) {
		
		if (lookup.isEmpty()) {
			throw new IllegalStateException("PhantomRendererPool must be initialized.");
		}
		
		try {
			// get an available renderer, waiting if necessary.
			final PhantomRenderer renderer = available.take();
			
			// execute the render.
			final DocumentDescriptor id = renderer.storedImageRender(params);

			// place it back in the queue.
			available.put(renderer);

			// return the completed result.
			return id;
			
		} catch(InterruptedException e) {
			throw new RuntimeException("Wait for available rendererer was interrupted.", e);
		}
	}
	
	
	
	
	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.ImageRenderService#inlineImageRender(java.util.Map)
	 */
	@Override
	public ImageData inlineImageRender(Map<String, Object> params) {

		if (lookup.isEmpty()) {
			throw new IllegalStateException("PhantomRendererPool must be initialized.");
		}
		
		try {
			// get an available renderer, waiting if necessary.
			final PhantomRenderer renderer = available.take();
			
			// execute the render.
			final ImageData data = renderer.inlineImageRender(params);

			// place it back in the queue.
			available.put(renderer);

			// return the completed result.
			return data;
			
		} catch(InterruptedException e) {
			throw new RuntimeException("Wait for available rendererer was interrupted.", e);
		}
	}
	
	
	
	
	/**
	 * Returns a worker renderer with the specified id or null if not found.
	 * This implementation must be thread-safe.
	 */
	public PhantomRenderer getRenderer(String workerId) {
		return lookup.get(workerId);
	}

	/**
	 * Shutdown
	 */
	public void kill() {
		for(PhantomRenderer renderer : lookup.values()) {
			renderer.kill();
		}
	}
}
