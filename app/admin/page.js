import AdminView from './admin.client';
import { verifyUser } from '@/lib/authentication';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const params = await searchParams;
  const experienceId = params?.experienceId;
  
  if (!experienceId) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing Experience ID</h1>
          <p className="text-gray-600 mb-4">Please access this page from a valid community.</p>
        </div>
      </div>
    );
  }
  
  try {
    // Verify user has access to this experience and is the owner
    const { userId, isOwner, companyContext } = await verifyUser(experienceId);
    
    console.log('✅ Admin page - User verified:', { userId, isOwner, experienceId, companyId: companyContext.company.companyId });
    
    // Only allow owners to access admin page
    if (!isOwner) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only community owners can access the admin dashboard.</p>
            <a 
              href={`/experiences/${experienceId}`}
              className="text-blue-500 hover:underline"
            >
              Go back to leaderboard
            </a>
          </div>
        </div>
      );
    }
    
    // Pass auth info to client component
    return (
      <AdminView 
        experienceId={experienceId}
        userId={userId}
        companyId={companyContext.company.companyId}
      />
    );
  } catch (error) {
    console.error('❌ Admin page auth verification failed:', error);
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have access to this page.</p>
          <a 
            href="/" 
            className="text-blue-500 hover:underline"
          >
            Go to main page
          </a>
        </div>
      </div>
    );
  }
}
