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
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;

import oculus.aperture.capture.phantom.data.PhantomImageData;
import oculus.aperture.capture.phantom.data.ProcessedTaskInfo;
import oculus.aperture.spi.capture.CaptureService;
import oculus.aperture.spi.store.ConflictException;
import oculus.aperture.spi.store.ContentService;
import oculus.aperture.spi.store.ContentService.Document;
import oculus.aperture.spi.store.ContentService.DocumentDescriptor;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.io.ByteStreams;

/**
 * Reads facility data from an SQL Server database
 */
public class PhantomRenderer implements CaptureService {
	private PhantomCommandLineCapture worker;
	
	final Logger logger = LoggerFactory.getLogger(getClass());

	// The task queue 
	private final BlockingQueue<Map<String, Object>> taskQueue;
		
	// The processed task map
	private final BlockingQueue<DocumentDescriptor> cmsResult;
	
	// The processed image map
	private final BlockingQueue<ImageData> imageResult;

	// Any task in progress.
	private Map<String, Object> inProgress;
	
	// The name of the CMS store we'll use for image captures
	private final static String DEFAULT_STORE = "aperture.render";
	
	// The CMS service where we store our captured images
	private final ContentService contentService;
		
	private int messageSize = 0;
	private final int MAX_MESSAGE_SIZE = 131072;
	private boolean resetMessage = false; 
	
	
	/**
	 * Constructs a new renderer instance.
	 * @param contentService
	 * 		The CMS
	 * @param cmsStore
	 * 		The store id
	 * @param exePath
	 * 		The path to phantom
	 * @param rootRef
	 * 		The root reference of the incoming url
	 * @param workerId
	 * 		A unique worker id.
	 */
	public PhantomRenderer(ContentService contentService,
		String exePath,
		String taskPageUrl,
		String workerId,
		String sslCertificatePath,
		String sslIgnoreErrors
	) {
		this.contentService = contentService;
		taskQueue = new SynchronousQueue<Map<String, Object>>();
		
		try {
			this.worker = new PhantomCommandLineCapture(
				exePath, 
				this, 
				taskPageUrl,
				sslCertificatePath,
				sslIgnoreErrors
			);
			
		} catch (IOException e) {
			throw new RuntimeException("Failed to start phantom JS process: "+ exePath, e);
		}
		
		cmsResult = new SynchronousQueue<DocumentDescriptor>();
		imageResult = new SynchronousQueue<ImageData>();
	}
	
	
	
