import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import supabase from "../supabase";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        setError("Fel vid inloggning: " + error.message);
        return;
      }

      console.log("Inloggad:", data);
      navigate("/");
    } catch (error) {
      setError("Ett fel uppstod vid inloggning");
      console.error("Inloggningsfel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName
          }
        }
      });

      if (error) throw error;

      if (data?.user) {
        // Uppdatera profilen med full_name
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: formData.fullName })
          .eq('id', data.user.id);

        if (profileError) throw profileError;
      }

      setMessage('Kontrollera din e-post för verifieringslänk');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-center mb-6">
              {isLogin ? 'Logga in' : 'Registrera dig'}
            </h1>
            
            <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                    Namn
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  E-post
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Lösenord
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Laddar...' : (isLogin ? 'Logga in' : 'Registrera')}
              </button>
            </form>
            
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full mt-4 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              {isLogin ? 'Skapa ett konto' : 'Har du redan ett konto? Logga in'}
            </button>
            
            {error && (
              <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
            )}
            
            {message && (
              <p className="mt-4 text-green-500 text-sm text-center">{message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 