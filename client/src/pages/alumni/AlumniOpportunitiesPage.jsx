import { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';

const opportunityDraft = {
  title: '',
  company: '',
  type: 'Internship',
  location: 'Remote',
  description: '',
};

const sampleList = [
  { id: 1, title: 'Frontend Developer', company: 'NEXA Labs', type: 'Full Time', location: 'Remote', applicants: 12 },
  { id: 2, title: 'Data Analyst', company: 'BrightPath', type: 'Internship', location: 'Bengaluru', applicants: 8 },
];

const AlumniOpportunitiesPage = () => {
  const [form, setForm] = useState(opportunityDraft);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardShell role="alumni" pageTitle="Opportunities">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Post opening</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">Share new opportunities</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input name="title" value={form.title} onChange={handleChange} placeholder="Role title" className="rounded-xl border border-slate-200 p-3" />
            <input name="company" value={form.company} onChange={handleChange} placeholder="Company name" className="rounded-xl border border-slate-200 p-3" />
            <select name="type" value={form.type} onChange={handleChange} className="rounded-xl border border-slate-200 p-3">
              <option>Internship</option>
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Campus</option>
            </select>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="rounded-xl border border-slate-200 p-3" />
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Job description" className="min-h-28 rounded-xl border border-slate-200 p-3 md:col-span-2" />
          </div>

          <div className="mt-4 flex justify-end">
            <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Publish</button>
          </div>
        </section>

        <section className="space-y-4">
          {sampleList.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xl font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.company} · {item.type} · {item.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{item.applicants} applicants</span>
                  <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">View</button>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </DashboardShell>
  );
};

export default AlumniOpportunitiesPage;
