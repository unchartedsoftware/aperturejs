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
package oculus.aperture.layout.tag;

import java.util.Collection;

import oculus.aperture.spi.common.Alignments;
import oculus.aperture.spi.common.Extents;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.NodeTag;
import oculus.aperture.spi.layout.options.TagLayoutOptions;

/**
 * An optimized Oculus deconfliction implementation written by Glenn Tsang 
 * with David Jonker, based on principles of the Kevin Mote paper 
 * "Fast point-feature label placement for dynamic visualizations".
 */
public class TrellisDeconfliction implements Alignments {

	private final static int NUM_ROW_ALIGNMENTS	= 3;
	private final static int NUM_ALIGNMENTS		= 8;
	
	/**
	 *  4  5  6   
	 *   \ | /
	 * 3 -   - 7
	 *   / | \
	 *  2  1  0
	 */
	private final static int[] ALIGNMENT_COMPASS = new int[] {
		2, // ALIGN_TOP_LEFT
		1, // ALIGN_TOP_CENTER
		0, // ALIGN_TOP_RIGHT
		3, // ALIGN_MIDDLE_RIGHT
		5, // ALIGN_BOTTOM_RIGHT
		6, // ALIGN_BOTTOM_CENTER
		7, // ALIGN_BOTTOM_LEFT
		4, // ALIGN_MIDDLE_LEFT
	};

	private final int[] alignmentPriorities_ = new int[8];

	// slopes that divide sectors
	private final static float SLOPE_0 = 0.41421356f;
	private final static float SLOPE_1 = 2.41421356f;
	private final static int[] JUMP_ORDER = {0,1,7,2,6,3,5,4};
	
	/**
	 *  4  5  6   
	 *   \ | /
	 * 3 -   - 7
	 *   / | \
	 *  2  1  0 [+x,+y]
	 */
	private void setAlignmentPriorities(float x, float y, int currentAlignment) {
		int i;
		
		// offset from center
		x-= .5f* viewWidth_;
		y-= .5f* viewHeight_;
		
		if (x == 0) {
			i = y < 0? 1:5; 
		} else {
			final float m = Math.abs((float)y/x);
			
			if (y >= 0) {
				if (x > 0) {
					i = m < SLOPE_0? 7: m < SLOPE_1? 0: 1;
				} else {
					i = m < SLOPE_0? 3: m < SLOPE_1? 2: 1;
				}
			} else {
				if (x > 0) {
					i = m < SLOPE_0? 7: m < SLOPE_1? 6: 5;
				} else {
					i = m < SLOPE_0? 3: m < SLOPE_1? 4: 5;
				}
			}
		}
		
		int ip = 0;
		int curAp = -1;
		
		if (currentAlignment != 0) {
			curAp = 0;
			
			while (currentAlignment > 1) {
				currentAlignment>>=1;
				curAp++;
			}
			alignmentPriorities_[ip++]= curAp;
		}
		
		for (int j=0; j < NUM_ALIGNMENTS; j++) {
			final int ap = ALIGNMENT_COMPASS[(i+JUMP_ORDER[j])%NUM_ALIGNMENTS];
			
			// only skip if current (already placed as first)
			if (ap != curAp) {
				alignmentPriorities_[ip++]= ap;
			}
		}
	}
	
	/**
	 *            
	 *   \ | /
	 *   -   -  
	 *   / | \
	 *  2  1  0 [+x,+y]
	 */
	private void setRowAlignmentPriorities(float x, float y, int currentAlignment) {
		int i;
		
		int ip = 0;
		int curAp = -1;
		
		if (currentAlignment != 0) {
			curAp = 0;
			
			while (currentAlignment > 1) {
				currentAlignment>>=1;
				curAp++;
			}
			alignmentPriorities_[ip++]= curAp;
		}
		
		// offset from center
		x-= .5f* viewWidth_;
		y-= .5f* viewHeight_;
		
		if (x == 0) {
			if (ALIGNMENT_COMPASS[1] != curAp) {
				alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[1];
			}
			if (ALIGNMENT_COMPASS[0] != curAp) {
				alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[0];
			}
			if (ALIGNMENT_COMPASS[2] != curAp) {
				alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[2];
			}
		} else {
			final float m = Math.abs((float)y)/x;
			
			if (m >= 0) {
				i = m < SLOPE_1? 0: 1;
				
				if (ALIGNMENT_COMPASS[i] != curAp) {
					alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[i];
				}
				if (ALIGNMENT_COMPASS[i==1?0:1] != curAp) {
					alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[i==1?0:1];
				}
				if (ALIGNMENT_COMPASS[2] != curAp) {
					alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[2];
				}

			} else {
				i =-m < SLOPE_1? 2: 1;
				
				if (ALIGNMENT_COMPASS[i] != curAp) {
					alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[i];
				}
				if (ALIGNMENT_COMPASS[i==1?2:1] != curAp) {
					alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[i==1?2:1];
				}
				if (ALIGNMENT_COMPASS[0] != curAp) {
					alignmentPriorities_[ip++]= ALIGNMENT_COMPASS[0];
				}
			}
		}
		
	}
	
	private float reservationSizeX_;
	private float reservationSizeY_;
	private float halfReservationSizeX_;
	private float halfReservationSizeY_;
	private int alignmentMask_ = ALIGN_ANY;
	
	
	private int trellis_[][][] = null;
	private int trellisSizeX_, trellisSizeY_;
	private int trellisCount_[][] = null;
	
