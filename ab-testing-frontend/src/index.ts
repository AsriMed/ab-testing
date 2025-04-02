/**
 * A/B Testing Platform Frontend
 * 
 * This worker handles the frontend UI for the A/B testing platform
 * and proxies API requests to the backend service.
 */

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

interface Env {
	AB_TESTING_API: Fetcher;
	FILES: R2Bucket;
	ASSETS: Fetcher;
	AI: any;
}

// Simple HTML templates
const renderPage = (content: string, title = 'A/B Testing Platform') => {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title}</title>
	<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<nav class="bg-white shadow-md mb-8 p-4 rounded">
			<div class="max-w-7xl mx-auto">
				<div class="flex justify-between">
					<div class="flex">
						<div class="flex-shrink-0 flex items-center">
							<span class="text-2xl font-bold text-blue-600">A/B Test</span>
						</div>
						<div class="ml-6 flex space-x-8">
							<a 
								href="/" 
								class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Home
							</a>
							<a 
								href="/create" 
								class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
							>
								Create Test
							</a>
						</div>
					</div>
				</div>
			</div>
		</nav>

		${content}
		
		<footer class="bg-white mt-12 py-6 border-t text-center">
			<p class="text-gray-500 text-sm">
				&copy; ${new Date().getFullYear()} A/B Testing Platform
			</p>
		</footer>
	</div>
