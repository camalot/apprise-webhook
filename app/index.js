"use strict";
const http = require('http');
const url = require('url');
const nunjucks = require('nunjucks');
const axios = require('axios').default;

const APPRISE_URL = process.env['APPRISE_URL'];
const NODE_PORT = process.env['NODE_PORT'] || 8001;
const NODE_HOST = process.env['NODE_HOST'] || "0.0.0.0";

if (!APPRISE_URL) {
	console.error(`APPRISE_URL is not specified`);
	return;
}

const env = nunjucks.configure();
env.addFilter('localdate', str => new Date(str).toLocaleString());

const server = http.createServer((request, response) => {
	if (request.method === 'POST') {
		let body = '';
		request.on('data', data => {
			body += data;
		});
		request.on('end', async () => {
			let responseText = `Template is not specified. Request URL ${request.url}`;
			let responseCode = 400;
			try {
				const query = url.parse(request.url, true).query;
				const template = query.template || process.env['TEMPLATE'];
				if (template) {
					const key = query.key || process.env['APPRISE_KEY'] || '';
					const appriseUrl = url.resolve(APPRISE_URL, key);
					console.log(`using template "${template}".`);
					console.log(body);
					const message = env.render(`/app/templates/${template}.njk`, JSON.parse(body));
					console.log(`Posting data to ${appriseUrl}`);
					const appriseResponse = await axios.post(appriseUrl, {
						body: message,
						title: query.title || "",
						tag: query.tag || key,
						type: query.type
					});
					responseCode = 200;
					responseText = `Sent ${message} to ${appriseUrl} using ${template} with a response ${appriseResponse.status} ${appriseResponse.data}`;
				}
			} catch (error) {
				responseCode = 500;
				responseText = error.response ? `${error.response.status} ${error.response.statusText}` : error.request || error;
			}
			response.writeHead(responseCode);
			response.end(responseText + '');
			console.log(responseText);
		});
	}
});

server.listen(NODE_PORT, NODE_HOST)
console.log(`Listening at http://${NODE_HOST}:${NODE_PORT}`);
