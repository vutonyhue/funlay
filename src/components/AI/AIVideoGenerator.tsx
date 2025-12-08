import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, X, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GeneratedContent {
  title: string;
  description: string;
  tags: string[];
}

interface AIVideoGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (content: GeneratedContent) => void;
}

export const AIVideoGenerator = ({ open, onOpenChange, onApply }: AIVideoGeneratorProps) => {
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateContent = async () => {
    if (!idea.trim()) {
      toast.error("Vui lòng nhập ý tưởng video");
      return;
    }

    setIsLoading(true);
    setGenerated(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Bạn là chuyên gia sáng tạo nội dung video. Dựa trên ý tưởng sau, hãy tạo:
1. Tiêu đề video hấp dẫn (tối đa 100 ký tự)
2. Mô tả video chi tiết (200-300 từ)  
3. 8-10 hashtags phù hợp

Ý tưởng: "${idea}"

Trả lời theo định dạng JSON:
{
  "title": "tiêu đề video",
  "description": "mô tả chi tiết",
  "tags": ["tag1", "tag2", "tag3"]
}`
            }
          ]
        }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullContent += content;
              } catch {}
            }
          }
        }
      }

      // Parse JSON from response
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setGenerated({
          title: parsed.title || "",
          description: parsed.description || "",
          tags: parsed.tags || []
        });
        toast.success("Đã tạo nội dung thành công!");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Lỗi tạo nội dung. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Đã copy!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApply = () => {
    if (generated && onApply) {
      onApply(generated);
      onOpenChange(false);
      toast.success("Đã áp dụng nội dung!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-[#00E7FF] to-[#FFD700]">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent font-bold">
              AI Video Content Generator
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Mô tả ý tưởng video của bạn
            </label>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="VD: Video hướng dẫn cách kiếm tiền với crypto cho người mới bắt đầu, giọng nói vui vẻ, dễ hiểu..."
              className="min-h-[100px] border-[#00E7FF]/30 focus:border-[#00E7FF]"
            />
          </div>

          <Button
            onClick={generateContent}
            disabled={isLoading || !idea.trim()}
            className="w-full bg-gradient-to-r from-[#00E7FF] to-[#FFD700] hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo nội dung...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Tạo nội dung với AI
              </>
            )}
          </Button>

          {/* Generated Content */}
          <AnimatePresence>
            {generated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 pt-4 border-t border-border"
              >
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#00E7FF]">Tiêu đề</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generated.title, "title")}
                    >
                      {copiedField === "title" ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-[#00E7FF]/5 border border-[#00E7FF]/20">
                    <p className="font-medium">{generated.title}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#00E7FF]">Mô tả</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generated.description, "description")}
                    >
                      {copiedField === "description" ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-[#00E7FF]/5 border border-[#00E7FF]/20 max-h-[150px] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{generated.description}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#FFD700]">Hashtags</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generated.tags.map(t => `#${t}`).join(" "), "tags")}
                    >
                      {copiedField === "tags" ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generated.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-full bg-gradient-to-r from-[#00E7FF]/10 to-[#FFD700]/10 border border-[#FFD700]/30 text-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {onApply && (
                  <Button
                    onClick={handleApply}
                    className="w-full bg-gradient-to-r from-[#FFD700] to-[#FF9500] text-white hover:opacity-90"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Áp dụng nội dung
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
