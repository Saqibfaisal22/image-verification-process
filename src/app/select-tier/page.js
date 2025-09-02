
'use client';

import { useState } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function SelectTier() {
  const [tier, setTier] = useState('free');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleTierSelection = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          tier: tier,
        });
        router.push('/admin/dashboard');
      } else {
        setError('You must be logged in to select a tier.');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h1>Select Your Subscription Tier</h1>
      <form onSubmit={handleTierSelection}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="tier">Subscription Tier</label>
          <select id="tier" value={tier} onChange={(e) => setTier(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
          Continue
        </button>
      </form>
    </div>
  );
}