	private final static int MIN_COUNT_BUFFER_INCR = 10;

	private int conflicts_[][] = new int[NUM_ALIGNMENTS][];
	private int conflictAlignments_[][] = new int[NUM_ALIGNMENTS][];
	private int conflictsCount_[] = new int[NUM_ALIGNMENTS];

	private int locations_[] = null;
	private int relocations_[] = null;

	private boolean candidate_[] = null;

	private float viewWidth_;
	private float viewHeight_;
	private float[] nodex_ = null;
	private float[] nodey_ = null;
	private double[] nodep_ = null;
	private int numNodes_ = 0;

	private float[] tempOrigin1_ = new float[2*NUM_ALIGNMENTS];
	private float[] tempOrigin2_ = new float[2*NUM_ALIGNMENTS];

	/**
	 * Constructs a deconfliction processor for use by a single client thread,
	 * with default size reservation of 100 x 15.
	 */
	public TrellisDeconfliction() {
		setReservationSize(100, 15);
	}

	/**
	 * Constructs a deconfliction processor for use by a single client thread,
	 * with the specified size registration.
	 */
	public TrellisDeconfliction(int reservationWidth, int reservationHeight) {
		setReservationSize(reservationWidth, reservationHeight);
	}
	
	/**
	 * Executes the deconfliction process for a set of primitives with consistent reserved size for each 
	 * at locations and priority specified by 'nodes'. Returns a set of new alignment masks indicating 
	 * which position the primitive should be rendered at, if at all. Priority is given to objects 
	 * which have a higher priority value.
	 * @param viewX TODO
	 * @param viewY TODO
	 * @param viewWidth 
	 * 			width of the view area in pixels
	 * @param viewHeight
	 * 			height of the view area in pixels
	 * @param nnodes
	 * 			set of nodes as a concatenation of position and priority [x0,y0,p0, x1,y1,p1, ...]. 
	 * @param whichNodes
	 * 			optional index of nodes to consider from the array (may be null). e.g. index 1 indicates
	 * 			the node represented by x1,y1,p1 in the array.
	 * 
	 * @return
	 * 			a new array of alignment masks for each primitive, where 0 indicates an occluded label 
	 * 			flagged for discarding (if filterOp is FILTER_OCCLUSIONS_DISCARD).
	 */
	public int[] deconflict(TagLayoutOptions options, Collection<? extends Node> nodes, int[] whichNodes) {

		// cache values of options.
		final Extents view = options.getView();
		final float zoom = options.getZoom();
		
		setAlignmentOptions(options.getAlignmentOptions());
		setReservationSize(options.getTagWidth(), options.getTagHeight());

		numNodes_ = nodes.size();
		
		// TODO: this buffer should be handled elsewhere.
		viewWidth_ = Math.min(4* view.getWidth(), zoom * view.getWidth());
		viewHeight_ = Math.min(4* view.getHeight(), zoom * view.getHeight());
		
		final float viewX = Math.max(0, view.getLeft() - view.getWidth());
		final float viewY = Math.max(0, view.getTop() - view.getHeight());
		
		// check allocations.
		if (nodex_ == null || nodex_.length < numNodes_) {
			nodex_ = new float[numNodes_];
			nodey_ = new float[numNodes_];
			nodep_ = new double[numNodes_];
		}
		if (locations_ == null || locations_.length < numNodes_)
			locations_ = new int[numNodes_];

		boolean isTopRow = false;
		if (isTopRow()) {
			isTopRow = true;
			alignmentMask_ = (alignmentMask_ >> 5) & ALIGN_TOP_ANY;
		}

		final boolean preferCurrent = options.preferCurrentAlignment();
		int i=0;
		
		// compact
		for (Node node : nodes) {
			nodex_[i] = (float)node.getX()*zoom - viewX;
			nodey_[i] = (float)node.getY()*zoom - viewY;
			nodep_[i] = -node.getWeight(); // higher weight -> higher priority (lower num)

			locations_[i] = 0;
			
			// current alignment
			if (preferCurrent) {
				NodeTag tag = node.getTag();
				
				if (tag != null) {
					int curAlg = tag.getAnchorY().and(tag.getAnchorX());
					
					if (isTopRow) {
						curAlg >>= 5;
					}
			
					locations_[i] = alignmentMask_ & curAlg;
				}
			}
			
			i++;
		}
		
		// Allocate relocation results and initialize
		initRelocations(whichNodes);

		// Determine trellis dimensions
		trellisSizeX_ = (int)Math.ceil(viewWidth_ / (float)reservationSizeX_);
		trellisSizeY_ = (int)Math.ceil(viewHeight_ / (float)reservationSizeY_);

		// Assign screen coords to trellis
		initTrellis();

		// Resolve conflicts
		if (isSingleAlignment())
			resolveConflictsSingle();
		else {
			initCandidatesList();
			if (isTopRow) {
				resolveConflictsBottomRow();
				alignmentMask_ = alignmentMask_ << 5;
				for (i=0; i<numNodes_; i++)
					relocations_[i] = relocations_[i] << 5;
			}
			else if (isBottomRow())
				resolveConflictsBottomRow();
			else
				resolveConflicts();
		}

		return relocations_;
	}

	
	private void setReservationSize(float x, float y) {
		reservationSizeX_ = x;
		reservationSizeY_ = y;
		halfReservationSizeX_ = x * 0.5f;
		halfReservationSizeY_ = y * 0.5f;
	}

