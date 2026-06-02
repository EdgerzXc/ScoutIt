import { redirect } from 'next/navigation';

export default function PropertyRootPage() {
  redirect('/discover');
  return null;
}
