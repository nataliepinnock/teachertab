'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { deleteAccount } from '@/app/(login)/actions';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DeleteState = {
  error?: string;
  success?: string;
};

export default function DeleteAccountConfirmPage() {
  const router = useRouter();
  const { data: user } = useSWR('/api/user', fetcher);
  const [feedback, setFeedback] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  const isConfirmTextValid = confirmText.toLowerCase() === 'delete my account';

  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-y-auto">
      <div className="p-4 lg:p-8 max-w-2xl mx-auto w-full pb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Account Settings
        </Button>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Account Deletion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  ⚠️ This action cannot be undone
                </p>
                <p className="text-sm text-red-700">
                  Your account will be marked for deletion and permanently removed after 30 days. 
                  During this time, your account can be restored if needed. After 30 days, all data will be permanently deleted.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What will be deleted:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>All your timetable data</li>
                  <li>All your lesson plans</li>
                  <li>All your classes and subjects</li>
                  <li>Your subscription information</li>
                  <li>Your account settings and preferences</li>
                </ul>
              </div>

              <form action={deleteAction} className="space-y-6">
                <div>
                  <Label htmlFor="feedback" className="mb-2">
                    Feedback (Optional)
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    We'd love to hear why you're leaving. Your feedback helps us improve TeacherTab.
                  </p>
                  <Textarea
                    id="feedback"
                    name="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What could we have done better? What features were missing? Any other feedback?"
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-text" className="mb-2">
                    Type "DELETE MY ACCOUNT" to confirm
                  </Label>
                  <input
                    id="confirm-text"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                    disabled={isDeletePending}
                  />
                </div>

                {deleteState.error && (
                  <p className="text-red-500 text-sm">{deleteState.error}</p>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={isDeletePending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={isDeletePending || !isConfirmTextValid}
                    onClick={(e) => {
                      if (!isConfirmTextValid) {
                        e.preventDefault();
                        return;
                      }
                    }}
                  >
                    {isDeletePending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

