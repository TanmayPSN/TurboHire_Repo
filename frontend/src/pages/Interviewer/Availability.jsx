import { useEffect, useState } from "react";
import {
  getMyAvailabilitySlots,
  addAvailabilitySlot,
  deleteAvailabilitySlot,
} from "../../api/interviewer.api";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";

export default function Availability() {
  const { user } = useAuth();
  const userId = user?.userId;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });

  const isSlotExpired = (slot) => {
    const now = new Date();
    const slotEnd = new Date(`${slot.slotDate}T${slot.endTime}`);
    return slotEnd < now;
  };

  const loadSlots = async () => {
    if (!userId) return;
    try {
      const data = await getMyAvailabilitySlots(userId);
      setSlots(data || []);
    } catch (err) {
      console.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [userId]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (!form.date || !form.startTime || !form.endTime) {
      toast.error("All fields are required");
      return;
    }

    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time");
      return;
    }
    const now = new Date();
    const newStart = new Date(`${form.date}T${form.startTime}`);
    const newEnd = new Date(`${form.date}T${form.endTime}`);
    
    if (newStart < now) {
      toast.error("Cannot add slot in the past");
      return;
    }
    
    const durationMinutes = (newEnd - newStart) / (1000 * 60);
    
    if (durationMinutes < 20) {
      toast.error("Slot must be at least 20 minutes long");
      return;
    }

    const duplicate = slots.some(
      (slot) =>
        slot.slotDate === form.date &&
        slot.startTime === form.startTime &&
        slot.endTime === form.endTime
    );

    if (duplicate) {
      toast.error("This slot already exists");
      return;
    }

    const overlapping = slots.some((slot) => {
      if (slot.slotDate !== form.date) return false;

      const existingStart = new Date(`${slot.slotDate}T${slot.startTime}`);
      const existingEnd = new Date(`${slot.slotDate}T${slot.endTime}`);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (overlapping) {
      toast.error("Slot overlaps with existing slot");
      return;
    }

    try {
      setSaving(true);

      await addAvailabilitySlot(userId, {
        slotDate: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      });

      toast.success("Slot added");
      setForm({ date: "", startTime: "", endTime: "" });
      loadSlots();
    } catch {
      toast.error("Failed to add slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slotId, booked) => {
    if (booked) return;
    if (!window.confirm("Delete this slot?")) return;

    await deleteAvailabilitySlot(slotId, userId);
    toast.success("Slot deleted");
    loadSlots();
  };

  const activeSlots = slots.filter((slot) => !isSlotExpired(slot));

  const today = new Date().toISOString().split("T")[0];

  const getMinStartTime = () => {
    if (form.date !== today) return "";
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <div className="px-10 py-8 font-['Montserrat']">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#101828]">My Availability</h1>
        <p className="text-sm text-gray-500">Manage interview slots</p>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ADD SLOT */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Add Slot</h2>

          <form onSubmit={handleAddSlot} className="space-y-4">

            <input
              type="date"
              name="date"
              min={today}
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            <input
              type="time"
              name="startTime"
              min={getMinStartTime()}
              value={form.startTime}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            <input
              type="time"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#101828] text-white py-2 rounded-lg hover:bg-black transition"
            >
              {saving ? "Saving..." : "Add Slot"}
            </button>
          </form>
        </div>

        {/* SLOT LIST */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-lg mb-4">Your Slots</h2>

          {loading && (
            <div className="text-center text-gray-500 py-6">
              Loading slots...
            </div>
          )}

          {!loading && activeSlots.length === 0 && (
            <div className="text-gray-400 text-center py-6">
              No active slots
            </div>
          )}

          <div className="space-y-3">
            {activeSlots.map((slot) => (
              <div
                key={slot.id}
                className="flex justify-between items-center border rounded-lg p-4"
              >
                <div>
                  <p className="font-semibold">{slot.slotDate}</p>
                  <p className="text-sm text-gray-500">
                    {slot.startTime} → {slot.endTime}
                  </p>

                  {slot.booked && (
                    <span className="text-xs text-blue-500 font-semibold">
                      Booked
                    </span>
                  )}
                </div>

                <button
                  disabled={slot.booked}
                  onClick={() => handleDelete(slot.id, slot.booked)}
                  className={`text-sm font-semibold ${
                    slot.booked
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-red-500 hover:text-red-600"
                  }`}
                >
                  {slot.booked ? "Booked" : "Delete"}
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}