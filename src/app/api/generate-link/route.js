
import { NextResponse } from 'next/server';
import db, { authAdmin } from '../../../firebase/admin';

const subscriptionTiers = {
  free: 10,
  basic: 15,
  premium: 20,
};

export async function POST(request) {
  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  const { name, email, phone, logoLink, bankName } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    let userData;

    if (!userSnap.exists) {
      // Create a new user with the default free tier
      const now = new Date();
      const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      userData = {
        userId,
        email: decodedToken.email,
        tier: 'free',
        linksThisMonth: 0,
        resetAt: admin.firestore.Timestamp.fromDate(resetAt),
      };
      await userRef.set(userData);
    } else {
      userData = userSnap.data();
      const now = new Date();
      // Check if quota needs to be reset
      if (now >= userData.resetAt.toDate()) {
        const newResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        userData.linksThisMonth = 0;
        userData.resetAt = admin.firestore.Timestamp.fromDate(newResetAt);
        await userRef.update({ 
          linksThisMonth: userData.linksThisMonth, 
          resetAt: userData.resetAt 
        });
      }
    }

    const limit = subscriptionTiers[userData.tier] || 0;

    if (userData.linksThisMonth >= limit) {
      return NextResponse.json({ error: 'Monthly link generation limit reached' }, { status: 429 });
    }

    // If within quota, generate the link
    const newLinkRef = await db.collection('links').add({
      status: 'unused',
      createdAt: new Date(),
      images: [],
      userId: userId,
      name,
      email,
      phone,
      logoLink,
      bankName,
    });

    // Increment the user's count
    await userRef.update({ linksThisMonth: userData.linksThisMonth + 1 });

    return NextResponse.json({ 
      message: 'Link generated successfully', 
      linkId: newLinkRef.id, 
      linksThisMonth: userData.linksThisMonth + 1,
      limit: limit
    });

  } catch (error) {
    console.error('Error generating link:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Token expired' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
