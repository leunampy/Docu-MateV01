import React from "react";
import { Link, useLocation, Routes, Route } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { FileText, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { base44 } from "@/api/base44Client";

// Pagine
import Home from "@/pages/Home";
import GenerateDocument from "@/pages/GenerateDocument";
import CompileDocument from "@/pages/CompileDocument";

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DocuMate</h1>
                <p className="text-xs text-gray-500">Documenti Legali Intelligenti</p>
              </div>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to={createPageUrl("Settings")}>
                    {/* @ts-ignore */}
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-xl">
                      <Settings className="w-5 h-5 text-gray-600" />
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {/* @ts-ignore */}
                      <Button variant="ghost" className="h-auto p-0 hover:opacity-80">
                        {/* @ts-ignore */}
                        <Avatar className="w-10 h-10 border-2 border-indigo-200">
                          {/* @ts-ignore */}
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white font-semibold">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    {/* @ts-ignore */}
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2">
                        <p className="font-semibold text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${
                              user.subscription_type === "premium"
                                ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                                : user.subscription_type === "registered"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.subscription_type === "premium"
                              ? "⭐ Premium"
                              : user.subscription_type === "registered"
                              ? "Registrato"
                              : "Gratuito"}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {/* @ts-ignore */}
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Profile")} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          Profilo
                        </Link>
                      </DropdownMenuItem>
                      {/* @ts-ignore */}
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Settings")} className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Impostazioni
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {/* @ts-ignore */}
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Esci
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                // @ts-ignore
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                >
                  Accedi
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/generate-document" element={<GenerateDocument />} />
          <Route path="/compile-document" element={<CompileDocument />} />
        </Routes>
      </main>
    </div>
  );
}
