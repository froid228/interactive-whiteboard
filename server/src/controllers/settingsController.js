const Setting = require('../models/Setting');

class SettingsController {
  async getSettings(req, res) {
    const settings = await Setting.getAll();
    return res.json(settings);
  }

  async updateSettings(req, res) {
    const settings = await Setting.updateAll(req.body || {});
    return res.json(settings);
  }
}

module.exports = new SettingsController();
