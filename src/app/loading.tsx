export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-border rounded-full mx-auto mb-6"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
        </div>
        <p className="text-text-secondary animate-pulse">加载中...</p>
      </div>
    </div>
  );
}
