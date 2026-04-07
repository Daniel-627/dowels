import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Dowels <noreply@dowels.co.ke>";

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Dowels",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px;">Welcome, ${name} 👋</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Your account has been created successfully. You can now browse available properties
          and submit rental requests directly through the platform.
        </p>
        <a href="${process.env.NEXTAUTH_URL}/login" 
           style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">
          Sign In to Dowels
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendRentalRequestEmail({
  to,
  landlordName,
  tenantName,
  propertyTitle,
  moveInDate,
  message,
}: {
  to: string;
  landlordName: string;
  tenantName: string;
  propertyTitle: string;
  moveInDate: string;
  message?: string | null;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `New Rental Request — ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px;">New Rental Request</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Hi ${landlordName}, <strong>${tenantName}</strong> has submitted a rental request for 
          <strong>${propertyTitle}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Tenant:</strong> ${tenantName}</p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Property:</strong> ${propertyTitle}</p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Move-in Date:</strong> ${new Date(moveInDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>
          ${message ? `<p style="font-size: 13px; color: #6b7280; margin: 0;"><strong>Message:</strong> ${message}</p>` : ""}
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/landlord/requests"
           style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">
          Review Request
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendRequestStatusEmail({
  to,
  tenantName,
  propertyTitle,
  status,
}: {
  to: string;
  tenantName: string;
  propertyTitle: string;
  status: "APPROVED" | "REJECTED";
}) {
  const approved = status === "APPROVED";

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your request for ${propertyTitle} has been ${approved ? "approved" : "rejected"}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <div style="background: ${approved ? "#f0fdf4" : "#fef2f2"}; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; color: ${approved ? "#166534" : "#991b1b"}; margin: 0 0 8px;">
            Request ${approved ? "Approved ✓" : "Not Approved"}
          </h2>
          <p style="font-size: 14px; color: ${approved ? "#166534" : "#991b1b"}; margin: 0;">
            ${propertyTitle}
          </p>
        </div>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Hi ${tenantName}, your rental request for <strong>${propertyTitle}</strong> has been 
          <strong>${approved ? "approved" : "rejected"}</strong> by the landlord.
          ${approved ? "The landlord will be in touch to finalise your booking." : "You are welcome to browse other available properties."}
        </p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/tenant/requests"
           style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">
          View My Requests
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendInvoiceEmail({
  to,
  tenantName,
  propertyTitle,
  invoiceType,
  amount,
  dueDate,
  period,
}: {
  to: string;
  tenantName: string;
  propertyTitle: string;
  invoiceType: string;
  amount: number;
  dueDate: string;
  period?: string | null;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `New Invoice — ${invoiceType} ${period ? `(${period})` : ""} for ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px;">New Invoice</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Hi ${tenantName}, a new invoice has been created for your tenancy at <strong>${propertyTitle}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Type:</strong> ${invoiceType}</p>
          ${period ? `<p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Period:</strong> ${period}</p>` : ""}
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Amount:</strong> KES ${amount.toLocaleString()}</p>
          <p style="font-size: 13px; color: #6b7280; margin: 0;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/tenant/invoices"
           style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">
          View Invoice
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendPaymentConfirmationEmail({
  to,
  tenantName,
  propertyTitle,
  amount,
  method,
  paidAt,
}: {
  to: string;
  tenantName: string;
  propertyTitle: string;
  amount: number;
  method: string;
  paidAt: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment Confirmed — KES ${amount.toLocaleString()} for ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #166534; margin: 0 0 4px;">Payment Confirmed ✓</h2>
          <p style="font-size: 24px; font-weight: 700; color: #166534; margin: 0;">
            KES ${amount.toLocaleString()}
          </p>
        </div>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Hi ${tenantName}, your payment for <strong>${propertyTitle}</strong> has been recorded successfully.
        </p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Amount:</strong> KES ${amount.toLocaleString()}</p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;"><strong>Method:</strong> ${method.replace("_", " ")}</p>
          <p style="font-size: 13px; color: #6b7280; margin: 0;"><strong>Date:</strong> ${new Date(paidAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/tenant/invoices"
           style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">
          View Invoices
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendMaintenanceRequestEmail({
  to,
  landlordName,
  tenantName,
  propertyTitle,
  title,
  description,
  priority,
}: {
  to: string;
  landlordName: string;
  tenantName: string;
  propertyTitle: string;
  title: string;
  description: string;
  priority: string;
}) {
  const priorityColors: Record<string, string> = {
    LOW: "#6b7280",
    MEDIUM: "#d97706",
    HIGH: "#dc2626",
    URGENT: "#7c3aed",
  };

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Maintenance Request — ${title} at ${propertyTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px;">New Maintenance Request</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Hi ${landlordName}, <strong>${tenantName}</strong> has submitted a maintenance request
          for <strong>${propertyTitle}</strong>.
        </p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            <strong>Title:</strong> ${title}
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px;">
            <strong>Priority:</strong>
            <span style="color: ${priorityColors[priority] ?? "#6b7280"}; font-weight: 600;">
              ${priority}
            </span>
          </p>
          <p style="font-size: 13px; color: #6b7280; margin: 0;">
            <strong>Description:</strong> ${description}
          </p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/landlord/maintenance"
           style="display: inline-block; background: #111827; color: #fff; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">
          View Request
        </a>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your Dowels password reset code",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin: 0;">Dowels</h1>
          <p style="font-size: 12px; color: #9ca3af; margin: 4px 0 0;">by Dorcas Owela</p>
        </div>
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 12px;">Password Reset</h2>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.7; margin: 0 0 24px;">
          Use the code below to reset your password. It expires in 15 minutes.
        </p>
        <div style="background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 40px; font-weight: 700; letter-spacing: 8px; color: #111827; margin: 0;">
            ${code}
          </p>
        </div>
        <p style="font-size: 13px; color: #9ca3af; margin: 0 0 24px;">
          If you did not request a password reset, ignore this email. Your password will not change.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin: 32px 0 0;">
          © ${new Date().getFullYear()} OpenDoor. All rights reserved.
        </p>
      </div>
    `,
  });
}