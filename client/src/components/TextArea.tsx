import { forwardRef, type TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(function TextArea(
  { label, error, id, ...rest },
  ref
) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-neutral-300">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={5}
        className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-400"
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
});
