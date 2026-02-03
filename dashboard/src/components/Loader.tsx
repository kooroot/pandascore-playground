export function Loader({ text = "데이터 로딩 중..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
      <span className="text-sm text-text-dim">{text}</span>
    </div>
  );
}

export function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-loss/30 bg-loss/5 p-8 text-center">
      <p className="text-sm text-loss">{message}</p>
    </div>
  );
}
