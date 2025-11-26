import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#00FFFF] flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-[#000833]" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#00FFFF] bg-clip-text text-transparent">
            Cài đặt FUN PLAY
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Cài đặt ứng dụng lên màn hình chính để truy cập nhanh chóng
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-foreground font-medium">
                Ứng dụng đã được cài đặt!
              </p>
              <Button 
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-[#FFD700] to-[#00FFFF] text-[#000833] hover:opacity-90"
              >
                Về trang chủ
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#FFD700]" />
                  Lợi ích khi cài đặt:
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✨ Truy cập nhanh từ màn hình chính</li>
                  <li>📱 Trải nghiệm như ứng dụng thật</li>
                  <li>🚀 Tải nhanh hơn và hoạt động offline</li>
                  <li>🔔 Nhận thông báo quan trọng</li>
                  <li>💎 Đồng bộ ví Web3 và giao dịch</li>
                </ul>
              </div>

              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-[#FFD700] to-[#00FFFF] text-[#000833] hover:opacity-90"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Cài đặt ngay
                </Button>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Để cài đặt trên điện thoại:
                  </p>
                  <div className="text-left space-y-2 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                    <p className="font-semibold text-foreground">📱 iPhone (Safari):</p>
                    <p>Nhấn nút <strong>Chia sẻ</strong> → <strong>Thêm vào Màn hình chính</strong></p>
                    
                    <p className="font-semibold text-foreground mt-3">🤖 Android (Chrome):</p>
                    <p>Mở menu (⋮) → <strong>Thêm vào Màn hình chính</strong></p>
                  </div>
                  <Button 
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full"
                  >
                    Về trang chủ
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPWA;
