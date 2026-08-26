interface FilterButtonProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}

export default function FilterButton({
  active,
  label,
  count,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      className={active ? "filter-option active" : "filter-option"}
      onClick={onClick}
    >
      <span>{label}</span>
      <b>{count}</b>
    </button>
  );
}
