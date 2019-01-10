import * as d3 from "d3";
import { SimulationNodeDatum, SimulationLinkDatum } from "d3";

interface RatNode extends SimulationNodeDatum {
    readonly label: string;
    count: number;
    entries: number;
}

interface RatLink extends SimulationLinkDatum<RatNode> {
    readonly source: RatNode;
    readonly target: RatNode;
    count: number;
}

interface Page {
    readonly user: string;
    readonly link: string;
    readonly referrer: string;
}

interface User {
    node: RatNode;
    link?: RatLink;
}

document.addEventListener("DOMContentLoaded", function() {

    const users = new Map<string, User>();

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

    const chartLayer = svg.append('g').classed('chartLayer', true);

    const range = 10;
    const nodes: RatNode[] = d3.range(0, range).map(d => { 
        return { 
            label: "l" + d, 
            count: ~~d3.randomUniform(1, 5)(),
            entries: ~~d3.randomUniform(1, 5)()
        }
    });

    const links: RatLink[] = d3.range(0, range * 2).map(() =>  { 
        return { 
            source: nodes[~~d3.randomUniform(range)()], 
            target: nodes[~~d3.randomUniform(range)()],
            count: ~~d3.randomUniform(1, 5)()
        } 
    });

    //const color = d3.scaleOrdinal(d3.schemeCategory10);    
    svg.attr("width", width).attr("height", height)
    
    chartLayer.attr("width", width).attr("height", height);
        
    var simulation = d3.forceSimulation<RatNode, RatLink>()
        //.force("link", d3.forceLink<RatNode, RatLink>().strength((link, i, links) => link.count))
        .force("link", d3.forceLink<RatNode, RatLink>().id((node, i, data) => { return node.index+'' } ))
        .force("collide",d3.forceCollide<RatNode>( node => { return node.count ^ 2 } ).iterations(32) )
        .force("charge", d3.forceManyBody<RatNode>().strength(-500))
        .force("center", d3.forceCenter<RatNode>(width / 2, height / 2))
        .force("x", d3.forceX<RatNode>())
        .force("y", d3.forceY<RatNode>())
        .on("tick", () => {
            link.attr("x1", (d) => { return d.source.x; })
                .attr("y1", (d) => { return d.source.y; })
                .attr("x2", (d) => { return d.target.x; })
                .attr("y2", (d) => { return d.target.y; });

            node.attr("cx", (d) => { return d.x; })
                .attr("cy", (d) => { return d.y; });
        });

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data<RatLink>(links);
    
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data<RatNode>(nodes);
  
    restart();

    function restart() {

        // Apply the general update pattern to the nodes.
        node = node.data<RatNode>(nodes, node => { return node.label });
        node.exit().remove();
        node = node.enter()
            .append("circle")
            .attr("r", node => { return node.count })
            .merge(node);
        
        node.append("title")
            .text(node => node.label);
        
        // Apply the general update pattern to the links.
        link = link.data<RatLink>(links, link => { return link.source + "-" + link.target;});

        link.exit().remove();
        link = link.enter()
            .append("line")
            .attr("stroke", "black")
            .attr("stroke-width", link => link.count)
            .merge(link);

        const transition = d3.transition().duration(750);

        node.transition(transition)
            .attr("r", node => { return node.count * 5; });
        
        // Update and restart the simulation.
        simulation.nodes(nodes);
        simulation.force<d3.ForceLink<RatNode, RatLink>>("link").links(links);
        
        simulation.alpha(1).restart();
    }
    
    const socket = new WebSocket('ws://localhost:3232');

    socket.addEventListener('open', (event) => {
        socket.send('I\'m just here');
        console.log('Connected to server');
    });

    var i = 100;

    socket.addEventListener('message', (event: MessageEvent) => {
        console.log('Message from server ', event.data);

        const page = parse(event);
        if (page == null) {
            return;
        }

        const entry: boolean = page.referrer == null;
        const user = getOrCreateUser(page);
        const existingLink = findNode(page.link);
        const existingRef = entry ? null : findNode(page.referrer);

        let newRef: RatNode;
        if (!entry && existingRef == null) {
            newRef = addRefNode(page, existingLink);
        }

        const node = addNode(page.link, existingRef != null ? existingRef : newRef);
        const link = page.referrer != null ? addLink(page, node) : null;

        user.node = node;
        user.link = link;

        setTimeout(() => { 
            if (newRef != null) {
                removeNode(newRef, entry);
            }
            removeNode(node, entry);
            if (link != null) {
                removeLink(link);
            }
            restart();
        }, 30000);

        function getOrCreateUser(page: Page) {
            const existingUser = users.get(page.user);
            if (existingUser != null) {
                return existingUser;
            }

            const user: User = { node: null, link: null }
            users.set(page.user, user);
            return user;
        }

        function addRefNode(page: Page, buddy: RatNode) {
            const node: RatNode = { 
                label: page.referrer, 
                count: 1,
                entries: 0,
                x: buddy != null ? buddy.x : width/2, 
                y: buddy != null ? buddy.y : height/2
            };
            nodes.push(node);
            return node;
        }

        function addNode(label: string, buddy: RatNode) {
            const node = findNode(label);
            if (node != null) {
                node.count = node.count + 1;
                if (buddy == null) {
                    node.entries++;
                }
                return node;
            }
            return createNode(label, buddy);
        }

        function createNode(label: string, buddy: RatNode) {
            const node: RatNode = { 
                label: label, 
                count: 1, 
                entries: buddy == null ? 1 : 0,
                x: buddy != null ? buddy.x : width/2, 
                y: buddy != null ? buddy.y : height/2
            };
            nodes.push(node);
            return node;
        }

        function removeNode(node: RatNode, entry: boolean) {
            if (entry && node.entries > 0) {
                node.entries--;
            }

            if (node.count > 1) {
                node.count = node.count - 1;
            }
            else {
                nodes.splice(node.index, 1); 
            }
        }

        function addLink(page: Page, to: RatNode) {
            const link = findLink(page);
            if (link != null) {
                link.count++;
                return link;
            }

            const from = findNode(page.referrer);
            return createLink(from, to);
        }

        function createLink(from: RatNode, to: RatNode) {
            const link: RatLink = { 
                source: from, 
                target: to, 
                count: 1 
            };
            
            links.push(link);
            return link;
        }

        function removeLink(link: RatLink) {
            if (link.count > 1) {
                link.count--;
            }
            else {
                links.splice(link.index, 1); 
            }
        }
        
        function findNode(label: string) {
            return nodes.find((node) => node.label == label);
        }

        function findLink(page: Page) {
            return links.find((link) => (link.source.label == page.link && link.target.label == page.referrer)
                || (link.source.label == page.referrer && link.target.label == page.link));
        }

        restart();
    });

    var loaded = once(() => console.log('Page loaded - ' + width + 'x' + height))();
});

function once(fn: Function) { 
	var result: any;

	return function() {
		if (fn) {
			result = fn.apply(this, arguments);
			fn = null;
		}

		return result;
	};
}

function parse(event: MessageEvent) {
    try {
        return <Page>JSON.parse(event.data);
    }
    catch (e) {
        console.error("Could not parse JSON");
        return null;
    }
}
