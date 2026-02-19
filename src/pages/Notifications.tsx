import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Notifications = () => {
  const { quotaStatus, acknowledgeQuota, user, logout } = useAuth();

  const scansExhausted = quotaStatus?.scansExhausted;
  const jobsExhausted = quotaStatus?.jobsExhausted;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-2xl font-black mb-6">Notifications</h1>

        <Card className="mb-4">
          <CardContent>
            <h3 className="font-bold">Trial Usage</h3>
            <p className="text-sm text-slate-600 mt-2">This panel shows your current trial limits and actions.</p>
            <div className="mt-4 space-y-3">
              {scansExhausted ? (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="font-bold text-amber-700">Scan quota reached</p>
                  <p className="text-sm text-amber-700 mt-1">You have reached the limit of candidate screenings for this trial. You can still view the existing job and candidates but cannot screen additional profiles.</p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="font-bold text-emerald-700">Scans available</p>
                  <p className="text-sm text-emerald-700 mt-1">You can continue screening candidates until your quota is reached.</p>
                </div>
              )}

              {jobsExhausted ? (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="font-bold text-amber-700">Job posting blocked</p>
                  <p className="text-sm text-amber-700 mt-1">Your trial allows one active job posting. To add more, upgrade to a paid plan.</p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="font-bold text-emerald-700">Job posting available</p>
                  <p className="text-sm text-emerald-700 mt-1">You can create one job posting while on trial.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => acknowledgeQuota()} variant="outline">Dismiss</Button>
              <Button onClick={() => window.location.assign('/settings')}>Upgrade Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
