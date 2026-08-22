import type { Metadata } from 'next';
import { getAllProperties } from '@/lib/db';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const properties = await getAllProperties();

  return <AdminDashboard initialProperties={properties} />;
}
