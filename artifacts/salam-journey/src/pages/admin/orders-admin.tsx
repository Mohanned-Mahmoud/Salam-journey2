import { useState, useEffect } from "react";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Copy,
  Zap,
  Settings,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  BookOpen,
  Calendar,
} from "lucide-react";
import { apiJson } from "@/lib/api";
import { notify } from "@/lib/notify";
import type { AdminOrder } from "./types";

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [config, setConfig] = useState({
    instapayUsername: "salamjourney@instapay",
    instapayPhone: "01015473623",
    instapayLink: "https://ipn.eg",
    usdToEgpRate: 50.0,
    rateProvider: "أسواق الصرف العالمية",
  });
  const [rateRefreshing, setRateRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiJson<AdminOrder[]>("/orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      notify.error("فشل تحميل طلبات الشراء");
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async (refresh = false) => {
    try {
      if (refresh) setRateRefreshing(true);
      const data = await apiJson<any>(`/orders/config${refresh ? "?refresh=true" : ""}`);
      if (data) {
        setConfig({
          instapayUsername: data.instapayUsername || "",
          instapayPhone: data.instapayPhone || "",
          instapayLink: data.instapayLink || "",
          usdToEgpRate: data.usdToEgpRate || 50.0,
          rateProvider: data.rateProvider || "أسواق الصرف العالمية",
        });
        if (refresh) {
          notify.success(`تم تحديث سعر الصرف التلقائي بنجاح: 1$ = ${data.usdToEgpRate} ج.م 🟢`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (refresh) setRateRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOrders();
    void loadConfig();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: "approved" | "rejected") => {
    const actionText = newStatus === "approved" ? "تأكيد الدفع وتفعيل العنصر للعميل" : "رفض هذا الطلب";
    if (!window.confirm(`هل أنت متأكد من ${actionText}؟`)) return;

    try {
      setProcessingId(orderId);
      const res = await apiJson<{ success: boolean; order: AdminOrder }>(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          approvedBy: "Admin",
        }),
      });

      if (res && res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, approvedAt: new Date().toISOString() } : o))
        );
        notify.success(
          newStatus === "approved"
            ? "تم تأكيد الدفع وتفعيل المنتج/الدورة بنجاح في حساب العميل! 🌿"
            : "تم تحديث حالة الطلب إلى مرفوض"
        );
      }
    } catch (err: any) {
      console.error(err);
      notify.error(`حدث خطأ أثناء تحديث الطلب: ${err.message || ""}`);
    } finally {
      setProcessingId(null);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      await apiJson("/site-settings", {
        method: "PUT",
        body: JSON.stringify({
          settings: {
            instapay_username: config.instapayUsername,
            instapay_phone: config.instapayPhone,
            instapay_link: config.instapayLink,
            usd_to_egp_rate: String(config.usdToEgpRate),
          },
        }),
      });
      notify.success("تم حفظ إعدادات انستا باي وسعر الصرف بنجاح! ⚡");
      setShowSettings(false);
    } catch (err: any) {
      console.error(err);
      notify.error("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.customerPhone?.toLowerCase().includes(q) ||
      o.itemTitle?.toLowerCase().includes(q) ||
      o.id?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === "pending_verification").length;
  const approvedCount = orders.filter((o) => o.status === "approved").length;
  const totalEgp = orders
    .filter((o) => o.status === "approved")
    .reduce((sum, o) => sum + (parseFloat(o.amountEgp) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text-dark)" }}>
            طلبات الشراء والتحويلات (انستا باي)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            مراجعة وتأكيد طلبات الشراء اليدوية وتفعيل المنتجات والدورات للعملاء فوراً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Automatic Exchange Rate Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>سعر الصرف التلقائي الآن: 1$ = {config.usdToEgpRate} ج.م</span>
            <button
              type="button"
              onClick={() => void loadConfig(true)}
              title="تحديث السعر المباشر الآن"
              disabled={rateRefreshing}
              className="p-1 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer text-emerald-700"
            >
              <RefreshCw size={12} className={rateRefreshing ? "animate-spin" : ""} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold transition-all shadow-2xs"
          >
            <Settings size={15} />
            <span>إعدادات انستا باي</span>
          </button>

          <button
            type="button"
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--cream)] hover:bg-[var(--cream)]/80 text-[var(--sage-dark)] text-xs font-bold transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Verification Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            pendingCount > 0
              ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-stone-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-amber-900">بانتظار التأكيد</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              ⏳
            </div>
          </div>
          <span className="text-2xl font-black text-amber-950">{pendingCount}</span>
          <span className="text-[11px] text-amber-800 block mt-0.5">طلبات تحتاج مراجعتك</span>
        </div>

        {/* Approved Orders */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-emerald-900">الطلبات المؤكدة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-950">{approvedCount}</span>
          <span className="text-[11px] text-stone-500 block mt-0.5">تم تفعيلها للعملاء</span>
        </div>

        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-[var(--text-dark)]">إجمالي الطلبات</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <span className="text-2xl font-black text-[var(--text-dark)]">{orders.length}</span>
          <span className="text-[11px] text-stone-500 block mt-0.5">عبر انستا باي</span>
        </div>

        {/* Total Revenue in EGP */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-[var(--sage-dark)]">إجمالي المبيعات المؤكدة</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--cream)] text-[var(--sage-dark)] flex items-center justify-center font-bold text-xs">
              ج.م
            </div>
          </div>
          <span className="text-2xl font-black text-[var(--sage-dark)]">
            {totalEgp.toLocaleString()} ج.م
          </span>
          <span className="text-[11px] text-stone-500 block mt-0.5">تحصيلات ناجحة</span>
        </div>
      </div>

      {/* InstaPay Settings Modal / Panel */}
      {showSettings && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 shadow-sm animate-in fade-in space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h3 className="font-extrabold text-sm text-[var(--text-dark)] flex items-center gap-2">
              <Settings size={16} />
              <span>إعدادات الدفع عبر انستا باي وسعر الصرف</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>

          <form onSubmit={saveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-dark)]">
                عنوان انستا باي (IPA)
              </label>
              <input
                type="text"
                required
                value={config.instapayUsername}
                onChange={(e) => setConfig({ ...config, instapayUsername: e.target.value })}
                placeholder="username@instapay"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-dark)]">
                رقم الهاتف المخصص للتحويل
              </label>
              <input
                type="text"
                value={config.instapayPhone}
                onChange={(e) => setConfig({ ...config, instapayPhone: e.target.value })}
                placeholder="010XXXXXXXX"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--text-dark)]">
                رابط تطبيق انستا باي
              </label>
              <input
                type="text"
                value={config.instapayLink}
                onChange={(e) => setConfig({ ...config, instapayLink: e.target.value })}
                placeholder="https://ipn.eg"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono dir-ltr text-right"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text-dark)]">
                  سعر صرف الدولار (EGP/USD)
                </label>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  محدّث تلقائياً لحظياً
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                required
                value={config.usdToEgpRate}
                onChange={(e) => setConfig({ ...config, usdToEgpRate: parseFloat(e.target.value) || 50.0 })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono dir-ltr text-right"
              />
              <span className="text-[10px] text-stone-500 block mt-1">
                يتم جلب سعر الصرف تلقائياً من أسواق الصرف العالمية لحظة بلحظة دون أي تدخل.
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsLoading}
                className="px-5 py-2.5 rounded-xl bg-[var(--sage-dark)] hover:bg-[var(--text-dark)] text-white text-xs font-bold transition-all shadow-xs"
              >
                {settingsLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "الكل" },
            { id: "pending_verification", label: `بانتظار التأكيد (${pendingCount})` },
            { id: "approved", label: "مؤكد ومفعّل" },
            { id: "rejected", label: "مرفوض" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filter === tab.id
                  ? "bg-[var(--sage-dark)] text-white shadow-2xs"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الإيميل أو العنصر..."
            className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--sage)]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#FAF8F5] border-b border-stone-200 text-stone-600 font-extrabold">
              <tr>
                <th className="px-4 py-3.5">تاريخ الطلب</th>
                <th className="px-4 py-3.5">العميل</th>
                <th className="px-4 py-3.5">العنصر المطلوب</th>
                <th className="px-4 py-3.5">المبلغ</th>
                <th className="px-4 py-3.5">طريقة الدفع</th>
                <th className="px-4 py-3.5">الحالة</th>
                <th className="px-4 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-[var(--sage)]" />
                    <span>جاري تحميل طلبات الشراء...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                    <Receipt size={32} className="mx-auto mb-2 opacity-40" />
                    <span>لا توجد طلبات تطابق هذا التصنيف أو البحث.</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === "pending_verification";
                  const isApproved = order.status === "approved";
                  const isRejected = order.status === "rejected";

                  const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, "") : "";

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        isPending ? "bg-amber-50/25" : ""
                      }`}
                    >
                      {/* Date */}
                      <td className="px-4 py-3.5 text-stone-500 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-stone-700">
                            {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(order.createdAt).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[var(--text-dark)]">{order.customerName}</span>
                          <span className="text-[11px] text-stone-500 font-mono dir-ltr text-right select-all">
                            {order.customerEmail}
                          </span>
                          {order.customerPhone && (
                            <span className="text-[11px] text-emerald-700 font-mono dir-ltr text-right">
                              {order.customerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Item */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[var(--cream)] text-[var(--sage-dark)] flex items-center justify-center shrink-0">
                            {order.itemType === "course" ? (
                              <BookOpen size={13} />
                            ) : order.itemType === "booking" ? (
                              <Calendar size={13} />
                            ) : (
                              <ShoppingBag size={13} />
                            )}
                          </span>
                          <div>
                            <span className="font-bold text-[var(--text-dark)] block">
                              {order.itemTitle}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {order.itemType === "course"
                                ? "دورة تدريبية"
                                : order.itemType === "booking"
                                ? "جلسة استشارية"
                                : "منتج رقمي"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-[var(--sage-dark)]">
                            {order.amountEgp} ج.م
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold">
                            (${order.amountUsd})
                          </span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                          ⚡ انستا باي
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            ⏳ بانتظار التأكيد
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>مؤكد ومفعّل 🌿</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                            <XCircle size={12} />
                            <span>مرفوض</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Approve Button */}
                          {isPending && (
                            <button
                              type="button"
                              disabled={processingId === order.id}
                              onClick={() => handleUpdateStatus(order.id, "approved")}
                              title="تأكيد الدفع وتفعيل المنتج للعميل"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              <span>تأكيد وتفعيل</span>
                            </button>
                          )}

                          {/* WhatsApp Chat Button */}
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              title="مراسلة العميل على واتساب"
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 transition-colors"
                            >
                              <MessageCircle size={15} />
                            </a>
                          )}

                          {/* Reject Button */}
                          {isPending && (
                            <button
                              type="button"
                              disabled={processingId === order.id}
                              onClick={() => handleUpdateStatus(order.id, "rejected")}
                              title="رفض الطلب"
                              className="p-1.5 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-500 hover:text-red-700 transition-colors cursor-pointer"
                            >
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
