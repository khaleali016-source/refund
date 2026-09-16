import { db } from "./supabase";

export async function auditLog(action: string, actor = "System", details: unknown = {}) {
  await db().from("admin_audit_logs").insert({ action, actor, details });
}

export function actionLabel(action: string): string {
  switch (action) {
    case "settings.updated": return "تحديث الإعدادات";
    case "telegram.test_success": return "اختبار اتصال ناجح";
    case "telegram.test_failed": return "اختبار اتصال فاشل";
    case "link_ttl.updated": return "تحديث مدة صلاحية الروابط";
    case "ui_flag.amount_input_updated": return "تحديث ظهور حقل المبلغ";
    case "profile.created": return "إنشاء ملف عميل";
    case "profile.extended": return "تمديد صلاحية رابط";
    case "profile.cancelled": return "إلغاء رابط";
    case "profile.deleted": return "حذف ملفات محددة";
    case "refund.notified": return "إشعار طلب استرجاع";
    case "refund.notify_failed": return "فشل إشعار طلب استرجاع";
    case "otp.notified": return "إشعار رمز تحقق";
    case "otp.notify_failed": return "فشل إشعار رمز تحقق";
    case "profile.notified": return "إشعار من صفحة العميل";
    case "profile.notify_failed": return "فشل إشعار من صفحة العميل";
    case "profile.visited": return "زيارة رابط عميل";
    case "profile.visit_failed": return "فشل إشعار زيارة رابط";
    case "admin.login_success": return "دخول ناجح";
    case "admin.login_failed": return "محاولة دخول فاشلة";
    default: return action;
  }
}
