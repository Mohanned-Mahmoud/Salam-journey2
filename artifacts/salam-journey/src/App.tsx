import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthModalsProvider } from "@/components/auth/auth-modals";
import { ScrollToTop } from "@/components/utils/scroll-to-top";

import Home from "@/pages/home";
import Courses from "@/pages/courses";
import Sessions from "@/pages/sessions";
import Products from "@/pages/products";
import About from "@/pages/about";
import Account from "@/pages/account";
import AdminPage from "@/pages/admin/index";
import AdminLoginPage from "@/pages/admin/login-page";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
});

function Router() {
  const [location] = useLocation();
  const isAdmin = location === "/admin" || location.startsWith("/admin/");

  if (isAdmin) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin" component={AdminPage} />
      </Switch>
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
