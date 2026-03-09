import { useState, useRef, useEffect } from "react";
import RightDrawer from "../../../components/RightDrawer";
import AddExistingCandidate from "../AddExistingCandidate";
import AddNewCandidate from "../AddNewCandidate";
import { closeJob, deleteJob } from "../../../api/jobs.api";
import api from "../../../api/axios";
import toast from "react-hot-toast";


export default function JobActionsMenu({
  jobId,
  jobStatus,
  onJobDeleted,
  onJobClosed,
}) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [job, setJob] = useState(null);
  const [autoSelectCandidateId, setAutoSelectCandidateId] = useState(null);

  const ref = useRef();
  const isClosed = jobStatus === "CLOSED";

  useEffect(() => {
    const close = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const loadJob = async () => {
    if (job) return;
    const res = await api.get(`/api/jobs/${jobId}`);
    setJob(res.data);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this job?")) return;
   try {
    await deleteJob(jobId);
    toast.success("Job deleted successfully");
    onJobDeleted?.(jobId);
    setOpen(false);
   } catch {
    toast.error("Failed to delete job");
   }
  };

  const handleClose = async () => {
    try {
      await closeJob(jobId);
      toast.success("Job closed successfully");
      onJobClosed?.(jobId);
      setOpen(false);
    } catch {
      toast.success("Job closed successfully");
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="border px-4 py-2 rounded text-sm"
        >
          Actions ▾
        </button>
   
        {open && (
          <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow z-10">
            {!isClosed && (
              <MenuItem
                onClick={() => {
                  setPickerOpen(true);
                  loadJob();
                }}
              >
                Add Candidate
              </MenuItem>
            )}
   
            {/* {!isClosed && (
              <MenuItem onClick={() => alert("Edit Job coming next")}>
                Edit Job
              </MenuItem>
            )} */}
   
            {!isClosed && <MenuItem onClick={handleClose}>Close Job</MenuItem>}
   
            <MenuItem danger onClick={handleDelete}>
              Delete Job
            </MenuItem>
          </div>
        )}
      </div>
   
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded shadow w-80">
            <h3 className="font-semibold mb-4">Add Candidate</h3>
   
            <button
              className="w-full border p-2 mb-2 rounded"
              onClick={() => {
                setDrawer("new");
                setPickerOpen(false);
              }}
            >
              Create New Candidate
            </button>
   
            <button
              className="w-full border p-2 rounded"
              onClick={() => {
                setDrawer("existing");
                setPickerOpen(false);
              }}
            >
              Add Existing Candidate
            </button>
          </div>
        </div>
      )}
   
      <RightDrawer
        open={drawer === "new"}
        onClose={() => setDrawer(null)}
        title="Create Candidate"
      >
        {job && (
          <AddNewCandidate
            job={job}
            onCreated={(createdCandidateId) => {
              setDrawer(null);
              setAutoSelectCandidateId(createdCandidateId);
              setDrawer("existing");
            }}
          />
        )}
      </RightDrawer>
   
      <RightDrawer
        open={drawer === "existing"}
        onClose={() => setDrawer(null)}
        title="Add Existing Candidate"
      >
        {job && (
          <AddExistingCandidate
            job={job}
            autoSelectId={autoSelectCandidateId}
            onSuccess={() => setDrawer(null)}
            onClose={() => setDrawer(null)}
          />
        )}
      </RightDrawer>
   
    </div>
  );
   
}

function MenuItem({ children, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 ${
        danger ? "text-red-600" : ""
      }`}
    >
      {children}
    </div>
  );
}
