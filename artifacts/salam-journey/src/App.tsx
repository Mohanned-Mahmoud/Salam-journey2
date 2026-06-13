import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
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
  const { user, isAuthenticated, isLoading } = useAuth(); // 🌟 سحبنا الـ isLoading هنا
  
  // 🛡️ التحقق ديناميكي بالكامل من الـ role المدمج في الحساب
  const isUserAdmin = isAuthenticated && (user as any)?.role === "admin";
  const isAdminRoute = location === "/admin" || location.startsWith("/admin/");

  // ⏳ الحل السحري: لو إحنا في مسار آدمن والسيستم لسه بيحمل البيانات، استنى ومبتطردش فوراً!
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
        {/* صفحة تسجيل دخول الآدمن متاحة للجميع */}
        <Route path="/admin/login" component={AdminLoginPage} />
        
        {/* 🔒 جدار الحماية الذكي: لا يشتغل إلا بعد انتهاء الـ isLoading تماماً */}
        <Route path="/admin">
          {isUserAdmin ? <AdminPage /> : <Redirect to="/" replace />}
        </Route>
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