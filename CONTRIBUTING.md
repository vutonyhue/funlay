# 🤝 Contributing to FUN Play

Cảm ơn bạn đã quan tâm đến việc đóng góp cho FUN Play! Mọi đóng góp, dù lớn hay nhỏ, đều được trân trọng.

## 📋 Mục Lục

- [Quy Tắc Ứng Xử](#-quy-tắc-ứng-xử)
- [Cách Đóng Góp](#-cách-đóng-góp)
- [Bắt Đầu](#-bắt-đầu)
- [Development Workflow](#-development-workflow)
- [Code Style Guidelines](#-code-style-guidelines)
- [Commit Conventions](#-commit-conventions)
- [Pull Request Process](#-pull-request-process)
- [Issue Guidelines](#-issue-guidelines)
- [Edge Functions](#-edge-functions)
- [Database Changes](#-database-changes)
- [Web3 Contributions](#-web3-contributions)
- [Design Guidelines](#-design-guidelines)
- [Cộng Đồng & Hỗ Trợ](#-cộng-đồng--hỗ-trợ)

---

## 📜 Quy Tắc Ứng Xử

Chúng tôi cam kết tạo ra một môi trường thân thiện và tôn trọng cho tất cả mọi người. Vui lòng:

- ✅ Sử dụng ngôn ngữ lịch sự và tôn trọng
- ✅ Chấp nhận các quan điểm và kinh nghiệm khác nhau
- ✅ Tập trung vào những gì tốt nhất cho cộng đồng
- ✅ Thể hiện sự đồng cảm với các thành viên khác
- ❌ Không sử dụng ngôn ngữ xúc phạm hoặc quấy rối
- ❌ Không spam hoặc quảng cáo không liên quan

---

## 🎯 Cách Đóng Góp

Có nhiều cách để đóng góp cho FUN Play:

### 🐛 Báo Lỗi (Bug Reports)

Phát hiện lỗi? Hãy báo cáo để chúng tôi sửa chữa:

1. Kiểm tra xem lỗi đã được báo cáo chưa trong [Issues](../../issues)
2. Nếu chưa, tạo issue mới với template "Bug Report"
3. Cung cấp đầy đủ thông tin để reproduce lỗi

### 💡 Đề Xuất Tính Năng (Feature Requests)

Có ý tưởng mới? Chúng tôi rất muốn nghe:

1. Kiểm tra xem ý tưởng đã được đề xuất chưa
2. Tạo issue mới với template "Feature Request"
3. Mô tả rõ ràng tính năng và lợi ích

### 📝 Cải Thiện Documentation

- Sửa lỗi chính tả, ngữ pháp
- Cập nhật hướng dẫn outdated
- Thêm ví dụ code
- Dịch sang ngôn ngữ khác

### 🔧 Đóng Góp Code

- Fix bugs
- Implement features mới
- Refactor code
- Optimize performance
- Thêm tests

---

## 🚀 Bắt Đầu

### Prerequisites

Đảm bảo bạn đã cài đặt:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** >= 2.30.0
- Code editor (khuyến nghị VS Code)

### Setup Development Environment

```bash
# 1. Fork repository trên GitHub
# Click nút "Fork" ở góc phải trên của repo

# 2. Clone fork về máy
git clone https://github.com/YOUR_USERNAME/funlay.git
cd funlay

# 3. Thêm upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/funlay.git

# 4. Cài đặt dependencies
npm install --legacy-peer-deps

# 5. Copy file environment
cp .env.example .env

# 6. Điền các environment variables cần thiết trong .env

# 7. Khởi động development server
npm run dev
```

### Cập Nhật Fork

```bash
# Fetch changes từ upstream
git fetch upstream

# Merge vào main branch
git checkout main
git merge upstream/main

# Push lên fork của bạn
git push origin main
```

---

## 🔄 Development Workflow

### Branch Naming Convention

Sử dụng format: `<type>/<short-description>`

| Type | Mô Tả | Ví Dụ |
|------|-------|-------|
| `feature/` | Tính năng mới | `feature/nft-minting` |
| `fix/` | Bug fixes | `fix/wallet-connection-error` |
| `docs/` | Documentation | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/video-player` |
| `style/` | UI/CSS changes | `style/dark-mode-fixes` |
| `test/` | Thêm tests | `test/auth-hooks` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `hotfix/` | Critical fixes | `hotfix/security-patch` |

### Workflow Steps

```bash
# 1. Tạo branch mới từ main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 2. Code và commit changes
# (Xem phần Commit Conventions bên dưới)

# 3. Push branch lên fork
git push origin feature/your-feature-name

# 4. Tạo Pull Request trên GitHub
```

### Keep Branch Updated

```bash
# Rebase với main để giữ branch updated
git fetch upstream
git rebase upstream/main

# Nếu có conflicts, resolve và continue
git rebase --continue
```

---

## 📏 Code Style Guidelines

### TypeScript

```typescript
// ✅ Good: Explicit types
interface VideoCardProps {
  title: string;
  channel: string;
  thumbnail?: string;
  viewCount: number;
}

export const VideoCard = ({ title, channel, thumbnail, viewCount }: VideoCardProps) => {
  // ...
};

// ❌ Bad: Implicit any, no interface
export function videoCard({title, channel}) {
  // ...
}
```

### React Components

```typescript
// ✅ Good: Functional component với proper structure
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

export const MyComponent = ({ title, onAction, className }: MyComponentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(() => {
    setIsLoading(true);
    onAction?.();
    setIsLoading(false);
  }, [onAction]);

  return (
    <div className={cn("p-4 rounded-lg bg-card", className)}>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Loading..." : "Click me"}
      </Button>
    </div>
  );
};
```

### File Naming Convention

| Type | Convention | Ví Dụ |
|------|------------|-------|
| Components | PascalCase | `VideoCard.tsx`, `UserProfile.tsx` |
| Hooks | camelCase với prefix "use" | `useAuth.tsx`, `useVideoPlayer.ts` |
| Utils | camelCase | `utils.ts`, `formatDate.ts` |
| Pages | PascalCase | `Watch.tsx`, `Dashboard.tsx` |
| Contexts | PascalCase với suffix "Context" | `AuthContext.tsx` |
| Types | PascalCase | `types.ts` |

### Import Ordering

```typescript
// 1. React imports
import { useState, useEffect, useCallback } from "react";

// 2. Third-party libraries
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// 3. Internal components (UI components first)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 4. Internal components (feature components)
import { VideoCard } from "@/components/Video/VideoCard";
import { Header } from "@/components/Layout/Header";

// 5. Hooks
import { useAuth } from "@/hooks/useAuth";

// 6. Utils & libs
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// 7. Types
import type { Video, Channel } from "@/types";
```

### Tailwind CSS

```tsx
// ✅ Good: Sử dụng semantic tokens từ design system
<div className="bg-background text-foreground border-border">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <Button className="bg-primary text-primary-foreground">Click</Button>
</div>

// ❌ Bad: Hard-coded colors
<div className="bg-[#1a1a2e] text-white border-gray-700">
  <h1 className="text-purple-500">Title</h1>
</div>

// ✅ Good: Sử dụng cn() cho conditional classes
<div className={cn(
  "p-4 rounded-lg",
  isActive && "bg-primary/10",
  className
)}>

// ❌ Bad: String concatenation
<div className={"p-4 rounded-lg " + (isActive ? "bg-primary/10" : "")}>
```

### ESLint Rules

Project sử dụng ESLint với các rules sau:

```javascript
// eslint.config.js
{
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "@typescript-eslint/no-unused-vars": "off"
  }
}
```

Chạy ESLint trước khi commit:

```bash
npm run lint
```

---

## 📝 Commit Conventions

Chúng tôi sử dụng [Conventional Commits](https://www.conventionalcommits.org/) format:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Mô Tả |
|------|-------|
| `feat` | Tính năng mới |
| `fix` | Bug fix |
| `docs` | Thay đổi documentation |
| `style` | Formatting, không ảnh hưởng code logic |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Thêm hoặc sửa tests |
| `build` | Build system hoặc dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance tasks |
| `revert` | Revert commit trước |

### Scopes (Optional)

- `video` - Video player, cards
- `auth` - Authentication
- `web3` - Wallet, tokens
- `ui` - UI components
- `api` - API, Edge Functions
- `db` - Database
- `meditation` - Meditation mode
- `ai` - AI features

### Examples

```bash
# Feature
git commit -m "feat(video): add picture-in-picture support"

# Bug fix
git commit -m "fix(auth): resolve login redirect loop"

# Documentation
git commit -m "docs: update installation instructions"

# Refactoring
git commit -m "refactor(video): extract player controls to separate component"

# Breaking change
git commit -m "feat(api)!: change video upload endpoint response format

BREAKING CHANGE: The upload endpoint now returns { url, id } instead of just url"
```

### Commit Message Guidelines

- ✅ Viết ở thì hiện tại: "add feature" không phải "added feature"
- ✅ Không viết hoa chữ cái đầu description
- ✅ Không kết thúc bằng dấu chấm
- ✅ Giới hạn subject line 72 ký tự
- ✅ Giải thích "what" và "why" trong body nếu cần

---

## 🔀 Pull Request Process

### Trước Khi Tạo PR

#### Checklist

- [ ] Code đã được test locally
- [ ] Không có ESLint errors (`npm run lint`)
- [ ] Build thành công (`npm run build`)
- [ ] Commits tuân theo Conventional Commits format
- [ ] Branch đã được rebase với main mới nhất
- [ ] Đã thêm/update documentation nếu cần
- [ ] Đã thêm tests cho features mới (nếu applicable)

### Tạo Pull Request

1. **Title**: Sử dụng Conventional Commits format
   ```
   feat(video): add queue management feature
   ```

2. **Description**: Sử dụng template sau

```markdown
## 📋 Mô Tả
<!-- Mô tả ngắn gọn những gì PR này thay đổi -->

## 🎯 Loại Thay Đổi
- [ ] 🐛 Bug fix (non-breaking change)
- [ ] ✨ New feature (non-breaking change)
- [ ] 💥 Breaking change
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI update
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvement

## 🔗 Related Issues
<!-- Link đến issues liên quan -->
Closes #123

## 📸 Screenshots (nếu có UI changes)
<!-- Thêm screenshots trước/sau -->

## ✅ Checklist
- [ ] Code đã được self-review
- [ ] Không có console.log() hoặc debug code
- [ ] Responsive trên mobile
- [ ] Dark mode hoạt động đúng
- [ ] Không có TypeScript errors

## 🧪 Cách Test
<!-- Hướng dẫn test changes -->
1. Navigate to /watch
2. Click on video
3. Verify queue appears correctly

## 📝 Notes
<!-- Thông tin bổ sung cho reviewers -->
```

### Review Process

1. **Auto-checks**: CI sẽ chạy linting và build
2. **Code Review**: Ít nhất 1 maintainer sẽ review
3. **Feedback**: Address comments và push fixes
4. **Approval**: Sau khi approved, maintainer sẽ merge

### Merge Requirements

- ✅ Tất cả CI checks pass
- ✅ Ít nhất 1 approval từ maintainer
- ✅ Không có unresolved conversations
- ✅ Branch up-to-date với main

---

## 📋 Issue Guidelines

### Bug Report Template

```markdown
## 🐛 Bug Report

### Describe the bug
<!-- Mô tả rõ ràng bug -->

### Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

### Expected behavior
<!-- Mô tả behavior mong đợi -->

### Screenshots
<!-- Nếu applicable, thêm screenshots -->

### Environment
- OS: [e.g. Windows 11, macOS 14]
- Browser: [e.g. Chrome 120, Safari 17]
- Device: [e.g. Desktop, iPhone 15]

### Additional context
<!-- Thông tin bổ sung -->
```

### Feature Request Template

```markdown
## 💡 Feature Request

### Is your feature request related to a problem?
<!-- Mô tả vấn đề bạn gặp -->
A clear description of the problem. Ex. I'm frustrated when...

### Describe the solution you'd like
<!-- Mô tả giải pháp bạn muốn -->

### Describe alternatives you've considered
<!-- Các giải pháp thay thế đã xem xét -->

### Additional context
<!-- Screenshots, mockups, references -->
```

### Question Template

```markdown
## ❓ Question

### What's your question?
<!-- Câu hỏi của bạn -->

### What have you tried?
<!-- Những gì bạn đã thử -->

### Additional context
<!-- Context bổ sung -->
```

---

## ⚡ Edge Functions

### Structure

```
supabase/functions/
├── function-name/
│   └── index.ts      # Main function file
```

### Template

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { param1, param2 } = await req.json();

    // Your logic here

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### Guidelines

- ✅ Always handle CORS
- ✅ Validate input parameters
- ✅ Use proper error handling
- ✅ Log errors for debugging
- ✅ Return consistent response format
- ❌ Don't expose sensitive information in errors
- ❌ Don't hardcode secrets (use environment variables)

### Testing Locally

```bash
# Start Supabase locally (nếu có Supabase CLI)
supabase start

# Test function
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Content-Type: application/json" \
  -d '{"param1": "value1"}'
```

---

## 🗄️ Database Changes

### Migration Guidelines

1. **Tạo migration file** với SQL statements
2. **Include RLS policies** cho mọi table mới
3. **Test locally** trước khi commit
4. **Document changes** trong commit message

### RLS Policy Template

```sql
-- Enable RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Read policy (authenticated users can read their own data)
CREATE POLICY "Users can view own data"
ON public.your_table
FOR SELECT
USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert own data"
ON public.your_table
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users can update own data"
ON public.your_table
FOR UPDATE
USING (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete own data"
ON public.your_table
FOR DELETE
USING (auth.uid() = user_id);
```

### Schema Documentation

Khi thêm table mới, update README.md với:
- Table name và purpose
- Column descriptions
- Relationships
- RLS status

---

## 🔗 Web3 Contributions

### Token Configuration

Tokens được cấu hình trong `src/config/tokens.ts`:

```typescript
export const SUPPORTED_TOKENS: TokenConfig[] = [
  {
    symbol: "NEW_TOKEN",
    name: "New Token Name",
    address: "0x...",
    decimals: 18,
    icon: "/path/to/icon.png",
  },
];
```

### Network Configuration

Network settings trong `src/lib/web3Config.ts`:

```typescript
export const SUPPORTED_CHAINS = [bsc, bscTestnet];
```

### Guidelines

- ✅ Test trên testnet trước
- ✅ Verify contract addresses
- ✅ Handle network switching
- ✅ Proper error handling cho wallet operations
- ❌ Never commit private keys

---

## 🎨 Design Guidelines

### Color Palette (Cosmic Theme)

Sử dụng CSS variables từ `src/index.css`:

```css
/* Primary colors */
--primary: 270 70% 60%;        /* Purple */
--secondary: 210 100% 60%;     /* Blue */
--accent: 280 100% 70%;        /* Pink */

/* Background */
--background: 240 20% 4%;      /* Dark space */
--foreground: 0 0% 95%;        /* Light text */

/* Muted */
--muted: 240 10% 15%;
--muted-foreground: 240 5% 65%;
```

### Component Styling

```tsx
// Sử dụng semantic classes
<Card className="bg-card border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">
      Description
    </CardDescription>
  </CardHeader>
</Card>
```

### Animation Guidelines

Sử dụng Framer Motion cho animations:

```tsx
import { motion } from "framer-motion";

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>

// Scale on hover
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

### Accessibility (a11y)

- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Alt text cho images
- ✅ ARIA labels cho interactive elements
- ✅ Keyboard navigation support
- ✅ Sufficient color contrast
- ✅ Focus indicators

---

## 💬 Cộng Đồng & Hỗ Trợ

### Kênh Liên Lạc

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Q&A, ideas
- **Discord**: Real-time chat (nếu có)

### Nhận Hỗ Trợ

1. Đọc documentation trước
2. Search existing issues
3. Nếu không tìm thấy, tạo issue mới với đầy đủ context

### Response Time

- **Issues**: 1-3 ngày làm việc
- **PRs**: 3-7 ngày làm việc (tùy complexity)

---

## 🏆 Recognition

Chúng tôi đánh giá cao mọi đóng góp! Contributors sẽ được:

- Listed trong README.md Contributors section
- Mentioned trong release notes
- Badges cho significant contributions

### Contributor Types

- 💻 **Code**: Bug fixes, features
- 📖 **Documentation**: Docs improvements
- 🎨 **Design**: UI/UX contributions
- 🐛 **Bug Reports**: Quality bug reports
- 💡 **Ideas**: Feature suggestions
- 🔍 **Review**: Code reviews

---

## ❓ FAQ

### Q: Tôi cần permission gì để contribute?

A: Không cần permission! Fork repo và submit PR.

### Q: PR của tôi bị reject thì sao?

A: Đừng nản! Reviewer sẽ explain lý do. Bạn có thể update và re-submit.

### Q: Tôi có thể work trên nhiều issues cùng lúc không?

A: Có thể, nhưng khuyến khích focus vào 1-2 issues để đảm bảo chất lượng.

### Q: Làm sao biết issue nào nên pick?

A: Issues với label `good first issue` phù hợp cho newcomers.

---

## 📄 License

Bằng việc contribute, bạn đồng ý rằng contributions của bạn sẽ được license theo [MIT License](LICENSE).

---

<div align="center">

**Cảm ơn bạn đã đóng góp cho FUN Play! 🚀**

Made with ❤️ by the FUN Play Community

</div>
