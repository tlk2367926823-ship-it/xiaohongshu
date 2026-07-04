import type { PublishPayload, PublishResult, Publisher } from "./types";

function getShareText(payload: PublishPayload) {
  return `${payload.body}\n\n${payload.tags.map((tag) => `#${tag}`).join(" ")}`;
}

function getFileName(url: string) {
  const cleanUrl = url.split("?")[0];
  return cleanUrl.split("/").pop() || "huizhi-share.png";
}

async function assetToFile(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("素材读取失败");
  }

  const blob = await response.blob();
  const mime = blob.type || "image/png";
  return new File([blob], getFileName(url), { type: mime });
}

export class CopyPublisher implements Publisher {
  async publish(payload: PublishPayload): Promise<PublishResult> {
    const text = `${payload.title}\n\n${payload.body}\n\n${payload.tags.map((tag) => `#${tag}`).join(" ")}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true, mode: "copy", message: "文案已复制" };
    }

    return { success: false, mode: "copy", message: "当前浏览器不支持自动复制" };
  }
}

export class DeeplinkPublisher implements Publisher {
  async publish(_payload: PublishPayload): Promise<PublishResult> {
    window.open("https://creator.xiaohongshu.com/publish/publish?source=official", "_blank", "noopener,noreferrer");
    return { success: true, mode: "deeplink", message: "已打开小红书发布界面" };
  }
}

export class NativeSharePublisher implements Publisher {
  async publish(payload: PublishPayload): Promise<PublishResult> {
    if (!navigator.share) {
      return { success: false, mode: "native-share", message: "当前浏览器不支持系统分享" };
    }

    const files = await Promise.all(payload.assets.map(assetToFile));
    const shareData: ShareData = {
      title: payload.title,
      text: getShareText(payload),
      files,
    };

    if (files.length > 0 && navigator.canShare && !navigator.canShare({ files })) {
      await navigator.share({
        title: payload.title,
        text: `${payload.title}\n\n${getShareText(payload)}`,
      });
      return { success: true, mode: "native-share", message: "已调起系统分享，素材需手动选择" };
    }

    await navigator.share(shareData);
    return { success: true, mode: "native-share", message: "已调起系统分享" };
  }
}

export class MockPublisher implements Publisher {
  async publish(_payload: PublishPayload): Promise<PublishResult> {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    return { success: true, mode: "mock", message: "模拟发布完成" };
  }
}
