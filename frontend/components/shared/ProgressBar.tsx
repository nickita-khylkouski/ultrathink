interface ProgressBarProps {
  progress?: number; // 0-100, if undefined shows indeterminate
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full h-1 bg-panel rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ${
          progress === undefined ? 'animate-progress' : ''
        }`}
        style={{
          width: progress !== undefined ? `${progress}%` : '70%',
        }}
      />
    </div>
  );
}
