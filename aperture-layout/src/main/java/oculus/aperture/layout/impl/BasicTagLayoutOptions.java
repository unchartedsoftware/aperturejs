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
package oculus.aperture.layout.impl;

import java.lang.reflect.Field;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import oculus.aperture.spi.common.Alignments;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.layout.options.TagLayoutOptions;

/**
 * @author djonker
 *
 */
public class BasicTagLayoutOptions extends BasicGraphLayoutOptions implements
		TagLayoutOptions {

	private final int tagHeight;
	private final int tagWidth;
	private final int alignmentOptions;
	private final int defaultAlignment;
	private final boolean preferCurrent;
	
	private final static Map<String, Integer> ALIGNMENTS;
	
	/**
	 * Seed the conversion map from string alignments to const ints.
	 */
	static {
		Map<String, Integer> map = new HashMap<String, Integer>();
		
		Field fields[] = Alignments.class.getFields();
		
		for (int i=0; i< fields.length; i++) {
			try {
				final String s = fields[i].getName().toLowerCase();
				final StringBuilder sb = new StringBuilder();
				
				int a = 6 /*ALIGN_*/, b;
				while ((b = s.indexOf('_', a)) > 0) {
					sb.append(s.substring(a, b));
					sb.append(Character.toUpperCase(s.charAt(b+1)));
					a = b+2;
				}
				sb.append(s.substring(a));
				map.put(sb.toString(), (Integer)fields[i].get(null));
				
			} catch (IllegalArgumentException e) {
			} catch (IllegalAccessException e) {
			}
		}
		
		ALIGNMENTS = Collections.unmodifiableMap(map);
	}
	
	/**
	 * @param options
	 */
	public BasicTagLayoutOptions(String layoutType, Properties extents, Properties options) {
		super(layoutType, extents, options);
		
		tagWidth = options.getInteger("tagWidth", 100);
		tagHeight = options.getInteger("tagHeight", 15);
		
		int a = 0;
		
		String align = options.getString("alignments", "any");
		if (align.indexOf(',') >= 0) {
			String list[] = align.split(",");

			for (int i=0; i < list.length; i++) {
				Integer aval = ALIGNMENTS.get(list[i].trim());
				
				if (aval != null) {
					a |= aval;
				}
			}
		} else {
			Integer aval = ALIGNMENTS.get(align);
			
			if (aval != null) {
				a = aval;
			}
		}
		alignmentOptions = a != 0? a : Alignments.ALIGN_ANY;
		
		// DEFAULT
		Integer aval = ALIGNMENTS.get(options.getString("preferred", "default"));
		defaultAlignment = aval != null? aval : 0;

		preferCurrent = options.getBoolean("preferCurrent", false);
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.TagLayoutOptions#getTagHeight()
	 */
	@Override
	public int getTagHeight() {
		return tagHeight;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.TagLayoutOptions#getTagWidth()
	 */
	@Override
	public int getTagWidth() {
		return tagWidth;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.TagLayoutOptions#getAlignmentOptions()
	 */
	@Override
	public int getAlignmentOptions() {
		return alignmentOptions;
	}

	/*
	 * (non-Javadoc)
	 * @see oculus.aperture.spi.layout.TagLayoutOptions#getDefaultAlignment()
	 */
	@Override
	public int getPreferredAlignment() {
		return defaultAlignment;
	}

	/* (non-Javadoc)
	 * @see oculus.aperture.spi.layout.TagLayoutOptions#preferCurrent()
	 */
	@Override
	public boolean preferCurrentAlignment() {
		return preferCurrent;
	}


}
