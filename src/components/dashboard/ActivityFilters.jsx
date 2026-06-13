export const ActivityFilters = ({ filters, onChange, types }) => {
  const handle = (k, v) => onChange({ ...filters, [k]: v });

  return (
    <form className="dfp-filters" onSubmit={(e)=>e.preventDefault()} aria-label="Activity filters">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
          <span className="sr-only">Search</span>
          <input aria-label="Search activities" placeholder="Search by type or value" value={filters.search||''} onChange={e=>handle('search', e.target.value)} />
        </label>

        <label style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
          <span className="sr-only">Start date</span>
          <input type="date" aria-label="Start date" value={filters.startDate||''} onChange={e=>handle('startDate', e.target.value)} />
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
          <span className="sr-only">End date</span>
          <input type="date" aria-label="End date" value={filters.endDate||''} onChange={e=>handle('endDate', e.target.value)} />
        </label>

        <label>
          <select aria-label="Category" value={filters.category||'All'} onChange={e=>handle('category', e.target.value)}>
            <option value="All">All categories</option>
            <option value="Travel">Travel</option>
            <option value="Home">Home</option>
            <option value="Food">Food</option>
          </select>
        </label>

        <label>
          <select aria-label="Type" value={filters.type||'All'} onChange={e=>handle('type', e.target.value)}>
            <option value="All">All types</option>
            {types.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
          <span className="sr-only">Min CO2</span>
          <input type="number" step="0.001" min="0" placeholder="Min CO₂" aria-label="Minimum CO2" value={filters.minCo2||''} onChange={e=>handle('minCo2', e.target.value?Number(e.target.value):'')} />
        </label>
        <label style={{ display:'flex', alignItems:'center', gap:'0.25rem' }}>
          <span className="sr-only">Max CO2</span>
          <input type="number" step="0.001" min="0" placeholder="Max CO₂" aria-label="Maximum CO2" value={filters.maxCo2||''} onChange={e=>handle('maxCo2', e.target.value?Number(e.target.value):'')} />
        </label>

        <label>
          <select aria-label="Sort" value={filters.sort||'newest'} onChange={e=>handle('sort', e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest CO₂</option>
            <option value="lowest">Lowest CO₂</option>
          </select>
        </label>

        <button type="button" className="btn" onClick={()=>onChange({})} aria-label="Clear filters">Clear</button>
      </div>
    </form>
  );
};

export default ActivityFilters;