	public float getReservationSizeX() {
		return reservationSizeX_;
	}

	public float getReservationSizeY() {
		return reservationSizeY_;
	}

	private void setAlignmentOptions(int alignmentMask) {
		alignmentMask_ = alignmentMask;

		if (isSingleAlignment()) {
			if (conflicts_[0] == null)
				conflicts_[0] = new int[MIN_COUNT_BUFFER_INCR];
		}
		else if (isBottomRow()) {
			for (int a=0; a<NUM_ROW_ALIGNMENTS; a++) {
				if (conflicts_[a] == null) {
					conflicts_[a] = new int[MIN_COUNT_BUFFER_INCR];
					conflictAlignments_[a] = new int[MIN_COUNT_BUFFER_INCR];
				}
			}
		}
		else {
			for (int a=0; a<NUM_ALIGNMENTS; a++) {
				if (conflicts_[a] == null) {
					conflicts_[a] = new int[MIN_COUNT_BUFFER_INCR];
					conflictAlignments_[a] = new int[MIN_COUNT_BUFFER_INCR];
				}
			}
		}
	}

	/**
	 * Returns the preferred alignment flag for a node in the set last deconflicted, 
	 * from the set of allowable alignments.
	 */
	public int getPreferredAlignment(int node) {
		setAlignmentPriorities(nodex_[node], nodey_[node], 0);
		
		for (int a=0; a<NUM_ALIGNMENTS; a++) {
			int ap = alignmentPriorities_[a];
			int def = 1<<ap;
			
			if ((def & alignmentMask_) != 0)
				return def;
		}
		
		// will never reach here.
		return 0;
	}
	
	/* (non-Javadoc)
	 * @see oculus.aperture.layout.IDeconfliction#getAlignmentOptions()
	 */
	public int getAlignmentOptions() {
		return alignmentMask_;
	}


	/**
	 * Returns the last result from a call to deconflict.
	 * 
	 * @return
	 * 			the previously allocated array of alignment masks for each primitive, where 0 indicates an occluded label 
	 * 			flagged for discarding (if filterOp is FILTER_OCCLUSIONS_DISCARD).
	 */
	public int[] getPreviousResult() {
		return relocations_;
	}
	
	
	/*
	 * Implementation functions below.
	 */
	private int getAlignmentIndex(int alignment) {
		int index =   ((alignment >> 1) & 1)
					+ ((alignment >> 2) & 1)*2
					+ ((alignment >> 3) & 1)*3
					+ ((alignment >> 4) & 1)*4
					+ ((alignment >> 5) & 1)*5
					+ ((alignment >> 6) & 1)*6
					+ ((alignment >> 7) & 1)*7;

		return index;
	}

	private int getAlignmentCount(int alignment) {
		int count =    (alignment       & 1)
					+ ((alignment >> 1) & 1)
					+ ((alignment >> 2) & 1)
					+ ((alignment >> 3) & 1)
					+ ((alignment >> 4) & 1)
					+ ((alignment >> 5) & 1)
					+ ((alignment >> 6) & 1)
					+ ((alignment >> 7) & 1);

		return count;
	}

	private boolean isSingleAlignment(int alignment) {
		return (getAlignmentCount(alignment) == 1);
	}

	private boolean isSingleAlignment() {
		return isSingleAlignment(alignmentMask_);
	}

	private boolean isBottomRow() {
		return (alignmentMask_ > ALIGN_TOP_LEFT && alignmentMask_ <= ALIGN_TOP_ANY) || (alignmentMask_ == (ALIGN_TOP_RIGHT | ALIGN_TOP_CENTER));
	}

	private boolean isTopRow() {
		return (alignmentMask_ > ALIGN_BOTTOM_LEFT && alignmentMask_ <= ALIGN_BOTTOM_ANY) || (alignmentMask_ == (ALIGN_BOTTOM_RIGHT | ALIGN_BOTTOM_CENTER));
	}

	private void initRelocations(final int[] whichNodes) {
		if (relocations_ == null || relocations_.length < numNodes_)
			relocations_ = new int[numNodes_];

		for (int i=0; i<numNodes_; i++)
			relocations_[i] = 0;

		if (whichNodes == null) {
			for (int i=0; i<numNodes_; i++) {
				if (nodex_[i] >= 0 && nodex_[i] <= viewWidth_ && nodey_[i] >= 0 && nodey_[i] <= viewHeight_)
					relocations_[i] = alignmentMask_;
			}
		}
		else {
			int[] list = whichNodes;
			int size = whichNodes.length;
			for (int i=0; i<size; i++) {
				int k = list[i];
				if (nodex_[k] >= 0 && nodex_[k] <= viewWidth_ && nodey_[k] >= 0 && nodey_[k] <= viewHeight_)
					relocations_[k] = alignmentMask_;
			}
		}
	}

	private void initCandidatesList() {
		if (candidate_ == null || candidate_.length < numNodes_)
			candidate_ = new boolean[numNodes_];

		for (int i=0; i<numNodes_; i++)
			candidate_[i] = false;
	}

