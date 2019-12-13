/**
 * Linkurious 2012, all rights reserved.
 * Sébastien Heymann <seb@linkurio.us>,
 * Romain Yon <romain@linkurio.us>
 * 
 * Please use http://jsbeautifier.org/ and indent with 2 spaces.
 *
 * Lib docs:
 * http://twitter.github.com/bootstrap/
 * http://docs.jquery.com/
 * http://addyosmani.github.com/jquery-ui-bootstrap/
 * http://sigmajs.org/ + well documented source code
 */
;
sigma.fruchtermanReingold = sigma.fruchtermanReingold || {};

sigma.fruchtermanReingold.FruchtermanReingold = function (graph, fixedNodes) {
  sigma.classes.Cascade.call(this);
  var self = this;
  this.graph = graph;
  this.stop = false;

  this.p = {
    area: 0.1,
    gravity: 10,
    speed: 0.1
  };

  var oldSumDist = Number.POSITIVE_INFINITY;

  this.init = function () {
    self.p.area = self.graph.nodes.length * self.graph.nodes.length;
  	self.graph.iterNodes(function (n) {
  		n.fr = {
  			dx: 0,
  			dy: 0
  		};
  	});
  	return self;
  };

  this.go = function () {
    while (self.atomicGo()) {};
  };

  this.atomicGo = function () {
    self.p.area = self.graph.nodes.length * self.graph.nodes.length;
    var graph = self.graph;
    var nodes = graph.nodes.filter(function (n) { return !n.hidden; });
    var edges = graph.edges.filter(function (e) { 
    	return !e.source.hidden && !e.target.hidden;
    });

    var maxDisplace = Math.sqrt(self.p.area) / 10;
    var k = Math.sqrt(self.p.area / (1 + nodes.length));

    nodes.forEach(function (n1) {
    	if (!n1.hasOwnProperty('fr')) {
    		n1.fr = {
				  dx: 0,
				  dy: 0
				};
    	}
    	// Repulsion force
    	nodes.forEach(function (n2) {
    		if (n1 != n2) {
    			var xDist = n1.x - n2.x;
    			var yDist = n1.y - n2.y;
          var dist = Math.sqrt(xDist * xDist + yDist * yDist) + 0.05;
    			// var dist = Math.sqrt(xDist * xDist + yDist * yDist) - n1.size - n2.size;
          if (dist > 0) {
    				var repulsiveF = k * k / dist;
    				n1.fr.dx += xDist / dist * repulsiveF;
    				n1.fr.dy += yDist / dist * repulsiveF;
    			}
    		}
    	});
    });
    edges.forEach(function (e) {
    	// Attraction force
    	var nf = e.source;
    	var nt = e.target;
	    var xDist = nf.x - nt.x;
	    var yDist = nf.y - nt.y;
      var dist = Math.sqrt(xDist * xDist + yDist * yDist) + 0.05;
	    // var dist = Math.sqrt(xDist * xDist + yDist * yDist) - nf.size - nt.size;
	    var attractiveF = dist * dist / k;
	    if (dist > 0) {
	 			nf.fr.dx -= xDist / dist * attractiveF;
	 			nf.fr.dy -= yDist / dist * attractiveF;
	 			nt.fr.dx += xDist / dist * attractiveF;
	 			nt.fr.dy += yDist / dist * attractiveF;
	    }
    });
    nodes.forEach(function (n) {
    	// Gravity
	    var d = Math.sqrt(n.x * n.x + n.y * n.y);
	    var gf = 0.01 * k * self.p.gravity * d;
	    n.fr.dx -= gf * n.x / d;
	    n.fr.dy -= gf * n.y / d;
    });
    nodes.forEach(function (n) {
    	// Speed
	    n.fr.dx *= self.p.speed;
	    n.fr.dy *= self.p.speed;
    });
    var sumDist = 0;
    nodes.forEach(function (n) {
    	// Apply computed displacement
    	if (-1 == $.inArray(n.id+'', fixedNodes)) {
    		var xDist = n.fr.dx;
	    	var yDist = n.fr.dy;
	    	var dist = Math.sqrt(xDist * xDist + yDist * yDist);
	    	if (dist > 0) {
	    		sumDist += dist;
	    		var limitedDist = Math.min(maxDisplace * self.p.speed, dist);
	    		n.x += xDist / dist * limitedDist;
	    		n.y += yDist / dist * limitedDist;
	    	}
    	}
    });

    // Global cooling (homebrew)
    sumDist = (sumDist * self.p.speed) / nodes.length;
    var diffDist = Math.abs(sumDist - oldSumDist);
    //console.log(sumDist, diffDist);
    if (sumDist < (Math.sqrt(nodes.length) / 100) && diffDist < (Math.sqrt(nodes.length) / 100)) {
    	self.p.speed *= 0.995;
    	if (self.p.speed < 0.01) {
    		self.stop = true;
    	}
    }
    oldSumDist = sumDist;

    return false;
  };

  this.end = function () {
    self.stop = true;
    self.graph.iterNodes(function (n) {
      n.fr = null;
    });
  };
}

sigma.publicPrototype.startFruchtermanReingold = function () {
  this.FruchtermanReingold = new sigma.fruchtermanReingold.FruchtermanReingold(this._core.graph);
  this.FruchtermanReingold.init();

  this.addGenerator('FruchtermanReingold', this.FruchtermanReingold.atomicGo, function () {
    return true;
  });
};

sigma.publicPrototype.stopFruchtermanReingold = function () {
  this.FruchtermanReingold.end();
  this.removeGenerator('FruchtermanReingold');
};