</body>
</html>`;
};

// JSON wrapper for responses
const jsonResponse = (data: any, status = 200) => {
	return new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json' },
		status
	});
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// API routes - proxy to backend API
		if (path.startsWith('/api/')) {
			try {
				const apiUrl = new URL(path.replace('/api', ''), 'https://ab-testing-api.irsale.fr');
				const apiRequest = new Request(apiUrl.toString(), {
					method: request.method,
					headers: request.headers,
					body: request.body,
				});
				return await env.AB_TESTING_API.fetch(apiRequest);
			} catch (error) {
				console.error('API proxy error:', error);
				return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error occurred' }, 500);
			}
		}

		// Serve static files
		if (path.startsWith('/static/')) {
			try {
				const assetUrl = new URL(path, url.origin);
				return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
			} catch (error) {
				return new Response('Not Found', { status: 404 });
			}
		}

		// Frontend routes
		try {
			// Home page
			if (path === '/' || path === '') {
				const homeContent = `
					<h1 class="text-3xl font-bold text-center">A/B Testing Platform</h1>
					<p class="text-center mt-4">A simple platform for creating and managing A/B tests</p>
					
					<div class="mt-8 bg-white p-6 rounded-lg shadow-md">
						<h2 class="text-xl font-semibold mb-4">Get Started</h2>
						<p class="mb-4">Welcome to the A/B Testing Platform! Use this tool to:</p>
						<ul class="list-disc pl-5 mb-4 space-y-2">
							<li>Create A/B tests with different HTML variations</li>
							<li>Get embed codes to include in your website</li>
							<li>Track user interactions with each variation</li>
							<li>View analytics to see which variation performs better</li>
						</ul>
						<div class="flex justify-center mt-6">
							<a href="/create" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
								Create Your First Test
							</a>
						</div>
					</div>
				`;
				return new Response(renderPage(homeContent), {
					headers: { 'Content-Type': 'text/html;charset=UTF-8' }
				});
			}
			
			// Create Test page
			if (path === '/create') {
				const createTestContent = `
					<div class="max-w-3xl mx-auto">
						<h1 class="text-3xl font-bold mb-6">Create A/B Test</h1>
						
						<div id="errorContainer" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 hidden">
							<p id="errorMessage"></p>
						</div>
						
						<form id="createTestForm" class="space-y-6">
							<div>
								<label for="name" class="block text-sm font-medium text-gray-700">
									Test Name *
								</label>
								<input
									type="text"
									id="name"
									name="name"
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									placeholder="Enter a name for your test"
									required
								/>
							</div>
							
							<div>
								<label for="description" class="block text-sm font-medium text-gray-700">
									Description
								</label>
								<textarea
									id="description"
									name="description"
									rows="3"
									class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									placeholder="Enter a description (optional)"
								></textarea>
							</div>
							
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<label for="variantA" class="block text-sm font-medium text-gray-700">
										Variant A (Control) *
									</label>
									<textarea
										id="variantA"
										name="variantA"
										rows="6"
										class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter HTML content for Variant A"
										required
									></textarea>
								</div>
								
								<div>
									<label for="variantB" class="block text-sm font-medium text-gray-700">
										Variant B (Test) *
									</label>
									<textarea
										id="variantB"
										name="variantB"
										rows="6"
										class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
										placeholder="Enter HTML content for Variant B"
										required
									></textarea>
								</div>
							</div>
							
							<div class="flex justify-end">
								<a
									href="/"
									class="mr-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
								>
									Cancel
								</a>
								<button
									type="submit"
									id="submitButton"
									class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Create Test
								</button>
							</div>
						</form>
					</div>

					<script>
						document.getElementById('createTestForm').addEventListener('submit', async (event) => {
							event.preventDefault();
							
							const submitButton = document.getElementById('submitButton');
							const errorContainer = document.getElementById('errorContainer');
							const errorMessage = document.getElementById('errorMessage');
							
							// Hide previous errors
							errorContainer.classList.add('hidden');
							
							// Disable submit button
							submitButton.disabled = true;
							submitButton.textContent = 'Creating...';
							
							// Get form data
							const formData = new FormData(event.target);
							
							try {
								const response = await fetch('/api/tests', {
									method: 'POST',
									body: formData
								});
								
								if (!response.ok) {
									const errorData = await response.json();
									throw new Error(errorData.error || 'Failed to create test');
								}
								
								const data = await response.json();
								
								// Redirect to success page
								window.location.href = \`/test-success?id=\${data.id}\`;
							} catch (err) {
								// Show error
								errorMessage.textContent = err.message || 'An unknown error occurred';
								errorContainer.classList.remove('hidden');
								
								// Re-enable submit button
								submitButton.disabled = false;
								submitButton.textContent = 'Create Test';
							}
						});
					</script>
				`;
				return new Response(renderPage(createTestContent, 'Create A/B Test'), {
					headers: { 'Content-Type': 'text/html;charset=UTF-8' }
				});
			}
			
			// Test Success page
			if (path === '/test-success') {
				const testId = url.searchParams.get('id');
				if (!testId) {
					return new Response('Test ID is required', { status: 400 });
				}
				
				const successContent = `
					<div class="bg-green-50 p-6 rounded-lg text-center">
						<h1 class="text-2xl font-bold text-green-800 mb-4">Test Created Successfully!</h1>
						
						<div class="mb-6">
							<p class="text-green-700 mb-2">Your A/B test has been created.</p>
						</div>
						
						<div class="bg-white p-4 rounded-md mb-6 max-w-2xl mx-auto">
							<h2 class="text-lg font-medium mb-2">Embed Code</h2>
							<p class="text-sm text-gray-600 mb-2">
								Add this code to your website to embed the A/B test:
							</p>
							<div class="bg-gray-100 p-3 rounded text-left overflow-x-auto">
								<code class="text-sm">
									&lt;script src="https://ab-testing-frontend.irsale.fr/embed/${testId}" defer&gt;&lt;/script&gt;
								</code>
							</div>
						</div>
						
						<div class="flex justify-center space-x-4">
							<a
								href="/tests/${testId}/analytics"
								class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								View Analytics
							</a>
							<a
								href="/embed/${testId}"
								class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
							>
								Preview Test
							</a>
							<a
								href="/"
								class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
							>
								Back to Tests
							</a>
						</div>
					</div>
				`;
				return new Response(renderPage(successContent, 'Test Created - A/B Testing Platform'), {
					headers: { 'Content-Type': 'text/html;charset=UTF-8' }
				});
			}
			
			// Test Analytics page
			if (path.match(/^\/tests\/[^/]+\/analytics$/)) {
				const testId = path.split('/')[2];
				
				const analyticsContent = `
					<div class="max-w-4xl mx-auto">
						<h1 class="text-3xl font-bold mb-6">Test Analytics</h1>
						
						<div class="mb-6 bg-white p-6 rounded-lg shadow">
							<div id="loading" class="flex justify-center py-10">
								<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
							</div>
							
							<div id="testInfo" class="hidden">
								<h2 id="testName" class="text-2xl font-bold mb-2"></h2>
								<p id="testDescription" class="text-gray-600 mb-4"></p>
								<div class="text-sm text-gray-500 mb-4">
									Created: <span id="testCreated"></span>
								</div>
							</div>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
							<div class="bg-white p-6 rounded-lg shadow">
								<h3 class="text-lg font-semibold mb-4">Variant A</h3>
								<div id="variantAStats">
									<div class="flex justify-between mb-2">
										<span>Views:</span>
										<span id="variantAViews" class="font-semibold">0</span>
									</div>
								</div>
							</div>
							
							<div class="bg-white p-6 rounded-lg shadow">
								<h3 class="text-lg font-semibold mb-4">Variant B</h3>
								<div id="variantBStats">
									<div class="flex justify-between mb-2">
										<span>Views:</span>
										<span id="variantBViews" class="font-semibold">0</span>
									</div>
								</div>
							</div>
						</div>
						
						<div class="bg-white p-6 rounded-lg shadow mb-6">
							<h3 class="text-lg font-semibold mb-4">Embed Code</h3>
							<div class="bg-gray-100 p-3 rounded overflow-x-auto">
								<code class="text-sm">
									&lt;script src="https://ab-testing-frontend.irsale.fr/embed/${testId}" defer&gt;&lt;/script&gt;
								</code>
							</div>
						</div>
						
						<div class="flex justify-between">
							<a href="/" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
								Back to Tests
							</a>
							<a href="/embed/${testId}" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
								Preview Test
							</a>
						</div>
					</div>
					
					<script>
						// Fetch test data when page loads
						document.addEventListener('DOMContentLoaded', async () => {
							try {
								const response = await fetch('/api/tests/${testId}');
								
								if (!response.ok) {
									throw new Error('Failed to fetch test data');
								}
								
								const test = await response.json();
								
								// Update test info
								document.getElementById('testName').textContent = test.name;
								document.getElementById('testDescription').textContent = test.description || 'No description provided';
								document.getElementById('testCreated').textContent = new Date(test.createdAt).toLocaleString();
								
								// Update variant stats
								document.getElementById('variantAViews').textContent = test.variantAViews || 0;
								document.getElementById('variantBViews').textContent = test.variantBViews || 0;
								
								// Hide loading and show test info
								document.getElementById('loading').classList.add('hidden');
								document.getElementById('testInfo').classList.remove('hidden');
							} catch (error) {
								console.error('Error fetching test data:', error);
								document.getElementById('loading').innerHTML = \`
									<div class="text-center text-red-600">
										<p class="font-bold">Error loading test data</p>
										<p>\${error.message}</p>
									</div>
								\`;
							}
						});
					</script>
				`;
				return new Response(renderPage(analyticsContent, 'Test Analytics - A/B Testing Platform'), {
					headers: { 'Content-Type': 'text/html;charset=UTF-8' }
				});
			}
			
			// Embed preview page
			if (path.match(/^\/embed\/[^/]+$/)) {
				const testId = path.split('/')[2];
				
				const embedPreviewContent = `
					<div class="max-w-4xl mx-auto">
						<h1 class="text-3xl font-bold mb-6">Test Preview</h1>
						
						<div class="bg-white p-6 rounded-lg shadow mb-6">
							<div id="loading" class="flex justify-center py-10">
								<div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
							</div>
							
							<div id="variants" class="hidden">
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<h3 class="text-lg font-semibold mb-3">Variant A</h3>
										<div id="variantAContent" class="border p-4 rounded min-h-[200px]"></div>
									</div>
									
									<div>
										<h3 class="text-lg font-semibold mb-3">Variant B</h3>
										<div id="variantBContent" class="border p-4 rounded min-h-[200px]"></div>
									</div>
								</div>
							</div>
						</div>
						
						<div class="flex justify-between">
							<a href="/tests/${testId}/analytics" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
								View Analytics
							</a>
							<a href="/" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
								Back to Tests
							</a>
						</div>
					</div>
					
					<script>
						// Fetch test data when page loads
						document.addEventListener('DOMContentLoaded', async () => {
							try {
								const response = await fetch('/api/tests/${testId}');
								
								if (!response.ok) {
									throw new Error('Failed to fetch test data');
								}
								
								const test = await response.json();
								
								// Safely render the variants
								document.getElementById('variantAContent').innerHTML = test.variantA;
								document.getElementById('variantBContent').innerHTML = test.variantB;
								
								// Hide loading and show variants
								document.getElementById('loading').classList.add('hidden');
								document.getElementById('variants').classList.remove('hidden');
							} catch (error) {
								console.error('Error fetching test data:', error);
								document.getElementById('loading').innerHTML = \`
									<div class="text-center text-red-600">
										<p class="font-bold">Error loading test data</p>
										<p>\${error.message}</p>
									</div>
								\`;
							}
						});
					</script>
				`;
				return new Response(renderPage(embedPreviewContent, 'Test Preview - A/B Testing Platform'), {
					headers: { 'Content-Type': 'text/html;charset=UTF-8' }
				});
			}
			
			// Embed script (for external websites)
			if (path.startsWith('/embed') && method === 'GET') {
				const testId = path.split('/')[2];
				
				if (!testId) {
					return new Response('Test ID is required', { status: 400 });
				}
				
				// Track view - generate random variant
				const variant = Math.random() < 0.5 ? 'A' : 'B';
				
				// Track the view via API
				ctx.waitUntil(fetch(`https://ab-testing-api.irsale.fr/tests/${testId}/track/${variant}`, {
					method: 'POST'
				}));
				
				// Simple script to insert variant content
				const embedScript = `
				// A/B Test Embed Script
				(async () => {
					try {
						// Fetch test data
						const response = await fetch('https://ab-testing-api.irsale.fr/tests/${testId}');
						
						if (!response.ok) {
							throw new Error('Failed to fetch test data');
						}
						
						const test = await response.json();
						
						// Get the current script element
						const scriptElement = document.currentScript;
						
						// Create a container element
						const container = document.createElement('div');
						
						// Insert the selected variant
						container.innerHTML = test.variant${variant};
						
						// Replace this script with the content
						scriptElement.parentNode.replaceChild(container, scriptElement);
					} catch (error) {
						console.error('A/B Testing error:', error);
					}
				})();
				`;
				
				return new Response(embedScript, {
					headers: { 'Content-Type': 'application/javascript' }
				});
			}
			
			// 404 Page
			return new Response(renderPage(`
				<div class="flex flex-col items-center justify-center min-h-[50vh]">
					<h1 class="text-4xl font-bold mb-4">404 - Page Not Found</h1>
					<p class="text-xl mb-8">The page you're looking for doesn't exist.</p>
					<a href="/" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
						Go Home
					</a>
				</div>
			`, '404 - Page Not Found'), {
				status: 404,
				headers: { 'Content-Type': 'text/html;charset=UTF-8' }
			});
		} catch (error) {
			console.error('Render error:', error);
			return new Response(`Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
				status: 500,
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	},
};
