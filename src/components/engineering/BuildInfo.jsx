import { memo } from 'react';
import { BUILD_INFO } from './engineeringData';

export const BuildInfo = memo(() => (
  <section className="eng-build">
    <div className="eng-build__grid">
      {BUILD_INFO.map((item) => (
        <div key={item.label} className="eng-build__item">
          <span className="eng-build__label">{item.label}</span>
          <span className="eng-build__value">{item.value}</span>
        </div>
      ))}
    </div>
  </section>
));

BuildInfo.displayName = 'BuildInfo';
