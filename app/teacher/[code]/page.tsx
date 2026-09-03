import TeacherDashboard from '@/components/teacher-dashboard';

export default async function TeacherPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TeacherDashboard code={code.toUpperCase()} />;
}
