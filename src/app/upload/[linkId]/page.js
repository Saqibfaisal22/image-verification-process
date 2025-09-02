
'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useParams } from 'next/navigation';

export default function UploadPage() {
  const { linkId } = useParams();
  const [linkData, setLinkData] = useState(null);
  const [linkStatus, setLinkStatus] = useState('loading');
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const checkLink = useCallback(async () => {
    if (!linkId) return;
    const linkRef = doc(db, 'links', linkId);
    const linkSnap = await getDoc(linkRef);

    if (linkSnap.exists() && linkSnap.data().status === 'unused') {
      setLinkStatus('valid');
      setLinkData(linkSnap.data());
    } else {
      setLinkStatus('expired');
    }
  }, [linkId]);

  useEffect(() => {
    checkLink();
  }, [checkLink]);

  const handleFileChange = (e, setImage) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!image1 || !image2) {
      alert('Please capture both photos.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);
      formData.append('linkId', linkId);
      formData.append('userId', linkData.userId);

      const response = await fetch('/api/upload-cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { imageUrls } = await response.json();

      const linkRef = doc(db, 'links', linkId);
      await updateDoc(linkRef, {
        status: 'used',
        images: imageUrls,
      });

      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload failed: ", error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [image1, image2, linkId, linkData]);

  useEffect(() => {
    if (image1 && image2) {
      handleUpload();
    }
  }, [image1, image2, handleUpload]);

  if (linkStatus === 'loading') {
    return <p>Loading...</p>;
  }

  if (linkStatus === 'expired') {
    return <h1>Link expired or invalid.</h1>;
  }

  if (uploadSuccess) {
    return <h1>Upload successful!</h1>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {linkData && (
        <div style={{ marginBottom: '20px' }}>
          {linkData.logoLink && <img src={linkData.logoLink} alt="Logo" style={{ maxWidth: '150px', marginBottom: '20px' }} />}
          <h1>{linkData.name}</h1>
          <p>Email: {linkData.email}</p>
          <p>Phone: {linkData.phone}</p>
          <p>Bank: {linkData.bankName}</p>
        </div>
      )}
      <h1>Upload Photos</h1>
      <p>Please capture two photos.</p>
      <div style={{ marginBottom: '20px' }}>
        <label>Photo 1:</label>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, setImage1)} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label>Photo 2:</label>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, setImage2)} />
      </div>
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
