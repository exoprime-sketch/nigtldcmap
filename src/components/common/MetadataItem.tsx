interface MetadataItemProps {
  label: string;
  value: string;
}

export default function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
