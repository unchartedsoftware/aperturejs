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
package oculus.aperture.layout.rest;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import oculus.aperture.common.BasicLink;
import oculus.aperture.common.BasicNode;
import oculus.aperture.common.BasicNodeTag;
import oculus.aperture.common.JSONProperties;
import oculus.aperture.common.rest.ApertureServerResource;
import oculus.aperture.spi.common.Link;
import oculus.aperture.spi.common.Node;
import oculus.aperture.spi.common.Properties;
import oculus.aperture.spi.common.Alignments.AnchorX;
import oculus.aperture.spi.common.Alignments.AnchorY;
import oculus.aperture.spi.layout.LayoutResults;
import oculus.aperture.spi.layout.LayoutService;
import oculus.aperture.spi.layout.options.LayoutOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.restlet.resource.Post;

import com.google.inject.Inject;

public class LayoutResource extends ApertureServerResource{

	/**
	 * Id property name in a JSON node
	 */
	public final static String NODE_PROPERTY_ID = "id";

	/**
	 * Width property name in a JSON node
	 */
	public final static String NODE_PROPERTY_WIDTH = "width";

	/**
	 * Height property name in a JSON node
	 */
	public final static String NODE_PROPERTY_HEIGHT = "height";

	/**
	 * X property name in a JSON node
	 */
	public final static String NODE_PROPERTY_X = "x";

	/**
	 * Y property name in a JSON node
	 */
	public final static String NODE_PROPERTY_Y = "y";

	/**
	 * Weight property name in a JSON node
	 */
	public final static String NODE_PROPERTY_WEIGHT = "weight";


	/**
	 * Id property name in a JSON link
	 */
	public final static String LINK_PROPERTY_ID = "id";

	/**
	 * Source Id property name in a JSON link
	 */
	public final static String LINK_PROPERTY_SOURCE_ID = "sourceId";

	/**
	 * Target Id property name in a JSON link
	 */
	public final static String LINK_PROPERTY_TARGET_ID = "targetId";



	private LayoutService layoutService;


	@Inject
	public LayoutResource(LayoutService layoutService) {
		this.layoutService = layoutService;
	}

	@Post("json")
	public LayoutResults layout(String jsonData) throws Exception {
		final JSONObject jsonObj = new JSONObject(jsonData);

		// Get node and edge data.
		JSONArray nodesJSON, edgesJSON, layoutJSON;
		JSONObject extentsJSON, nodeSizeJSON;

		// required
		try {
			layoutJSON = jsonObj.getJSONArray("layout");
		} catch (JSONException e) {
			throw new IllegalArgumentException("Unspecified layout requested.");
		}

		// required
		try {
			nodesJSON = jsonObj.getJSONArray("nodes");
		} catch (JSONException e) {
			throw new IllegalArgumentException("Layout requested but no nodes supplied.");
		}

		// required
		try {
			extentsJSON = jsonObj.getJSONObject("extents");
		} catch (JSONException e) {
			throw new IllegalArgumentException("Layout requested but no extents supplied.");
		}

		// optional for some layouts
		try {
			edgesJSON = jsonObj.getJSONArray("links");
		} catch (JSONException e) {
			edgesJSON = null;
		}
		// optional universal size
		try {
			nodeSizeJSON = jsonObj.getJSONObject("defaultNodeSize");
		} catch (JSONException e) {
			nodeSizeJSON = null;
		}

		LayoutResults result= null;

		Properties extents = new JSONProperties(extentsJSON);
		List<Node> nodes = parseNodes(nodesJSON, nodeSizeJSON);
		List<Link> links = parseLinks(edgesJSON);

		// execute layouts
		for (int i = 0; i < layoutJSON.length(); i++) {
			final JSONObject layout = layoutJSON.getJSONObject(i);
			final String layoutType = layout.getString("type");

			final LayoutOptions options = layoutService.parseOptions(layoutType, extents,
					new JSONProperties(layout));

			result = layoutService.layout(nodes, links, options);
		}

		return result;
	}

	/**
	 * Parses node list from JSON and returns the result as Java.
	 *
	 * @param nodesJSON
	 * 		The node list as a JSON array (of JSONObject).
	 * @return
	 * 		The node list as a Java List of LayoutNode.
	 *
	 * @throws JSONException
	 */
	private List<Node> parseNodes(JSONArray nodesJSON, JSONObject nodeSizeJSON) throws JSONException {
		List<Node> nodes = new ArrayList<Node>(nodesJSON.length());

		Integer globalW = 1;
		Integer globalH = 1;

		if (nodeSizeJSON != null) {
			try {
				globalW= nodeSizeJSON.getInt("width");
				globalH= nodeSizeJSON.getInt("height");
			} catch(Exception e) {
			}
		}

		final int defaultW = globalW != null? globalW.intValue() : 1;
		final int defaultH = globalH != null? globalH.intValue() : 1;

		for (int i=0; i< nodesJSON.length(); i++) {
			JSONObject nodeObj = (JSONObject)nodesJSON.get(i);
			JSONProperties nodeProp = new JSONProperties(nodeObj);

			final String id = nodeProp.getString(NODE_PROPERTY_ID, null);

			if (id != null) {
				final int w = nodeProp.getInteger(NODE_PROPERTY_WIDTH, defaultW);
				final int h = nodeProp.getInteger(NODE_PROPERTY_HEIGHT, defaultH);
				final int x = nodeProp.getInteger(NODE_PROPERTY_X, 0);
				final int y = nodeProp.getInteger(NODE_PROPERTY_Y, 0);

				BasicNode node = new BasicNode(id, x, y, w, h);
				nodes.add(node);

				// optional.
				node.setWeight(nodeProp.getFloat(NODE_PROPERTY_WEIGHT, 0f));

				Properties tag = nodeProp.getPropertiesSet("tag", null);

				if (tag != null) {
					node.setTag(new BasicNodeTag(
							tag.getBoolean("visible", true),
							AnchorX.valueOf(tag.getString("anchorX", "middle")),
							AnchorY.valueOf(tag.getString("anchorY", "middle"))
					));
				}

			} else {
				throw new JSONException("Failed to parse a valid id from one or more layout nodes.");
			}
		}

		return nodes;
	}

	/**
	 * Parses link list from JSON and returns the result as Java.
	 *
	 * @param linksJSON
	 * 		The link list as a JSON array (of JSONObject).
	 * @return
	 * 		The link list as a Java List of LayoutLink.
	 *
	 * @throws JSONException
	 */
	private List<Link> parseLinks(JSONArray linksJSON) throws JSONException {
		if (linksJSON == null) return Collections.emptyList();

		List<Link> links = new ArrayList<Link>(linksJSON.length());

		for (int i=0; i< linksJSON.length(); i++) {
			JSONObject linkObj = (JSONObject)linksJSON.get(i);
			JSONProperties linkProp = new JSONProperties(linkObj);

			final String id  = linkProp.getString(LINK_PROPERTY_ID, "");
			final String sid = linkProp.getString(LINK_PROPERTY_SOURCE_ID, null);
			final String tid = linkProp.getString(LINK_PROPERTY_TARGET_ID, null);

			if (sid != null && tid != null) {
				Link link = new BasicLink(id, sid, tid);
				links.add(link);

			} else {
				throw new JSONException("Failed to parse a valid id from one or more layout nodes.");
			}
		}

		return links;
	}

}
