"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { iconButtonClass } from "./styles";
import { useToast } from "./Toast";

export interface DeleteButtonProps {
  /**
   * Server action performing the delete; called as `action(id)`. Pass the imported server
   * action itself (`action={deleteArticle}`) — this works from server components too, because
   * server action references are serializable (an inline arrow would not be).
   */
  action: (id: string) => Promise<ActionResult<unknown>>;
  /** Id of the document to delete. */
  id: string;
  /** Name of the thing being deleted, used in the dialog ("Delete “Sajjan Raj Vaidya”?"). */
  itemLabel: string;
  /** Where to go after deleting (e.g. the list page). Omit to router.refresh() in place. */
  redirectTo?: string;
  /** Button text (default "Delete"). */
  label?: string;
  /** Extra sentence in the dialog. */
  description?: string;
  /** Called after a successful delete (before navigation). */
  onDeleted?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render only the trash icon as a 36px square matching the other row buttons; label becomes the aria-label. `size`/`variant` are ignored. */
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Delete with a confirmation dialog; toasts the outcome and refreshes or navigates. */
export function DeleteButton({
  action,
  id,
  itemLabel,
  redirectTo,
  label = "Delete",
  description,
  onDeleted,
  variant = "ghost",
  size = "md",
  iconOnly = false,
  disabled,
  className,
}: DeleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      let result: ActionResult<unknown>;
      try {
        result = await action(id);
      } catch {
        setError("Could not reach the server. Try again.");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast.success(result.message ?? `Deleted “${itemLabel}”.`);
      onDeleted?.();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <>
      {iconOnly ? (
        // Same 36px bordered square as the other row buttons (iconButtonClass), in danger red.
        // (Routing it through <Button> left the pill padding in place, which squeezed the icon.)
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setError(undefined);
            setOpen(true);
          }}
          aria-label={`${label} ${itemLabel}`}
          title={label}
          className={cn(iconButtonClass, "text-danger hover:border-danger/60 hover:bg-danger/10 hover:text-danger", className)}
        >
          <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      ) : (
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          onClick={() => {
            setError(undefined);
            setOpen(true);
          }}
          className={variant === "ghost" ? cn("text-danger hover:bg-danger/10 hover:text-danger", className) : className}
          icon={<Trash2 aria-hidden className="size-4" strokeWidth={1.75} />}
        >
          {label}
        </Button>
      )}
      <ConfirmDialog
        open={open}
        title={`Delete “${itemLabel}”?`}
        description={
          <>
            {description ? <p className="mb-2">{description}</p> : null}
            <p>This can’t be undone.</p>
          </>
        }
        confirmLabel={label}
        pending={pending}
        error={error}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
