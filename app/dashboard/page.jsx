"use client"
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/app/firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import AddEmployeeModal from './AddEmployeeModal';
import EmployeesTable from './EmployeesTable';
import AttendanceLogsTable from './AttendanceLogsTable';

const Dashboard = () => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [systemStatus, setSystemStatus] = useState({ status: 'offline', isPairingMode: false });

  const router = useRouter();

  useEffect(() => {
    let unsubscribeLogs;
    let unsubscribeEmployees;
    let unsubscribeStatus;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);

        // الاستماع لسجلات الحضور
        const qLogs = query(collection(db, "attendance_logs"), orderBy("timestamp", "desc"));
        unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
          const logsData = [];
          snapshot.forEach((doc) => {
            logsData.push({ id: doc.id, ...doc.data() });
          });
          setLogs(logsData);
        });

        unsubscribeEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
          const employeesData = [];
          snapshot.forEach((doc) => {
            employeesData.push({ id: doc.id, ...doc.data() });
          });
          setEmployees(employeesData);
          setTotalEmployees(snapshot.size);
        });

        unsubscribeStatus = onSnapshot(doc(db, "system_settings", "hardware_status"), (docSnap) => {
          if (docSnap.exists()) {
            setSystemStatus(docSnap.data());
          }
        });

      } else {
        router.push('/register');
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeEmployees) unsubscribeEmployees();
      if (unsubscribeStatus) unsubscribeStatus();
    };
  }, [router]);

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '--:--';
    }
  };

  const processedLogs = useMemo(() => {
    if (!logs.length) return [];
    
    const chronologicalLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const tracker = {};

    const annotatedLogs = chronologicalLogs.map(log => {
      const dateStr = new Date(log.timestamp).toDateString();
      const empKey = `${log.employeeId || log.rfidTag}_${dateStr}`; 

      const matchedEmployee = employees.find(
        emp => emp.rfidTag?.trim().toUpperCase() === log.rfidTag?.trim().toUpperCase()
      );
      const realName = matchedEmployee ? matchedEmployee.name : (log.employeeName || "Unknown Card");

      let currentStatus = 'Check-in';
      if (!tracker[empKey] || tracker[empKey] === 'Check-out') {
        tracker[empKey] = 'Check-in';
        currentStatus = 'Check-in';
      } else {
        tracker[empKey] = 'Check-out';
        currentStatus = 'Check-out';
      }

      return { 
        ...log, 
        computedStatus: currentStatus,
        realEmployeeName: realName
      };
    });

    return annotatedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, employees]);

  const presentTodayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    let count = 0;
    
    const todayLogs = processedLogs.filter(log => new Date(log.timestamp).toDateString() === todayStr);
    const latestStatus = {};
    
    todayLogs.forEach(log => {
      const empKey = log.employeeId || log.rfidTag;
      if (!latestStatus[empKey]) {
        latestStatus[empKey] = log.computedStatus;
      }
    });

    Object.values(latestStatus).forEach(status => {
      if (status === 'Check-in') count++;
    });
    
    return count;
  }, [processedLogs]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex relative" dir="ltr">
      
      {/* Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 flex flex-col
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-primary">RFID Admin</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-400 hover:text-white md:hidden text-2xl"
          >
            ✕
          </button>
        </div>

        <nav className="space-y-4 flex-grow text-left">
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            className={`w-full text-left block py-2.5 px-4 rounded transition ${
              activeTab === 'dashboard' ? 'bg-primary/20 text-primary border-l-4 border-primary font-bold' : 'hover:bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          
          <button 
            onClick={() => { setActiveTab('employees'); setIsSidebarOpen(false); }} 
            className={`w-full text-left block py-2.5 px-4 rounded transition ${
              activeTab === 'employees' ? 'bg-primary/20 text-primary border-l-4 border-primary font-bold' : 'hover:bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Employees Management
          </button>
          
          <button 
            onClick={() => { setActiveTab('logs'); setIsSidebarOpen(false); }} 
            className={`w-full text-left block py-2.5 px-4 rounded transition ${
              activeTab === 'logs' ? 'bg-primary/20 text-primary border-l-4 border-primary font-bold' : 'hover:bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            Attendance Logs
          </button>
          <button className="w-full text-left block py-2.5 px-4 rounded transition hover:bg-slate-800 text-gray-400 hover:text-white">
            Settings
          </button>
        </nav>

        <button onClick={handleLogout} className="sidebar-logout mt-auto py-2 px-4 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all text-sm font-medium">
          Log out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 w-full overflow-hidden">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 md:hidden hover:bg-gray-50"
            >
              ☰
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome, Admin</h1>
              <p className="text-gray-500 text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none">{user?.email}</p>
            </div>
            <div className="ml-4">
               <button 
                   onClick={() => setIsModalOpen(true)}
                   className="bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-medium py-2 px-4 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
               >
                   + Add Employee
               </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
               {user?.email?.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Employees</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">{totalEmployees}</h3>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Present Today</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-green-600">{presentTodayCount}</h3>
              </div>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm sm:col-span-2 md:col-span-1">
                <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">System Status</p>
                
                {systemStatus.isPairingMode ? (
                  <h3 className="text-lg sm:text-xl font-bold text-purple-600 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-ping"></span> Pairing Mode
                  </h3>
                ) : systemStatus.status === 'online' ? (
                  <h3 className="text-lg sm:text-xl font-bold text-blue-600 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span> Online
                  </h3>
                ) : (
                  <h3 className="text-lg sm:text-xl font-bold text-gray-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-gray-400 rounded-full"></span> Offline
                  </h3>
                )}
              </div>
            </div>

            {/* Real-time Logs Table (Dashboard Preview) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-50">
                <h4 className="font-bold text-slate-800 text-base sm:text-lg">Recent Attendance Logs</h4>
              </div>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left min-w-[500px]"> 
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Employee</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Card UID</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Time</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                    {processedLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-4 sm:px-6 py-8 text-center text-gray-400">
                          No logs available yet. Scan an RFID card to begin.
                        </td>
                      </tr>
                    ) : (
                      processedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-slate-700">
                            {log.realEmployeeName}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 font-mono">
                            {log.rfidTag}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500">
                            {formatTime(log.timestamp)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                              log.computedStatus === 'Check-in' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {log.computedStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'employees' ? (
          <EmployeesTable />
        ) : (
          <AttendanceLogsTable logs={processedLogs} employees={employees} />
        )}
        
      </main>
      <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;