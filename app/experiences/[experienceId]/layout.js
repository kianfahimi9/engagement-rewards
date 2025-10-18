import { WhopWebsocketProvider } from "@whop/react/websockets";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ExperienceLayout({ children, params }) {
  const { experienceId } = await params;

  return (
    <WhopWebsocketProvider joinExperience={experienceId}>
      <div className="w-full max-w-7xl mx-auto">
        {children}
      </div>
    </WhopWebsocketProvider>
  );
}
 