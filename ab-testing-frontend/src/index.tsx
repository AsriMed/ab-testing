/**
 * A/B Testing Platform Frontend
 * 
 * This worker handles the frontend UI for the A/B testing platform
 * and proxies API requests to the backend service.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateTest } from './pages/CreateTest';
import { TestAnalytics } from './pages/TestAnalytics';
import { RenderTest } from './pages/RenderTest';

// Import CloudFlare worker types
type Fetcher = {
	fetch: typeof fetch;
};

type R2Bucket = {
	get: (key: string) => Promise<any>;
	put: (key: string, value: any) => Promise<any>;
};

type ExecutionContext = {
	waitUntil: (promise: Promise<any>) => void;
	passThroughOnException: () => void;
};

interface ExportedHandler<Env> {
	fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
}

// HTML wrapper for responses with full HTML document
const htmlResponse = (component: React.ReactElement) => {
	const content = renderToString(component);
	
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>A/B Testing Platform</title>
	<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
</head>
<body class="bg-gray-50">
	<div id="app">${content}</div>
</body>
</html>
`;
	
	return new Response(html, {
		headers: {
			'Content-Type': 'text/html;charset=UTF-8',
		}
	});
};

// JSON wrapper for responses
const jsonResponse = (data: any, status = 200) => {
	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
		},
		status
	});
};

interface Env {
	AB_TESTING_API: Fetcher;
	FILES: R2Bucket;
	ASSETS: Fetcher;
	AI: any;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// API routes
		if (path.startsWith('/api/')) {
			// Proxy requests to the API service
			try {
				// Modify the URL to point to our backend API
				const apiUrl = new URL(path.replace('/api', ''), 'https://ab-testing-api2.irsale.fr');

				// Create a new request to forward
				const apiRequest = new Request(apiUrl.toString(), {
					method: request.method,
					headers: request.headers,
					body: request.body,
				});

				// Forward the request to our API service
				const response = await env.AB_TESTING_API.fetch(apiRequest);
				
				// Return the response from the API
				return response;
			} catch (error) {
				console.error('API proxy error:', error);
				return jsonResponse({ 
					error: error instanceof Error ? error.message : 'Unknown error occurred'
				}, 500);
			}
		}

		// Serve static files from the public directory
		if (path.startsWith('/static/')) {
			try {
				const assetUrl = new URL(path, url.origin);
				return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
			} catch (error) {
				console.error('Static file error:', error);
				return new Response('Not Found', { status: 404 });
			}
		}

		// Frontend routes
		try {
			switch (path) {
				case '/':
					return htmlResponse(<Home />);
					
				case '/create':
					return htmlResponse(<CreateTest />);
					
				case '/embed': {
					const testId = url.searchParams.get('id');
					if (!testId) {
						return new Response('Test ID is required', { status: 400 });
					}
					return htmlResponse(<RenderTest testId={testId} />);
				}
				
				default:
					// Check for parameterized routes
					if (path.match(/^\/tests\/[^/]+\/analytics$/)) {
						const testId = path.split('/')[2];
						return htmlResponse(<TestAnalytics testId={testId} />);
					}
					
					if (path.match(/^\/embed\/[^/]+$/)) {
						const testId = path.split('/')[2];
						return htmlResponse(<RenderTest testId={testId} />);
					}
					
					// 404 fallback
					return htmlResponse(
						<Layout>
							<div className="flex flex-col items-center justify-center min-h-screen py-2">
								<h1 className="text-4xl font-bold">404 - Page Not Found</h1>
								<p className="mt-3 text-xl">
									The page you are looking for does not exist.
								</p>
								<a href="/" className="mt-5 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600">
									Go Home
								</a>
							</div>
						</Layout>
					);
			}
		} catch (error) {
			console.error('Render error:', error);
			return new Response(`Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	},
} satisfies ExportedHandler<Env>;
