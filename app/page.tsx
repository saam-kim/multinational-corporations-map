import TeachingMap from '@/components/teaching-map';
import StudentExplorer from '@/components/student-explorer';

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  if (query.session || query.mode === 'student') return <StudentExplorer />;
  return <TeachingMap initialCompany={typeof query.company === 'string' ? query.company : ''} initialHub={typeof query.hub === 'string' ? query.hub : ''} />;
}
