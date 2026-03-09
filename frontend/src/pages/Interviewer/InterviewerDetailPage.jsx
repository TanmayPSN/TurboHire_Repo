import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InterviewerNavbar from "../../components/InterviewerNavbar";
import CandidateCard from "../../components/CandidateCard";
import EvaluationModel from "../../components/EvaluationModel";
import { ArrowLeft } from "lucide-react";

import {
  getPreviousRoundFeedback,
  getMyInterviewerProfile,
  getMyInterviews,
  submitInterviewFeedback,
  markInterviewAttendance,
} from "../../api/interviewer.api";

import toast from "react-hot-toast";

export default function InterviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [previousFeedback, setPreviousFeedback] = useState([]);
  const [interviewer, setInterviewer] = useState(null);

  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [timeLabel, setTimeLabel] = useState("");

  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await getMyInterviewerProfile();
        setInterviewer(profile);
      } catch {
        toast.error("Failed to load profile");
      }
    }
    loadProfile();
  }, []);

  /* ================= LOAD INTERVIEW ================= */
  const loadInterview = async () => {
    try {
      const all = await getMyInterviews();
      const found = all.find((i) => String(i.interviewId) === String(id));

      if (!found) {
        toast.error("Interview not found");
        return;
      }

      setInterview(found);
    } catch {
      toast.error("Failed to load interview");
    }
  };

  useEffect(() => {
    if (id) loadInterview();
  }, [id]);

  /* ================= LOAD PREVIOUS FEEDBACK ================= */
  const loadFeedback = async () => {
    try {
      const data = await getPreviousRoundFeedback(id);
      setPreviousFeedback(data || []);
    } catch {
      console.error("Failed loading previous feedback");
    }
  };

  useEffect(() => {
    if (id) loadFeedback();
  }, [id]);
  

  /* ================= TIMER LOGIC ================= */
  useEffect(() => {
    if (!interview) return;

    const interval = setInterval(() => {
      const startTime = new Date(
        `${interview.slotDate}T${interview.startTime}`
      );

      const endTime = new Date(`${interview.slotDate}T${interview.endTime}`);


      if (interview.attendanceStatus === "NO_SHOW") {
        setTimeLabel("No Show");
        return;
      }

      if (interview.feedbackSubmitted) {
        setTimeLabel("Completed");
        return;
      }

      if (now < startTime) {
        const diff = startTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);

        if (hours > 0) {
          setTimeLabel(`Starts in ${hours}h ${minutes}m`);
        } else {
          setTimeLabel(`Starts in ${minutes}m`);
        }
        return;
      }

      if (now >= startTime && now <= endTime) {
        setTimeLabel("Interview in progress");
        return;
      }

      if (now > endTime) {
        if (!interview.attendanceStatus) {
          setTimeLabel("Awaiting Attendance");
          return;
        }

        if (
          interview.attendanceStatus === "ATTENDED" &&
          !interview.feedbackSubmitted
        ) {
          setTimeLabel("Decision Pending");
          return;
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [interview]);

  /* ================= ATTENDANCE ================= */
  const handleAttendanceSubmit = async (status) => {
    try {
      await markInterviewAttendance(interview.interviewId, status);
      toast.success("Attendance marked");
      setShowAttendanceModal(false);
      await loadInterview();
    } catch {
      toast.error("Failed to mark attendance");
    }
  };

  /* ================= FEEDBACK ================= */
  const handleSaveFeedback = async (payload) => {
    try {
      await submitInterviewFeedback(id, payload);
      toast.success("Feedback submitted");
      setIsEvaluationOpen(false);
      await loadInterview();
      await loadFeedback();
    } catch {
      toast.error("Feedback submission failed");
    }
  };

  if (!interview) return null;

  const interviewStart = new Date(
    `${interview.slotDate}T${interview.startTime}`
  );

  const joinAllowedTime = new Date(interviewStart.getTime() - 5 * 60 * 1000);

  const endTime = new Date(
    `${interview.slotDate}T${interview.endTime}`
  );
  const now = new Date();

  const canEvaluate =
    now >= endTime &&
    interview.attendanceStatus === "ATTENDED" 

  const canMarkAttendance =
    new Date() >= interviewStart && !interview.attendanceStatus;
  
  
    const canJoinMeeting =
  now >= joinAllowedTime && now <= endTime && interview.status === "SCHEDULED";
  

  return (
    <>
      <InterviewerNavbar interviewer={interviewer} />

      <div className="px-4 sm:px-6 md:px-12 py-8 md:py-10 bg-[#F9FAFB] min-h-screen">
        {/* ================= BACK BUTTON ================= */}
        <div className="mb-6 flex">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-2xl
                       bg-white border border-gray-200 shadow-sm
                       text-sm font-semibold text-gray-700
                       hover:shadow-md hover:-translate-y-0.5
                       transition-all duration-200 w-fit"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Interviews
          </button>
        </div>

        {/* ================= HEADER ================= */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start md:items-center">
            {/* LEFT */}
            <div>
              <h1 className="text-2xl font-bold text-[#101828]">
                {interview.jobTitle}
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                BXA-{String(interview.jobId).padStart(4, "0")} •{" "}
                {interview.roundName}
              </p>

              <p className="text-xs text-gray-400 mt-2">
                {interview.slotDate} | {interview.startTime} –{" "}
                {interview.endTime}
              </p>
            </div>

            {/* CENTER STATUS */}
            <div className="flex justify-start md:justify-center">
              <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                {timeLabel}
              </span>
            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex flex-col gap-3 w-full md:w-[320px] md:items-end">
              { canJoinMeeting &&  (
                <a
                  href={interview.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition"
                >
                  Go To Microsoft Teams Interview
                </a>
              )}

              {canMarkAttendance && (
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="w-full text-center px-6 py-3 rounded-xl text-sm font-semibold border border-gray-300 hover:bg-gray-50 transition"
                >
                  Candidate Attended Interview?
                </button>
              )}

              {interview.attendanceStatus === "ATTENDED" && (
                <span className="text-green-600 font-semibold text-sm">
                  ✅ Attended
                </span>
              )}

              {interview.attendanceStatus === "NO_SHOW" && (
                <span className="text-red-600 font-semibold text-sm">
                  ❌ No Show
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ================= CANDIDATE CARD ================= */}
        <CandidateCard
          candidate={interview}
          feedbackToShow={
            interview.feedbackSubmitted
              ? [
                  {
                    rating: interview.rating,
                    recommendation: interview.recommendation,
                    comments: interview.comments,
                    submittedAt: interview.submittedAt,
                    roundName: interview.roundName,
                  },
                ]
              : previousFeedback
          }
        />

        {/* ================= EVALUATE SECTION ================= */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 my-8 flex flex-col md:flex-row gap-4 md:justify-between md:items-center">
          <h3 className="text-lg font-bold text-[#101828]">
            {interview.feedbackSubmitted
              ? "Your Evaluation"
              : "Evaluate Candidate after the Interview"}
          </h3>

          <button
            onClick={() => setIsEvaluationOpen(true)}
            disabled={!canEvaluate}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold text-sm transition
    ${
      canEvaluate
        ? "bg-blue-600 hover:bg-blue-700 text-white"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
          >
            {interview.feedbackSubmitted ? "View / Edit" : "Evaluate"}
          </button>
        </div>

        {/* ================= BOTTOM INFO GRID ================= */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-8 mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <InfoCard title="Education" value={interview.education?.degree} />
            <InfoCard
              title="Experience"
              value={`${interview.totalExperience || 0} Years`}
            />
            <InfoCard
              title="Skills"
              value={interview.skills?.join(", ") || "N/A"}
            />
            <InfoCard title="Current Stage" value={interview.roundName} />
          </div>
        </div>
      </div>

      {/* ================= ATTENDANCE MODAL ================= */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[90%] max-w-[400px] text-center">
            <h3 className="text-lg font-bold mb-4">
              Did the candidate attend the interview?
            </h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleAttendanceSubmit("ATTENDED")}
                className="bg-green-600 text-white px-6 py-2 rounded-lg"
              >
                Yes
              </button>

              <button
                onClick={() => handleAttendanceSubmit("NO_SHOW")}
                className="bg-red-600 text-white px-6 py-2 rounded-lg"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <EvaluationModel
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        candidate={interview}
        onSave={handleSaveFeedback}
      />
    </>
  );
}

/* ================= INFO CARD ================= */
function InfoCard({ title, value }) {
  return (
    <div className="bg-[#F9F6F2] rounded-2xl p-6 hover:shadow-md transition">
      <p className="text-xs font-bold text-gray-400 uppercase mb-2">{title}</p>
      <p className="text-sm font-semibold text-[#101828]">
        {value || "Not Specified"}
      </p>
    </div>
  );
}
