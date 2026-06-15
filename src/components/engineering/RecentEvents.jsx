import { memo } from 'react';
import { RECENT_EVENTS } from './engineeringData';

const EventIcon = memo(({ icon: Icon, variant }) => (
  <div className={`eng-events__icon eng-events__icon--${variant}`}>
    <Icon size={14} aria-hidden="true" />
  </div>
));

EventIcon.displayName = 'EventIcon';

export const RecentEvents = memo(() => (
  <section className="eng-events">
    <div className="eng-events__timeline" role="list" aria-label="Recent engineering events">
      {RECENT_EVENTS.map((evt, i) => (
        <div key={i} className="eng-events__item" role="listitem">
          <EventIcon icon={evt.icon} variant={evt.variant} />
          <div className="eng-events__content">
            <span className="eng-events__event">{evt.event}</span>
            <span className="eng-events__time">{evt.time}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
));

RecentEvents.displayName = 'RecentEvents';
