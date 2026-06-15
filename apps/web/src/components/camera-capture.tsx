import { useRef, useState, useCallback, useEffect } from "react";
import { SwitchCamera, CameraOff, Aperture } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type FacingMode = "environment" | "user";

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "denied">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode: FacingMode) => {
      stopStream();
      setStatus("loading");
      setErrorMsg("");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");
      } catch (err: unknown) {
        const e = err as DOMException;
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setStatus("denied");
          setErrorMsg("Izin kamera ditolak. Buka pengaturan untuk mengizinkan akses kamera.");
        } else if (e.name === "NotFoundError") {
          setStatus("error");
          setErrorMsg("Kamera tidak ditemukan pada perangkat ini.");
        } else if (e.name === "NotReadableError") {
          setStatus("error");
          setErrorMsg("Kamera sedang digunakan oleh aplikasi lain.");
        } else {
          setStatus("error");
          setErrorMsg(`Gagal mengakses kamera: ${e.message}`);
        }
      }
    },
    [stopStream],
  );

  // Start camera on mount
  useEffect(() => {
    startCamera(facingMode);
    return () => stopStream();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFacing = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    canvas.width = vw;
    canvas.height = vh;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, vw, vh);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Viewfinder */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] max-h-[420px]">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Membuka kamera...</span>
            </div>
          </div>
        )}

        {(status === "error" || status === "denied") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <CameraOff className="text-red-400" size={40} />
              <p className="text-sm text-red-300">{errorMsg}</p>
              <Button
                variant="outline"
                className="h-9 px-3 text-sm text-white border-white/30 hover:bg-white/10"
                onClick={() => startCamera(facingMode)}
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${status === "ready" ? "opacity-100" : "opacity-0"}`}
        />

        {/* Scan area overlay */}
        {status === "ready" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/20" />
            <div
              className="relative flex items-center justify-center"
              style={{ width: "70%", height: "75%" }}
            >
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-lime-300" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-lime-300" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-lime-300" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-lime-300" />
              <div className="text-white text-center flex flex-col gap-1">
                <span className="text-xs font-semibold tracking-widest">
                  AREA SCAN
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 w-full">
        <Button
          variant="outline"
          className="rounded-full h-12 w-12 p-0"
          onClick={onClose}
          title="Tutup kamera"
        >
          <CameraOff size={20} />
        </Button>

        <Button
          className="rounded-full h-16 w-16 p-0 bg-white border-4 border-green-500 hover:bg-green-50"
          onClick={handleCapture}
          disabled={status !== "ready"}
          title="Ambil foto"
        >
          <Aperture className="text-green-600" size={32} />
        </Button>

        <Button
          variant="outline"
          className="rounded-full h-12 w-12 p-0"
          onClick={toggleFacing}
          title="Ganti kamera"
        >
          <SwitchCamera size={20} />
        </Button>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
