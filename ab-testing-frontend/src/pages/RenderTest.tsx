import React, { FC, useState, useEffect } from 'react';

interface TestData {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
}

export const RenderTest: FC<{ testId?: string }> = ({ testId }) => {
  const [test, setTest] = useState<TestData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B' | null>(null);
  
  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setError('Test ID is required');
        setLoading(false);
        return;
      }

      try {
        // Fetch the test data
        const response = await fetch(`/api/tests/${testId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch test data');
        }
        
        const data = await response.json() as TestData;
        setTest(data);
        
        // Randomly select a variant (50/50 chance)
        const variant = Math.random() < 0.5 ? 'A' : 'B';
        setSelectedVariant(variant);
        
        // Track the view for the selected variant
        await fetch(`/api/tests/${testId}/track/${variant}`, {
          method: 'POST'
        });
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!test || !selectedVariant) {
    return <div>No test data available</div>;
  }

  // Render the selected variant's content
  const variantContent = selectedVariant === 'A' ? test.variantA : test.variantB;
  
  // We use dangerouslySetInnerHTML to render the HTML content
  // In a production environment, you'd want to sanitize this input
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: variantContent }} />
    </div>
  );
}; 