	private void allocateTrellis() {
		if (trellis_ == null) {
			trellis_ = new int[trellisSizeX_][][];
			trellisCount_ = new int[trellisSizeX_][];
			for (int i=0; i<trellisSizeX_; i++) {
				trellis_[i] = new int[trellisSizeY_][];
				trellisCount_[i] = new int[trellisSizeY_];
				for (int j=0; j<trellisSizeY_; j++) {
					trellis_[i][j] = null;
					trellisCount_[i][j] = 0;
				}
			}
		}
		else {
			if (trellis_.length < trellisSizeX_) {
				int[][][] tmp = trellis_;
				int[][] tmpCount = trellisCount_;
				trellis_ = new int[trellisSizeX_][][];
				trellisCount_ = new int[trellisSizeX_][];
				if (tmp[0].length < trellisSizeY_) {
					for (int i=0; i<trellisSizeX_; i++) {
						trellis_[i] = new int[trellisSizeY_][];
						trellisCount_[i] = new int[trellisSizeY_];
						for (int j=0; j<trellisSizeY_; j++) {
							trellis_[i][j] = null;
						}
					}
					for (int i=0; i<tmp.length; i++) {
						for (int j=0; j<tmp[0].length; j++) {
							trellis_[i][j] = tmp[i][j];
						}
					}
				}
				else {
					for (int i=0; i<tmp.length; i++) {
						trellis_[i] = tmp[i];
						trellisCount_[i] = tmpCount[i];
					}
					for (int i=tmp.length; i<trellisSizeX_; i++) {
						trellis_[i] = new int[trellisSizeY_][];
						trellisCount_[i] = new int[trellisSizeY_];
						for (int j=0; j<trellisSizeY_; j++) {
							trellis_[i][j] = null;
						}
					}
				}
			}
			else {
				if (trellis_[0].length < trellisSizeY_) {
					for (int i=0; i<trellisSizeX_; i++) {
						int[][] tmp = trellis_[i];
						trellis_[i] = new int[trellisSizeY_][];
						trellisCount_[i] = new int[trellisSizeY_];
						for (int j=0; j<trellisSizeY_; j++) {
							trellis_[i][j] = null;
						}
						for (int j=0; j<tmp.length; j++) {
							trellis_[i][j] = tmp[j];
						}
					}
				}
			}

			for (int i=0; i<trellisSizeX_; i++) {
				for (int j=0; j<trellisSizeY_; j++) {
					trellisCount_[i][j] = 0;
				}
			}
		}
	}

	private void initTrellis() {
		allocateTrellis();

		float recipReservationSizeX = 1f / reservationSizeX_;
		float recipReservationSizeY = 1f / reservationSizeY_;
		int x, y;
		
		// Get the counts
		for (int i=0; i<numNodes_; i++) {
			if (relocations_[i] != 0) {
				x = (int)(nodex_[i] * recipReservationSizeX);
				y = (int)(nodey_[i] * recipReservationSizeY);
				trellisCount_[x][y]++;
			}
		}

		// Allocate required space
		for (int i=0; i<trellisSizeX_; i++) {
			for (int j=0; j<trellisSizeY_; j++) {
				if (trellis_[i][j] == null) {
					if (trellisCount_[i][j] > MIN_COUNT_BUFFER_INCR)
						trellis_[i][j] = new int [trellisCount_[i][j]];
					else
						trellis_[i][j] = new int [MIN_COUNT_BUFFER_INCR];
				}
				else if (trellis_[i][j].length < trellisCount_[i][j]) {
					if (trellisCount_[i][j] - trellis_[i][j].length > MIN_COUNT_BUFFER_INCR)
						trellis_[i][j] = new int [trellisCount_[i][j]];
					else
						trellis_[i][j] = new int [trellis_[i][j].length + MIN_COUNT_BUFFER_INCR];
				}
				trellisCount_[i][j] = 0;
			}
		}

		// Store coord indexes
		for (int i=0; i<numNodes_; i++) {
			if (relocations_[i] != 0) {
				x = (int)(nodex_[i] * recipReservationSizeX);
				y = (int)(nodey_[i] * recipReservationSizeY);
				trellis_[x][y][trellisCount_[x][y]] = i;
				trellisCount_[x][y]++;
			}
		}
	}

	private void setOrigins(int coord, float[] origin) {
		float scx = nodex_[coord];
		float scy = nodey_[coord];

		// ALIGN_TOP_RIGHT
		origin[0] = scx - reservationSizeX_;
		origin[1] = scy;

		// ALIGN_TOP_CENTER
		origin[2] = scx - halfReservationSizeX_;
		origin[3] = scy;

		// ALIGN_TOP_LEFT
		origin[4] = scx;
		origin[5] = scy;

		// ALIGN_MIDDLE_RIGHT
		origin[6] = scx - reservationSizeX_;
		origin[7] = scy - halfReservationSizeY_;

		// ALIGN_MIDDLE_LEFT
		origin[8] = scx;
		origin[9] = scy - halfReservationSizeY_;

		// ALIGN_BOTTOM_RIGHT
		origin[10] = scx - reservationSizeX_;
		origin[11] = scy - reservationSizeY_;

		// ALIGN_BOTTOM_CENTER
		origin[12] = scx - halfReservationSizeX_;
		origin[13] = scy - reservationSizeY_;

		// ALIGN_BOTTOM_LEFT
		origin[14] = scx;
		origin[15] = scy - reservationSizeY_;
	}

	private void addConflictSingle(int conflictCoord) {
		if (conflicts_[0].length < conflictsCount_[0] + 1) {
			int[] newConflicts = new int[conflicts_[0].length + MIN_COUNT_BUFFER_INCR];
			System.arraycopy(conflicts_[0], 0, newConflicts, 0, conflicts_[0].length);
			conflicts_[0] = newConflicts;
		}
		conflicts_[0][conflictsCount_[0]++] = conflictCoord;
	}

