package oculus.aperture.capture.phantom.impl;

import java.util.List;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

public class WebShutdownListener implements ServletContextListener {

	@Override
	public void contextInitialized(ServletContextEvent sce) {
		// do nothing
	}

	@Override
	public void contextDestroyed(ServletContextEvent sce) {
		List<PhantomRendererPool> allPools = PhantomRendererPool.POOLS;

		while (!allPools.isEmpty()) {
			(allPools.get(0)).kill();
		}
	}
}

