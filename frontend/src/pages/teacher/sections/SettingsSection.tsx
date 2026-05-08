import {
  Bell,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";

type TeacherSettings = {
  emailAlerts: boolean;
  liveNotifications: boolean;
};

const SETTINGS_STORAGE_KEY = "teacher_settings";

const defaultSettings: TeacherSettings = {
  emailAlerts: true,
  liveNotifications: true,
};

const SettingsSection = () => {

  const [settings, setSettings] = useState<TeacherSettings>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as Partial<TeacherSettings>;
      setSettings({
        emailAlerts: parsed.emailAlerts ?? defaultSettings.emailAlerts,
        liveNotifications: parsed.liveNotifications ?? defaultSettings.liveNotifications,
      });
    } catch {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSavedMessage("Settings saved successfully");
    window.setTimeout(() => setSavedMessage(""), 2500);
  };

  return (

    <div className="space-y-6">

      {/* HEADER */}

      <div>

        <p
          className="
            uppercase
            tracking-[0.28em]
            text-orange-300
            text-[10px]
            mb-2
          "
        >
          PLATFORM SETTINGS
        </p>

        <h1
          className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-black
            leading-none
          "
        >

          Dashboard
          <span className="ml-2 text-orange-400">
            Settings
          </span>

        </h1>

      </div>

      {/* SETTINGS GRID */}

      <div
        className="
          grid
          grid-cols-1
          xl:grid-cols-1
          gap-5
        "
      >

        {/* NOTIFICATIONS */}

        <div
          className="
            rounded-[26px]
            border
            border-white/10
            bg-[#08111f]/90
            p-5
            backdrop-blur-xl
          "
        >

          <div className="flex items-center gap-3 mb-5">

            <div
              className="
                rounded-xl
                bg-cyan-400/10
                p-3
              "
            >
              <Bell className="h-5 w-5 text-cyan-300" />
            </div>

            <div>

              <h2 className="text-lg font-bold">
                Notifications
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Manage dashboard alerts
              </p>

            </div>

          </div>

          <div className="space-y-4">

            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-white/10
                bg-[#0b1525]
                px-4
                py-3
              "
            >

              <div>

                <p className="text-sm font-medium">
                  Email Alerts
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Receive copied alerts
                </p>

              </div>

              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    emailAlerts: event.target.checked,
                  }))
                }
                aria-label="Enable email alerts"
                className="h-4 w-4 accent-orange-400"
              />

            </div>

            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-white/10
                bg-[#0b1525]
                px-4
                py-3
              "
            >

              <div>

                <p className="text-sm font-medium">
                  Live Notifications
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Real-time updates
                </p>

              </div>

              <input
                type="checkbox"
                checked={settings.liveNotifications}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    liveNotifications: event.target.checked,
                  }))
                }
                aria-label="Enable live notifications"
                className="h-4 w-4 accent-orange-400"
              />

            </div>

          </div>

        </div>

        

      </div>

      {/* SAVE BUTTON */}

      <div className="flex justify-end">

        <div className="flex flex-col items-end gap-2">
          {savedMessage ? (
            <p className="text-xs text-emerald-300">{savedMessage}</p>
          ) : null}

          <button
          onClick={handleSave}
          className="
            inline-flex
            items-center
            gap-2
            rounded-2xl
            bg-orange-400
            px-6
            py-3
            text-sm
            font-semibold
            text-black
            transition-all
            hover:bg-orange-300
            hover:scale-[1.01]
          "
        >

          <Save className="h-4 w-4" />

          Save Changes

          </button>
        </div>

      </div>

    </div>
  );
};

export default SettingsSection;