	void kill() {
		worker.kill();
		try {
			// close threads blocked on the task queue
			Map<String, Object> empty_message = new HashMap<String, Object>();
			taskQueue.offer(empty_message, 1, TimeUnit.SECONDS);
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
		}
	}


	
	public void addListener(PhantomCommandLineCapture.ShutdownListener listener) {
		this.worker.addListener(listener);
	}
	
	
	
	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.ImageRenderService#cachedImageRender(java.util.Map)
	 */
	@Override
	public DocumentDescriptor storedImageRender(Map<String, Object> task) {

		task.put("returnImage", false);
		
		try {
			logger.debug("Task Added: " + task.get("source"));
			
			// check to see if the message size exceeds the maximum allowable. If so, issue a reconnect message
			if (resetMessage) {
				sendResetMessage();
			}
			
			// this will block until a worker takes it.
			taskQueue.put(Collections.unmodifiableMap(task));
			
			// this will block until a worker populates it.
			return cmsResult.take();
			
		} catch (InterruptedException e) {
			logger.warn("Error in client-worker handoff", e);
		}
		
		return ProcessedTaskInfo.NONE;
	}
	
	
	
	
	private void sendResetMessage() throws InterruptedException {
		
		resetMessage = false;
		
		Map<String, Object> reconnect_message = new HashMap<String, Object>();
		reconnect_message.put("reconnect", true);
		taskQueue.put(reconnect_message);
	}




	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.ImageRenderService#inlineImageRender(java.util.Map)
	 */
	@Override
	public ImageData inlineImageRender(Map<String, Object> task) {
		
		task.put("returnImage", true);
		
		try {
			logger.debug("Task Added: " + task.get("source"));
			
			// check to see if the message size exceeds the maximum allowable. If so, issue a reconnect message
			if (resetMessage) {
				sendResetMessage();
			}
			
			// this will block until a worker takes it.
			taskQueue.put(Collections.unmodifiableMap(task));
			
			// this will block until a worker populates it.
			return imageResult.take();
			
		} catch (Exception e) {
			logger.warn("Error in client-worker handoff", e);
		}
		
		return PhantomImageData.NONE;
	}
	
	
	
	
	void reofferCurrent() {
		try {
			if (inProgress != null) {
				taskQueue.put(inProgress);
			}
		} catch (InterruptedException e) {
			logger.warn("Error reinstating task", e);
		}
	}
	
	
	
	
	/**
	 * Package level - used internally.
	 */
	Map<String, Object> nextTask(int timeout) {
		try {
			logger.debug("poll");

			// notify
			worker.onTaskRequest();
			
			// this will block for 5s or until there is a task supplied.
			final Map<String, Object> task = taskQueue.poll(timeout, TimeUnit.SECONDS);
			
			evaluateMessageSize(task);
			
			if (task != null) {
				logger.debug("Next: "+ String.valueOf(task));
				inProgress = task;
				return task;
			}
			
		} catch (InterruptedException e) {
			logger.warn("Error fetching task", e);
		}
		
		return null;
	}

	
	
	  
	private void evaluateMessageSize(Map<String, Object> task) throws InterruptedException {
		
		if (task == null ||
			(task.containsKey("reconnect") && (Boolean)task.get("reconnect"))
		) {
			messageSize = 0;
			return;
		}
		
		int newMessageSize;
		try {
			byte[] utf8Bytes = new JSONObject(task).toString().getBytes("UTF-8");
			newMessageSize = utf8Bytes.length;
		} catch (UnsupportedEncodingException e) {
			newMessageSize = task.toString().length();
		}
		
		messageSize += newMessageSize;
		
		if (messageSize > MAX_MESSAGE_SIZE) {		
			resetMessage = true;
		}
	}




	/**
	 * Utility method for below.
	 */
	private static String strValue(Object value) {
		return value != null? value.toString() : null;
	}
	
	
	
	
	/**
	 * Package level - used internally.
	 */
	void putResponse(boolean success) {
		final Map<String, Object> task = inProgress;
		inProgress = null;
		
		if (task != null) {
			if (success) {
				try {
		    		InputStream ins;
		    		File file = new File(strValue(task.get("filename")));
		    		byte[] data = null;
						ins = new FileInputStream(file);
						data = ByteStreams.toByteArray(ins);
					final String cType = strValue(task.get("mimeType"));

					// close file input stream.
					ins.close();
					file.delete();
					
					if (task.get("returnImage").equals(Boolean.TRUE)) {
						// releases the waiting client.
						imageResult.put(new PhantomImageData(data, cType));
						
					} else {			
						// Store to the content service, return a URL to the image
						Document doc = contentService.createDocument();
						doc.setContentType(cType);
						doc.setDocument(data);
			
						String store = strValue(task.get("store"));
						
						if (store == null || store.isEmpty()) {
							store = DEFAULT_STORE;
						}
						// Store and let the content service pick the id
						DocumentDescriptor descriptor = null;
						descriptor = contentService.storeDocument(doc, store, 
								strValue(task.get("id")), strValue(task.get("rev")));
					
						if (descriptor != null) {
							// releases the waiting client.
							cmsResult.put(new ProcessedTaskInfo(
									descriptor.getStore(), descriptor.getId(), descriptor.getRevision()));
						}
					}
					
					return;
					
				} catch (FileNotFoundException e) {
					logger.warn("Error finding temporary file", e);
				} catch (IOException e) {
					logger.warn("Error reading temporary file", e);
				} catch (ConflictException e) {
					logger.warn("Error putting result in CMS", e);
				} catch (InterruptedException e) {
					logger.warn("Failed to put result", e);
					return;
				}
			}
			try {
				// releases the waiting client.
				if (task.get("returnImage").equals(Boolean.TRUE)) {
					imageResult.put(PhantomImageData.NONE);
				} else {
					cmsResult.put(ProcessedTaskInfo.NONE);
				}
				
			} catch (InterruptedException e) {
				logger.warn("Failed to put result. Client may be left waiting.", e);
			}
			
		} else {
			logger.warn("Response encountered from phantom for an unrecognized task.");
		}
	}
}
