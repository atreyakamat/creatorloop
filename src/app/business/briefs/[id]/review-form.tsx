"use client";

import { useActionState, useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { Button, TextArea } from "@/components/ui";
import { FormAlert } from "@/components/form-alert";
import { reviewSubmission, type FormState } from "../../actions";

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    reviewSubmission.bind(null, submissionId),
    undefined,
  );
  const [asking, setAsking] = useState(false);

  return (
    <form action={action} className="mt-4 space-y-3">
      {asking ? (
        <TextArea
          label="What should change?"
          name="feedback"
          placeholder="Great shots. Please open with the pour and make the text bigger."
          required
          minLength={3}
          maxLength={1000}
          rows={2}
        />
      ) : null}
      <FormAlert error={state?.error} />
      <div className="flex flex-wrap gap-2">
        {asking ? (
          <>
            <Button type="submit" name="decision" value="changes_requested" disabled={pending} className="px-4 py-2">
              {pending ? "Sending…" : "Send feedback"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAsking(false)} className="px-4 py-2">
              Back
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" name="decision" value="approved" variant="accent" disabled={pending} className="px-4 py-2">
              <Check className="size-4" aria-hidden /> {pending ? "Approving…" : "Approve"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setAsking(true)} className="px-4 py-2">
              <MessageSquare className="size-4" aria-hidden /> Request changes
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
