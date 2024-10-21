// src/components/RecommendationsForm.tsx

import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';

const RecommendationsForm: React.FC = () => {
  const [recommendations, setRecommendations] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError('User is not authenticated');
      return;
    }

    try {
      // Get the ID token
      const idToken = await user.getIdToken(true);

      // Send recommendations to the server
      const response = await fetch('/api/saverecommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          recommendations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recommendations');
      }

      // Update success state and clear error
      setSuccess('Recommendations saved successfully.');
      setError(null);
    } catch (error) {
      // Handle errors and update state
      setError(`Error saving recommendations: ${(error as Error).message}`);
      setSuccess(null);
    }
  };

  // Handler for form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRecommendations((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  return (
    <div>
      <h2>Save Recommendations</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div>
          <label htmlFor="calories">Calories:</label>
          <input
            type="number"
            id="calories"
            name="calories"
            value={recommendations.calories}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="protein">Protein:</label>
          <input
            type="number"
            id="protein"
            name="protein"
            value={recommendations.protein}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="carbs">Carbs:</label>
          <input
            type="number"
            id="carbs"
            name="carbs"
            value={recommendations.carbs}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="fat">Fat:</label>
          <input
            type="number"
            id="fat"
            name="fat"
            value={recommendations.fat}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Save Recommendations</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
};

export default RecommendationsForm;
