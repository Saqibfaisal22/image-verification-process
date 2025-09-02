
'use client';

import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../../../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

function CreateUserForm({ currentUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('free');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email, password, tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`User ${email} created successfully!`);
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '5px', marginTop: '20px' }}>
      <h2>Create New User</h2>
      <form onSubmit={handleCreateUser}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <select value={tier} onChange={(e) => setTier(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none' }}>Create User</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </form>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchLinks = useCallback(async () => {
    const linksCollection = collection(db, 'links');
    const linksSnapshot = await getDocs(linksCollection);
    const linksList = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLinks(linksList);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetchLinks();

    const userRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(userRef, (snapshot) => {
      const usersList = snapshot.docs.map(doc => doc.data());
      setAllUsers(usersList);
      const currentUserData = usersList.find(u => u.userId === user.uid);
      if (currentUserData) {
        setUserData(currentUserData);
      }
    });

    return () => unsubscribeUsers();
  }, [user, fetchLinks]);

  const generateLink = async () => {
    setError(null);
    if (!user) {
      setError('You must be logged in to generate a link.');
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/generate-link', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to generate link');
      }

      fetchLinks();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin');
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Dashboard</h1>
      {user && <p>Welcome, {user.email}</p>}
      {userData && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
          <p>Your Tier: <strong>{userData.tier}</strong> | Links Used: <strong>{userData.linksThisMonth} / {userData.tier === 'free' ? 10 : userData.tier === 'basic' ? 15 : 20}</strong></p>
        </div>
      )}
      <button onClick={handleLogout} style={{ padding: '10px', marginBottom: '20px' }}>Logout</button>
      <button onClick={generateLink} style={{ padding: '10px', marginBottom: '20px', marginLeft: '10px' }}>Generate Link</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <CreateUserForm currentUser={user} />

      <h2 style={{ marginTop: '40px' }}>All Users</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Email</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Tier</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Usage</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map(u => (
            <tr key={u.userId}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.email}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.tier}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{u.linksThisMonth}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Generated Links</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Link ID</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Link</th>
          </tr>
        </thead>
        <tbody>
          {links.map(link => (
            <tr key={link.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{link.id}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{link.status}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}><a href={`/upload/${link.id}`} target="_blank" rel="noopener noreferrer">{`/upload/${link.id}`}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Uploaded Images</h2>
      {links.filter(link => link.status === 'used').map(link => (
        <div key={link.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>Link ID: {link.id}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {link.images && link.images.map((image, index) => (
              <img key={index} src={image} alt={`Uploaded image ${index + 1}`} style={{ maxWidth: '200px', maxHeight: '200px' }} />
            ))}
          </div>
        </div>
      ))}    </div>
  );
}
