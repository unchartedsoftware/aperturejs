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

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.inject.Inject;

/**
 * A version of the capture worker that actually executes a commandline program 
 * and writes the image to a temp file.  It then reads from the temp file and 
 * returns the image bytes.
 */
public class PhantomCommandLineCapture {
	
	private enum GobblerType {
		ERROR,
		OUTPUT
	}
	
	private static final String LOG_SUCCESS = "SUCCESS";
	private static final String LOG_ERROR = "LOAD ERROR";
	private static final String LOG_SHUTDOWN = "{SHUTDOWN}";
	
	/**
	 * Sinks stream contents to the log
	 */
	class StreamGobbler extends Thread
	{

		private InputStream is;
	    private GobblerType type;
	    private String filename = null;
	    private final PhantomRenderer resource;
		private volatile boolean isRunning = true;
	    
	    StreamGobbler(
	    	InputStream is,
	    	GobblerType type,
	    	PhantomRenderer resource
	    ) {
	    	setDaemon(false); // wait for thread to terminate so it's not reported as a leak 
	        this.is = is;
	        this.type = type;
	        this.resource = resource;
	        
	        this.setName("PhantomCommandLineCapture StreamGobbler");
	    }
	    
	    public void run()
	    {
	        try
	        {
	            InputStreamReader isr = new InputStreamReader(is);
	            BufferedReader br = new BufferedReader(isr);
	            String line=null;
	      
	            while ((line = br.readLine()) != null && isRunning) {
	            	logger.debug(line = line.trim()); 
	            	if (type == GobblerType.OUTPUT) {
		            	if (line.startsWith(LOG_SUCCESS)) {
		            		resource.putResponse(true);
		            	} else if (line.startsWith(LOG_ERROR)) {
		            		resource.putResponse(false);
		            	} else if (line.equals(LOG_SHUTDOWN)) {
		            		for(ShutdownListener listener : listeners) {
		            			listener.fireShutdownEvent(new ShutdownEvent(PhantomCommandLineCapture.this));
		            		}
		            		return;
		            	}
	            	}
	            }
	        } catch (IOException ioe) {
	        	ioe.printStackTrace();  
			}
	    }

	    public void kill() {
	    	isRunning = false;
	    }

	    public String getFilename() {
	    	return filename;
	    }
	}
	
	interface ShutdownListener {
		void fireShutdownEvent(ShutdownEvent e);
	}

	class ShutdownEvent {

		private final PhantomCommandLineCapture capturer;

		ShutdownEvent(PhantomCommandLineCapture capturer) {
			this.capturer = capturer;
		}

		PhantomCommandLineCapture getCapturer() {
			return capturer;
		}
	}
	
	
	
	private final Logger logger = LoggerFactory.getLogger(getClass());
	private final String cmdLocation;
	private final PhantomRenderer resource;
	private final String taskPageUrl;
	private final String sslCertificatePath;
	private final String sslIgnoreErrors;
	private final List<ShutdownListener> listeners = new ArrayList<ShutdownListener>();
	StreamGobbler errorGobbler;
	StreamGobbler outputGobbler;

	private File jsFile;
	Process proc;
	
	
	/**
	 * Creates a new commandline capture tool.
	 * 
	 * @param location
	 * @throws IOException 
	 */
	@Inject
	public PhantomCommandLineCapture(
		String location,
		PhantomRenderer resource,
		String taskPageUrl,
		String sslCertificatePath,
		String sslIgnoreErrors
	) throws IOException {
		this.cmdLocation = location;
		this.resource = resource;
		
		this.taskPageUrl = taskPageUrl;
		this.sslCertificatePath = sslCertificatePath;
		this.sslIgnoreErrors = sslIgnoreErrors;
		
		initialize();
	}
	
	
	
	
	private Thread closeProcess = new Thread("PhantomCommandLineCapture closeProcess") {
		
	    public void run() {
			cleanInitFiles();
	        proc.destroy();
	    }
	};
	
	
	
	
	/* (non-Javadoc)
	 * @see oculus.aperture.phantom.PhantomImageWorker#onTaskRequest()
	 */
	public void onTaskRequest() {
		cleanInitFiles();
	}

	void addListener(ShutdownListener listener) {
		listeners.add(listener);
	}

	boolean removeListener(ShutdownListener listener) {
		return listeners.remove(listener);
	}

	/*
	 * Delete temporary file created in constructor if haven't already done so
	 */
	private void cleanInitFiles() {
		if (jsFile != null) {
			try {
				if (!jsFile.delete()) {
					logger.warn("Failed to delete temp copy of rasterize.js");
				}
			} catch (Exception e) {
				logger.warn("Failed to delete temp copy of rasterize.js", e);
			}
			jsFile = null;
		}
	}

	/**
	 * Called on construction or if the stream gobbler sees the initial process exit.
	 * Launches a new phantom process with a new stream watcher.
	 * 
	 * @throws IOException
	 */
	private void initialize() throws IOException {
		
		cleanInitFiles();
		
		// create new temporary javascript file from rasterize.js
		InputStream in = getClass().getResourceAsStream("/oculus/aperture/capture/phantom/rasterize.js");
		jsFile = File.createTempFile("PhantomRender", ".js");	
		
		OutputStream out = new FileOutputStream(jsFile);
		byte buf[] = new byte[1024];
		int len;
		while ((len = in.read(buf)) > 0) {
			out.write(buf,0,len);
		}
		
		in.close();
		out.flush();
		out.close();
		
		// Populate the commandline arguments
		List<String> cmd = new ArrayList<String>();
		cmd.add(cmdLocation);
		cmd.add("--proxy-type=none");
		if(sslCertificatePath != null && !sslCertificatePath.isEmpty()) {
			cmd.add("--ssl-certificates-path=" + sslCertificatePath);
		}
		
		if(sslIgnoreErrors != null && !sslIgnoreErrors.isEmpty()) {
			cmd.add("--ignore-ssl-errors=" + sslIgnoreErrors);
		}
		
		cmd.add(jsFile.getAbsolutePath());
		cmd.add(taskPageUrl);
		
		String args = "";
		for (String arg : cmd){
			args += (args.isEmpty()?"":" ") + arg;
		}
		logger.info("Running capture: " + args);
		
		// Start PhantomJS process and add shutdown hook
		proc = Runtime.getRuntime().exec(cmd.toArray(new String[0]));
		Runtime.getRuntime().addShutdownHook(closeProcess); 
		
		errorGobbler = new StreamGobbler(proc.getErrorStream(), GobblerType.ERROR, resource);            
		outputGobbler = new StreamGobbler(proc.getInputStream(), GobblerType.OUTPUT, resource);
        errorGobbler.start();
        outputGobbler.start();
	}

	void kill() {
		errorGobbler.kill();
		outputGobbler.kill();
		proc.destroy();
	}
}
