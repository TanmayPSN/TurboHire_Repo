import { useState } from "react";
import api from "../../api/axios";

export default function UsersTable({ users }) {

  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const roles = ["ADMIN", "RECRUITER", "INTERVIEWER"];

  const handleRoleChange = async (userId) => {
    try {
      await api.put(`/users/${userId}/assign-role`, {
        roleName: selectedRole
      });

      alert("Role updated successfully");

      setEditingUserId(null);

      // Ideally you should refetch users here
    } catch (err) {
      console.error(err);
      alert("Failed to update role");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border overflow-hidden">

      <table className="w-full text-sm">

        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="p-4 text-left">Name</th>
            <th className="p-4 text-left">Email</th>
            <th className="p-4 text-left">Role</th>
            <th className="p-4 text-left">Business Unit</th>
            <th className="p-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t hover:bg-gray-50">

              <td className="p-4">{user.fullName}</td>
              <td className="p-4">{user.email}</td>

              {/* 🔥 Editable Role */}
              <td className="p-4">

                {editingUserId === user.id ? (
                  <div className="flex gap-2">

                    <select
                      className="border rounded px-2 py-1"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <button
                      className="text-blue-600"
                      onClick={() => handleRoleChange(user.id)}
                    >
                      Save
                    </button>

                    <button
                      className="text-gray-500"
                      onClick={() => setEditingUserId(null)}
                    >
                      Cancel
                    </button>

                  </div>
                ) : (
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => {
                      setEditingUserId(user.id);
                      setSelectedRole(user.roleName);
                    }}
                  >
                    {user.roleName}
                  </span>
                )}

              </td>

              <td className="p-4">{user.businessUnitName}</td>

              <td className="p-4">
                <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700">
                  {user.status}
                </span>
              </td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}