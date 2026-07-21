type Option = { id: string; name: string };

export function ChipMultiSelect({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div>
      <p className="text-sm text-neutral-300">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selectedIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-white bg-white text-neutral-950"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-400"
              }`}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
