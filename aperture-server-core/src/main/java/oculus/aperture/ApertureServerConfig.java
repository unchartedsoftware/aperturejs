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
package oculus.aperture;

import java.lang.reflect.Constructor;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import oculus.aperture.config.DefaultServerConfigModule;
import oculus.aperture.rest.RestModule;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Splitter;
import com.google.common.collect.Lists;
import com.google.inject.Guice;
import com.google.inject.Injector;
import com.google.inject.Module;
import com.google.inject.servlet.GuiceServletContextListener;

/**
 * Main entry-point (so to speak) of an Aperture server.  Finds a list of 
 * guice module classes in web.xml, instantiates them, and passes them to
 * a new Guice injector.
 * 
 * @author rharper
 *
 */
public class ApertureServerConfig extends GuiceServletContextListener {
	
	final Logger logger = LoggerFactory.getLogger(getClass());

	/**
	 * The name of the attribute in the web.xml used to specify module classes
	 */
	public static final String MODULES_ATTRIBUTE = "guice-modules";

	private List<Module> modules;

	@Override
	public void contextInitialized(ServletContextEvent servletContextEvent) {
		ServletContext context = servletContextEvent.getServletContext();

		/*
		 * Extract modules class names to add from web.xml
		 */
		String moduleNames = context.getInitParameter(MODULES_ATTRIBUTE);
		modules = Lists.newLinkedList();

		// these are standard and in our core.
		logger.info("Adding Core Aperture Guice Modules: "
				+ DefaultServerConfigModule.class.getName() + ", "
				+ RestModule.class.getName()
				);
		
		modules.add(new DefaultServerConfigModule(context));
		modules.add(new RestModule(context));
		
		if (moduleNames != null) {
			for (String moduleName : Splitter.on(':').split(moduleNames)) {
				try {
					moduleName = moduleName.trim();
					if (moduleName.length() > 0) {
						// Create instance of module, add to list
						Class<?> moduleClass = Class.forName(moduleName);
						
						Module module = null;
						
						// First try constructor that takes a ServletContext
						try {
							Constructor<?> cons = moduleClass.getConstructor(ServletContext.class);
							// Have a specialized constructor, invoke
							module = (Module)cons.newInstance(context);
						} catch (Exception e) {
							// Noop - silent fail on this constructor
						}
						
						// Second, try no-arg constructor
						if( module == null ) {
							// No specialized constructor, use no-arg
							module = (Module)moduleClass.newInstance();
						}
						
						if( module != null ) {
							logger.info("Adding Guice Module: "+moduleClass.getName());
							modules.add( module );
							
							if (module instanceof ServletContextListener) {
								try {
									((ServletContextListener)module).contextInitialized(servletContextEvent);
								} catch (Exception e) {
									logger.error("Exception caught while notifying module of servlet context destruction", e);
								}
							}
							
						} else {
							// Cannot load specified module, 
							throw new RuntimeException("No valid constructor found for module class: " + moduleClass.getName());
						}
					}
				} catch (InstantiationException e) {
					throw new RuntimeException(e);
				} catch (ClassNotFoundException e) {
					throw new RuntimeException(e);
				} catch (IllegalAccessException e) {
					throw new RuntimeException(e);
				}
			}
		}

		super.contextInitialized(servletContextEvent);
	}

	
	/* (non-Javadoc)
	 * @see com.google.inject.servlet.GuiceServletContextListener#contextDestroyed(javax.servlet.ServletContextEvent)
	 */
	@Override
	public void contextDestroyed(ServletContextEvent servletContextEvent) {
		for (Module module : modules) {
			if (module instanceof ServletContextListener) {
				try {
					((ServletContextListener)module).contextDestroyed(servletContextEvent);
				} catch (Exception e) {
					logger.error("Exception caught while notifying module of servlet context destruction", e);
				}
			}
		}
		
		super.contextDestroyed(servletContextEvent);
	}


	@Override
	protected Injector getInjector() {
		/*
		 * Create injector
		 */
		return Guice.createInjector(modules);
	}

}
