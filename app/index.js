"use strict";
const http = require('http');
const url = require('url');
const nunjucks = require('nunjucks');
const { json } = require('stream/consumers');
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
					console.log(message);
					console.log(`Posting data to ${appriseUrl}`);
					const json_data = {
						body: message //,
						// title: query.title || "",
						// tag: query.tag || "",
						// type: query.type || "",
						// format: query.format || ""
					};

					if (query.title) {
						json_data["title"] = query.title;
					}
					if (query.tag) {
						json_data["tag"] = query.tag;
					}
					const q_type = (query.type || "UNKNOWN").toLowerCase();
					switch (q_type) {
						case "info":
						case "success":
						case "warning":
						case "failure":
							json_data["type"] = q_type;
							break;
					}
					const q_format = (query.format || "UNKNOWN").toLowerCase();
					switch (q_format) {
						case "text":
						case "markdown":
						case "html":
							json_data["format"] = q_format;
							break;
						default:
							json_data["format"] = "text";
							break;
					}
					
					console.log(json_data);
					const appriseResponse = await axios.post(appriseUrl, json_data);
					responseCode = 200;
					responseText = `Sent ${message} to ${appriseUrl} using ${template} with a response ${appriseResponse.status} ${JSON.stringify(appriseResponse.data)}`;
				}
			} catch (error) {
				responseCode = 500;
				responseText = error.response ? `${error.response.status} ${error.response.statusText}` : error.request || error;
			}
			response.writeHead(responseCode);
			response.end(responseText + '');
			console.log(responseText);
		});
	} else if (request.method === 'GET' && request.url.match(/^\/healthz?\/?$/)) {
		response.writeHead(200, { 'Content-Type': 'text/plain' });
		response.end('OK');
	} else {
		response.writeHead(404);
		response.end(`Not found: ${request.method} ${request.url}`);
	}
});

server.listen(NODE_PORT, NODE_HOST)
console.log(`Listening at http://${NODE_HOST}:${NODE_PORT}`);
