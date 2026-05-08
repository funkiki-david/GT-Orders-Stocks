type PageHeaderProps = {
  title: string;
  instruction: string;
};

export function PageHeader({ title, instruction }: PageHeaderProps) {
  return (
    <div className="mb-4">
      <h1 className="mb-1 font-title text-[22px] font-semibold text-primaryText">{title}</h1>
      <p className="text-xs text-helperText">{instruction}</p>
    </div>
  );
}
