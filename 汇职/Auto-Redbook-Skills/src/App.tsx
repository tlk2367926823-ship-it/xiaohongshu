import { Check, ChevronRight, Clipboard, Gift, Loader2, RefreshCw, Send, Share2, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { mockAssets, selectAsset } from "./mockAssets";
import { CopyPublisher, DeeplinkPublisher, MockPublisher, NativeSharePublisher } from "./publishers";
import { generateShareDraft } from "./qwen";
import type { AppStep, MockAsset, ShareDraft } from "./types";

const progressSteps = ["分析活动入口", "生成小红书标题", "匹配分享素材", "整理发布草稿"];

function useCampaign() {
  return useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return {
      source: search.get("source") || "nfc",
      campaign: search.get("campaign") || "huizhi-share",
    };
  }, []);
}

function formatCopy(draft: ShareDraft) {
  return `${draft.title}\n\n${draft.body}\n\n${draft.tags.map((tag) => `#${tag}`).join(" ")}`;
}

export default function App() {
  const campaign = useCampaign();
  const [step, setStep] = useState<AppStep>("intro");
  const [draft, setDraft] = useState<ShareDraft | null>(null);
  const [asset, setAsset] = useState<MockAsset>(mockAssets[0]);
  const [assetCursor, setAssetCursor] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  async function handleGenerate() {
    setStep("generating");
    setError("");
    setCopied(false);
    setLoadingIndex(0);

    const timer = window.setInterval(() => {
      setLoadingIndex((index) => Math.min(index + 1, progressSteps.length - 1));
    }, 520);

    try {
      const generated = await generateShareDraft(campaign);
      const selected = selectAsset(generated, 0);
      setDraft(generated);
      setAsset(selected);
      setAssetCursor(0);
      window.setTimeout(() => setStep("result"), 450);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试");
    } finally {
      window.clearInterval(timer);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    const publisher = new CopyPublisher();
    const result = await publisher.publish({
      title: draft.title,
      body: draft.body,
      tags: draft.tags,
      assets: [asset.url],
    });
    setCopied(result.success);
  }

  function switchAsset() {
    if (!draft) return;
    const nextCursor = assetCursor + 1;
    setAsset(selectAsset(draft, nextCursor));
    setAssetCursor(nextCursor);
  }

  async function openRedbook() {
    await copyDraft();
    await new DeeplinkPublisher().publish({
      title: draft?.title || "",
      body: draft?.body || "",
      tags: draft?.tags || [],
      assets: [asset.url],
    });
  }

  async function nativeShareToRedbook() {
    if (!draft) return;
    setPublishMessage("");

    try {
      const result = await new NativeSharePublisher().publish({
        title: draft.title,
        body: draft.body,
        tags: draft.tags,
        assets: [asset.url],
      });
      setPublishMessage(result.message || "已调起系统分享");
    } catch (err) {
      const message = err instanceof Error ? err.message : "系统分享失败，请使用备用发布方式";
      setPublishMessage(message);
    }
  }

  async function finishPublish() {
    setPublished(false);
    const result = await new MockPublisher().publish({
      title: draft?.title || "",
      body: draft?.body || "",
      tags: draft?.tags || [],
      assets: [asset.url],
    });
    setPublished(result.success);
    setStep("reward");
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        <header className="topbar">
          <div>
            <span className="eyebrow">深圳汇职驾校</span>
            <strong>小红书分享活动</strong>
          </div>
          <div className="source-pill">{campaign.source === "qrcode" ? "扫码进入" : "NFC碰一碰"}</div>
        </header>

        {step === "intro" && (
          <section className="screen intro-screen">
            <div className="hero-media">
              <img src="/mock-assets/activity-poster.svg" alt="深圳汇职驾校活动主视觉" />
              <div className="hero-badge">
                <Sparkles size={16} />
                AI 自动生成
              </div>
            </div>

            <div className="hero-copy">
              <h1>1分钟生成你的学车分享</h1>
              <p>系统会自动写好小红书标题、正文和标签，并匹配活动素材。你只需要确认、复制、去发布。</p>
            </div>

            <div className="benefit-grid">
              <div>
                <strong>少操作</strong>
                <span>一键生成草稿</span>
              </div>
              <div>
                <strong>像真人</strong>
                <span>真实学员口吻</span>
              </div>
              <div>
                <strong>有奖励</strong>
                <span>发布后到店领取</span>
              </div>
            </div>
          </section>
        )}

        {step === "generating" && (
          <section className="screen generating-screen">
            <div className="orbital-loader">
              <Loader2 size={44} />
            </div>
            <h2>正在准备你的分享草稿</h2>
            <p>通义千问正在结合深圳本地学车场景生成内容。</p>

            <div className="progress-card">
              {progressSteps.map((item, index) => (
                <div className={`progress-row ${index <= loadingIndex ? "active" : ""}`} key={item}>
                  <span>{index < loadingIndex ? <Check size={15} /> : index + 1}</span>
                  {item}
                </div>
              ))}
            </div>

            {error && (
              <div className="error-box">
                <strong>生成遇到问题</strong>
                <span>{error}</span>
                <button onClick={handleGenerate}>重新生成</button>
              </div>
            )}
          </section>
        )}

        {step === "result" && draft && (
          <section className="screen result-screen">
            <div className="preview-card">
              <img src={asset.url} alt={asset.title} />
              <div className="asset-caption">
                <span>{asset.title}</span>
                <button onClick={switchAsset}>
                  <RefreshCw size={15} />
                  换一组
                </button>
              </div>
            </div>

            <article className="draft-card">
              <span className="eyebrow">生成结果</span>
              <h2>{draft.title}</h2>
              <p>{draft.body}</p>
              <div className="tag-list">
                {draft.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </article>

            <div className="action-row">
              <button className="secondary-button" onClick={copyDraft}>
                <Clipboard size={18} />
                {copied ? "已复制" : "复制文案"}
              </button>
              <button className="secondary-button" onClick={handleGenerate}>
                <Wand2 size={18} />
                重新生成
              </button>
            </div>
          </section>
        )}

        {step === "publish" && draft && (
          <section className="screen publish-screen">
            <div className="publish-hero">
              <Share2 size={30} />
              <h2>手机端一键分享到小红书</h2>
              <p>客户试用时请用手机打开活动页，点击下方按钮调起系统分享面板，再选择小红书。电脑网页不支持跨站自动填入。</p>
            </div>

            <div className="publish-steps">
              <button className="recommended-step" onClick={nativeShareToRedbook}>
                <Share2 size={20} />
                <span>手机一键分享到小红书</span>
                <ChevronRight size={18} />
              </button>
              <div className="support-note">
                手机端会调用系统分享能力；如果小红书 App 不接收文字，系统会自动保留备用发布方式。
              </div>
              <button onClick={copyDraft}>
                <Clipboard size={20} />
                <span>{copied ? "文案已复制" : "复制小红书文案"}</span>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => window.open(asset.url, "_blank", "noopener,noreferrer")}>
                <Sparkles size={20} />
                <span>查看匹配素材</span>
                <ChevronRight size={18} />
              </button>
              <button onClick={openRedbook}>
                <Send size={20} />
                <span>电脑备用：复制并打开发布页</span>
                <ChevronRight size={18} />
              </button>
            </div>

            {publishMessage && <div className="publish-message">{publishMessage}</div>}

            <button className="done-button" onClick={finishPublish}>我已发布，领取奖励</button>
          </section>
        )}

        {step === "reward" && (
          <section className="screen reward-screen">
            <div className="reward-card">
              <div className="reward-icon">
                <Gift size={42} />
              </div>
              <span className="eyebrow">{published ? "发布完成" : "活动奖励"}</span>
              <h2>请向前台或教练出示此页面</h2>
              <p>工作人员确认发布内容后，将为你登记活动奖励。感谢你分享深圳汇职驾校的学车体验。</p>
              <div className="reward-code">HZ-{new Date().getFullYear()}-{campaign.source.toUpperCase()}</div>
            </div>
          </section>
        )}

        <footer className="bottom-cta">
          {step === "intro" && (
            <button className="primary-button" onClick={handleGenerate}>
              立即发布
              <ChevronRight size={20} />
            </button>
          )}
          {step === "result" && (
            <button className="primary-button" onClick={() => setStep("publish")}>
              打开发布界面
              <ChevronRight size={20} />
            </button>
          )}
          {step === "reward" && (
            <button className="primary-button" onClick={() => setStep("intro")}>
              返回活动首页
              <ChevronRight size={20} />
            </button>
          )}
        </footer>
      </div>

      <aside className="desktop-note">
        <strong>Mobile Web App Preview</strong>
        <span>请使用手机尺寸查看最佳体验。</span>
        <textarea readOnly value={draft ? formatCopy(draft) : "生成后这里会同步展示可复制文案。"} />
      </aside>
    </main>
  );
}
