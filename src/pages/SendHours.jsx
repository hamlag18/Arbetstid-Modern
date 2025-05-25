import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "../supabase";
import { Card, CardContent } from '../components/ui/card';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useAuth } from '../contexts/AuthContext';

function Notification({ message, type, onClose }) {
  return (
    <div className={`fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } text-white`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 hover:text-white/80">✕</button>
      </div>
    </div>
  );
}

const getDayStatus = (date, reportedDates, sentDates, selectedDates) => {
  const dateStr = format(date, "yyyy-MM-dd");
  
  if (selectedDates.some(d => isSameDay(d, date))) {
    return "bg-blue-500 hover:bg-blue-600 text-white";
  }
  if (sentDates.includes(dateStr)) {
    return "bg-green-500 hover:bg-green-600 text-white";
  }
  if (reportedDates.includes(dateStr)) {
    return "bg-yellow-500 hover:bg-yellow-600 text-white";
  }
  return "bg-zinc-700 hover:bg-zinc-600 text-white";
};

export default function SendHours() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [reportedDates, setReportedDates] = useState([]);
  const [sentDates, setSentDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [projects, setProjects] = useState({});

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchProjects();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('time_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;

      setReports(data || []);
      setReportedDates(data.map(report => report.date));
      setSentDates(data.filter(report => report.sent).map(report => report.date));
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;
      // Map id to name
      const projectMap = {};
      data.forEach(p => { projectMap[p.id] = p.name; });
      setProjects(projectMap);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const hasReport = reportedDates.includes(dateStr);

    if (hasReport) {
      setSelectedDates(prev => {
        const isSelected = prev.some(d => isSameDay(d, date));
        if (isSelected) {
          return prev.filter(d => !isSameDay(d, date));
        } else {
          return [...prev, date];
        }
      });
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

  const generateEmailContent = () => {
    if (selectedDates.length === 0) return '';

    const selectedReports = reports.filter(report => 
      selectedDates.some(date => isSameDay(new Date(report.date), date))
    );
    if (selectedReports.length === 0) return '';

    // Sort by date
    const sortedReports = [...selectedReports].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by week
    const weeklyReports = {};
    sortedReports.forEach(report => {
      const date = new Date(report.date);
      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (!weeklyReports[weekStart]) {
        weeklyReports[weekStart] = [];
      }
      weeklyReports[weekStart].push(report);
    });

    // Project summary
    const projectSummary = {};
    sortedReports.forEach(report => {
      const projectName = projects[report.project] || report.project;
      if (!projectSummary[projectName]) projectSummary[projectName] = 0;
      projectSummary[projectName] += report.hours;
    });
    const totalHours = Object.values(projectSummary).reduce((a, b) => a + b, 0);

    // Header and period
    const userEmail = (user && user.email) ? user.email : '';
    const periodStart = format(new Date(sortedReports[0].date), 'd MMMM yyyy', { locale: sv });
    const periodEnd = format(new Date(sortedReports[sortedReports.length - 1].date), 'd MMMM yyyy', { locale: sv });

    let html = `<div style="background:#18181b;color:#fff;padding:24px 0;font-family:Inter,sans-serif;max-width:700px;margin:0 auto;">
      <div style="background:#23232a;border-radius:16px;padding:32px 24px 24px 24px;max-width:600px;margin:0 auto;">
        <h2 style="margin:0 0 8px 0;font-size:22px;font-weight:700;">Tidrapport för <span style='color:#3b82f6;'>${userEmail}</span></h2>
        <div style="color:#bdbdbd;font-size:15px;margin-bottom:18px;">Period: ${periodStart} - ${periodEnd}</div>
    `;

    Object.entries(weeklyReports).forEach(([weekStart, weekReports]) => {
      const weekNum = format(new Date(weekStart), 'w', { locale: sv });
      const year = format(new Date(weekStart), 'yyyy');
      html += `<div style='margin-bottom:18px;'>
        <div style='font-size:18px;font-weight:600;margin-bottom:8px;'>Vecka ${weekNum}, ${year}</div>
        <table style='width:100%;border-collapse:collapse;background:#18181b;'>
          <thead>
            <tr style='background:#23232a;'>
              <th style='padding:6px 8px;text-align:left;font-weight:600;'>Datum</th>
              <th style='padding:6px 8px;text-align:left;font-weight:600;'>Projekt</th>
              <th style='padding:6px 8px;text-align:right;font-weight:600;'>Timmar</th>
              <th style='padding:6px 8px;text-align:left;font-weight:600;'>Material</th>
              <th style='padding:6px 8px;text-align:left;font-weight:600;'>Kommentar</th>
            </tr>
          </thead>
          <tbody>`;
      weekReports.forEach(report => {
        html += `<tr style='border-bottom:1px solid #23232a;'>
          <td style='padding:6px 8px;'>${report.date}</td>
          <td style='padding:6px 8px;'>${projects[report.project] || report.project}</td>
          <td style='padding:6px 8px;text-align:right;'>${report.hours}</td>
          <td style='padding:6px 8px;'>${report.materials ? report.materials : ''}</td>
          <td style='padding:6px 8px;'>${report.comments || report.comment || ''}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    });

    // Project summary
    html += `<div style='background:#18181b;border-radius:12px;padding:18px 16px;margin-top:24px;'>
      <div style='font-size:17px;font-weight:600;margin-bottom:10px;'>Summering per projekt</div>`;
    if (Object.keys(projectSummary).length > 0) {
      Object.entries(projectSummary).forEach(([project, hours]) => {
        html += `<div style='color:#e0e0e0;font-size:15px;margin-bottom:2px;'>${project}<span style='font-weight:700;margin-left:8px;'>${hours.toFixed(1)} timmar</span></div>`;
      });
    } else {
      html += `<div style='color:#e0e0e0;font-size:15px;margin-bottom:2px;'>Inga projekt att summera</div>`;
    }
    html += `<hr style='border:0;border-top:1px solid #23232a;margin:12px 0;'>
      <div style='font-size:16px;font-weight:700;'>Totalt antal timmar: ${totalHours.toFixed(1)}</div>
    </div>`;

    html += `</div></div>`;
    return html;
  };

  const handleSend = async () => {
    if (selectedDates.length === 0) return;

    try {
      setSending(true);
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          recipient: user.email,
          subject: 'Tidrapport',
          content: generateEmailContent(),
          from: 'noreply@arbetstid.app'
        }
      });

      if (error) throw error;

      // Update sent status for all selected reports
      const dateStrings = selectedDates.map(date => format(date, 'yyyy-MM-dd', { locale: sv }));
      const { error: updateError } = await supabase
        .from('time_reports')
        .update({ sent: true })
        .in('date', dateStrings)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Refresh reports and clear selection
      await fetchReports();
      setSelectedDates([]);
      setNotification({
        message: 'Tidrapporten har skickats framgångsrikt!',
        type: 'success'
      });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error.message);
      setNotification({
        message: error.message || 'Kunde inte skicka tidrapporten',
        type: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div>Laddar...</div>;
  if (error) return <div>Error: {error}</div>;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center py-6 px-3 sm:py-10 sm:px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Skicka Timmar</h1>
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white p-2 active:bg-zinc-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div 
              className="touch-pan-x"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={handlePrevMonth} 
                  className="text-zinc-400 hover:text-white p-2 -ml-2 active:bg-zinc-800 rounded-lg transition-colors"
                >
                  &lt; Föregående
                </button>
                <h2 className="text-lg sm:text-xl font-semibold">
                  {format(currentDate, "MMMM yyyy", { locale: sv })}
                </h2>
                <button 
                  onClick={handleNextMonth} 
                  className="text-zinc-400 hover:text-white p-2 -mr-2 active:bg-zinc-800 rounded-lg transition-colors"
                >
                  Nästa &gt;
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day, i) => (
                  <div key={i} className="text-center text-xs sm:text-sm font-medium text-zinc-400">
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
                        className="aspect-square w-full text-xs sm:text-sm font-medium rounded-md bg-zinc-800 opacity-25 flex items-center justify-center"
                        style={{ minHeight: '32px', touchAction: 'manipulation' }}
                      />
                    );
                  }
                  return null;
                })}
                {daysInMonth.map((date, i) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const isReported = reportedDates.includes(dateStr);
                  const isSent = sentDates.includes(dateStr);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isCurrentDay = isToday(date);
                  const buttonClass = getDayStatus(date, reportedDates, sentDates, selectedDates);

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateClick(date)}
                      className={`aspect-square w-full text-xs sm:text-sm font-medium rounded-md ${buttonClass} 
                        ${!isCurrentMonth ? 'opacity-50' : ''} 
                        ${isCurrentDay ? 'ring-2 ring-blue-500' : ''} 
                        flex items-center justify-center`}
                      style={{ minHeight: '32px', touchAction: 'manipulation' }}
                    >
                      {format(date, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-zinc-700 rounded"></div>
                  <span>Ingen rapport</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Rapporterad</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Vald</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Skickad</span>
                </div>
              </div>

              {selectedDates.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Valda datum:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDates.map(date => (
                      <div 
                        key={format(date, "yyyy-MM-dd")}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm flex items-center gap-2"
                      >
                        <span>{format(date, "d MMM", { locale: sv })}</span>
                        <button 
                          onClick={() => handleDateClick(date)}
                          className="hover:text-zinc-200 active:text-zinc-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-500 p-4 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            disabled={loading || sending || selectedDates.length === 0}
            className="w-full sm:flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {showPreview ? 'Dölj förhandsgranskning' : 'Förhandsgranska'}
          </button>
          <button
            onClick={handleSend}
            disabled={loading || sending || selectedDates.length === 0}
            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {sending ? "Skickar..." : "Skicka Tidrapport"}
          </button>
        </div>

        {showPreview && (
          <div className="mt-4 bg-zinc-800 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm">{generateEmailContent()}</pre>
          </div>
        )}
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 