import React, { FC, useState, FormEvent, ChangeEvent } from 'react';
import { Layout } from '../components/Layout';

interface TestResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface ErrorResponse {
  error: string;
}

export const CreateTest: FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [testId, setTestId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (!name.trim()) {
        throw new Error('Test name is required');
      }
      
      if (!variantA.trim() || !variantB.trim()) {
        throw new Error('Both variants must contain content');
      }

      // Create form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('variantA', variantA);
      formData.append('variantB', variantB);

      // Submit the form
      const response = await fetch('/api/tests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || 'Failed to create test');
      }

      const data = await response.json() as TestResponse;
      setTestId(data.id);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success && testId) {
    return (
      <Layout>
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-4">Test Created Successfully!</h1>
          
          <div className="mb-6">
            <p className="text-green-700 mb-2">Your A/B test has been created.</p>
          </div>
          
          <div className="bg-white p-4 rounded-md mb-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-medium mb-2">Embed Code</h2>
            <p className="text-sm text-gray-600 mb-2">
              Add this code to your website to embed the A/B test:
            </p>
            <div className="bg-gray-100 p-3 rounded text-left overflow-x-auto">
              <code className="text-sm">
                {`<script src="https://ab-testing-frontend.irsale.fr/embed/${testId}" defer></script>`}
              </code>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <a
              href={`/tests/${testId}/analytics`}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Analytics
            </a>
            <a
              href={`/embed/${testId}`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Preview Test
            </a>
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Tests
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create A/B Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Test Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a name for your test"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.currentTarget.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a description (optional)"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="variantA" className="block text-sm font-medium text-gray-700">
                Variant A (Control) *
              </label>
              <textarea
                id="variantA"
                value={variantA}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVariantA(e.currentTarget.value)}
                rows={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter HTML content for Variant A"
                required
              />
            </div>
            
            <div>
              <label htmlFor="variantB" className="block text-sm font-medium text-gray-700">
                Variant B (Test) *
              </label>
              <textarea
                id="variantB"
                value={variantB}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setVariantB(e.currentTarget.value)}
                rows={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter HTML content for Variant B"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <a
              href="/"
              className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}; 