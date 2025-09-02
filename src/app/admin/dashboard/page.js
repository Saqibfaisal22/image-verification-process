
'use client';

import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../../../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import GenerateLinkModal from '../../../components/GenerateLinkModal';

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
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('links');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const fetchLinksAndImages = useCallback(async (currentUser) => {
    const linksCollection = collection(db, 'links');
    let linksQuery = linksCollection;

    if (currentUser.email !== 'admin@gmail.com') {
      linksQuery = query(linksCollection, where('userId', '==', currentUser.uid));
    }

    const linksSnapshot = await getDocs(linksQuery);
    const linksList = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLinks(linksList);

    const imagesList = linksList
      .filter(link => link.status === 'used' && link.images)
      .flatMap(link => link.images.map(image => ({ url:image, linkId: link.id })));
    setImages(imagesList);
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

    fetchLinksAndImages(user);

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
  }, [user, fetchLinksAndImages]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const generateLink = async (formData) => {
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to generate link');
      }

      fetchLinksAndImages(user);
      handleCloseModal();
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

  const isAdmin = user && user.email === 'admin@gmail.com';

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
      <button onClick={handleOpenModal} style={{ padding: '10px', marginBottom: '20px', marginLeft: '10px' }}>Generate Link</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <GenerateLinkModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={generateLink} />

      {isAdmin && <CreateUserForm currentUser={user} />}

      {isAdmin && (
        <>
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
        </>
      )}

      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
          <div
            onClick={() => handleTabClick('links')}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === 'links' ? '2px solid blue' : 'none',
              fontWeight: activeTab === 'links' ? 'bold' : 'normal',
            }}
          >
            {isAdmin ? 'All Generated Links' : 'My Generated Links'}
          </div>
          <div
            onClick={() => handleTabClick('images')}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              borderBottom: activeTab === 'images' ? '2px solid blue' : 'none',
              fontWeight: activeTab === 'images' ? 'bold' : 'normal',
            }}
          >
            {isAdmin ? 'All Uploaded Images' : 'My Uploaded Images'}
          </div>
        </div>

        {activeTab === 'links' && (
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
        )}

        {activeTab === 'images' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {images.map((image, index) => (
              <div key={index} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                <img src={image.url} alt={`Uploaded image ${index + 1}`} style={{ maxWidth: '200px', maxHeight: '200px' }} />
                <p>Link ID: {image.linkId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}