	private void addConflict(int alignment, int conflictCoord, int conflictAlignments) {
		if (conflicts_[alignment].length < conflictsCount_[alignment] + 1) {
			int[] newConflicts = new int[conflicts_[alignment].length + MIN_COUNT_BUFFER_INCR];
			System.arraycopy(conflicts_[alignment], 0, newConflicts, 0, conflicts_[alignment].length);
			conflicts_[alignment] = newConflicts;

			int[] newConflictAssignments = new int[conflicts_[alignment].length];
			System.arraycopy(conflictAlignments_[alignment], 0, newConflictAssignments, 0, conflictAlignments_[alignment].length);
			conflictAlignments_[alignment] = newConflictAssignments;
		}
		conflicts_[alignment][conflictsCount_[alignment]] = conflictCoord;
		conflictAlignments_[alignment][conflictsCount_[alignment]] = conflictAlignments;
		conflictsCount_[alignment]++;
	}

	private void aggregateConflictsSingle(int x, int y, int sc) {
		float x1 = nodex_[sc];
		float y1 = nodey_[sc];
		boolean xm = x-1>=0 && x-1<trellisSizeX_;
		boolean xp = x+1>=0 && x+1<trellisSizeX_;
		int xi, yj;

		yj = y-1;
		if (yj>=0 && yj<trellisSizeY_) {
			if (xm) {
				xi = x-1;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					int sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0
							&& x1 - nodex_[sc2] < reservationSizeX_
							&& y1 - nodey_[sc2] < reservationSizeY_) {
						addConflictSingle(sc2);
					}
				}
			}
	
			xi = x;
			for (int k=0; k<trellisCount_[xi][yj]; k++) {
				int sc2 = trellis_[xi][yj][k];
				if (relocations_[sc2] != 0
						&& y1 - nodey_[sc2] < reservationSizeY_) {
					addConflictSingle(sc2);
				}
			}

