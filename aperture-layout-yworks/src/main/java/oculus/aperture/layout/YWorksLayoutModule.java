/**
 * Copyright (C) 2013 Oculus Info Inc. 
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

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
package oculus.aperture.layout;

import oculus.aperture.layout.LayoutGraphFactory;
import oculus.aperture.layout.yworks.YWorksFactory;

import com.google.inject.AbstractModule;
import com.google.inject.multibindings.Multibinder;

/**
 * Bindings for inclusion of yYworks as an aperture layout provider. yWorks is proprietary
 * software and requires a license for use and distribution. Distribution of yWorks must be
 * in obfuscated form and must not publicly expose yWorks functionality through any other
 * API.
 * 
 * Note that yFiles 2.4.0.3 has an issue with JDK 7, however this is a workaround if needed:
 * http://kb.yworks.com/article550.html
 */
public class YWorksLayoutModule extends AbstractModule {

	/* (non-Javadoc)
	 * @see com.google.inject.AbstractModule#configure()
	 */
	@Override
	protected void configure() {
		Multibinder<LayoutGraphFactory> binder =
			Multibinder.newSetBinder(binder(), LayoutGraphFactory.class);

		binder.addBinding().to(YWorksFactory.class);
	}

}
