Confirm dialog tone fix patch

Replace:
- src/components/ConfirmDialog.jsx
- src/styles/confirm-dialog.css

Then update the Import Progress ConfirmDialog in src/components/SettingsPanel.jsx:
- Change tone="danger" to tone="primary"

What changed:
- Dialog title/header text now explicitly uses theme text color.
- ConfirmDialog now normalizes tones to primary or danger.
- Primary confirm actions render blue with white text.
- Destructive confirm actions render red with white text.
- Import Progress should use primary.
- Delete song/genre/recording/session flows should keep danger.
