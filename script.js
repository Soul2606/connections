
class ConnectedGraphNode {
	#targets
	#properties
	constructor(targets=[], properties={}) {
		const propertiesCopy = JSON.parse(JSON.stringify(properties))
		if (!Array.isArray(targets) || targets.some(target=>!(target instanceof ConnectedGraphNode))) throw new Error("Invalid targets, targets must be an array of ConnectedGraphNode");
		if (typeof propertiesCopy !== 'object' || Array.isArray(propertiesCopy)) throw new Error("Invalid properties, properties must be a JSON compatible object");
		this.#targets = targets
		this.#properties = propertiesCopy
	}

	getTargets(){
		return Array.from(this.#targets)
	}

	setTargets(newTargets){
		if (!Array.isArray(newTargets) || newTargets.some(target=>!(target instanceof ConnectedGraphNode))) throw new Error("Invalid newTargets, newTargets must be an array of ConnectedGraphNode");
		this.#targets = Array.from(newTargets)
		return this
	}

	getProperties(){
		return JSON.parse(JSON.stringify(this.#properties))
	}

	setProperties(newProperties){
		if (typeof newProperties !== 'object' || Array.isArray(newProperties)) throw new Error("Invalid newProperties, newProperties must be an object");
		this.#properties = JSON.parse(JSON.stringify(newProperties))
		return this
	}

	findNodesTargetingThis(nodes){
		if (!Array.isArray(nodes)) return null
		if (nodes.some(element=>!(element instanceof ConnectedGraphNode))) return null
		return nodes.filter(node=>node.getTargets().some(target=>target === this))
	}
}


const svgNS = 'http://www.w3.org/2000/svg'


function removeAllChildren(element) {
	if (!(element instanceof Element)) return false
	while (element.hasChildNodes()) {
		element.removeChild(element.firstChild)
	}
	return true
}


const nodes = []
for (let i = 0; i < 8; i++) {
	nodes.push(new ConnectedGraphNode())
}
nodes[0].setTargets([nodes[1], nodes[2], nodes[3]])
nodes[1].setTargets([nodes[3], nodes[5]])
nodes[2].setTargets([nodes[4], nodes[6]])




const board = document.getElementById('board')
const boardRect = board.getBoundingClientRect()
const boardCenter = {x:boardRect.width/2, y:boardRect.height/2}
const svg = document.getElementById('svg')
const cells = []
const cellPositions = []
for (let i=0; i<nodes.length; i++) {
	const node = nodes[i]
	const cell = document.createElement('div')
	cell.className = 'cell'
	cell.addEventListener('mouseenter',()=>showConnections(node, cells, nodes, svg))
	cell.addEventListener('mouseleave',()=>{
		cells.forEach(value=>value.cell.classList.remove('dim'))
		removeAllChildren(svg)
	})
	const {x,y} = findFreeSpace(120, cellPositions, 100, boardCenter)
	cellPositions.push({x,y})
	cell.style.top = y+'px'
	cell.style.left = x+'px'
	board.appendChild(cell)
	cells.push({cell, node:node})
}




function findFreeSpace(stepSize=120, positions=[], spacing=100, anchor={x:0,y:0}) {

	const isClear = ({x,y})=>{
		return !positions.some(p=> ((p.x-x)**2 + (p.y-y)**2) < spacing**2)
	}

	if (isClear(anchor)) return anchor
	for (let i=1; i<25; i++) {
		const candidate = {x:anchor.x-i*stepSize,y:anchor.y-i*stepSize}
		if (isClear(candidate)) return candidate
		for (let j = 0; j < i*2; j++) {
			candidate.x += stepSize
			if (isClear(candidate)) return candidate
		}
		for (let j = 0; j < i*2; j++) {
			candidate.y += stepSize
			if (isClear(candidate)) return candidate
		}
		for (let j = 0; j < i*2; j++) {
			candidate.x -= stepSize
			if (isClear(candidate)) return candidate
		}
		for (let j = 0; j < i*2; j++) {
			candidate.y -= stepSize
			if (isClear(candidate)) return candidate
		}
	}
	return null
}




function showConnections(selectedNode, allCells, allNodes, svg) {
  
	if (!(selectedNode instanceof ConnectedGraphNode)) {
		throw new Error("Invalid parameters: selectedNode must be a ConnectedGraphNode")
	}
	
	// Clear existing lines
	while (svg.firstChild) {
		svg.removeChild(svg.firstChild)
	}
	
	// Precompute bounding rectangles
	const svgRect = svg.getBoundingClientRect()
	const cellEntries = allCells.map(({ cell, node }) => {
		const rect = cell.getBoundingClientRect()
		return { cell, node, x: rect.x + rect.width / 2 - svgRect.x, y: rect.y + rect.height / 2 - svgRect.y }
	})
  
	// Identify outgoing and incoming targets
	const outgoing = new Set(selectedNode.getTargets())
	const incoming = new Set(selectedNode.findNodesTargetingThis(allNodes))
	
	const directions = []
	// Iterate once, draw or dim
	for (const { cell, node, x: x2, y: y2 } of cellEntries) {
		if (node === selectedNode) continue
		
		if (outgoing.has(node) || incoming.has(node)) {
			// draw line
			const from = cellEntries
				.find(e => e.node === selectedNode)
			const x1 = from.x, y1 = from.y
			const line = document.createElementNS(svgNS, "line")
		
			// offset the lines if they are pointing in the same or similar direction
			const direction = Number(Math.atan2(y1-y2,x1-x2).toFixed(3))
			const offset = directions.filter(item=>item===direction).length*10
			directions.push(direction)
			console.log(direction)

			line.setAttribute("x1", x1 + Math.cos(direction + 90/180*Math.PI)*offset)
			line.setAttribute("y1", y1 + Math.sin(direction + 90/180*Math.PI)*offset)
			line.setAttribute("x2", x2 + Math.cos(direction + 90/180*Math.PI)*offset)
			line.setAttribute("y2", y2 + Math.sin(direction + 90/180*Math.PI)*offset)
			line.setAttribute("stroke", outgoing.has(node) ? "cyan" : "magenta")
		
			svg.appendChild(line)

		} else {
			cell.classList.add("dim")
		}
	}
}


