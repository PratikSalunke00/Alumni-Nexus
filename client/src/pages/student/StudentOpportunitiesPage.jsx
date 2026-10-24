import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardShell from '../../components/DashboardShell';

const fallbackOpportunities = [
  { _id: '1', title: 'Software Engineer Intern', company: 'Google', type: 'Internship', location: 'Bengaluru', salary: '₹60k/mo', remote: false, tags: ['JavaScript', 'React', 'DSA'], description: 'Build scalable web products and collaborate with mentors on live projects.' },
  { _id: '2', title: 'Product Analyst', company: 'Microsoft', type: 'Full Time', location: 'Hyderabad', salary: '₹18 LPA', remote: false, tags: ['SQL', 'Data', 'Product'], description: 'Work across experimentation, feature strategy, and business insights.' },
  { _id: '3', title: 'Data Analyst', company: 'Amazon', type: 'Internship', location: 'Remote', salary: '₹35k/mo', remote: true, tags: ['Python', 'Excel', 'Analytics'], description: 'Support data pipelines and generate weekly performance reports.' },
];

const StudentOpportunitiesPage = () => {
  const [opportunities, setOpportunities] = useState(fallbackOpportunities);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    axios
      .get(`${apiBase}/opportunities`)
      .then((response) => {
        if (Array.isArray(response?.data?.data) && response.data.data.length > 0) {
          setOpportunities(response.data.data);
        }
      })
      .catch(() => {
        setOpportunities(fallbackOpportunities);
      });
  }, []);

  return (
    <DashboardShell role="student" pageTitle="Opportunities">
      <div className="space-y-6">
        <section className="rounded-3xl border border-sky-100 bg-sky-50 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Career growth</p>
              <h3 className="mt-2 text-3xl font-semibold text-slate-900">Recommended opportunities</h3>
            </div>
            <button className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white">Browse all</button>
          </div>
        </section>

        <div className="space-y-4">
          {opportunities.map((item) => (
            <div key={item._id || item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">{item.type}</span>
                    {item.remote && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Remote</span>}
                  </div>
                  <div>
                    <h4 className="text-2xl font-semibold text-slate-900">{item.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{item.company} · {item.location}</p>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {(item.tags || []).map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex min-w-[180px] flex-col items-end gap-3">
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Salary</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{item.salary || 'Competitive'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Save</button>
                    <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white">Apply</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
};

export default StudentOpportunitiesPage;
