import * as React from "react";

const { Fragment } = React;

export default function SettingsPanel() {
  return (
    <Fragment>
      <section className="panel-card settings-panel">
        <div className="settings-hero">
          <p className="eyebrow">Settings</p>
          <h2>App preferences</h2>
          <p>
            Configure how Guitar Journey looks, stores progress, and handles audio. Some options are placeholders for upcoming features.
          </p>
        </div>

        <div className="settings-grid">
          <SettingsSection
            title="Appearance"
            eyebrow="Theme"
            description="Light and dark mode will live here next, including a system preference option."
          >
            <div className="settings-placeholder-row">
              <span>Theme mode</span>
              <strong>Coming next</strong>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Storage"
            eyebrow="Persistence"
            description="Local progress is currently stored on this device. Later, this section can support user-configured databases or online sync targets."
          >
            <div className="settings-placeholder-row">
              <span>Current storage</span>
              <strong>localStorage</strong>
            </div>
            <div className="settings-placeholder-row">
              <span>Database configuration</span>
              <strong>Planned</strong>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Audio"
            eyebrow="Input / Output"
            description="Chord samples, recording inputs, and recorded-session playback settings will be configured here."
          >
            <div className="settings-placeholder-row">
              <span>Chord samples</span>
              <strong>Planned</strong>
            </div>
            <div className="settings-placeholder-row">
              <span>Recording input</span>
              <strong>Planned</strong>
            </div>
          </SettingsSection>

          <SettingsSection
            title="About"
            eyebrow="Guitar Journey"
            description="A focused practice app for building songs through chords, timing, transitions, rhythm, and real session history."
          >
            <div className="settings-placeholder-row">
              <span>Version</span>
              <strong>Local app</strong>
            </div>
          </SettingsSection>
        </div>
      </section>
    </Fragment>
  );
}

function SettingsSection({ children, description, eyebrow, title }) {
  return (
    <article className="settings-section-card">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="settings-section-content">{children}</div>
    </article>
  );
}
