import type { MockAsset, ShareDraft } from "./types";

export const mockAssets: MockAsset[] = [
  {
    id: "training-field",
    type: "image",
    title: "训练场实拍风",
    keywords: ["练车", "训练场", "科目二", "学车"],
    url: "/mock-assets/training-field.png",
    tone: "轻松、有行动感",
  },
  {
    id: "coach-car",
    type: "image",
    title: "教练车场景",
    keywords: ["教练", "服务", "上车", "陪练"],
    url: "/mock-assets/coach-car.png",
    tone: "温暖、可信赖",
  },
  {
    id: "student-practice",
    type: "image",
    title: "学员体验感",
    keywords: ["学员", "体验", "新手", "报名"],
    url: "/mock-assets/student-practice.png",
    tone: "真实、像朋友分享",
  },
  {
    id: "license-success",
    type: "image",
    title: "拿证结果感",
    keywords: ["拿证", "考试", "通过", "科目三"],
    url: "/mock-assets/license-success.png",
    tone: "积极、有结果感",
  },
  {
    id: "activity-video",
    type: "video",
    title: "活动短视频占位",
    keywords: ["活动", "优惠", "报名", "福利"],
    url: "/mock-assets/activity-poster.svg",
    tone: "活动感、适合首屏",
  },
];

export function selectAsset(draft: ShareDraft, cursor = 0): MockAsset {
  const text = `${draft.title} ${draft.body} ${draft.tags.join(" ")}`;
  const candidates = mockAssets
    .filter((asset) => asset.type === draft.materialType || draft.materialType === "image")
    .map((asset) => ({
      asset,
      score: asset.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  const ranked = candidates.length > 0 ? candidates : mockAssets.map((asset) => ({ asset, score: 0 }));
  return ranked[cursor % ranked.length].asset;
}
