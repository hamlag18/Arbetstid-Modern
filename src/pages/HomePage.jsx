import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import supabase from "../supabase";

function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-zinc-800 rounded-xl shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

const getDayStatus = (date, reportedDates, sentDates) => {
  const dateStr = format(date, "yyyy-MM-dd");
  
  if (sentDates.includes(dateStr)) {
    return "bg-green-500 hover:bg-green-600 text-white";
  }
  if (reportedDates.includes(dateStr)) {
    return "bg-yellow-500 hover:bg-yellow-600 text-white";
  }
  return "bg-zinc-700 hover:bg-zinc-600 text-white";
};

export default function HomePage() {
  const navigate = useNavigate();
  const [reportedDates, setReportedDates] = useState([]);
  const [sentDates, setSentDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateReports, setSelectedDateReports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [projects, setProjects] = useState({});
  const [editingReport, setEditingReport] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Fel vid hämtning av användare:", userError);
        setError("Kunde inte hämta användarinformation");
        setLoading(false);
        return;
      }

      // Kontrollera om användaren är admin
      const isAdminByEmail = user.email === 'tidrapport1157@gmail.com';
      setIsAdmin(isAdminByEmail);
      setSelectedUserId(user.id);

      // Om admin, hämta alla användare
      if (isAdminByEmail) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .order('full_name');

        if (usersError) {
          console.error("Fel vid hämtning av användare:", usersError);
        } else {
          setUsers(usersData || []);
        }
      }

      // Hämta alla projekt först
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) {
        console.error("Fel vid hämtning av projekt:", projectsError);
        setError("Kunde inte hämta projekt");
        setLoading(false);
        return;
      }

      const projectsMap = {};
      projectsData.forEach(project => {
        projectsMap[project.id] = project;
      });
      setProjects(projectsMap);

      // Hämta tidrapporter baserat på vald användare
      const { data: reports, error: reportsError } = await supabase
        .from('time_reports')
        .select('*')
        .eq('user_id', selectedUserId || user.id);

      if (reportsError) {
        console.error("Fel vid hämtning av tidrapporter:", reportsError);
        setError("Kunde inte hämta tidrapporter");
        setLoading(false);
        return;
      }

      const reported = reports.filter(report => !report.sent).map(report => report.date);
      const sent = reports.filter(report => report.sent).map(report => report.date);

      setReportedDates(reported);
      setSentDates(sent);
      setLoading(false);
    } catch (error) {
      console.error("Ett fel uppstod:", error);
      setError("Ett oväntat fel uppstod");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedUserId]);

  const handleDateClick = async (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: reports, error } = await supabase
        .from('time_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr);

      if (error) throw error;

      setSelectedDateReports(reports);
      setSelectedDate(dateStr);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Fel vid hämtning av tidrapporter:", error);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      const { error } = await supabase
        .from('time_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Uppdatera listan och kalendern
      setSelectedDateReports(prev => prev.filter(report => report.id !== reportId));
      await fetchReports();
    } catch (error) {
      console.error("Fel vid radering:", error);
    }
  };

  const handleEdit = async (report) => {
    if (editingReport?.id === report.id) {
      try {
        const { error } = await supabase
          .from('time_reports')
          .update({
            hours: editingReport.hours,
            materials: editingReport.materials
          })
          .eq('id', report.id);

        if (error) throw error;

        setEditingReport(null);
        // Uppdatera listan och kalendern
        const { data: updatedReports } = await supabase
          .from('time_reports')
          .select('*')
          .eq('date', selectedDate);

        setSelectedDateReports(updatedReports);
        await fetchReports();
      } catch (error) {
        console.error("Fel vid uppdatering:", error);
      }
    } else {
      setEditingReport({ ...report });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Fel vid utloggning:", error);
        return;
      }
      navigate("/login");
    } catch (error) {
      console.error("Ett fel uppstod vid utloggning:", error);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleUserChange = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Hämta användarens tidrapporter
      const { data: reports, error: reportsError } = await supabase
        .from('time_reports')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (reportsError) throw reportsError;

      // Uppdatera state först efter att vi har data
      setSelectedUserId(userId);
      setReportedDates(reports.filter(report => !report.sent).map(report => report.date));
      setSentDates(reports.filter(report => report.sent).map(report => report.date));
      
      // Uppdatera användarens information från profiles-tabellen
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      
      if (userData) {
        setSelectedUser(userData);
      }
    } catch (error) {
      console.error("Fel vid hämtning av data:", error);
      setError("Kunde inte hämta användardata");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Laddar kalender...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center bg-red-500 p-4 rounded-lg">Tidrapportering</h1>
      
      <Card className="mb-8 w-full max-w-md">
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} className="text-zinc-400 hover:text-white">
              &lt; Föregående
            </button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: sv })}
            </h2>
            <button onClick={handleNextMonth} className="text-zinc-400 hover:text-white">
              Nästa &gt;
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day, i) => (
              <div key={i} className="text-center text-sm font-medium text-zinc-400">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => {
              const firstDayOfMonth = startOfMonth(currentDate);
              const firstDayOfWeek = startOfWeek(firstDayOfMonth, { locale: sv });
              const dayToShow = addDays(firstDayOfWeek, i);
              if (!isSameMonth(dayToShow, firstDayOfMonth)) {
                return (
                  <div
                    key={i}
                    className="aspect-square w-full text-sm font-medium rounded-md bg-zinc-800 opacity-25"
                    style={{ minHeight: '40px' }}
                  />
                );
              }
              return null;
            })}
            {daysInMonth.map((date, i) => {
              const statusClass = getDayStatus(date, reportedDates, sentDates);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isCurrentDay = isToday(date);
              
              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square w-full text-sm font-medium rounded-md ${statusClass} ${!isCurrentMonth ? 'opacity-50' : ''} ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ minHeight: '40px' }}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {selectedDate ? format(new Date(selectedDate), "d MMMM yyyy", { locale: sv }) : ""}
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {selectedDateReports.length === 0 ? (
          <p className="text-center text-zinc-400">Inga tidrapporter för detta datum</p>
        ) : (
          <div className="space-y-4">
            {selectedDateReports.map(report => (
              <div key={report.id} className="bg-zinc-700 p-4 rounded-lg">
                {editingReport?.id === report.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Timmar</label>
                      <input
                        type="number"
                        value={editingReport.hours}
                        onChange={(e) => setEditingReport(prev => ({ ...prev, hours: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-600 rounded"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Material</label>
                      <textarea
                        value={editingReport.materials || ""}
                        onChange={(e) => setEditingReport(prev => ({ ...prev, materials: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-600 rounded"
                        rows="2"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{projects[report.project]?.name || "Okänt projekt"}</h3>
                        <p className="text-sm text-zinc-400">{projects[report.project]?.address}</p>
                      </div>
                      <p className="text-lg font-medium">{report.hours}h</p>
                    </div>
                    {report.materials && (
                      <p className="text-sm text-zinc-300 mt-2">Material: {report.materials}</p>
                    )}
                  </>
                )}
                
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(report)}
                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm"
                  >
                    {editingReport?.id === report.id ? "Spara" : "Redigera"}
                  </button>
                  {editingReport?.id === report.id && (
                    <button
                      onClick={() => setEditingReport(null)}
                      className="px-3 py-1 bg-zinc-600 hover:bg-zinc-500 rounded text-sm"
                    >
                      Avbryt
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm"
                  >
                    Radera
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => navigate(`/tidrapport?datum=${selectedDate}`)}
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
          >
            Lägg till tid
          </button>
        </div>
      </Modal>

      <div className="grid gap-4 w-full max-w-sm">
        <Card
          className="cursor-pointer hover:shadow-xl transition-all"
          onClick={() => navigate("/nytt-projekt")}
        >
          <CardContent className="p-6 text-center">
            <span className="text-xl">➕ Nytt projekt</span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all"
          onClick={() => navigate("/skicka-timmar")}
        >
          <CardContent className="p-6 text-center">
            <span className="text-xl">📤 Skicka Timmar</span>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-xl transition-all"
          onClick={() => navigate("/tidrapporter")}
        >
          <CardContent className="p-6 text-center">
            <span className="text-xl">📋 Visa tidrapporter</span>
          </CardContent>
        </Card>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex gap-4">
            {isAdmin && (
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Logga ut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}