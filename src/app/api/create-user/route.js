
import { NextResponse } from 'next/server';
import db, { Admin, authAdmin } from '../../../firebase/admin';

export async function POST(request) {
  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];

  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, verify the token of the admin making the request
    await authAdmin.verifyIdToken(idToken);

    const { email, password, tier } = await request.json();

    if (!email || !password || !tier) {
      return NextResponse.json({ error: 'Missing required fields: email, password, tier' }, { status: 400 });
    }

    // Create the new user in Firebase Authentication
    const userRecord = await authAdmin.createUser({
      email: email,
      password: password,
    });

    // Create the corresponding user document in Firestore
    const userId = userRecord.uid;
    const userRef = db.collection('users').doc(userId);
    
    const now = new Date();
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await userRef.set({
      userId,
      email,
      tier,
      linksThisMonth: 0,
      resetAt: Admin.firestore.Timestamp.fromDate(resetAt),
    });

    return NextResponse.json({ message: 'User created successfully', userId: userId });

  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
