export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin ${className}`}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner />
    </div>
  )
}
