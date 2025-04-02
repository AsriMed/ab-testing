import React, { FC } from 'react';
import { Layout } from '../components/Layout';

export const Home: FC = () => {
  return (
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-center mt-10">A/B Testing Platform</h1>
        <p className="text-center mt-5">Welcome to the A/B Testing Platform</p>
        <div className="flex justify-center mt-10">
          <a 
            href="/create" 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create New Test
          </a>
        </div>
      </div>
    </Layout>
  );
}; 