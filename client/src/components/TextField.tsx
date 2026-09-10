import { forwardRef, useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, error, id, type, ...rest },
  ref
) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const effectiveType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      <label htmlFor={id} className="block text-sm text-neutral-300">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={effectiveType}
          className={`mt-1 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-neutral-400 ${
            isPassword ? "pr-11" : ""
          }`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 mt-1 flex items-center px-3 text-lg text-neutral-400 hover:text-white"
            tabIndex={-1}
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
});
