const { pool } = require('../config/db');

const DEFAULT_SETTINGS = {
  collaborationEnabled: true,
  allowGuestRegistration: true,
  autosaveIntervalSec: 5,
  maxBoardTitleLength: 120,
};

class Setting {
  static async getAll() {
    const { rows } = await pool.query('SELECT key, value FROM system_settings ORDER BY key ASC');
    const settings = { ...DEFAULT_SETTINGS };

    rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    return settings;
  }

  static async updateAll(nextSettings) {
    const current = await this.getAll();
    const merged = {
      ...current,
      collaborationEnabled:
        nextSettings.collaborationEnabled === undefined
          ? current.collaborationEnabled
          : Boolean(nextSettings.collaborationEnabled),
      allowGuestRegistration:
        nextSettings.allowGuestRegistration === undefined
          ? current.allowGuestRegistration
          : Boolean(nextSettings.allowGuestRegistration),
      autosaveIntervalSec: Number(nextSettings.autosaveIntervalSec) || DEFAULT_SETTINGS.autosaveIntervalSec,
      maxBoardTitleLength: Number(nextSettings.maxBoardTitleLength) || DEFAULT_SETTINGS.maxBoardTitleLength,
    };

    merged.autosaveIntervalSec = Math.min(60, Math.max(2, merged.autosaveIntervalSec));
    merged.maxBoardTitleLength = Math.min(120, Math.max(20, merged.maxBoardTitleLength));

    await Promise.all(
      Object.entries(merged).map(([key, value]) =>
        pool.query(
          `
            INSERT INTO system_settings (key, value)
            VALUES ($1, $2::jsonb)
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          `,
          [key, JSON.stringify(value)]
        )
      )
    );

    return this.getAll();
  }
}

module.exports = Setting;
