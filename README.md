# Aperture JS

> agile visual analytics for big data

Aperture JS is an open, adaptable and extensible JavaScript visualization framework with supporting REST services, designed to produce visualizations for analysts and decision makers in any common web browser. Aperture utilizes a novel layer based approach to visualization assembly, and a data mapping API that simplifies the process of adaptable transformation of data and analytic results into visual forms and properties.  Aperture vizlets can be easily embedded with full interoperability in frameworks such as the Ozone Widget Framework (OWF).

 * [Aperture JS website](http://aperturejs.com)
 * [Examples](http://aperturejs.com/demos/)
 * [Documentation](http://aperturejs.com/api/js/)


## Quick Start

The quick start assumes you've set up your development environment. Please see [below](#prerequisites).

### Building

To build aperturejs, execute the following command in the root project directory:
```
mvn clean install
```

### Creating an Application

Once you've built the Aperture JS project, the easiest way to get started with aperturejs is to use the *[aperturejs-bootstrap](https://github.com/oculusinfo/aperturejs-bootstrap) project*. The bootstrap comes ready to start development using HTML/JS/CSS on the front-end and Java on the back.



## Project Layout

Aperture JS is comprised of both client- and server-side components that work together to provide a full-featured visualizaiton framework. However, Aperture JS is also modular meaning that it is designed to allow using client JS and server components separately - many of the client-side components do not require any server-side code.

The project is structured as follows:

**Client-side**

 * [`/aperture-client`](./aperture-client) - Aperture JS client-side JS library

**Server-side**

 * [`/aperture-common`](./aperture-common) - Common Java classes and utilities used throughout the rest of the project
 * [`/aperture-spi`](./aperture-spi) - Service Provider Interface definitions for all Aperture server-side services
 * [`/aperture-capture-phantom`](./aperture-capture-phantom) - PhantomJS reference implementation of the Aperture Capture SPI
 * [`/aperture-cms`](./aperture-cms) - EhCache and CouchDB reference implementations of the Aperture CMS SPI
 * [`/aperture-geo`](./aperture-geo) - Basic reference implementations of the Aperture Geo SPIs
 * [`/aperture-graph`](./aperture-graph) - Various reference implementations of the Aperture Graph SPIs including Louvain, Markov, KSnap, and Modularity aggregators
 * [`/aperture-icons`](./aperture-icons) - Full reference implementation of the Aperture Icon SPI including all source SVG content
 * [`/aperture-layout`](./aperture-layout) - Reference implementations of the Aperture Graph Layout SPIs
 * [`/aperture-layout-yworks`](./aperture-layout) - yWorks reference implementation of the Aperture Graph Layout SPIs - requires yWorks "yFiles" v2.4
 * [`/aperture-parchment`](./aperture-parchment) - Provides degree-of-confidence "parchment" images
 * [`/aperture-server-core`](./aperture-server-core) - Core Aperture server logic to handle binding SPI implementations via Google Guice. This forms the core of an Aperture server and handles all loading and bootstrapping.

**Examples, Docs, and Distrubution**

 * [`/aperture-examples`](./aperture-examples) - Example code and content, essentially the source for [aperturejs.com](http://aperturejs.com)
 * [`/aperture-client-docs`](./aperture-client-docs) - JSDoc generation code for the `aperture-client` JS library
 * [`/aperture-distribution`](./aperture-distribution) - Project for generating distributables of aperturejs including a client-only `.zip` of `.js` files and a full server distribution.
 * [`/aperture-server`](./aperture-server) - An example combining the reference SPI implementations above, the `server-core`, the client JS, and the examples into an application. This generates a WAR that can be served in any Java Servlet container and contains all docs and examples.


## Development

### Prerequisites

The aperturejs project uses the [Maven](http://maven.apache.org/) build tool for all sub-projects. For the moment, this also includes building a concatenated `aperture.js` client-side library. As such, to build please ensure the following are installed and working on your local system:

 * [Java JDK v6+](http://www.oracle.com/technetwork/java/javase/downloads/index.html)
 * [Maven v3.0+](http://maven.apache.org/download.cgi)

Note that Maven and Java both require that various environment variables are set on your system. This is operating system dependent so please follow the install instructions that apply to your host system carefully.


### Building

To build aperturejs, execute the following command in the root project directory:
```
mvn clean install
```

The build will place all compiled `JAR` artifacts in the `target` folders within each project and into your local Maven repository (generally at `<user home>/.m2/repository`) but will also include the following files of note:

 * `/aperture-distribution/target/aperture-dist-{VERSION}-js.zip` - A `zip` file containing all compiled aperture .js files and dependencies (such as OpenLayers).
 * `/aperture-distribution/target/aperture-dist-{VERSION}-full.zip` - A `zip` file containing all compiled aperture .jars and .js files. If you are building an application from the ground-up without using the `aperture-server` bootstrap example, this distribution should contain everything you need.
 * `/aperture-server/target/aperture-server-{VERSION}.war` - A `war` (web archive) file containing the example server with full aperturejs documentation and examples. This file can be placed into your web application container ([Jetty](http://www.eclipse.org/jetty/), [Tomcat](http://tomcat.apache.org/)) of choice for demonstration purposes.

