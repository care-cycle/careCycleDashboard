interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  noBorder?: boolean;
}

export function PageHeader({
  title,
  description,
  className,
  noBorder,
}: PageHeaderProps) {
  return (
    <div className={`${!noBorder ? "border-b pb-5" : ""} ${className || ""}`}>
      <div className="max-w-[800px]">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}
