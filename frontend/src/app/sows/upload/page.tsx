'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import SOWUploader from '@/components/SOWUploader';
import AgencySetup from '@/components/AgencySetup';
import { useAgency } from '@/lib/useAgency';

export default function SOWUploadPage() {
  const { agency, loading, setupAgency } = useAgency();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!agency) {
    return <AgencySetup onSetup={setupAgency} />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Upload Contract / SOW
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {agency.name} &mdash; Upload a Statement of Work to establish scope guardrails for AI
          monitoring
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <SOWUploader agencyId={agency.id} />
      </div>
    </div>
  );
}
