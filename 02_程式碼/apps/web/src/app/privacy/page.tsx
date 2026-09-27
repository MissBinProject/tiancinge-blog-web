import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { loadSettings } from '@/lib/data';
import { buildSeoMetadata } from '@/lib/seo-metadata';

const description = '說明天心閣養生會館蒐集、處理及利用個人資料的方式，以及您可行使的個人資料權利。';

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSettings();
  return buildSeoMetadata({ title: `隱私權政策｜${site.brandName}`, description, path: '/privacy', siteName: site.brandName, imageUrl: site.ogImageUrl });
}

export default async function Privacy() {
  const site = await loadSettings();
  return <><Header siteSettings={site} /><main id="main-content" tabIndex={-1} className="policy-page">
    <article className="policy-document container">
      <header className="policy-heading"><span className="eyebrow">PRIVACY POLICY</span><h1>隱私權政策</h1><p>生效日期：2026 年 9 月 19 日</p></header>
      <p>{site.brandName}（以下稱「本會館」）重視您的個人資料與隱私。本政策依中華民國個人資料保護法，說明您使用本網站、填寫聯絡表單或與本會館聯繫時，個人資料的蒐集、處理及利用方式。</p>
      <section><h2>一、適用範圍與蒐集者</h2><p>本政策適用於本會館營運的官方網站及網站聯絡表單。透過 LINE、Instagram、Facebook、YouTube、Google 地圖或其他第三方網站進行的活動，另適用該服務提供者的隱私政策。</p><dl><div><dt>蒐集者</dt><dd>{site.brandName}</dd></div><div><dt>營業地址</dt><dd>{site.address}</dd></div><div><dt>聯絡電話</dt><dd><a href={`tel:${site.phone}`}>{site.phone}</a></dd></div></dl></section>
      <section><h2>二、蒐集目的與資料類別</h2><p>我們僅在提供服務所需的範圍內蒐集資料：</p><ul><li><strong>聯絡與預約：</strong>姓名、電話、選填的電子郵件、留言內容，以及後續聯繫與處理紀錄。</li><li><strong>網站安全與防止濫用：</strong>IP 位址或其雜湊識別碼、請求時間、瀏覽器與裝置傳送的基本連線紀錄。</li><li><strong>依法處理爭議：</strong>為回應申訴、保障權利或履行法定義務所必要的往來紀錄。</li></ul><p>請勿在一般留言欄填寫病歷、診斷、健康檢查結果或其他非預約所必需的敏感資料。如需說明特殊身體狀況，請先透過電話與本會館確認適合的聯繫方式。</p></section>
      <section><h2>三、資料利用的期間、地區、對象及方式</h2><dl><div><dt>期間</dt><dd>自資料取得起，保存至聯絡、預約或服務目的完成，或法定保存期間屆滿為止。若為保障權利、處理爭議或履行法定義務所必要，得於必要期間內繼續保存；目的消失或期限屆滿後將刪除或停止利用。</dd></div><div><dt>地區</dt><dd>主要於臺灣使用。因網站採用雲端服務，資料可能依服務供應商的基礎設施於其他國家或地區儲存或處理。</dd></div><div><dt>對象</dt><dd>本會館經授權的工作人員，以及受委託提供網站託管、資料儲存、安全維護等服務的供應商。除法令要求、保障權益或取得您的同意外，不會提供給其他第三人。</dd></div><div><dt>方式</dt><dd>以自動化或非自動化方式進行蒐集、儲存、查詢、聯繫、回覆、服務安排、安全防護及必要的內部管理。</dd></div></dl></section>
      <section><h2>四、第三方與雲端服務</h2><p>本網站目前使用 Firebase／Google Cloud 提供網站託管、資料庫與檔案儲存，並可能嵌入 Google 地圖及 YouTube 內容。當您載入嵌入內容或前往 LINE、Instagram、Facebook、YouTube 等外部服務時，第三方可能依其政策取得 IP 位址、裝置資訊，或使用 Cookie。建議您同時查閱各服務提供者的隱私政策。</p></section>
      <section><h2>五、Cookie 與網站紀錄</h2><p>本網站目前未設置自有的廣告追蹤或跨網站行銷分析工具。維持網站功能、安全性及第三方嵌入內容所需的 Cookie 或類似技術，可能由瀏覽器或第三方服務設定。您可透過瀏覽器限制 Cookie；停用後，地圖、影片或部分功能可能無法正常使用。</p></section>
      <section><h2>六、資料安全</h2><p>我們採取合理的技術與管理措施，包括 HTTPS 傳輸、管理權限控管、登入保護、請求驗證、輸入限制及防止重複提交等措施，以降低資料遭未授權存取、竄改、毀損、滅失或洩漏的風險。若發生依法應通知的個人資料事故，我們將依適用法令採取應變及通知措施。</p></section>
      <section><h2>七、您可以行使的權利</h2><p>依個人資料保護法，您可以就本會館保有的個人資料提出以下請求：</p><ul><li>查詢、閱覽或請求製給複製本。</li><li>請求補充或更正。</li><li>請求停止蒐集、處理或利用。</li><li>請求刪除。</li></ul><p>為保障資料安全，我們可能要求您提供足以確認身分及資料關聯性的資訊。法律另有規定或本會館依法得拒絕時，將向您說明理由。</p></section>
      <section><h2>八、是否提供資料及其影響</h2><p>您可自由選擇是否提供個人資料。聯絡表單中的姓名、電話及留言內容為回覆需求所必需；若未提供或資料不完整，我們可能無法辨識需求、聯繫您或完成預約。電子郵件為選填，不提供不影響您使用電話或其他聯絡方式。</p></section>
      <section><h2>九、未成年人</h2><p>未成年人提供個人資料前，應由法定代理人閱讀並同意本政策。如我們得知在欠缺必要同意的情況下取得未成年人的資料，將於確認後停止利用並予以刪除。</p></section>
      <section><h2>十、政策更新與聯絡方式</h2><p>我們可能因服務或法令變更修訂本政策，修訂後將公布於本頁並更新生效日期。若您要詢問本政策、行使個人資料權利或反映資料安全問題，請透過網站聯絡表單、電話 <a href={`tel:${site.phone}`}>{site.phone}</a>，或本網站公布的 LINE 聯絡方式提出。</p><p>個人資料相關規定可參閱<a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021" target="_blank" rel="noreferrer">全國法規資料庫—個人資料保護法</a>。</p></section>
    </article>
  </main><Footer siteSettings={site} /></>;
}
