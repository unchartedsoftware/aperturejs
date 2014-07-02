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
package oculus.aperture.common.data;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import oculus.aperture.spi.common.data.QuantizedRange;

/**
 * Represents a range of double values.
 * 
 * @author djonker
 */
public class BoundedLinearQuantizedRange implements QuantizedRange {

	private double min = Double.MAX_VALUE;
	private double max =-Double.MAX_VALUE;
	private boolean empty = true;
	
	private final int numBands;
	private List<MyBand> bands;
	private double step;
	
	/**
	 * Represents a range band.
	 * 
	 * @author djonker
	 */
	private static class MyBand implements Band {
		private double bandMin;
		private double bandLimit;
		
		public MyBand(double min, double limit) {
			bandMin = min;
			bandLimit = limit;
		}
		
		/*
		 * (non-Javadoc)
		 * @see oculus.charitynet.util.QuantizedRange.Band#getMin()
		 */
		public double getMin() {
			return bandMin;
		}

		/* (non-Javadoc)
		 * @see oculus.charitynet.util.QuantizedRange.Band#getLimit()
		 */
		@Override
		public double getLimit() {
			return bandLimit;
		}
	}
	
	/**
	 * Constructs a new range.
	 */
	public BoundedLinearQuantizedRange(int numBands) {
		this.numBands = numBands;
	}

	/* (non-Javadoc)
	 * @see oculus.charitynet.util.QuantizedRange#isEmpty()
	 */
	public boolean isEmpty() {
		return empty;
	}
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.util.QuantizedRange#getStart()
	 */
	public double getStart() {
		calcBands();
		
		return bands.get(0).bandMin;
	}

	/* (non-Javadoc)
	 * @see oculus.charitynet.util.QuantizedRange#getEnd()
	 */
	public double getEnd() {
		calcBands();
		
		return bands.get(bands.size()-1).bandMin + step;
	}
	
	/* (non-Javadoc)
	 * @see oculus.charitynet.util.QuantizedRange#getBands()
	 */
	public List<? extends Band> getBands() {
		calcBands();
		return bands;
	}
	
	/*
	 * (non-Javadoc)
	 * @see oculus.charitynet.util.QuantizedRange#bandIndex(double)
	 */
	public int bandIndex(double value) {
		calcBands();

		// normalize
		value = Math.floor((value - bands.get(0).getMin()) / step);

		//System.out.print((int)value);
		
		// constrain
		return Math.max(0, Math.min(bands.size()-1, (int)value));
	}
	
	/*
	 * (non-Javadoc)
	 * @see oculus.charitynet.util.QuantizedRange#expand(double)
	 */
	public void expand(double value) {
		if (min > value) {
			min = value;
			bands = null;
		}
		if (max < value) {
			max = value;
			bands = null;
		}
		empty = false;
	}

	
	/**
	 * Expands range to fit all values in collection, as necessary.
	 */
	public void expand(Collection<Double> values) {
		for (Double value : values) {
			expand(value);
		}
	}

	// used in banding
	private static double roundStep( double step ) {
		
		double round = Math.pow( 10, Math.floor( Math.log( step ) * 0.4342944819032518 /* LOG10E */ ) );

		// round steps are considered 1, 2, or 5.
		step /= round;

		if (step <= 2) {
			step = 2;
		} else if (step <= 5) {
			step = 5;
		} else {
			step = 10;
		}

		return step * round;
	}
	
	/**
	 * Recalc bands.
	 */
	private void calcBands() {
		if (bands != null) {
			return;
		}
		
		double start = min, end = max;
		int spec = numBands;
			
		// if zero range, handle problem case by bumping up the end of range by a tenth (or 1 if zero).
		if (end == start) {
			end = (end != 0? end + 0.1* Math.abs(end) : 1);
		}
		
		// if range spans zero, want an increment to fall on zero,
		// so use the larger half to calculate the round step.
		if (end * start < 0) {
			// cannot properly create only one band if it spans zero.
			if (spec == 1) {
				spec = 2;
			}
			// use the greater absolute.
			if (end > -start) {
				spec *= end / (end-start);
				start = 0;

			} else {
				spec *= -start / (end-start);
				end = 0;
			}
		}

		step = roundStep((end - start) / spec);

		double next = Math.floor( min / step ) * step;
		double bandmin;

		bands = new ArrayList<MyBand>();
		
		// build the range.
		do {
			bandmin = next;
			next += step;
			bands.add(new MyBand(bandmin, bandmin+step));
	
		} while (next < max);

	}
}
