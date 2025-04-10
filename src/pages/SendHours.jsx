import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addDays, getWeek } from "date-fns";
import { sv } from "date-fns/locale";
import supabase from "../supabase";
import { Card, CardContent } from '../components/ui/card';

export default function SendHours() {
  const navigate = useNavigate();
  const [selectedDates, setSelectedDates] = useState([]);
  const [reportedDates, setReportedDates] = useState([]);
  const [sentDates, setSentDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchUser();
  }, [currentDate]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReports = async () => {
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const { data: reports, error } = await supabase
        .from('time_reports')
        .select('*')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const reported = reports.map(report => report.date);
      const sent = reports.filter(report => report.sent).map(report => report.date);

      setReportedDates(reported);
      setSentDates(sent);
    } catch (error) {
      console.error('Fel vid hämtning av rapporter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    if (sentDates.includes(dateStr)) return;

    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr].sort();
    });
  };

  const generateEmailContent = (timeReports) => {
    const sortedReports = [...timeReports].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startDate = format(new Date(sortedReports[0].date), 'yyyy-MM-dd');
    const endDate = format(new Date(sortedReports[sortedReports.length - 1].date), 'yyyy-MM-dd');
    const totalHours = sortedReports.reduce((sum, report) => sum + report.hours, 0);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tidrapport</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 800px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: #1a56db;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 20px;
            }
            .period {
              text-align: center;
              margin-bottom: 20px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
            }
            th {
              background: #f8f9fa;
              color: #333;
              font-weight: 600;
              text-align: left;
              padding: 12px;
              border-bottom: 2px solid #dee2e6;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #dee2e6;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .total {
              background: #f8f9fa;
              padding: 15px;
              text-align: right;
              font-weight: 600;
              border-top: 2px solid #dee2e6;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #dee2e6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Tidrapport</h1>
            </div>
            <div class="content">
              <div class="period">
                Period: ${format(new Date(startDate), 'd MMMM', { locale: sv })} - ${format(new Date(endDate), 'd MMMM yyyy', { locale: sv })}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Datum</th>
                    <th>Projekt</th>
                    <th>Timmar</th>
                    <th>Material</th>
                  </tr>
                </thead>
                <tbody>
                  ${sortedReports.map(report => `
                    <tr>
                      <td>${format(new Date(report.date), 'yyyy-MM-dd')}</td>
                      <td>${report.project}</td>
                      <td>${report.hours.toFixed(1)}</td>
                      <td>${report.material || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" class="total">Totalt antal timmar:</td>
                    <td colspan="2" class="total">${totalHours.toFixed(1)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="footer">
              Detta är en automatisk tidrapport från Arbetstid Modern
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleSend = async () => {
    if (selectedDates.length === 0) {
      setError('Välj minst ett datum att skicka');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Ingen inloggad användare');

      const { data: timeReports, error: reportsError } = await supabase
        .from('time_reports')
        .select('*')
        .in('date', selectedDates);

      if (reportsError) throw reportsError;

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');

      if (projectsError) throw projectsError;

      const reportsWithProjects = timeReports.map(report => {
        const project = projects.find(p => p.id === report.project);
        return {
          ...report,
          project: project?.name || 'Okänt projekt',
          material: report.materials || 'Inget material',
          comment: report.comment || ''
        };
      });

      const emailContent = generateEmailContent(reportsWithProjects);

      const response = await fetch('https://email-server-production-a333.up.railway.app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          recipient: 'hampus.lagerstrom@gmail.com',
          subject: `Tidrapport ${format(new Date(selectedDates[0]), 'd MMM', { locale: sv })} - ${format(new Date(selectedDates[selectedDates.length - 1]), 'd MMM yyyy', { locale: sv })}`,
          content: emailContent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Railway API svarade med fel:', errorData);
        throw new Error(`Kunde inte skicka e-post: ${errorData.error || 'Okänt fel'}`);
      }

      const data = await response.json();
      console.log('E-post skickad framgångsrikt:', data);

      // Uppdatera tidrapporterna som skickade
      const { error: updateError } = await supabase
        .from('time_reports')
        .update({ sent: true })
        .eq('user_id', user.id)
        .in('date', selectedDates);

      if (updateError) throw updateError;

      // Navigera tillbaka till startsidan
      navigate('/');
    } catch (error) {
      console.error("Fel vid skickande:", error);
      setError(error.message || "Kunde inte skicka tidrapporterna");
    } finally {
      setSending(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Laddar kalender...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Skicka Timmar</h1>

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
              const dateStr = format(date, "yyyy-MM-dd");
              const isSelected = selectedDates.includes(dateStr);
              const isReported = reportedDates.includes(dateStr);
              const isSent = sentDates.includes(dateStr);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isCurrentDay = isToday(date);

              let buttonClass = 'bg-zinc-700 hover:bg-zinc-600';
              if (isSelected) {
                buttonClass = 'bg-blue-500 hover:bg-blue-600';
              } else if (isSent) {
                buttonClass = 'bg-green-500';
              } else if (isReported) {
                buttonClass = 'bg-yellow-500 hover:bg-yellow-600';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square w-full text-sm font-medium rounded-md ${buttonClass} \
                    ${!isCurrentMonth ? 'opacity-50' : ''} \
                    ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ minHeight: '40px' }}
                  disabled={isSent}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex gap-4 w-full max-w-md">
        <button
          onClick={handleSend}
          disabled={sending || selectedDates.length === 0}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {sending ? "Skickar..." : "Skicka"}
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Tillbaka
        </button>
      </div>
    </div>
  );
} 