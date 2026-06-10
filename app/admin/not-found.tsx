import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy trang admin</h1>
      <p className="mt-2 text-sm text-slate-500">Trang bạn tìm kiếm không tồn tại trong khu vực quản trị.</p>
      <Link href="/admin" className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
        Quay về dashboard
      </Link>
    </div>
  );
}
