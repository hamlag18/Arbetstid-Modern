import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import supabase from "../supabase";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@heroicons/react/24/outline";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-zinc-800 rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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
  }, []);

  const handleDateClick = async (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: reports, error } = await supabase
        .from('time_reports')
        .select('*')
        .eq('user_id', selectedUserId || user.id)
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

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextMonth();
    }
    if (isRightSwipe) {
      handlePrevMonth();
    }

    setTouchStart(null);
    setTouchEnd(null);
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-zinc-400">Laddar kalender...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <p className="text-red-500 mb-4 text-sm sm:text-base">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-screen-sm mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">Tidrapporter</h1>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate("/tidrapport")}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors text-base sm:text-lg"
            >
              Ny tidrapport
            </button>
            <button
              onClick={() => navigate("/tidrapporter")}
              className="w-full sm:w-auto bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-6 rounded-lg transition-colors text-base sm:text-lg"
            >
              Visa tidrapporter
            </button>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">Kalender</h2>
          <div className="calendar-container">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 sm:p-3 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <h3 className="text-lg sm:text-xl font-medium">
                {format(currentDate, "MMMM yyyy", { locale: sv })}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 sm:p-3 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm sm:text-base font-medium py-2"
                >
                  {day}
                </div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => {
                const firstDayOfMonth = startOfMonth(currentDate);
                const firstDayOfWeek = startOfWeek(firstDayOfMonth, { locale: sv });
                const dayToShow = addDays(firstDayOfWeek, i);
                if (!isSameMonth(dayToShow, firstDayOfMonth)) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="h-12 sm:h-16"
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
                  <div
                    key={i}
                    className={`relative h-12 sm:h-16 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                      isCurrentDay
                        ? "bg-blue-600 hover:bg-blue-700"
                        : statusClass
                    }`}
                    onClick={() => handleDateClick(date)}
                  >
                    <span className="text-sm sm:text-base">{format(date, "d")}</span>
                    {isCurrentDay && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-6">
          {isAdmin && (
            <Card
              className="cursor-pointer hover:shadow-xl transition-all active:scale-95 touch-manipulation"
              onClick={() => navigate("/projects")}
            >
              <CardContent className="p-4 sm:p-6 text-center">
                <span className="text-lg sm:text-xl">⚙️ Projekthantering</span>
              </CardContent>
            </Card>
          )}

          <Card
            className="cursor-pointer hover:shadow-xl transition-all active:scale-95 touch-manipulation"
            onClick={() => navigate("/nytt-projekt")}
          >
            <CardContent className="p-4 sm:p-6 text-center">
              <span className="text-lg sm:text-xl">➕ Nytt projekt</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all active:scale-95 touch-manipulation"
            onClick={() => navigate("/skicka-timmar")}
          >
            <CardContent className="p-4 sm:p-6 text-center">
              <span className="text-lg sm:text-xl">📤 Skicka Timmar</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all active:scale-95 touch-manipulation sm:col-span-2"
            onClick={() => navigate("/tidrapporter")}
          >
            <CardContent className="p-4 sm:p-6 text-center">
              <span className="text-lg sm:text-xl">📋 Visa tidrapporter</span>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full max-w-md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            {isAdmin && (
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(e.target.value)}
                className="w-full sm:w-auto bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Logga ut
            </button>
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">
                {selectedDate ? format(new Date(selectedDate), "d MMMM yyyy", { locale: sv }) : ""}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-2 -mr-2"
              >
                ✕
              </button>
            </div>

            {selectedDateReports.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">Inga tidrapporter för detta datum</p>
                <button
                  onClick={() => navigate(`/tidrapport?datum=${selectedDate}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Lägg till tid
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateReports.map(report => (
                  <div key={report.id} className="bg-zinc-700/50 p-4 rounded-lg">
                    {editingReport?.id === report.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm mb-1">Timmar</label>
                          <input
                            type="number"
                            value={editingReport.hours}
                            onChange={(e) => setEditingReport(prev => ({ ...prev, hours: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-600 rounded-lg text-base"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Material</label>
                          <textarea
                            value={editingReport.materials || ""}
                            onChange={(e) => setEditingReport(prev => ({ ...prev, materials: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-600 rounded-lg text-base"
                            rows="2"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleEdit(report)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Spara
                          </button>
                          <button
                            onClick={() => setEditingReport(null)}
                            className="flex-1 bg-zinc-600 hover:bg-zinc-500 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Avbryt
                          </button>
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
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleEdit(report)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Redigera
                          </button>
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            Radera
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                
                <div className="pt-4">
                  <button
                    onClick={() => navigate(`/tidrapport?datum=${selectedDate}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Lägg till tid
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}