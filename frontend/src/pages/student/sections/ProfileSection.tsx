import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { studentApi } from "../studentApi";
import { StudentProfile } from "../types";

type Props = {
  email: string;
};

const emptyProfile: StudentProfile = {
  name: "",
  rollNumber: "",
  branch: "",
  section: "",
  semester: "",
  email: "",
  phone: "",
  photo: "",
};

const readOnlyFieldClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm text-slate-300 outline-none cursor-not-allowed";

const editableFieldClass =
  "w-full rounded-xl border border-white/10 bg-[#0b1627] px-3 py-2 text-sm outline-none transition focus:border-orange-300/50";

const ProfileSection = ({ email }: Props) => {
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentApi.getProfile(email);
        setProfile(data);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load profile");
      }
    };

    if (email) {
      load();
    }
  }, [email]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const updated = await studentApi.updateProfile({
        email,
        phone: profile.phone,
        password: password || undefined,
      });

      setProfile(updated);
      setPassword("");
      toast.success("Profile updated");
    } catch (error: any) {
      toast.error(error?.message || "Failed to update profile");
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-orange-300">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold">Student Profile</h1>
      </div>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-white/10 bg-[#081120]/85 p-4 backdrop-blur-xl sm:p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Profile Details</h2>
            <span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-orange-300">
              Read only
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Name</label>
              <input value={profile.name} title="Name" placeholder="Name" readOnly className={readOnlyFieldClass} />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</label>
              <input value={profile.email} title="Email" placeholder="Email" readOnly className={readOnlyFieldClass} />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Roll Number</label>
              <input value={profile.rollNumber || "Not available"} title="Roll Number" readOnly className={readOnlyFieldClass} />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Branch</label>
              <input value={profile.branch || "Not available"} title="Branch" readOnly className={readOnlyFieldClass} />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Section</label>
              <input value={profile.section || "Not available"} title="Section" readOnly className={readOnlyFieldClass} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Editable Details</h2>
            <span className="text-xs text-slate-500">Only phone and password can be changed</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Phone</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile((old) => ({ ...old, phone: e.target.value }))}
                placeholder="Phone"
                className={editableFieldClass}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-400">New Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter new password"
                className={editableFieldClass}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-stretch sm:justify-end">
          <button
            type="submit"
            className="w-full rounded-full bg-orange-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-orange-300 sm:w-52"
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProfileSection;
