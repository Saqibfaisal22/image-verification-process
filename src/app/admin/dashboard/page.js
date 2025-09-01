
'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchLinks();
      } else {
        router.push('/admin');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchLinks = async () => {
    const linksCollection = collection(db, 'links');
    const linksSnapshot = await getDocs(linksCollection);
    const linksList = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLinks(linksList);
  };

  const generateLink = async () => {
    const newLinkRef = await addDoc(collection(db, 'links'), {
      status: 'unused',
      createdAt: new Date(),
      images: []
    });
    fetchLinks(); // Refresh the links list
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
      <button onClick={handleLogout} style={{ padding: '10px', marginBottom: '20px' }}>Logout</button>
      <button onClick={generateLink} style={{ padding: '10px', marginBottom: '20px', marginLeft: '10px' }}>Generate Link</button>
      
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
        ))}
    </div>
  );
}
