import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthModalsProvider } from "@/components/auth/auth-modals";
import { ScrollToTop } from "@/components/utils/scroll-to-top";
import { apiJson } from "@/lib/api";

import Home from "@/pages/home";
import Courses from "@/pages/courses";
import Sessions from "@/pages/sessions";
import Products from "@/pages/products";
import About from "@/pages/about";
import Account from "@/pages/account";
import AdminPage from "@/pages/admin/index";
import AdminLoginPage from "@/pages/admin/login-page";
import FunnelPage from "@/pages/funnel-page";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

function Router() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [displayMode, setDisplayMode] = useState<'full_website' | 'funnel_page' | null>(null);

  const isUserAdmin = isAuthenticated && (user as any)?.role === "admin";
  const isAdminRoute = location === "/admin" || location.startsWith("/admin/");

  useEffect(() => {
    if (isAdminRoute) return;
    apiJson<{ value: string }>("/site-settings/display_mode")
      .then((res) => setDisplayMode(res.value === "funnel_page" ? "funnel_page" : "full_website"))
      .catch(() => setDisplayMode("full_website"));
  }, [isAdminRoute]);

  if (isAdminRoute && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--cream)]">
        <p className="text-lg font-medium animate-pulse" style={{ color: "var(--text-dark)" }}>
          جاري التحقق من صلاحيات الآدمن...
        </p>
      </div>
    );
  }

  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin">
          {isUserAdmin ? <AdminPage /> : <Redirect to="/" replace />}
        </Route>
      </Switch>
    );
  }

  if (displayMode === "funnel_page") {
    return (
      <Switch>
        <Route path="/" component={FunnelPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route component={FunnelPage} />
      </Switch>
    );
  }

  if (displayMode === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/courses" component={Courses} />
            <Route path="/sessions" component={Sessions} />
            <Route path="/products" component={Products} />
            <Route path="/about" component={About} />
            <Route path="/account" component={Account} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/courses" component={Courses} />
          <Route path="/sessions" component={Sessions} />
          <Route path="/products" component={Products} />
          <Route path="/about" component={About} />
          <Route path="/account" component={Account} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ScrollToTop />
              <AuthModalsProvider>
                <Router />
              </AuthModalsProvider>
            </WouterRouter>
            <SonnerToaster position="top-center" richColors={false} closeButton={false} />
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;