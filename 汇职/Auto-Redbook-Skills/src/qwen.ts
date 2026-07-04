import type { ShareDraft } from "./types";

const API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";

const fallbackDraft: ShareDraft = {
  title: "在深圳学车真省心",
  body:
    "最近在深圳汇职驾校练车，体验比我想象中轻松很多。\n\n教练讲得比较细，路线和动作会拆开说，新手也不会太有压力。训练场安排也清楚，适合想高效学车的人。\n\n如果你也在深圳准备报名驾校，可以先去了解一下，少走一点弯路。",
  tags: ["深圳驾校", "深圳学车", "汇职驾校", "驾考经验", "新手学车", "小红书学车"],
  materialType: "image",
  style: "real_experience",
  cta: "想了解报名可以去咨询一下",
};

function getPrompt(source: string, campaign: string): string {
  return `你是小红书本地生活内容运营专家。请为“深圳汇职驾校”的线下分享活动生成一条用户可直接发布的小红书笔记。

活动来源：${source || "扫码或NFC进入"}
活动名称：${campaign || "汇职驾校分享奖励活动"}

要求：
1. 标题不超过 20 个中文字符。
2. 正文像真实学员分享，不要像硬广。
3. 内容突出深圳、本地学车、驾校服务、练车体验、报名咨询。
4. 正文分段清晰，语气自然，适合移动端阅读。
5. 生成 5-8 个小红书标签，不要包含 # 符号。
6. materialType 只能是 image 或 video，优先 image。
7. style 只能是 real_experience、promotion、student_story、exam_tips 之一。
8. 不要使用“包过”“最快拿证”“百分百通过”等高风险承诺。
9. 返回严格 JSON，不要输出 Markdown，不要解释。

JSON 格式：
{
  "title": "20字以内的小红书标题",
  "body": "适合用户直接发布的小红书正文",
  "tags": ["深圳驾校", "学车", "汇职驾校"],
  "materialType": "image",
  "style": "real_experience",
  "cta": "评论区或私信了解报名"
}`;
}

function stripCodeFence(content: string): string {
  return content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function normalizeDraft(raw: Partial<ShareDraft>): ShareDraft {
  return {
    title: String(raw.title || fallbackDraft.title).slice(0, 20),
    body: String(raw.body || fallbackDraft.body),
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags.map(String).slice(0, 8) : fallbackDraft.tags,
    materialType: raw.materialType === "video" ? "video" : "image",
    style:
      raw.style === "promotion" || raw.style === "student_story" || raw.style === "exam_tips"
        ? raw.style
        : "real_experience",
    cta: String(raw.cta || fallbackDraft.cta),
  };
}

export async function generateShareDraft(params: { source: string; campaign: string }): Promise<ShareDraft> {
  const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY;
  const model = import.meta.env.VITE_DASHSCOPE_MODEL || "qwen-plus";

  if (!apiKey) {
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    return fallbackDraft;
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "你只输出可解析的 JSON。内容必须自然、真实、合规。",
        },
        {
          role: "user",
          content: getPrompt(params.source, params.campaign),
        },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`通义千问请求失败：${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("通义千问返回内容为空");
  }

  return normalizeDraft(JSON.parse(stripCodeFence(content)));
}
