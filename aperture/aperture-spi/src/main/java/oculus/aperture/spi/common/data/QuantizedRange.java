package oculus.aperture.spi.common.data;

import java.util.List;

public interface QuantizedRange {

	/**
	 * Represents a single quantized band, which at minimum can
	 * be represented by it's minimum value.
	 */
	public interface Band {
		
		/**
		 * Any value greater or equal to this value will pass the
		 * first band membership qualification.
		 */
		public double getMin();
		
		/**
		 * Any value less than this value will pass the
		 * second band membership qualification.
		 */
		public double getLimit();
	}
	
	/**
	 * Expands to fit value, if necessary.
	 */
	public void expand(double value);
	
	/**
	 * @return the empty
	 */
	public boolean isEmpty();

	/**
	 * @return the lower bound of the range
	 */
	public double getStart();

	/**
	 * @return the upper bound of the range
	 */
	public double getEnd();

	/**
	 * Returns a rounded set of evenly quantized bands.
	 */
	public List<? extends Band> getBands();
	
	/**
	 * Returns the index of the band that the value falls into.
	 */
	public int bandIndex(double value);

}