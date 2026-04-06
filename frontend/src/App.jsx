import { useState, useEffect } from 'react';
import { LayoutDashboard, Ticket, Users, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('submit');
  const [stats, setStats] = useState({ total_tickets: 0, open_tickets: 0, auto_resolved: 0, auto_resolution_rate: "0%" });
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [newTicket, setNewTicket] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [statsRes, ticketsRes, empRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/analytics'),
        fetch('http://127.0.0.1:8000/api/tickets'),
        fetch('http://127.0.0.1:8000/api/employees')
      ]);
      setStats(await statsRes.json());
      setTickets(await ticketsRes.json());
      setEmployees(await empRes.json());
    } catch (error) {
      console.error("Failed to fetch backend data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/tickets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newTicket }),
      });
      const data = await response.json();
      setSubmitResult(data);
      setNewTicket(""); 
      fetchData(); 
    } catch (error) {
      alert("Error reaching AI Backend.");
    }
    setLoading(false);
  };

  return (
    /* FULL SCREEN FLUID LAYOUT CONTAINER */
    <div className="h-screen w-full bg-slate-900 text-slate-200 flex font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION - FIXED WIDTH */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-amber-500 flex items-center gap-2">
            <LayoutDashboard size={24} />AI Incident Management
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('submit')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'submit' ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800'}`}>
            <Send size={18} /> Submit Ticket
          </button>
          <button onClick={() => setActiveTab('queue')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'queue' ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800'}`}>
            <Ticket size={18} /> Ticket Queue
          </button>
          <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'directory' ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800'}`}>
            <Users size={18} /> Directory ({employees.length})
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> Analytics
          </button>
        </nav>
      </div>

      {/* MAIN CONTENT AREA - FLUID WIDTH & HEIGHT */}
      <div className="flex-1 overflow-y-auto w-full animate-in fade-in">
        <div className="max-w-7xl mx-auto p-8 md:p-12">
          
          {/* MODULE 1 & 2: SUBMIT TICKET */}
          {activeTab === 'submit' && (
            <div className="w-full animate-in fade-in duration-500">
              <h2 className="text-4xl font-bold mb-8 text-white">IT Service Desk</h2>
              <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl mb-8">
                <label className="block text-sm font-medium mb-3 text-slate-300">Describe your issue in detail</label>
                <textarea 
                  className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-white text-lg"
                  rows="5" required
                  placeholder="E.g., I need a password reset for the payroll system..."
                  value={newTicket} onChange={(e) => setNewTicket(e.target.value)}
                />
                <button type="submit" disabled={loading} className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 text-base shadow-md shadow-amber-500/20 flex-shrink-0 active:scale-[0.98]">
                  {loading ? <Clock className="animate-spin" size={24}/> : <Send size={24} />}
                  {loading ? "AI is analyzing..." : "Submit to AI"}
                </button>
              </form>

              {/* AI Result Feedback Card */}
              {submitResult && (
                <div className={`p-8 rounded-xl border shadow-2xl ${submitResult.auto_resolved ? 'bg-green-900/20 border-green-500' : 'bg-slate-800 border-amber-500'}`}>
                  <div className="flex items-center gap-3 mb-6">
                    {submitResult.auto_resolved ? <CheckCircle className="text-green-400" size={28}/> : <AlertCircle className="text-amber-400" size={28}/>}
                    <h3 className="text-2xl font-bold text-white">
                      {submitResult.auto_resolved ? "Auto-Resolved by AI" : "Ticket Routed Successfully"}
                    </h3>
                  </div>
                  
                  <p className="text-slate-200 text-lg mb-6 bg-slate-900/50 p-6 rounded-lg border border-slate-700 leading-relaxed">
                    {submitResult.auto_resolved ? submitResult.ai_analysis.auto_response : submitResult.ai_analysis.ai_summary}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Category</p><p className="font-bold text-white text-lg">{submitResult.ai_analysis.category}</p></div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Severity</p><p className="font-bold text-white text-lg">{submitResult.final_severity}</p></div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Sentiment</p><p className="font-bold text-white text-lg">{submitResult.ai_analysis.sentiment}</p></div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700/50"><p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Assigned To</p><p className="font-bold text-amber-400 text-lg">{submitResult.assigned_employee_id ? `EMP-${submitResult.assigned_employee_id}` : "AI Bot"}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 5: TICKET QUEUE */}
          {activeTab === 'queue' && (
            <div className="w-full animate-in fade-in duration-500">
              <h2 className="text-4xl font-bold mb-8 text-white">Active Ticket Queue</h2>
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-900 text-slate-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-5 font-semibold">ID</th>
                      <th className="p-5 font-semibold">Summary</th>
                      <th className="p-5 font-semibold">Severity</th>
                      <th className="p-5 font-semibold">Status</th>
                      <th className="p-5 font-semibold">Assignee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="p-5 font-mono text-slate-400">#{ticket.id}</td>
                        <td className="p-5 max-w-md truncate text-white font-medium">{ticket.ai_summary || ticket.description}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${ticket.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700 text-slate-300'}`}>
                            {ticket.severity}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${ticket.auto_resolved ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-5 text-sm font-medium text-slate-300">{ticket.assigned_to_id ? `Emp-${ticket.assigned_to_id}` : 'AI Bot'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 4: EMPLOYEE DIRECTORY (Now handles 1000 dynamically) */}
          {activeTab === 'directory' && (
            <div className="w-full animate-in fade-in duration-500">
              <h2 className="text-4xl font-bold mb-8 text-white flex items-center justify-between">
                Employee Directory
                <span className="text-xl font-normal text-slate-400 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">Total: {employees.length}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-amber-500 transition-colors shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                        <p className="text-sm text-amber-400 font-medium">{emp.role}</p>
                        <p className="text-xs text-slate-400 mt-1">{emp.department}</p>
                      </div>
                      <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${emp.status === 'Available' ? 'bg-green-500/20 text-green-400' : emp.status === 'Busy' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                        {emp.status}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Skills</p>
                      <p className="text-xs text-slate-300 truncate">{emp.skills}</p>
                    </div>
                    <div className="pt-4 border-t border-slate-700 flex justify-between text-sm bg-slate-900/30 -mx-6 -mb-6 p-4 rounded-b-xl">
                      <span className="text-slate-400">Load: <strong className="text-white text-base ml-1">{emp.current_ticket_load}</strong></span>
                      <span className="text-slate-400">Avg: <strong className="text-white text-base ml-1">{emp.average_resolution_time}m</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 6: ANALYTICS DASHBOARD (Now includes full table) */}
          {activeTab === 'analytics' && (
            <div className="w-full animate-in fade-in duration-500">
              <h2 className="text-4xl font-bold mb-8 text-white">System Analytics</h2>
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Ticket size={64}/></div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Tickets</p>
                  <p className="text-5xl font-black text-white">{stats.total_tickets}</p>
                </div>
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl border-b-4 border-b-red-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={64}/></div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Action Required</p>
                  <p className="text-5xl font-black text-white">{stats.open_tickets}</p>
                </div>
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl border-b-4 border-b-green-500 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={64}/></div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">AI Auto-Resolved</p>
                  <p className="text-5xl font-black text-white">{stats.auto_resolved}</p>
                </div>
                <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl border-b-4 border-b-amber-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><LayoutDashboard size={64}/></div>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">AI Deflection Rate</p>
                  <p className="text-5xl font-black text-amber-400">{stats.auto_resolution_rate}</p>
                </div>
              </div>

              {/* Total Ticket List appended to Analytics */}
              <h3 className="text-2xl font-bold mb-6 text-white border-b border-slate-700 pb-4">Full System Ticket Record</h3>
              <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-slate-900 text-slate-400 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-5 font-semibold">Date / ID</th>
                      <th className="p-5 font-semibold">Category</th>
                      <th className="p-5 font-semibold">Department</th>
                      <th className="p-5 font-semibold">Status</th>
                      <th className="p-5 font-semibold">Time Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="p-5 text-slate-300">
                          <span className="font-mono text-amber-400 mr-2">#{ticket.id}</span> 
                          <span className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-5 text-white font-medium">{ticket.category}</td>
                        <td className="p-5 text-slate-300">{ticket.auto_resolved ? "N/A" : ticket.ai_summary ? "Assigned" : "Pending"}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${ticket.auto_resolved ? 'bg-green-500/20 text-green-400' : ticket.status === 'Closed' ? 'bg-slate-700 text-slate-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="p-5 text-sm text-slate-400">{ticket.estimated_time || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;