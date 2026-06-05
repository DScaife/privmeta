"use client";
import Typography from "./Typography";
import type { FileStrippedReport } from "@/utils/stripMetadata";

function totalItems(report: FileStrippedReport): number {
  return report.categories.reduce((sum, cat) => sum + (cat.fields.length > 0 ? cat.fields.length : 1), 0);
}

function CategoryCard({ category }: { category: FileStrippedReport["categories"][0] }) {
  return (
    <div className="flex flex-col gap-(--space-sm) rounded-sm border border-foreground/20 p-(--space-lg)">
      <div className="flex items-center gap-(--space-sm)">
        <span className="text-lg" aria-hidden="true">
          {category.emoji}
        </span>
        <Typography as="span" variant="label" weight={600}>
          {category.name}
        </Typography>
      </div>
      <Typography variant="bodySm" muted>
        {category.summary}
      </Typography>
      {category.fields.length > 0 && (
        <ul className="flex flex-col gap-(--space-sm) mt-(--space-xs) border-t border-foreground/10 pt-(--space-sm)">
          {category.fields.map((field, i) => (
            <li key={i} className="flex flex-col gap-0.5">
              <div className="flex flex-wrap items-baseline gap-(--space-sm)">
                <Typography as="span" variant="bodySm" weight={600}>
                  {field.label}
                </Typography>
                {field.value && (
                  <Typography as="span" variant="bodySm" className="font-mono break-all text-foreground">
                    {field.value}
                  </Typography>
                )}
              </div>
              <Typography variant="legal" muted className="italic">
                {field.why}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileReportCard({ report }: { report: FileStrippedReport }) {
  const count = totalItems(report);
  return (
    <div className="flex flex-col gap-(--space-md)">
      <div className="flex flex-col gap-(--space-xs)">
        <Typography as="h3" variant="h2" weight={600}>
          {report.fileName}
        </Typography>
        <Typography variant="body" muted>
          {count} {count === 1 ? "type" : "types"} of hidden data found and removed.
        </Typography>
      </div>
      <div className="flex flex-col gap-(--space-sm)">
        {report.categories.map((cat, i) => (
          <CategoryCard key={i} category={cat} />
        ))}
      </div>
    </div>
  );
}

export default function MetadataReport({ reports }: { reports: FileStrippedReport[] }) {
  if (reports.length === 0) return null;
  return (
    <section className="w-full flex flex-col gap-(--fluid-lg-xl)">
      <div className="flex flex-col gap-(--space-xs)">
        <Typography as="h2" variant="h1" weight={700}>
          What was removed
        </Typography>
        <Typography variant="body" muted>
          Here is a plain-English breakdown of the hidden data that was stripped before your download. This data is invisible
          to most people but can be read by anyone who knows how to look.
        </Typography>
      </div>
      <div className="flex flex-col gap-(--fluid-md-lg)">
        {reports.map((report, i) => (
          <FileReportCard key={i} report={report} />
        ))}
      </div>
    </section>
  );
}