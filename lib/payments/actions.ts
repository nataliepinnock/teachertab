'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { getUser } from '@/lib/db/queries';

export const checkoutAction = async (formData: FormData) => {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession({ user, priceId, context: 'existing' });
};

export const customerPortalAction = async () => {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }
  
  const session = await createCustomerPortalSession(user);
  redirect(session.url);
};
