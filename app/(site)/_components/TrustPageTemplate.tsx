import React from 'react';

type TrustPageSection = {
  title: string;
  items: string[];
};

interface TrustPageTemplateProps {
  title: string;
  description: string;
  sections: TrustPageSection[];
}

export function TrustPageTemplate({ title, description, sections }: TrustPageTemplateProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </header>

      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
