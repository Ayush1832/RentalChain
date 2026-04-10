import puppeteer from 'puppeteer';
import { logger } from '../../utils/logger';

export interface AgreementData {
  agreementId: string;
  landlord: { fullName: string; phone: string };
  tenant: { fullName: string; phone: string };
  property: {
    title: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  };
  monthlyRent: number;
  securityDeposit: number;
  startDate: string;
  endDate?: string;
  noticePeriodDays: number;
  rentDueDay: number;
  generatedAt: string;
}

function formatINR(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function buildHTML(data: AgreementData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.6; color: #111; padding: 40px 60px; }
    h1 { font-size: 20px; text-align: center; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
    .subtitle { text-align: center; font-size: 12px; color: #555; margin-bottom: 30px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    td { padding: 5px 8px; vertical-align: top; }
    td:first-child { font-weight: bold; width: 40%; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .party-box { border: 1px solid #ccc; padding: 12px; border-radius: 4px; }
    .party-box h3 { font-size: 12px; text-transform: uppercase; color: #555; margin-bottom: 8px; }
    .highlight { background: #f9f9f9; padding: 10px 15px; border-left: 3px solid #333; margin: 10px 0; }
    .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .sig-box { border-top: 1px solid #333; padding-top: 8px; }
    .sig-box p { font-size: 11px; color: #555; }
    .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
    .agreement-id { font-family: monospace; font-size: 10px; color: #888; text-align: center; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>Rental Agreement</h1>
  <p class="subtitle">This Rental/Leave &amp; License Agreement is executed on ${new Date(data.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  <p class="agreement-id">Agreement ID: ${data.agreementId}</p>

  <div class="section">
    <div class="section-title">Parties</div>
    <div class="parties">
      <div class="party-box">
        <h3>Licensor / Landlord</h3>
        <p><strong>${data.landlord.fullName}</strong></p>
        <p>Phone: ${data.landlord.phone}</p>
      </div>
      <div class="party-box">
        <h3>Licensee / Tenant</h3>
        <p><strong>${data.tenant.fullName}</strong></p>
        <p>Phone: ${data.tenant.phone}</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Licensed Premises</div>
    <table>
      <tr><td>Property</td><td>${data.property.title}</td></tr>
      <tr><td>Address</td><td>${data.property.addressLine1}, ${data.property.city}, ${data.property.state} – ${data.property.pincode}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Terms &amp; Conditions</div>
    <table>
      <tr><td>License Period</td><td>${data.startDate}${data.endDate ? ` to ${data.endDate}` : ' (open-ended)'}</td></tr>
      <tr><td>Monthly License Fee</td><td>${formatINR(data.monthlyRent)}</td></tr>
      <tr><td>Security Deposit</td><td>${formatINR(data.securityDeposit)}</td></tr>
      <tr><td>License Fee Due Date</td><td>Day ${data.rentDueDay} of each calendar month</td></tr>
      <tr><td>Notice Period</td><td>${data.noticePeriodDays} days</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Covenants</div>
    <p style="margin-bottom:8px">1. The Licensee shall use the premises solely for residential/licensed purposes and shall not sublet or transfer the license without prior written consent of the Licensor.</p>
    <p style="margin-bottom:8px">2. The Licensee shall pay the license fee on or before the due date each month. A delay beyond 7 days shall attract a late fee of ₹500 per week.</p>
    <p style="margin-bottom:8px">3. The Licensor shall maintain the structural integrity of the premises. The Licensee shall maintain day-to-day upkeep and report damage promptly.</p>
    <p style="margin-bottom:8px">4. The security deposit shall be refunded within 30 days of vacating the premises, subject to deductions for damages beyond normal wear and tear.</p>
    <p style="margin-bottom:8px">5. Either party may terminate this agreement by providing ${data.noticePeriodDays} days' written notice.</p>
    <p>6. Any disputes arising out of this agreement shall be subject to the jurisdiction of courts in ${data.property.city}.</p>
  </div>

  <div class="highlight">
    <strong>Blockchain Verification:</strong> The SHA-256 hash of this signed agreement document shall be anchored on the Ethereum blockchain by RentalChain, creating an immutable, time-stamped proof of this agreement. The transaction hash will be shared with both parties.
  </div>

  <div class="signature-section">
    <div class="sig-box">
      <p><strong>Licensor / Landlord</strong></p>
      <br/><br/>
      <p>Name: ${data.landlord.fullName}</p>
      <p>Date: _______________</p>
    </div>
    <div class="sig-box">
      <p><strong>Licensee / Tenant</strong></p>
      <br/><br/>
      <p>Name: ${data.tenant.fullName}</p>
      <p>Date: _______________</p>
    </div>
  </div>

  <div class="footer">
    Generated by RentalChain | ${data.generatedAt} | This is a legally binding document. Consult a lawyer for complex tenancies.
  </div>
</body>
</html>`;
}

export async function generateAgreementPDF(data: AgreementData): Promise<Buffer> {
  logger.info(`Generating PDF for agreement ${data.agreementId}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHTML(data), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm' } });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
