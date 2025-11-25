import { useState, useEffect } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Save } from "lucide-react";

export default function RewardSettings() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    reward_enabled: false,
    reward_token: "CAMLY",
    reward_amount: 9.999,
    min_watch_percentage: 80,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("reward_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setSettings({
          reward_enabled: data.reward_enabled,
          reward_token: data.reward_token,
          reward_amount: Number(data.reward_amount),
          min_watch_percentage: data.min_watch_percentage,
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi tải cài đặt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("reward_settings")
        .update({
          reward_enabled: settings.reward_enabled,
          reward_token: settings.reward_token,
          reward_amount: settings.reward_amount,
          min_watch_percentage: settings.min_watch_percentage,
        })
        .eq("id", (await supabase.from("reward_settings").select("id").single()).data?.id);

      if (error) throw error;

      toast({
        title: "Đã lưu cài đặt",
        description: "Cài đặt phần thưởng đã được cập nhật thành công",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi lưu cài đặt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Gift className="h-8 w-8 text-fun-yellow" />
              Cài đặt phần thưởng xem video
            </h1>
            <p className="text-muted-foreground mt-2">
              Quản lý hệ thống tự động trao thưởng cho người xem video
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cấu hình phần thưởng</CardTitle>
              <CardDescription>
                Thiết lập số tiền và điều kiện để trao thưởng tự động
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Rewards */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reward-enabled" className="text-base font-medium">
                    Bật tính năng thưởng
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tự động trao thưởng khi người dùng xem đủ thời lượng video
                  </p>
                </div>
                <Switch
                  id="reward-enabled"
                  checked={settings.reward_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, reward_enabled: checked })
                  }
                />
              </div>

              {/* Token Selection */}
              <div className="space-y-2">
                <Label htmlFor="token">Loại token thưởng</Label>
                <Select
                  value={settings.reward_token}
                  onValueChange={(value) =>
                    setSettings({ ...settings, reward_token: value })
                  }
                >
                  <SelectTrigger id="token">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAMLY">CAMLY</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reward Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Số lượng thưởng</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.0001"
                  value={settings.reward_amount}
                  onChange={(e) =>
                    setSettings({ ...settings, reward_amount: Number(e.target.value) })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Người dùng sẽ nhận {settings.reward_amount} {settings.reward_token} mỗi video
                </p>
              </div>

              {/* Watch Percentage */}
              <div className="space-y-2">
                <Label htmlFor="percentage">Phần trăm xem tối thiểu (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.min_watch_percentage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      min_watch_percentage: parseInt(e.target.value),
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Người dùng phải xem ít nhất {settings.min_watch_percentage}% video để nhận
                  thưởng
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-fun-yellow text-primary-foreground hover:bg-fun-yellow/90"
                >
                  {saving ? (
                    <>Đang lưu...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu cài đặt
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-fun-yellow/30 bg-fun-yellow/5">
            <CardHeader>
              <CardTitle className="text-base">Lưu ý quan trọng</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                • Người dùng cần kết nối ví MetaMask để nhận thưởng
              </p>
              <p>
                • Mỗi video chỉ được nhận thưởng 1 lần duy nhất
              </p>
              <p>
                • Phần thưởng sẽ được ghi nhận khi người dùng xem đủ {settings.min_watch_percentage}% thời lượng video
              </p>
              <p>
                • Đảm bảo ví admin có đủ token để trao thưởng
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
