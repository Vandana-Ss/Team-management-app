import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Calendar, User, Clock } from 'lucide-react';
import API from '../api/axios';

const WorkspacesList = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const { data } = await API.get('/workspaces');
        console.log(data)
        setWorkspaces(data.workspaces);
      } catch (err) {
        console.error("Error fetching workspaces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  if (loading) return <div className="p-10 animate-pulse text-gray-400">Loading workspaces...</div>;

  return (
    <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#001E2B]">All Workspaces</h2>
        <span className="text-sm text-gray-400">{workspaces.length} Total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-400 text-sm uppercase tracking-wider border-b border-gray-50">
              <th className="px-8 py-5 font-semibold">Workspace</th>
              <th className="px-6 py-5 font-semibold">Created At</th>
              <th className="px-6 py-5 font-semibold">Owner</th>
              <th className="px-6 py-5 font-semibold">Latest Update</th>
              <th className="px-6 py-5 font-semibold">Changed By</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workspaces.map((ws) => (
              <tr
                key={ws._id}
                onClick={() => navigate(`/workspace/${ws._id}`)}
                className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
              >
                {/* Workspace Name & Icon */}
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F0FDF4] rounded-xl flex items-center justify-center text-[#00684A] font-bold">
                      {ws.name.charAt(0)}
                    </div>
                    <span className="font-bold text-[#001E2B] group-hover:text-[#00ED64] transition-colors">
                      {ws.name}
                    </span>
                  </div>
                </td>

                {/* Created At */}
                <td className="px-6 py-5 text-gray-500 text-sm">
                  {ws.createdAt ? new Date(ws.createdAt).toLocaleDateString() : "Unknown"}
                </td>

                {/* Owner */}
                <td className="px-6 py-5 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-300" />
                    {ws.owner?.name || "Workspace Admin"}
                  </div>
                </td>

                {/* Latest Update (Placeholder until Tasks are live) */}
                <td className="px-6 py-5 text-gray-500 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-300" />
                    {ws.updatedAt ? new Date(ws.updatedAt).toLocaleDateString() : "Just now"}
                  </div>
                </td>

                {/* Changed By */}
                <td className="px-6 py-5">
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                    {ws.lastActionBy || "System"}
                  </span>
                </td>

                {/* Action Icon */}
                <td className="px-8 py-5 text-right">
                  <button className="p-2 text-gray-300 hover:text-gray-600">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkspacesList;