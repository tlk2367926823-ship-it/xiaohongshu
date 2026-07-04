import type { MockAsset, ShareDraft } from "./types";

export interface XhsHandoffDraft {
  title: string;
  body: string;
  tags: string[];
  assetUrl: string;
  assetTitle: string;
}

export function buildXhsHandoffUrl(draft: ShareDraft, asset: MockAsset) {
  const payload: XhsHandoffDraft = {
    title: draft.title,
    body: draft.body,
    tags: draft.tags,
    assetUrl: new URL(asset.url, window.location.origin).toString(),
    assetTitle: asset.title,
  };

  const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(payload)))));
  return `https://creator.xiaohongshu.com/publish/publish?source=official&from=huizhi#huizhiDraft=${encoded}`;
}

export function formatXhsBody(draft: ShareDraft) {
  return `${draft.body}\n\n${draft.tags.map((tag) => `#${tag}`).join(" ")}`;
}
