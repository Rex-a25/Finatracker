import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Password updated successfully if u like forget again!");
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Update Password</h2>

        <form className="space-y-4" onSubmit={handleUpdatePassword}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter your new password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
