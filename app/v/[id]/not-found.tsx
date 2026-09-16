export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="card-soft w-full p-8">
        <h1 className="text-xl font-extrabold">الرابط غير متوفر</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط انتهت صلاحيته أو تم إلغاؤه. تواصل مع الدعم للحصول على رابط جديد.
        </p>
      </div>
    </main>
  );
}
