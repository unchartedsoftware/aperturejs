package oculus.aperture.graph.aggregation;

public interface Cancellable extends Runnable {

	/**
	 * Requests the operation be cancelled.  Cancellation may not be 
	 * immediate (although this method should not block waiting for the cancel).
	 */
	public void requestCancel();
}