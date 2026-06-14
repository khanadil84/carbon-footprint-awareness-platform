import { memo } from 'react';

export const ActivityFilters = memo(({ filters, onChange, types }) => {
  const handle = (k, v) => onChange({ ...filters, [k]: v });

  return (
    <form className="dfp-filters" onSubmit={(e)=>e.preventDefault()} aria-label="Activity filters">
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          <span className="sr-only">Search</span>
          <input placeholder="Search by type or value" value={filters.search||''} onChange={e=>handle('search', e.target.value)} />
        </label>

        <label>
          <span className="sr-only">Start date</span>
          <input type="date" value={filters.startDate||''} onChange={e=>handle('startDate', e.target.value)} />
        </label>
        <label>
          <span className="sr-only">End date</span>
          <input type="date" value={filters.endDate||''} onChange={e=>handle('endDate', e.target.value)} />
        </label>

        <label>
          Category
          <select value={filters.category||'All'} onChange={e=>handle('category', e.target.value)}>
            <option value="All">All categories</option>
            <option value="Travel">Travel</option>
            <option value="Home">Home</option>
            <option value="Food">Food</option>
          </select>
        </label>

        <label>
          Type
          <select value={filters.type||'All'} onChange={e=>handle('type', e.target.value)}>
            <option value="All">All types</option>
            {types.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label>
          <span className="sr-only">Min CO2</span>
          <input type="number" step="0.001" min="0" placeholder="Min CO₂" value={filters.minCo2||''} onChange={e=>handle('minCo2', e.target.value?Number(e.target.value):'')} />
        </label>
        <label>
          <span className="sr-only">Max CO2</span>
          <input type="number" step="0.001" min="0" placeholder="Max CO₂" value={filters.maxCo2||''} onChange={e=>handle('maxCo2', e.target.value?Number(e.target.value):'')} />
        </label>

        <label>
          Sort
          <select value={filters.sort||'newest'} onChange={e=>handle('sort', e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest CO₂</option>
            <option value="lowest">Lowest CO₂</option>
          </select>
        </label>

        <button type="button" className="btn" onClick={()=>onChange({})}>Clear filters</button>
      </div>
    </form>
  );
});

export default ActivityFilters;
