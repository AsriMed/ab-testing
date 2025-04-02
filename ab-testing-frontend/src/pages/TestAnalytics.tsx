import React, { FC, useState, useEffect } from 'react';
import { Layout } from '../components/Layout';

interface TestStats {
  testId: string;
  testName: string;
  totalViews: number;
  variantA: {
    views: number;
    percentage: number;
  };
  variantB: {
    views: number;
    percentage: number;
  };
}

export const TestAnalytics: FC<{ testId?: string }> = ({ testId }) => {
  const [stats, setStats] = useState<TestStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!testId) {
        setError('Test ID is required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/tests/${testId}/stats`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch test statistics');
        }
        
        const data = await response.json() as TestStats;
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchStats();
  }, [testId]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Test Analytics</h1>
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Back to Tests
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        ) : !stats ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>No statistics available for this test.</p>
          </div>
        ) : (
          <div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">{stats.testName}</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Test ID: {stats.testId}</p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Total Views</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{stats.totalViews}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Variant A (Control)</h3>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Views</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{stats.variantA.views}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Percentage</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{stats.variantA.percentage}%</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Variant B (Test)</h3>
                </div>
                <div className="border-t border-gray-200">
                  <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Views</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{stats.variantB.views}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Percentage</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{stats.variantB.percentage}%</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Comparison Chart</h3>
                <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-l-full" 
                    style={{ width: `${stats.variantA.percentage}%` }}
                  >
                    <span className="px-2 text-xs font-medium text-white">A: {stats.variantA.percentage}%</span>
                  </div>
                  <div 
                    className="h-full bg-green-500 rounded-r-full -mt-8" 
                    style={{ width: `${stats.variantB.percentage}%`, marginLeft: `${stats.variantA.percentage}%` }}
                  >
                    <span className="px-2 text-xs font-medium text-white">B: {stats.variantB.percentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}; 