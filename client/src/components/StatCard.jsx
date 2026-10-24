const StatCard = ({ label, value, detail, accent = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-900 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-900 ring-amber-100',
    sky: 'bg-sky-50 text-sky-900 ring-sky-100',
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ${colorMap[accent]}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <h3 className="text-3xl font-semibold tracking-tight text-slate-900">{value}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-600">{detail}</p>
    </div>
  );
};

export default StatCard;
