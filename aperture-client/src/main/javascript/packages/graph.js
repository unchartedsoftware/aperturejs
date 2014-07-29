/**
 * Source: graph.js
 * Copyright (c) 2013-2014 Oculus Info Inc.
 * @fileOverview Defines graph utility functions for Aperture.
 */

/**
 * @namespace Aperture graph utility functions.
 */
aperture.graph = (function(ns) {

	var util = aperture.util;

	/**
	 * @name aperture.graph.linkNodes
	 * @function
	 * @description
	 * 
	 * Takes an array of nodes and links in typical data representation
	 * form with id references and creates an enhanced view of them with direct
	 * object references. Links are enhanced with an object reference to each
	 * node, source and target, and given a unique id if they don't already have one.
	 * Nodes are enhanced with arrays linksOut and linksIn if directed or array links
	 * if undirected. The existing node and link arrays are updated in place with
	 * the enhanced node and link views, where each updated node or link has the original
	 * node or link as its prototype. Using views enables any original properties of the
	 * node or link to be extended without modification to the original objects.
	 *
	 * @param nodes
	 *      an array of nodes
	 *
	 * @param links
	 *      an array of links
	 *
	 * @param [options]
	 *      an optional set of directives
	 *
	 * @param [options.nodeId='id']
	 *      the node field representing the id
	 *
	 * @param [options.linkId='id']
	 *      the link field representing the id, or the name of one to create
	 *
	 * @param [options.sourceId='sourceId']
	 *      the link field representing the source node id
	 *
	 * @param [options.targetId='targetId']
	 *      the link field representing the target node id
	 *
	 * @param [options.nodeMap]
	 *      the optional node map updated with enhanced nodes and used to lookup nodes
	 *      when enhancing links
	 *
	 * @param [options.undirected=false]
	 *      if undirected, each node will be given a single list of links instead
	 *      of one for linksIn and linksOut
	 */
	ns.linkNodes = function(nodes, links, options) {
		// options with default fallbacks
		var nid = (options && options.nodeId) || 'id';
		var lid = (options && options.sourceId) || 'id';
		var sid = (options && options.sourceId) || 'sourceId';
		var tid = (options && options.targetId) || 'targetId';
		var und = (options && options.undirected) || false;
		var map = (options && options.nodeMap) || {};

		// name of link arrays on each node
		var olk = und? 'links' : 'linksOut';
		var ilk = und? 'links' : 'linksIn';

		var i, node;

		// replace each node with an enhanced view of it and create a map of them
		for (i=0; i < nodes.length; i++) {
			node = nodes[i] = util.viewOf(nodes[i]);
			node[olk]= [];

			if (!und) {
				node[ilk]= [];
			}

			map[node[nid]] = node;
		}

		var link;

		// replace each link with an enhanced view of it
		for (i=0; i < links.length; i++) {
			link = links[i] = util.viewOf(links[i]);

			// make sure it has an id
			if (link[lid] == null) {
				link[lid] = link[sid] + '-' + link[tid];
			}

			// give link node refs and add link to nodes' lists
			link.source = map[link[sid]];
			link.target = map[link[tid]];

			link.source[olk].push(util.extend(util.viewOf(link), {other: link.target}));
			link.target[ilk].push(util.extend(util.viewOf(link), {other: link.source}));
		}

		return this;
	};

	/**
	 * @name aperture.graph.weightNodes
	 * @function
	 * @description
	 * 
	 * Takes an array of nodes and a specification of weights to sum from link weight and set
	 * in the node objects.
	 *
	 * @param nodes
	 *      an array of nodes
	 *
	 * @param [weights = {weight:{links: 'weight'}, weightIn:{linksIn: 'weight'}, weightOut:{linksOut: 'weight'}}]
	 *      the specification of weights to calculate
	 *
	 * @param [sum]
	 *      the optional name of a node field to set with the sum of all calculated weights
	 */
	ns.weightNodes = function(nodes, weights, sum) {
		if (nodes && nodes.length) {
			if (util.isString(weights)) {
				sum = weights;
				weights = null;
			}

			if (!util.isObject(weights)) {
				weights = {};

				if (nodes[0].links) weights.weight = {links: 'weight'};
				if (nodes[0].linksIn) weights.weightIn = {linksIn: 'weight'};
				if (nodes[0].linksOut) weights.weightOut = {linksOut: 'weight'};
			}

			sum = util.isString(sum) && sum.length > 0? sum: null;

			// sum of weight for
			util.forEach(nodes, function(node) {
				var sumWeight = 0;

				util.forEach(weights, function(weightSpec, weightField) {
					util.forEach(weightSpec, function(srcWeightField, linksField) {
						var nodeWeight = 0;

						util.forEach(node[linksField], function(link) {
							nodeWeight += link[srcWeightField];
						});

						sumWeight += (node[weightField] = nodeWeight);
					});
				});

				if (sum !== null) {
					node[sum] = sumWeight;
				}
			});
		}

		return this;
	};

	return ns;

}(aperture.graph || {}));

