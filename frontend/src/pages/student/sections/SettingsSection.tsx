import { useEffect, useState } from "react";
import { toast } from "sonner";

import { studentApi } from "../studentApi";
import { StudentSettings } from "../types";

type Props = {
  email: string;
};

const defaultSettings: StudentSettings = {
  darkMode: true,
  notifications: true,
  language: "English",
};

const SettingsSection = ({ email }: Props) => {
  const [settings, setSettings] = useState<StudentSettings>(defaultSettings);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentApi.getSettings(email);
        setSettings(data);
      } catch {
        setSettings(defaultSettings);
      }
    };

    if (email) {
      load();
    }
  }, [email]);

  const save = async () => {
    try {
      const updated = await studentApi.updateSettings({
        email,
        darkMode: settings.darkMode,
        notifications: settings.notifications,
        language: settings.language,
      });

      setSettings(updated);
      toast.success("Settings saved");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save settings");
    }
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.assign("/");
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Preferences</h1>
      </div>

      <article className="space-y-4 rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl">
        <label className="flex items-center justify-between text-sm">
          <span>Dark Mode</span>
          <input
            type="checkbox"
            checked={settings.darkMode}
            onChange={(e) => setSettings((old) => ({ ...old, darkMode: e.target.checked }))}
          />
        </label>

        <label className="flex items-center justify-between text-sm">
          <span>Notifications</span>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings((old) => ({ ...old, notifications: e.target.checked }))}
          />
        </label>

        <label className="flex items-center justify-between text-sm">
          <span>Language</span>
          <select
            value={settings.language}
            onChange={(e) => setSettings((old) => ({ ...old, language: e.target.value }))}
            className="rounded-lg border border-white/10 bg-[#0b1627] px-2 py-1 text-sm"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={save} className="rounded-xl bg-orange-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-300">
            Save
          </button>

          <button type="button" onClick={logout} className="rounded-xl border border-white/10 px-4 py-2 text-sm">
            Logout
          </button>
        </div>
      </article>
    </section>
  );
};

export default SettingsSection;
