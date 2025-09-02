
'use client';

import { useState } from 'react';

export default function GenerateLinkModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logoLink, setLogoLink] = useState('');
  const [bankName, setBankName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, phone, logoLink, bankName });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '5px', width: '400px' }}>
        <h2>Generate New Link</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Phone Number:</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Logo Link:</label>
            <input type="url" value={logoLink} onChange={(e) => setLogoLink(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Bank Name:</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: '100%', padding: '8px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none' }}>Generate</button>
          </div>
        </form>
      </div>
    </div>
  );
}
