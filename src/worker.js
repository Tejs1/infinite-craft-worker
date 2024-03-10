import { items } from './db.js';
import { keyMap } from './keyMap.js';
/**
 * @typedef {Object} Env
 */

// eslint-disable-next-line import/no-anonymous-default-export
export default {
	/**
	 * @param {Request} request
	 * @param {Env} env
	 * @param {ExecutionContext} ctx
	 * @returns {Promise<Response>}
	 */

	async fetch(request, env, ctx) {
		try {
			if (!request || !request.url || !request.method) {
				console.log('request', request);
				throw new Error('Invalid request object');
			}

			if (request.method !== 'GET') {
				console.log('request', request.method);
				throw new Error('Only GET requests are supported');
			}

			const url = request.url.toString().split('=')[1];

			if (url) {
				let element = decodeURI(url).toLocaleLowerCase();
				const elementGraph = traceElement(element);
				if (elementGraph) {
					const G = convertToOriginalCase(elementGraph, keyMap);
					return new Response(JSON.stringify(G), {
						status: 200,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				return new Response('Element not found', { status: 404 });
			}

			return new Response('Successful! request recipes using ?recipe={Name}', { status: 200 });
		} catch (error) {
			console.error('Error occurred:', error.message);
			return new Response('Internal Server Error', { status: 500 });
		}
	},
};

/**
 * @param {string} element
 */
function traceElement(element, elementGraph = {}) {
	const BASE_ARRAY = ['wind', 'earth', 'fire', 'water'];

	if (BASE_ARRAY.includes(element)) return null;
	if (elementGraph[element]) return null;

	let constituents = findCombinationsFromDB(element);
	if (!constituents || constituents.length === 0) return null;

	elementGraph[element] = constituents;

	//wait till all promises are resolved
	constituents.map((/** @type {string} */ constituent) => traceElement(constituent, elementGraph));
	return elementGraph;
}

const findCombinationsFromDB = (/** @type {string } */ compound) => {
	const result = items[compound];
	return result;
};

function convertToOriginalCase(obj, keyMap) {
	const originalItems = {};
	Object.keys(obj).forEach((key) => {
		const [first, second] = obj[key];
		const originalFirst = keyMap[first];
		const originalSecond = keyMap[second];
		const keyString = keyMap[key];
		originalItems[keyString] = [originalFirst, originalSecond];
	});
	return originalItems;
}
