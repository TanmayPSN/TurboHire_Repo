import { useEffect, useState } from "react";

import KPISection from "../../components/admin/KPISection";
import HiringFunnelChart from "../../components/admin/HiringFunnelChart";
import InterviewMetricsPanel from "../../components/admin/InterviewMetricsPanel";
import TimeAnalyticsChart from "../../components/admin/TimeAnalyticsChart";

import { getAdminDashboard } from "../../api/adminAnalyticsService";
import { getJobs } from "../../api/jobs.api";

export default function AdminDashboard() {

  const [dashboard, setDashboard] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);

  useEffect(() => {
    getJobs()
      .then((data) => setJobs(data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    getAdminDashboard(selectedJobId)
      .then((data) => {
        console.log("DASHBOARD:", data);
        setDashboard(data);
      })
      .catch((err) => console.error(err));
  }, [selectedJobId]);

  if (!dashboard) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6 p-4">

      {/* JOB FILTER */}
      <div className="flex items-center gap-3">

        <h2 className="text-lg text-white font-semibold">Analytics</h2>

        <select
          className="border border-white px-3 py-1.5 rounded-md text-sm text-white bg-transparent"
          value={selectedJobId || ""}
          onChange={(e) =>
            setSelectedJobId(
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
        >
          <option className="text-black" value="">
            All Jobs
          </option>

          {jobs.map((job) => (
            <option className="text-black" key={job.id} value={job.id}>
              {job.title} (BXA-{String(job.id).padStart(4, "0")})
            </option>
          ))}
        </select>

      </div>

      <KPISection
        totalActiveJobs={dashboard.totalActiveJobs}
        totalPipeline={dashboard.totalPipeline}
        totalHired={dashboard.totalHired}
        totalRejected={dashboard.totalRejected}
      />

      {/* Hiring Efficiency */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
        <h3 className="text-md font-semibold mb-3 text-indigo-700">
          Hiring Efficiency
        </h3>

        <div className="grid md:grid-cols-3 gap-4 text-center">

          <div>
            <p className="text-gray-500 text-xs">Overall Conversion</p>
            <p className="text-xl font-bold text-indigo-600">
              {dashboard.overallConversionRate}%
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-xs">Shortlisted → Hired</p>
            <p className="text-xl font-bold text-indigo-600">
              {dashboard.totalHired} / {dashboard.totalShortlisted}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-xs">Interviews per Hire</p>
            <p className="text-xl font-bold text-indigo-600">
              {dashboard.interviewsPerHire}
            </p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <HiringFunnelChart funnel={dashboard.funnel} />
        <InterviewMetricsPanel metrics={dashboard.interviewMetrics} />
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border border-yellow-200">
        <p className="text-sm font-semibold text-yellow-700">
          ⏳ R1 Pending Scheduling: {dashboard.r1Pending}
        </p>
      </div>

      <TimeAnalyticsChart analytics={dashboard.timeAnalytics} />

    </div>
  );
}