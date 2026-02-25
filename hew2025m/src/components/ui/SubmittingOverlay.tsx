import { Loader2 } from 'lucide-react';

interface SubmittingOverlayProps {
  message: string;
}

export default function SubmittingOverlay({ message }: SubmittingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center">
      <p className="text-white text-xl font-bold mb-6">{message}</p>
      <Loader2 className="h-12 w-12 text-white animate-spin" />
    </div>
  );
}