			if (xp) {
				xi = x+1;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					int sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0
							&& nodex_[sc2] - x1 < reservationSizeX_
							&& y1 - nodey_[sc2] < reservationSizeY_) {
						addConflictSingle(sc2);
					}
				}
			}
		}

		yj = y;
		if (xm) {
			xi = x-1;
			for (int k=0; k<trellisCount_[xi][yj]; k++) {
				int sc2 = trellis_[xi][yj][k];
				if (relocations_[sc2] != 0
						&& x1 - nodex_[sc2] < reservationSizeX_) {
					addConflictSingle(sc2);
				}
			}
		}

		if (xp) {
			xi = x+1;
			for (int k=0; k<trellisCount_[xi][yj]; k++) {
				int sc2 = trellis_[xi][yj][k];
				if (relocations_[sc2] != 0
						&& nodex_[sc2] - x1 < reservationSizeX_) {
					addConflictSingle(sc2);
				}
			}
		}

		yj = y+1;
		if (yj>=0 && yj<trellisSizeY_) {
			if (xm) {
				xi = x-1;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					int sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0
							&& x1 - nodex_[sc2] < reservationSizeX_
							&& nodey_[sc2] - y1 < reservationSizeY_) {
						addConflictSingle(sc2);
					}
				}
			}
	
			xi = x;
			for (int k=0; k<trellisCount_[xi][yj]; k++) {
				int sc2 = trellis_[xi][yj][k];
				if (relocations_[sc2] != 0
						&& nodey_[sc2] - y1 < reservationSizeY_) {
					addConflictSingle(sc2);
				}
			}
	
			if (xp) {
				xi = x+1;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					int sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0
							&& nodex_[sc2] - x1 < reservationSizeX_
							&& nodey_[sc2] - y1 < reservationSizeY_) {
						addConflictSingle(sc2);
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YM1_XM2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x1 - x2 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YM1_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YM1_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YM1_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							addConflict(0, sc2, ALIGN_TOP_RIGHT);
						}
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_Y_XM2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts = ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x1 - x2 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(0, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_Y_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (Math.abs(x1 - x2) < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (Math.abs(x1 - x2) < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(0, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_Y_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					conflicts = ALIGN_TOP_RIGHT;
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(0, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_Y_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				if (conflicts != 0)
					addConflict(0, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YP1_XM2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x1 - x2 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YP1_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YP1_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopLeft_YP1_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					if (conflicts != 0)
						addConflict(0, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YM1_XM2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x1 - x2 < reservationSizeX_) {
							addConflict(1, sc2, ALIGN_TOP_LEFT);
						}
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YM1_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(1, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YM1_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(1, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YM1_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(1, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YM1_XP2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							addConflict(1, sc2, ALIGN_TOP_RIGHT);
						}
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_Y_XM2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x1 - x2 < reservationSizeX_) {
						addConflict(1, sc2, ALIGN_TOP_LEFT);
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_Y_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (Math.abs(x1 - x2) < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(1, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_Y_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					conflicts |= ALIGN_TOP_CENTER;
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(1, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_Y_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (Math.abs(x1 - x2) < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(1, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_Y_XP2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						addConflict(1, sc2, ALIGN_TOP_RIGHT);
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YP1_XM2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x1 - x2 < reservationSizeX_) {
							addConflict(1, sc2, ALIGN_TOP_LEFT);
						}
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YP1_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(1, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YP1_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(1, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YP1_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(1, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopCenter_YP1_XP2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							addConflict(1, sc2, ALIGN_TOP_RIGHT);
						}
					}
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YM1_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x1 - x2 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YM1_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YM1_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YM1_XP2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y1 - y2 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_Y_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts = ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x1 - x2 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(2, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_Y_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x1 - x2 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					conflicts |= ALIGN_TOP_LEFT;
				}

				if (conflicts != 0)
					addConflict(2, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_Y_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (Math.abs(x1 - x2) < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (Math.abs(x1 - x2) < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				// ALIGN_TOP_LEFT
				if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
					x2 = nodex_[sc2];
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_LEFT;
					}
				}

				if (conflicts != 0)
					addConflict(2, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_Y_XP2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				conflicts = 0;

				// ALIGN_TOP_RIGHT
				if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
					x2 = nodex_[sc2] - reservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						conflicts = ALIGN_TOP_RIGHT;
					}
				}

				// ALIGN_TOP_CENTER
				if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
					x2 = nodex_[sc2] - halfReservationSizeX_;
					if (x2 - x1 < reservationSizeX_) {
						conflicts |= ALIGN_TOP_CENTER;
					}
				}

				if (conflicts != 0)
					addConflict(2, sc2, conflicts);
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YP1_XM1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x1 - x2 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YP1_X(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x1 - x2 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YP1_XP1(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (Math.abs(x1 - x2) < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					// ALIGN_TOP_LEFT
					if ((relocations_[sc2] & ALIGN_TOP_LEFT) != 0) {
						x2 = nodex_[sc2];
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_LEFT;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow_TopRight_YP1_XP2(int xi, int yj, int sc, float x1, float y1) {
		int sc2;
		float x2, y2;
		int conflicts;

		for (int k=0; k<trellisCount_[xi][yj]; k++) {
			sc2 = trellis_[xi][yj][k];
			if (relocations_[sc2] != 0 && !candidate_[sc2]) {
				y2 = nodey_[sc2];
				if (y2 - y1 < reservationSizeY_) {
					conflicts = 0;
	
					// ALIGN_TOP_RIGHT
					if ((relocations_[sc2] & ALIGN_TOP_RIGHT) != 0) {
						x2 = nodex_[sc2] - reservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts = ALIGN_TOP_RIGHT;
						}
					}
	
					// ALIGN_TOP_CENTER
					if ((relocations_[sc2] & ALIGN_TOP_CENTER) != 0) {
						x2 = nodex_[sc2] - halfReservationSizeX_;
						if (x2 - x1 < reservationSizeX_) {
							conflicts |= ALIGN_TOP_CENTER;
						}
					}
	
					if (conflicts != 0)
						addConflict(2, sc2, conflicts);
				}
			}
		}
	}

	private void aggregateConflictsBottomRow(int x, int y, int sc) {
		int xi, yj;
		float x1, y1;

		y1 = nodey_[sc];

		if ((relocations_[sc] & ALIGN_TOP_RIGHT) != 0) {
			// Set origin for first scene geometry
			x1 = nodex_[sc] - reservationSizeX_;

			yj = y-1;
			if (yj>=0 && yj<trellisSizeY_) {
				xi = x-2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_YM1_XM2(xi, yj, sc, x1, y1);

				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_YM1_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopLeft_YM1_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_YM1_XP1(xi, yj, sc, x1, y1);
			}

			yj = y;
			{
				xi = x-2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_Y_XM2(xi, yj, sc, x1, y1);

				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_Y_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopLeft_Y_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_Y_XP1(xi, yj, sc, x1, y1);
			}

			yj = y+1;
			if (yj>=0 && yj<trellisSizeY_) {
				xi = x-2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_YP1_XM2(xi, yj, sc, x1, y1);

				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_YP1_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopLeft_YP1_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopLeft_YP1_XP1(xi, yj, sc, x1, y1);
			}
		}

		if ((relocations_[sc] & ALIGN_TOP_CENTER) != 0) {
			// Set origin for first scene geometry
			x1 = nodex_[sc] - halfReservationSizeX_;

			yj = y-1;
			if (yj>=0 && yj<trellisSizeY_) {
				xi = x-2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YM1_XM2(xi, yj, sc, x1, y1);

				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YM1_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopCenter_YM1_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YM1_XP1(xi, yj, sc, x1, y1);

				xi = x+2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YM1_XP2(xi, yj, sc, x1, y1);
			}

			yj = y;
			{
				xi = x-2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_Y_XM2(xi, yj, sc, x1, y1);

				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_Y_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopCenter_Y_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_Y_XP1(xi, yj, sc, x1, y1);

				xi = x+2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_Y_XP2(xi, yj, sc, x1, y1);
			}

			yj = y+1;
			if (yj>=0 && yj<trellisSizeY_) {
				xi = x-2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YP1_XM2(xi, yj, sc, x1, y1);

				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YP1_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopCenter_YP1_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YP1_XP1(xi, yj, sc, x1, y1);

				xi = x+2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopCenter_YP1_XP2(xi, yj, sc, x1, y1);
			}
		}

		if ((relocations_[sc] & ALIGN_TOP_LEFT) != 0) {
			// Set origin for first scene geometry
			x1 = nodex_[sc];

			yj = y-1;
			if (yj>=0 && yj<trellisSizeY_) {
				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_YM1_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopRight_YM1_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_YM1_XP1(xi, yj, sc, x1, y1);

				xi = x+2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_YM1_XP2(xi, yj, sc, x1, y1);
			}

			yj = y;
			{
				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_Y_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopRight_Y_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_Y_XP1(xi, yj, sc, x1, y1);

				xi = x+2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_Y_XP2(xi, yj, sc, x1, y1);
			}

			yj = y+1;
			if (yj>=0 && yj<trellisSizeY_) {
				xi = x-1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_YP1_XM1(xi, yj, sc, x1, y1);

				xi = x;
				aggregateConflictsBottomRow_TopRight_YP1_X(xi, yj, sc, x1, y1);

				xi = x+1;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_YP1_XP1(xi, yj, sc, x1, y1);

				xi = x+2;
				if (xi>=0 && xi<trellisSizeX_)
					aggregateConflictsBottomRow_TopRight_YP1_XP2(xi, yj, sc, x1, y1);
			}
		}
	}

	private void aggregateConflicts(int x, int y, int sc) {
		float x1, y1, x2, y2;
		int xi, yj;
		int sc2;
		int conflicts;

		setOrigins(sc, tempOrigin1_);

		for (int a=0; a<NUM_ALIGNMENTS; a++) {
			int alignment = 1<<a;
			if ((relocations_[sc] & alignment) != 0) {
				x1 = tempOrigin1_[2*a];
				y1 = tempOrigin1_[2*a+1];

				for (int j=-2; j<=2; j++) {
					yj = y+j;
					if (yj>=0 && yj<trellisSizeY_) {
						for (int i=-2; i<=2; i++) {
							xi = x+i;
							if (xi>=0 && xi<trellisSizeX_) {
								for (int k=0; k<trellisCount_[xi][yj]; k++) {
									sc2 = trellis_[xi][yj][k];
									if (relocations_[sc2] != 0 && !candidate_[sc2]) {
										setOrigins(sc2, tempOrigin2_);

										conflicts = 0;

										for (int a2=0; a2<NUM_ALIGNMENTS; a2++) {
											int alignment2 = 1<<a2;
											if ((relocations_[sc2] & alignment2) != 0) {
												x2 = tempOrigin2_[2*a2];
												y2 = tempOrigin2_[2*a2+1];

												if (Math.abs(x1 - x2) < reservationSizeX_ && Math.abs(y1 - y2) < reservationSizeY_) {
													conflicts |= alignment2;
												}
											}
										}

										if (conflicts != 0)
											addConflict(a, sc2, conflicts);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	private void findAndProcessTopCandidateSingle(int x, int y) {
		// Get the highest value in this trellis cell
		int candidate = -1;
		double priority = Double.MAX_VALUE;
		int sc;
		for (int k=0; k<trellisCount_[x][y]; k++) {
			sc = trellis_[x][y][k];
			if (relocations_[sc] != 0 && nodep_[sc] < priority) {
				priority = nodep_[sc];
				candidate = k;
			}
		}

		if (candidate == -1) {
			trellisCount_[x][y] = 0;
			return;
		}

		sc = trellis_[x][y][candidate];

		// Search for candidates that are in the neighborhood that have higher weighting.
		// If we find one, then process that one instead.
		for (int i=-1; i<=1; i++) {
			for (int j=-1; j<=1; j++) {
				if ((i==0 && j==0)
						|| x+i<0 || x+i>=trellisSizeX_
						|| y+j<0 || y+j>=trellisSizeY_)
					continue;

				int xi = x+i, yj = y+j;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					int sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0 && nodep_[sc2] < priority) {
						// Found a better candidate
						findAndProcessTopCandidateSingle(xi, yj);
						if (relocations_[sc] == 0)
							return;
						k--;  // else redo
					}
				}
			}
		}

		conflictsCount_[0] = 0;

		// Aggregate all conflicts
		aggregateConflictsSingle(x, y, sc);

		// Process top dog house
		for (int k=0; k<trellisCount_[x][y]; k++) {
			if (k != candidate) {
				sc = trellis_[x][y][k];
				relocations_[sc] = 0;
			}
		}
		trellisCount_[x][y] = 0;

		// Process known conflicts from neighborhood
		for (int i=0; i<conflictsCount_[0]; i++)
			relocations_[conflicts_[0][i]] = 0;
	}

	private void resolveConflictsSingle() {
		for (int i=0; i<trellisSizeX_; i++) {
			for (int j=0; j<trellisSizeY_; j++) {
				while (trellisCount_[i][j] > 0) {
					findAndProcessTopCandidateSingle(i, j);
				}
			}
		}
	}

	private void findAndProcessTopCandidateBottomRow(int x, int y) {
		// Get the highest value in this trellis cell
		int candidate = -1;
		double priority = Double.MAX_VALUE;
		int sc, sc2;
		for (int k=0; k<trellisCount_[x][y]; k++) {
			sc = trellis_[x][y][k];
			if (relocations_[sc] != 0 && !candidate_[sc] && nodep_[sc] < priority) {
				priority = nodep_[sc];
				candidate = k;
			}
		}

		if (candidate == -1) {
			trellisCount_[x][y] = 0;
			return;
		}

		sc = trellis_[x][y][candidate];

		// Search for candidates that are in the neighborhood that have higher ranking priority.
		// If we find one, then process that one instead.
		for (int i=-2; i<=2; i++) {
			for (int j=-1; j<=1; j++) {
				if ((i==0 && j==0)
						|| x+i<0 || x+i>=trellisSizeX_
						|| y+j<0 || y+j>=trellisSizeY_)
					continue;

				int xi = x+i, yj = y+j;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0 && !candidate_[sc2] && nodep_[sc2] < priority) {
						// Found a better candidate
						findAndProcessTopCandidateBottomRow(xi, yj);
						if (relocations_[sc] == 0)
							return;
						k--;  // else redo
					}
				}
			}
		}

		// This is the top dog
		candidate_[sc] = true;

		for (int a=0; a<NUM_ROW_ALIGNMENTS; a++) {
			conflictsCount_[a] = 0;
		}

		// Aggregate all conflicts
		aggregateConflictsBottomRow(x, y, sc);

		// Determine which alignment to use
		int sa = -1, si = -1;
		if (isSingleAlignment(relocations_[sc])) {
			sa = relocations_[sc];
			si = getAlignmentIndex(sa);
		}
		else {
			float score, topScore = Float.MAX_VALUE;
			setRowAlignmentPriorities(nodex_[sc], nodey_[sc], locations_[sc]);
			
			for (int a = 0; a< NUM_ROW_ALIGNMENTS; a++) {
				int ap = alignmentPriorities_[a];
				int alignment = 1<<ap;
				if ((relocations_[sc] & alignment) != 0) {
					score = 0;
					for (int j=0; j<conflictsCount_[ap]; j++) {
						score += (getAlignmentCount(conflictAlignments_[ap][j]) / getAlignmentCount(relocations_[conflicts_[ap][j]]));
					}
	
					if (score < topScore) {
						sa = alignment;
						si = ap;
						topScore = score;
					}
				}
			}
		}
		relocations_[sc] = sa;

		// Remove known conflicts
		for (int i=0; i<conflictsCount_[si]; i++)
			relocations_[conflicts_[si][i]] -= conflictAlignments_[si][i];
	}

	private void resolveConflictsBottomRow() {
		for (int i=0; i<trellisSizeX_; i++) {
			for (int j=0; j<trellisSizeY_; j++) {
				while (trellisCount_[i][j] > 0) {
					findAndProcessTopCandidateBottomRow(i, j);
				}
			}
		}
	}

	private void findAndProcessTopCandidate(int x, int y) {
		// Get the highest value in this trellis cell
		int candidate = -1;
		double priority = Double.MAX_VALUE;
		int sc, sc2;
		for (int k=0; k<trellisCount_[x][y]; k++) {
			sc = trellis_[x][y][k];
			if (relocations_[sc] != 0 && !candidate_[sc] && nodep_[sc] < priority) {
				priority = nodep_[sc];
				candidate = k;
			}
		}

		if (candidate == -1) {
			trellisCount_[x][y] = 0;
			return;
		}

		sc = trellis_[x][y][candidate];

		// Search for candidates that are in the neighborhood that have higher weighting.
		// If we find one, then process that one instead.
		for (int i=-2; i<=2; i++) {
			for (int j=-2; j<=2; j++) {
				if ((i==0 && j==0)
						|| x+i<0 || x+i>=trellisSizeX_
						|| y+j<0 || y+j>=trellisSizeY_)
					continue;

				int xi = x+i, yj = y+j;
				for (int k=0; k<trellisCount_[xi][yj]; k++) {
					sc2 = trellis_[xi][yj][k];
					if (relocations_[sc2] != 0 && !candidate_[sc2] && nodep_[sc2] < priority) {
						// Found a better candidate
						findAndProcessTopCandidate(xi, yj);
						if (relocations_[sc] == 0)
							return;
						k--;  // else redo
					}
				}
			}
		}

		// This is the top dog
		candidate_[sc] = true;

		for (int a=0; a<NUM_ALIGNMENTS; a++) {
			conflictsCount_[a] = 0;
		}

		// Aggregate all conflicts
		aggregateConflicts(x, y, sc);

		// Determine which alignment to use
		int sa = -1, si = -1;
		if (isSingleAlignment(relocations_[sc])) {
			sa = relocations_[sc];
			si = getAlignmentIndex(sa);
		}
		else {
			float score, topScore = Float.MAX_VALUE;
			setAlignmentPriorities(nodex_[sc], nodey_[sc], locations_[sc]);
			
			for (int a = 0; a< NUM_ALIGNMENTS; a++) {
				int ap = alignmentPriorities_[a];
				int alignment = 1<<ap;
				if ((relocations_[sc] & alignment) != 0) {
					score = 0;
					for (int j=0; j<conflictsCount_[ap]; j++) {
						score += (getAlignmentCount(conflictAlignments_[ap][j]) / getAlignmentCount(relocations_[conflicts_[ap][j]]));
					}
	
					if (score < topScore) {
						sa = alignment;
						si = ap;
						topScore = score;
					}
				}
			}
		}
		relocations_[sc] = sa;

		// Remove known conflicts
		for (int i=0; i<conflictsCount_[si]; i++)
			relocations_[conflicts_[si][i]] -= conflictAlignments_[si][i];
	}

	private void resolveConflicts() {
		for (int i=0; i<trellisSizeX_; i++) {
			for (int j=0; j<trellisSizeY_; j++) {
				while (trellisCount_[i][j] > 0) {
					findAndProcessTopCandidate(i, j);
				}
			}
		}
	}

}