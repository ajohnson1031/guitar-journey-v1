import * as React from "react";

const { Fragment } = React;

export default function TransitionTracker({ onUpdateTransitionScore, selectedSong, transitionScores }) {
  return (
    <Fragment>
      <section className="panel-card detail-section-card">
        <div className="detail-section-header">
          <div>
            <p className="eyebrow">Practice Detail</p>
            <h2>Transition Tracker</h2>
            <p className="section-copy">Log clean changes per minute. Aim for smoothness before speed.</p>
          </div>
        </div>

        {selectedSong.transitions.length ? (
          <div className="transition-list transition-grid">
            {selectedSong.transitions.map((transition) => {
              const key = `${selectedSong.id}:${transition}`;

              return (
                <div key={transition} className="transition-card">
                  <div>
                    <strong>{transition}</strong>
                    <span>{transitionScores[key] || 0} clean/min</span>
                  </div>

                  <input type="range" min="0" max="80" value={transitionScores[key] || 0} onChange={(event) => onUpdateTransitionScore(transition, Number(event.target.value))} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="history-empty">
            <p>No transitions added for this song yet.</p>
          </div>
        )}
      </section>
    </Fragment>
  );
}
