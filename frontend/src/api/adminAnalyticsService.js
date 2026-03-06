import api from "../api/axios";

/**
 * 🔥 Fetch full Admin Dashboard
 * Single API call
 */
export const getAdminDashboard = async (jobId) => {

  const response = await api.get("/api/admin/dashboard", {
    params: {
      jobId: jobId || undefined
    }
  });

  return response.data;
};